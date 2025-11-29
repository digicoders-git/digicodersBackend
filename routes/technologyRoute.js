import express from "express";
import { technologyController } from "../controllers/technologyControllers.js";
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected with auth middleware
router.use(auth);


// Basic CRUD operations
router.post('/:action', technologyController);      // create
router.get('/:action', technologyController);       // getAll
router.get('/:action/:id', technologyController);   // getById ,getByTrainingDuration
router.patch('/:action/:id', technologyController);   // update
router.delete('/:action/:id', technologyController); // delete


export default router;
