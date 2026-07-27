const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/UserModel");
require("dotenv").config();
module.exports.isLoggedIn = async (req, res, next) => {
  // Native mobile clients can't rely on the httpOnly cookie the way a browser
  // does, so fall back to a Bearer header when no cookie is present. The web
  // frontend already sends this header today; it was previously ignored here.
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = req.cookies.token || bearerToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Invalid/expired token is a client auth problem, not a server error -- send the
    // user back to login instead of surfacing a generic 500.
    return res.status(401).json({ message: "Session expired, please log in again" });
  }

  try {
    const user = await UserModel.findById(decoded.userId);

    if (!user || user.removeAt) {
      // TEMP DIAGNOSTIC — remove once the spurious-logout cause is found.
      console.log(
        `[isLoggedIn 401] decoded.userId=${decoded.userId} found=${!!user} removeAt=${user?.removeAt} dbName=${UserModel.db.name}`
      );
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in isLoggedIn middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


module.exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role?.toLowerCase() === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Admin access required" });
  }
};


module.exports.isStaff = (req, res, next) => {
  if (req.user && req.user.role?.toLowerCase() === "staff") {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Staff access required" });
  }
};
