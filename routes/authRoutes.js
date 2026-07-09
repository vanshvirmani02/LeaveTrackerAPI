import express from "express";
import {
  signupUser,
  loginUser,
  refreshToken,
  signoutUser,
} from "../controllers/authController.js";
import {
  signupUserValidation,
  loginUserValidation,
  refreshTokenValidation,
  validateReq,
} from "../validations/index.js";
import { authHandler } from "../middleware/authHandler.js";
const router = express.Router();

router.post("/signup", signupUserValidation, validateReq, signupUser);
router.post("/login", loginUserValidation, validateReq, loginUser);
router.post("/refresh", refreshTokenValidation, validateReq, refreshToken);
router.post("/signout", authHandler, signoutUser);

export default router;
