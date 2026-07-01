import express from "express";
import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Leave Tracker API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
