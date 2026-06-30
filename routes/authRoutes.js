import express from "express";
import { signupUser } from "../controllers/authController.js";
import { signupUserValidation, validateReq } from "../validations/index.js";

const router = express.Router();

router.post("/signup", signupUserValidation, validateReq, signupUser);

export default router;
