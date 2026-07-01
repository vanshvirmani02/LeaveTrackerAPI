import { ROLES } from "../config/constants.js";

export const employeeHandler = (req, res, next) => {
  if (req.user?.role !== ROLES.EMPLOYEE) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Employee privileges required.",
    });
  }

  next();
};
