// routes/feeRoutes.js
import express from "express";
import {
  recordPayment,
  getPaymentHistory,
  checkDues,
  getallPayments,
  changeStatus,
  getFeeById,deleteFeeData,getPaymentHistoryToken
} from "../controllers/feeController.js";
import { auth } from '../middleware/auth.js';
import upload from "../config/multer.js";
const router = express.Router();
// router.use(auth);

router.post("/",upload.single("image"),auth, recordPayment);
router.get("/:registrationId/history", getPaymentHistory);
router.get("/history",auth, getPaymentHistoryToken);
router.get("/:registrationId/dues", checkDues);
router.get("/", getallPayments);
router.get("/:id", getFeeById);
router.patch("/status/:id",auth, changeStatus);
router.delete("/delete/:id",auth, deleteFeeData);

export default router;