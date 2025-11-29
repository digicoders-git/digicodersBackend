import express from "express";
import {
  createAttendance,
  markAttendance,
  getBatchAttendance,
  getStudentAttendance,getStuAttendance
} from "../controllers/attendanceController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

// POST: create attendance for a batch
router.post("/", createAttendance);

// PATCH: mark attendance of student
router.patch("/:attendanceId/mark", markAttendance);

// GET: all attendance of a batch
router.get("/batch/:batchId", getBatchAttendance);

// GET: single student’s attendance in a batch
router.get("/batch/:batchId/student/:studentId", getStudentAttendance);

router.get("/student", getStuAttendance);



export default router;
