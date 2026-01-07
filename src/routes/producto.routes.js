import {
  getProductos,
  getProductosCosecha,
  createProducto,
  updateProducto,
  deleteProducto
} from '../controllers/producto.controller.js';

const { Router } = await import('express');
const router = Router();

router.get('/', getProductos);
router.get('/cosecha', getProductosCosecha);
router.post('/', createProducto);
router.put('/:id', updateProducto);
router.delete('/:id', deleteProducto);

export default router;