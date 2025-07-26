import express from "express";
import { addStaff } from "../controller/staffController.js";
import { loginAdmin } from "../controller/adminController.js";
import {
  faceRecognition,
  login,
  validateToken,
} from "../controller/authController.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  faceEncoding,
  getAllStaff,
  registerStaff,
  sendEmail,
} from "../controller/userController.js";
import multer from "multer";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/add", addStaff);
router.post("/admin", loginAdmin);
router.post("/auth/login", login);
router.get("/auth/validate", authenticateToken, validateToken);
router.get("/users/staff", authenticateToken, getAllStaff);
router.post("/users/staff", authenticateToken, registerStaff);
router.post("/api/users/staff/send-mail", authenticateToken, sendEmail);
router.post("/auth/validate", upload.single("image"), faceRecognition);
router.post(
  "/users/face-encoding",
  authenticateToken,
  upload.single("image"),
  faceEncoding
);

export default router;
