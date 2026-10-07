import { verifyAccessToken } from "../Sevices/token.service.js";

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // console.log("start authenticate", authHeader)
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Token not sent" });
  }

  let decoded;
  try {
    decoded = verifyAccessToken(authHeader.split(" ")[1]);
    console.log(decoded);
  } catch (err) {
    console.log(">>>>>>>>> Token Expired");
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
  next();
};

export default authenticate;
