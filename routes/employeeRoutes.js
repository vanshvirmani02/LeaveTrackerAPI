import express from "express";
import {
  createLeaveRequest,
  getMyLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequestById,
  deleteLeaveRequestById,
  getAllLeaveRequests,
} from "../controllers/leaveRequestController.js";
import { actionLeaveRequest } from "../controllers/adminController.js";
import {
  getMyLeaveBalances,
  getLeaveBalances,
} from "../controllers/leaveBalanceController.js";
import { getAllHolidays, getManagerHolidays } from "../controllers/holidayController.js";
import { getUserProfile } from "../controllers/authController.js";
import {
  addBankDetails,
  getBankDetails,
  updateBankDetails,
  deleteBankDetails,
} from "../controllers/bankDetailsController.js";
import {
  addSkills,
  getSkills,
  updateSkills,
  deleteSkills,
} from "../controllers/skillsController.js";
import {
  addLeaveRequestValidation,
  getLeaveRequestsQueryValidation,
  getLeaveRequestByIdQueryValidation,
  updateLeaveRequestValidation,
  leaveRequestIdParamValidation,
  getAllLeaveRequestsQueryValidation,
  actionLeaveRequestValidation,
  getLeaveBalancesQueryValidation,
  addBankDetailsValidation,
  updateBankDetailsValidation,
  addSkillsValidation,
  updateSkillsValidation,
  getHolidaysQueryValidation,
  getMyPayrollValidation,
  downloadSalarySlipValidation,
  validateReq,
} from "../validations/index.js";
import { authHandler } from "../middleware/authHandler.js";
import { employeeHandler } from "../middleware/employeeHandler.js";
import { teamScopeHandler } from "../middleware/teamScopeHandler.js";
import { getAllLeaveTypes } from "../controllers/leaveTypeController.js";
import {
  getEmployeeDashboard,
  getManagerDashboard,
} from "../controllers/dashboardController.js";
import {
  getMyPayroll,
  downloadMySalarySlip,
} from "../controllers/payrollController.js";

const router = express.Router();

router.use(authHandler, employeeHandler);

router.get("/dashboard", getEmployeeDashboard);
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
router.get("/leave-balances", getMyLeaveBalances);
router.get(
  "/holidays",
  getHolidaysQueryValidation,
  validateReq,
  getAllHolidays,
);
router.get(
  "/holidays/:employeeId",
  getHolidaysQueryValidation,
  validateReq,
  getAllHolidays,
);
router.get("/getAllLeaveTypes", getAllLeaveTypes);
router.get("/profile", getUserProfile);

router.post(
  "/bank-details",
  addBankDetailsValidation,
  validateReq,
  addBankDetails,
);
router.get("/bank-details", getBankDetails);
router.put(
  "/bank-details",
  updateBankDetailsValidation,
  validateReq,
  updateBankDetails,
);
router.delete("/bank-details", deleteBankDetails);

router.post("/skills", addSkillsValidation, validateReq, addSkills);
router.get("/skills", getSkills);
router.put("/skills", updateSkillsValidation, validateReq, updateSkills);
router.delete("/skills", deleteSkills);

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
router.get(
  "/manager/leave-requests",
  teamScopeHandler,
  getAllLeaveRequestsQueryValidation,
  validateReq,
  getAllLeaveRequests,
);
router.put(
  "/manager/leave-requests/:id/action",
  teamScopeHandler,
  actionLeaveRequestValidation,
  validateReq,
  actionLeaveRequest,
);
router.get(
  "/manager/leave-balances",
  teamScopeHandler,
  getLeaveBalancesQueryValidation,
  validateReq,
  getLeaveBalances,
);
router.get("/manager/dashboard", teamScopeHandler, getManagerDashboard);

router.get("/payroll", getMyPayrollValidation, validateReq, getMyPayroll);
router.get(
  "/payroll/salary-slip",
  downloadSalarySlipValidation,
  validateReq,
  downloadMySalarySlip,
);

export default router;
