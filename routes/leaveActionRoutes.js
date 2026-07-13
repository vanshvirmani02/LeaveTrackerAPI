import express from "express";
import { handleEmailLeaveAction } from "../controllers/leaveActionController.js";

const router = express.Router();

router.get("/:token", handleEmailLeaveAction);

export default router;
