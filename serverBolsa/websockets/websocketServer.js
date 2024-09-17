import { Server as SocketIOServer } from 'socket.io';
import axios from 'axios';
import Empresa from '../models/Empresa.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const { FINNHUB_API_KEY, TOKEN_SECRET } = process.env; 


export function configureWebSocket(server) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
  });


  io.use((socket, next) => {
    const token = socket.handshake.headers['authorization']?.split(' ')[1];

    if (!token) {
      return next(new Error('No token provided'));
    }

    jwt.verify(token, TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Invalid token'));
      }

      socket.usuarioId = decoded._id; 
      next();
    });
  });



  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);
    console.log('ID del usuario:', socket.usuarioId);

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });

    socket.on('someEvent', (data) => {
      console.log('Evento recibido:', data);
    });
  });


  async function actualizarPrecios() {
    try {
      const empresas = await Empresa.find();
      for (const empresa of empresas) {
        const { data } = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${empresa.ticker}&token=${FINNHUB_API_KEY}`);
        const nuevoPrecio = data.c;

        console.log(`Nuevo precio para ${empresa.ticker}: ${nuevoPrecio}`);

        if (nuevoPrecio !== empresa.precio) {
          empresa.precio = nuevoPrecio;
          await empresa.save();

          //Emite el evento de actualización de precios a todos los clientes
          io.emit('priceUpdate', {
            empresaId: empresa._id,
            nuevoPrecio: empresa.precio,
            variacion: nuevoPrecio > empresa.precio ? 'up' : 'down'
          });
        }
      }
    } catch (error) {
      console.error('Error al actualizar precios:', error);
    }
  }

  //Actualiza cada 50 segundos
  setInterval(actualizarPrecios, 30000);
}
