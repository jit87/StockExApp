import { Router } from 'express';
import { agregarAccion } from '../controllers/accionController.js';

const router = Router();

//Ruta para añadir una acción
router.post('/', agregarAccion); 


export default router;