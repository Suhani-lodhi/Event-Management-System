import { verifyAccessToken } from "../Sevices/token.service.js";

const authenticate = (req, res, next) => {
  const { accessToken } = req.cookies;
  // console.log("start authenticate", authHeader)
  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: "Token not sent",
      code: "TOKEN_MISSING",
    });
  }

  let decoded;
  try {
    decoded = verifyAccessToken(accessToken);
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
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "Token_INVALID",
    });
  }

  req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
  next();
};

export default authenticate;
