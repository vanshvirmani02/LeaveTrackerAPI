import express from "express";
import {
  createLeaveRequest,
  getMyLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequestById,
  deleteLeaveRequestById,
} from "../controllers/leaveRequestController.js";
import { getAllHolidays, getManagerHolidays } from "../controllers/holidayController.js";
import { getUserProfile } from "../controllers/authController.js";
import {
  addLeaveRequestValidation,
  getLeaveRequestsQueryValidation,
  getLeaveRequestByIdQueryValidation,
  updateLeaveRequestValidation,
  leaveRequestIdParamValidation,
  validateReq,
} from "../validations/index.js";
import { authHandler } from "../middleware/authHandler.js";
import { employeeHandler } from "../middleware/employeeHandler.js";
import { getAllLeaveTypes } from "../controllers/leaveTypeController.js";
const router = express.Router();



router.use(authHandler, employeeHandler);

router.post(
  "/leave-requests",
  addLeaveRequestValidation,
  validateReq,
  createLeaveRequest,
);
router.get(
  "/leave-requests",
  getLeaveRequestsQueryValidation,
  validateReq,
  getMyLeaveRequests,
);
router.get("/holidays", getAllHolidays);
router.get("/holidays/:employeeId", getAllHolidays);
router.get("/getAllLeaveTypes", getAllLeaveTypes);
router.get("/profile", getUserProfile);
router.get(
  "/leave-requests/:id",
  getLeaveRequestByIdQueryValidation,
  validateReq,
  getLeaveRequestById,
);
router.put(
  "/leave-requests/:id",
  updateLeaveRequestValidation,
  validateReq,
  updateLeaveRequestById,
);
router.delete(
  "/leave-requests/:id",
  leaveRequestIdParamValidation,
  validateReq,
  deleteLeaveRequestById,
);
router.get("/manager/holidays", getManagerHolidays);
export default router;
