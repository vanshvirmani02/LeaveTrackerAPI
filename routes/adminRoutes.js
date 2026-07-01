import express from "express";
import {
  addEmployee,
  getAllEmployees,
  updateEmployeeById,
  deleteEmployeeById,
} from "../controllers/adminController.js";
import { getAllManagers } from "../controllers/managersController.js";
import {
  addLeaveType,
  getAllLeaveTypes,
  updateLeaveTypeById,
  deleteLeaveTypeById,
} from "../controllers/leaveTypeController.js";
import {
  addLeavePolicy,
  getAllLeavePolicies,
  updateLeavePolicyById,
  deleteLeavePolicyById,
} from "../controllers/leavePolicyController.js";
import {
  addHoliday,
  getAllHolidays,
  updateHolidayById,
  deleteHolidayById,
} from "../controllers/holidayController.js";
import {
  addAdminSettings,
  getAllAdminSettings,
  updateAdminSettingsById,
  deleteAdminSettingsById,
} from "../controllers/adminSettingsController.js";
import {
  addEmployeeValidation,
  updateEmployeeValidation,
  employeeIdParamValidation,
  getEmployeesQueryValidation,
  addLeaveTypeValidation,
  updateLeaveTypeValidation,
  leaveTypeIdParamValidation,
  addLeavePolicyValidation,
  updateLeavePolicyValidation,
  leavePolicyIdParamValidation,
  addHolidayValidation,
  updateHolidayValidation,
  holidayIdParamValidation,
  addAdminSettingsValidation,
  updateAdminSettingsValidation,
  adminSettingsIdParamValidation,
  validateReq,
} from "../validations/index.js";
import { authHandler } from "../middleware/authHandler.js";
import { adminHandler } from "../middleware/adminHandler.js";

const router = express.Router();

router.use(authHandler, adminHandler);

router.post("/employees", addEmployeeValidation, validateReq, addEmployee);
router.get(
  "/employees",
  getEmployeesQueryValidation,
  validateReq,
  getAllEmployees,
);
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

router.post(
  "/leave-policies",
  addLeavePolicyValidation,
  validateReq,
  addLeavePolicy,
);
router.get("/leave-policies", getAllLeavePolicies);
router.put(
  "/leave-policies/:id",
  updateLeavePolicyValidation,
  validateReq,
  updateLeavePolicyById,
);
router.delete(
  "/leave-policies/:id",
  leavePolicyIdParamValidation,
  validateReq,
  deleteLeavePolicyById,
);

router.post("/holidays", addHolidayValidation, validateReq, addHoliday);
router.get("/holidays", getAllHolidays);
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

export default router;
