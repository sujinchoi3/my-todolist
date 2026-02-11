import { Router } from 'express';
import {
  createTodoController,
  getTodosController,
  getTodoByIdController,
  updateTodoController,
  updateTodoStatusController,
  deleteTodoController,
} from '../controllers/todoController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createTodoController);
router.get('/', getTodosController);
router.get('/:id', getTodoByIdController);
router.put('/:id', updateTodoController);
router.patch('/:id/status', updateTodoStatusController);
router.delete('/:id', deleteTodoController);

export default router;
