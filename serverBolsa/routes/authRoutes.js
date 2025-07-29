import express from 'express'
import dotenv from 'dotenv';
import { registro, login, getUsuarioByEmail, modificarEmail, modificarNombre, modificarPassword } from '../controllers/authController.js';

dotenv.config();

const router = express.Router();

//Ruta registro
router.post('/registro', registro);

//Ruta login
router.post('/login', login);

//Ruta para obtener usuario en función del email
router.get('/usuario/:email', getUsuarioByEmail);

//Ruta para modificar contraseña
router.put('/modificar-pass', modificarPassword);

//Ruta para modificar nombre
router.put('/modificar-nombre', modificarNombre);

//Ruta para modificar email
router.put('/modificar-email', modificarEmail);


export default router;
