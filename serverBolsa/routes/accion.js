import { Router } from 'express';
import { actualizarAccion, agregarAccion, eliminarAccion, obtenerAcciones } from '../controllers/accionController.js';

const router = Router();

//Ruta para añadir una acción
router.post('/', agregarAccion); 

//Ruta para obtener todas las acciones
router.get('/', obtenerAcciones); 

//Ruta para actualizar una acción
router.put('/:id', actualizarAccion);

//Ruta para eliminar una acción
router.delete('/:id', eliminarAccion); 


export default router;