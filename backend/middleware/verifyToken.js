import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token, authorization denied!" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Token is invalid!" });
    }
    console.log(decoded);

    req.user_id = decoded.user_id; // set the userId in req
    next();
  } catch (error) {
    console.log("Error in verify token ", error);
    return res
      .status(500)
      .json({ success: false, message: "Verify token failed!" });
  }
};
