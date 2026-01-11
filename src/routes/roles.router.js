import {
  getRoles,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/roles.controller.js';

const { Router } = await import('express');
const router = Router();

router.get('/', getRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;
