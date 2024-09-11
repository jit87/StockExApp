import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();



// Registro de usuarios
router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Usuario({
        nombre,
        email,
        password: hashedPassword
    });

    try {
        const savedUser = await newUser.save();
        res.send({ user: savedUser._id });
    }   catch (err) {
        res.status(400).send(err);
    }
});




// Login de usuarios
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await Usuario.findOne({ email });
    if (!user) return res.status(400).send('Email o contraseña incorrectos.');

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).send('Contraseña incorrecta.');

    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send(token);
});



export default router;
