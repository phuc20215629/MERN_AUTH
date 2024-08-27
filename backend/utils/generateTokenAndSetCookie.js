import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, user_id) => {
  const token = jwt.sign({ user_id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.cookie("token", token, {
    expires: new Date(Date.now() + 24 * 3600 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 3600 * 1000,
  });

  return token;
};
