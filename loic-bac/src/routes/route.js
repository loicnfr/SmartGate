import express from "express";
import { addStaff } from "../controller/staffController.js";
import { loginAdmin } from "../controller/adminController.js";

const router = express.Router();

router.post("/add", addStaff);
router.post("/admin", loginAdmin);

export default router;
