import express from 'express';
import { auth } from '../middleware/auth.js';
import { sendEmails } from '../controllers/sendEmailReminders.js';

const router = express.Router();

// All routes are protected with auth middleware
router.use(auth);

// Switch case based routes
router.post('/send', sendEmails);      // For create

export default router;