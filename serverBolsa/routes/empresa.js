import { Router } from 'express';
import { actualizarEmpresa, agregarEmpresa, eliminarEmpresa, obtenerEmpresas, obtenerEmpresa } from '../controllers/empresaController.js';
import authenticate  from '../middlewares/authenticate.js'; 

const router = Router();

//Autenticamos todas las rutas
router.use(authenticate); 

//Ruta para añadir una acción
router.post('/', agregarEmpresa); 

//Ruta para obtener todas las empresas
router.get('/todas/:id', obtenerEmpresas); 

//Ruta para actualizar una acción
router.put('/:id', actualizarEmpresa);

//Ruta para eliminar una acción
router.delete('/:id', eliminarEmpresa); 

//Ruta para obtener una empresa por su id
router.get('/:id', obtenerEmpresa); 


export default router;