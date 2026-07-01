import express from "express";
import {
  createLeaveRequest,
  getMyLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequestById,
  deleteLeaveRequestById,
} from "../controllers/leaveRequestController.js";
import {
  addLeaveRequestValidation,
  getLeaveRequestsQueryValidation,
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
router.get("/getAllLeaveTypes", getAllLeaveTypes);
router.get(
  "/leave-requests/:id",
  leaveRequestIdParamValidation,
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

export default router;
