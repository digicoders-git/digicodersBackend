import express from "express";
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  assignBatchToTeacher,
  deleteTeacher,
  updateTeacher
} from "../controllers/teacherController.js";
import { auth } from "../middleware/auth.js";
const router = express.Router();
router.use(auth);

// Teacher CRUD
router.post("/create", createTeacher);
router.get("/", getTeachers);
router.get("/:id", getTeacherById);
router.delete("/:id", deleteTeacher);
router.patch("/:id", updateTeacher);

// Extra Logic
router.post("/assign-batch", assignBatchToTeacher);

export default router;
