import express from "express";
import { signupUser, loginUser, getReqUser } from "../controllers/authController.js";
import {
  signupUserValidation,
  loginUserValidation,
  validateReq,
} from "../validations/index.js";
import { authHandler } from "../middleware/authHandler.js";
const router = express.Router();

router.post("/signup", signupUserValidation, validateReq, signupUser);
router.post("/login", loginUserValidation, validateReq, loginUser);
router.get("/getReqUser", authHandler, getReqUser);

export default router;
