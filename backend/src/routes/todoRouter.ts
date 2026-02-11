import { Router } from 'express';
import {
  createTodoController,
  getTodosController,
  getTodoByIdController,
} from '../controllers/todoController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createTodoController);
router.get('/', getTodosController);
router.get('/:id', getTodoByIdController);

export default router;
