import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  logout,
} from '../controllers/authController.ts';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.post('/logout', logout);

export default router;
