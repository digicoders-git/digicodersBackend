import express from 'express';
import {
  addEducation,
  getEducation,
  getAllEducations,
  updateEducation,
  deleteEducation
} from '../controllers/education.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected with auth middleware
router.use(auth);

// Define routes directly with their handlers
router.post('/',addEducation);
router.get('/', getAllEducations);
router.get('/:id', getEducation);
router.put('/:id',updateEducation);
router.delete('/:id',deleteEducation);

export default router;