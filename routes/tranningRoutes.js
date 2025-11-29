import express from 'express';
import { trainingController } from '../controllers/TranningController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected with auth middleware
router.use(auth);

// Switch case based routes
router.post('/:action', trainingController);      // For create
router.get('/:action', trainingController);       // For getAll
router.get('/:action/:id', trainingController);   // For getById
router.patch('/:action/:id', trainingController);   // For update
router.delete('/:action/:id', trainingController); // For delete

export default router;