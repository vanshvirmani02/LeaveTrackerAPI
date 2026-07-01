import express from "express";
import {
  addEmployee,
  getAllEmployees,
  updateEmployeeById,
  deleteEmployeeById,
} from "../controllers/adminController.js";
import { getAllManagers } from "../controllers/managersController.js";
import {
  addEmployeeValidation,
  updateEmployeeValidation,
  employeeIdParamValidation,
  validateReq,
} from "../validations/index.js";
import { authHandler } from "../middleware/authHandler.js";
import { adminHandler } from "../middleware/adminHandler.js";

const router = express.Router();

router.use(authHandler, adminHandler);

router.post("/employees", addEmployeeValidation, validateReq, addEmployee);
router.get("/employees", getAllEmployees);
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

export default router;
