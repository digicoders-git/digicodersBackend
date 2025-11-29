import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Registration from "../models/regsitration.js";

export const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided, access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find User or Student
    let user = await User.findById(decoded.id).select("-password");
    let student = null;

    if (!user) {
      student = await Registration.findById(decoded.id).select("-password").populate("technology","name").populate("training")
    }

    if (!user && !student) {
      return res.status(401).json({ message: "Account not found" });
    }

    if (user && !user.isActive) {
      return res.status(401).json({ message: "Account inactive" });
    }

    req.user = user;
    req.student = student;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

// export const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: 'Access denied' });
//     }
//     next();
//   };
// };
