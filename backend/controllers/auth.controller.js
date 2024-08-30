import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendResetSuccessEmail,
} from "../mailtrap/emails.js";
import { User } from "../models/user.model.js";

export const signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (!email || !password || !name) {
      throw new Error("All field must be filled!");
    }

    const oldUser = await User.findOne({ email: email });
    if (oldUser) {
      return res
        .status(400)
        .json({ succcess: false, message: "User already exists!" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      verificationTokenExpiredAt: Date.now() + 24 * 3600 * 1000,
    });

    await newUser.save();

    // jwt
    generateTokenAndSetCookie(res, newUser._id);

    // send verification email
    await sendVerificationEmail(newUser.email, verificationToken);

    res.status(200).json({
      success: true,
      message: "User registered successfully!",
      user: {
        ...newUser._doc,
        password: undefined,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiredAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Verification token expired or invalid!",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiredAt = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.name);

    return res.status(200).json({
      success: true,
      message: "Email verified!",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found!" });
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password!" });
    }
    generateTokenAndSetCookie(res, user._id);
    user.lastLogin = new Date();
    await user.save();
    res.status(200).json({
      success: true,
      message: "Login successful!",
      user: { _id: user._id, name: user.name },
    });
  } catch (error) {
    console.log("Error in login ", error);
  }
};

export const logout = async (req, res) => {
  const user = await User.findById(req.user_id).select("-password");
  if (!user) {
    return res.status(401).json({ success: false, message: "User not found!" });
  }

  res.clearCookie("token");
  res.status(200).json({ succcess: true, user, message: "Logout successful!" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found!" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiredAt = Date.now() + 3600 * 1000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpriredAt = resetTokenExpiredAt;
    await user.save();

    await sendResetPasswordEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Reset password email sent successfully!",
    });
  } catch (error) {
    console.log("Error in reset password ", error);
  }
};

export const resetPassword = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpriredAt: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset password token invalid or expired!",
      });
    }
    const newPassword = await bcryptjs.hash(password, 10);
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpriredAt = undefined;
    await user.save();

    sendResetSuccessEmail(user.email);
    res.status(200).json({
      success: true,
      message: "Password reset successfully!",
    });
  } catch (error) {
    console.log("Error in reset password ", error);
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user_id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated!" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in check auth ", error);
  }
};
