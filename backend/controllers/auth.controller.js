import { User } from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail } from "../mailtrap/emails.js";

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
export const login = async (req, res) => {
  res.send("login");
};
export const logout = async (req, res) => {
  res.send("logout");
};
