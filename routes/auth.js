import express from 'express';
import rateLimit from 'express-rate-limit';
import { auth } from '../middleware/auth.js';
// import { registerValidation, loginValidation } from '../middleware/validation.js';
import {
  register,
  login,
  logout,getAll,updateUser,getMe,
  deleteUser
} from '../controllers/authControllers.js';
import upload from '../config/multer.js';

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: 'Too many login attempts, please try again later' }
});

// Public routes
router.post('/register',auth,upload.single("image"), register);
router.post('/login', authLimiter,  login);
router.get('/getall',auth,  getAll);
router.get('/getme',auth,  getMe);
router.put('/update/:id',auth,upload.single("image"),  updateUser);
router.post('/logout',auth,  logout);
router.delete('/delete/:id',auth,  deleteUser);


export default router;
