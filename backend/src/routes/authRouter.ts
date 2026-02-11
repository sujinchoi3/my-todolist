import { Router } from 'express';
import {
  signupController,
  loginController,
  logoutController,
  refreshTokenController,
} from '../controllers/authController';

const router = Router();

router.post('/signup', signupController);
router.post('/login', loginController);
router.post('/logout', logoutController);
router.post('/refresh', refreshTokenController);

export default router;
