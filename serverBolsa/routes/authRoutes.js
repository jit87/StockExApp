import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();


router.post('/registro', async (req, res) => {
    const { nombre, email, password } = req.body;

    try {
        //Verifica si el usuario ya existe
        const emailExistente = await Usuario.findOne({ email });
        if (emailExistente) {
            return res.status(400).send('El correo electrónico ya está en uso.');
        }

        //Hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //Crea nuevo usuario
        const newUser = new Usuario({
            nombre,
            email,
            password: hashedPassword
        });

        //Guarda el usuario en la base de datos
        const savedUser = await newUser.save();
        res.status(201).send({ user: savedUser._id });
    } catch (err) {
        res.status(400).send(err);
    }
});



router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        //Verifica si el usuario existe
        const user = await Usuario.findOne({ email });
        if (!user) {
            return res.status(400).send('Email o contraseña incorrectos.');
        }

        //Verifica contraseña
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.status(400).send('Contraseña incorrecta.');
        }

        //Genera y envia el token JWT
        const generatedToken = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
        res.json({ token: generatedToken });
    } catch (err) {
        res.status(500).send('Error en el servidor.');
    }
});


//Ruta para obtener usuario en función del email
router.get('/usuario/:email', async (req, res) => {

     try {
        const email = req.params.email;
        const user = await Usuario.findOne({ email: email }).exec();

        if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error });
    }
    
});

//Ruta para modificar contraseña
router.put('/modificar', async (req, res) => {

    try {
        const { email, actualPassword, nuevaPassword } = req.body;

            //Busca al usuario por email
            const usuario = await Usuario.findOne({ email });
            if (!usuario) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            //Verifica que la contraseña actual sea correcta
            const esValida = await bcrypt.compare(actualPassword, usuario.password);
            if (!esValida) {
                return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
            }

            //Encripta la nueva contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

            //Actualiza la contraseña
            usuario.password = hashedPassword;
            await usuario.save();
            console.log("Contraseña modificada"); 
            res.json({ nuevaPassword: nuevaPassword }); 
    } catch (err) {
        res.status(500).send(err);
    }
});


export default router;
