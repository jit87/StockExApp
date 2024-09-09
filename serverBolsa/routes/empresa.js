import { Router } from 'express';
import { actualizarEmpresa, agregarEmpresa, eliminarEmpresa, obtenerEmpresas, obtenerEmpresa } from '../controllers/empresaController.js';

const router = Router();

//Ruta para añadir una acción
router.post('/', agregarEmpresa); 

//Ruta para obtener todas las empresas
router.get('/', obtenerEmpresas); 

//Ruta para actualizar una acción
router.put('/:id', actualizarEmpresa);

//Ruta para eliminar una acción
router.delete('/:id', eliminarEmpresa); 

//Ruta para obtener una empresa por su id
router.get('/:id', obtenerEmpresa); 


export default router;