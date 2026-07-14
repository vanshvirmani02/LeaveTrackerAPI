import express from "express";
import {
  addEmployee,
  getAllEmployees,
  updateEmployeeById,
  deleteEmployeeById,
  setEmployeeManager,
  actionLeaveRequest,
} from "../controllers/adminController.js";
import { getAllManagers, getManagersList } from "../controllers/managersController.js";
import {
  addLeaveType,
  getAllLeaveTypes,
  updateLeaveTypeById,
  deleteLeaveTypeById,
} from "../controllers/leaveTypeController.js";
import {
  addHoliday,
  getAllHolidays,
  updateHolidayById,
  deleteHolidayById,
  downloadHolidaysCsv,
  downloadHolidaysExcel,
  uploadHolidays,
} from "../controllers/holidayController.js";
import {
  addAdminSettings,
  getAllAdminSettings,
  updateAdminSettingsById,
  deleteAdminSettingsById,
} from "../controllers/adminSettingsController.js";
import {
  generatePayroll,
  getPayroll,
  editPayrollEntry,
  actionPayrollEntry,
} from "../controllers/payrollController.js";
import {
  addEmployeeValidation,
  updateEmployeeValidation,
  employeeIdParamValidation,
  getEmployeesQueryValidation,
  setEmployeeManagerValidation,
  addLeaveTypeValidation,
  updateLeaveTypeValidation,
  leaveTypeIdParamValidation,
  addHolidayValidation,
  updateHolidayValidation,
  holidayIdParamValidation,
  getHolidaysQueryValidation,
  addAdminSettingsValidation,
  updateAdminSettingsValidation,
  adminSettingsIdParamValidation,
  actionLeaveRequestValidation,
  getAllLeaveRequestsQueryValidation,
  getLeaveBalancesQueryValidation,
  generatePayrollValidation,
  getPayrollValidation,
  editPayrollValidation,
  actionPayrollValidation,
  validateReq,
} from "../validations/index.js";
import { authHandler } from "../middleware/authHandler.js";
import { adminHandler } from "../middleware/adminHandler.js";
import { holidayFileUpload } from "../middleware/holidayUploadHandler.js";
import { getAllLeaveRequests } from "../controllers/leaveRequestController.js";
import { getLeaveBalances } from "../controllers/leaveBalanceController.js";
import { getAdminDashboard } from "../controllers/dashboardController.js";

const uploadHolidayFile = (req, res, next) => {
  holidayFileUpload(req, res, (error) => {
    if (!error) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to upload holiday file.",
    });
  });
};

const router = express.Router();

router.use(authHandler, adminHandler);

router.post("/employees", addEmployeeValidation, validateReq, addEmployee);
router.get(
  "/employees",
  getEmployeesQueryValidation,
  validateReq,
  getAllEmployees,
);
router.get("/managers/list", getManagersList);
router.get("/managers", getAllManagers);
router.put(
  "/employees/:id",
  updateEmployeeValidation,
  validateReq,
  updateEmployeeById,
);
router.delete(
  "/employees/:id",
  employeeIdParamValidation,
  validateReq,
  deleteEmployeeById,
);

router.post("/leave-types", addLeaveTypeValidation, validateReq, addLeaveType);
router.get("/leave-types", getAllLeaveTypes);
router.put(
  "/leave-types/:id",
  updateLeaveTypeValidation,
  validateReq,
  updateLeaveTypeById,
);
router.delete(
  "/leave-types/:id",
  leaveTypeIdParamValidation,
  validateReq,
  deleteLeaveTypeById,
);

router.post("/holidays", addHolidayValidation, validateReq, addHoliday);
router.get(
  "/holidays",
  getHolidaysQueryValidation,
  validateReq,
  getAllHolidays,
);
router.get("/holidays/export/csv", downloadHolidaysCsv);
router.get("/holidays/export/excel", downloadHolidaysExcel);
router.post("/holidays/import", uploadHolidayFile, uploadHolidays);
router.put(
  "/holidays/:id",
  updateHolidayValidation,
  validateReq,
  updateHolidayById,
);
router.delete(
  "/holidays/:id",
  holidayIdParamValidation,
  validateReq,
  deleteHolidayById,
);

router.post(
  "/admin-settings",
  addAdminSettingsValidation,
  validateReq,
  addAdminSettings,
);
router.get("/admin-settings", getAllAdminSettings);
router.put(
  "/admin-settings/:id",
  updateAdminSettingsValidation,
  validateReq,
  updateAdminSettingsById,
);
router.delete(
  "/admin-settings/:id",
  adminSettingsIdParamValidation,
  validateReq,
  deleteAdminSettingsById,
);

router
  .route("/set-employee-manager")
  .get(setEmployeeManagerValidation, validateReq, setEmployeeManager)
  .post(setEmployeeManagerValidation, validateReq, setEmployeeManager);
router.get(
  "/leave-all-requests",
  getAllLeaveRequestsQueryValidation,
  validateReq,
  getAllLeaveRequests,
);
router.get(
  "/leave-balances",
  getLeaveBalancesQueryValidation,
  validateReq,
  getLeaveBalances,
);
router.put(
  "/leave-requests/:id/action",
  actionLeaveRequestValidation,
  validateReq,
  actionLeaveRequest,
);
router.get("/dashboard", getAdminDashboard);

router.post(
  "/payroll/generate",
  generatePayrollValidation,
  validateReq,
  generatePayroll,
);
router.get("/payroll", getPayrollValidation, validateReq, getPayroll);
router.put(
  "/payroll/:monthYear/employees/:employeeId",
  editPayrollValidation,
  validateReq,
  editPayrollEntry,
);
router.put(
  "/payroll/:monthYear/employees/:employeeId/action",
  actionPayrollValidation,
  validateReq,
  actionPayrollEntry,
);

export default router;