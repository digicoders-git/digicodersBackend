import express from 'express';
import { getCollegeNames, addCollegeName, updataCollage, deleteCollage } from '../controllers/collegeController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

// Get college names for datalist
router.get('/', getCollegeNames);

// Add new college name
router.post('/', addCollegeName);
router.delete('/:id',deleteCollage);
router.put('/:id',updataCollage);

export default router;