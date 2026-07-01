import express from "express";
import { signupUser, loginUser } from "../controllers/authController.js";
import {
  signupUserValidation,
  loginUserValidation,
  validateReq,
} from "../validations/index.js";
const router = express.Router();

router.post("/signup", signupUserValidation, validateReq, signupUser);
router.post("/login", loginUserValidation, validateReq, loginUser);

export default router;
