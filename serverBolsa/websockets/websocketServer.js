import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Empresa from '../models/Empresa.js';
import dotenv from 'dotenv';

dotenv.config();
const { polygonApiKey, secretKey } = process.env;

export function configureWebSocket(server) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: 'http://localhost:4200',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

async function actualizarPrecios() {
  try {
    const empresas = await Empresa.find();
    for (const empresa of empresas) {
      const { data } = await axios.get(`https://api.polygon.io/v1/last/stocks/${empresa.ticker}?apiKey=${polygonApiKey}`);
      const nuevoPrecio = data.price;

      console.log(`Nuevo precio para ${empresa.ticker}: ${nuevoPrecio}`);

      if (nuevoPrecio !== empresa.precio) {
        empresa.precio = nuevoPrecio;
        await empresa.save();

        //Emite el evento de actualización de precios a todos los clientes
        io.emit('priceUpdate', {
          empresaId: empresa._id,
          nuevoPrecio: empresa.precio,
          variacion: empresa.precio > nuevoPrecio ? 'down' : 'up'
        });
      }
    }
  } catch (error) {
    console.error('Error al actualizar precios:', error);
  }
}

  //Actualiza cada 5 minutos
  setInterval(actualizarPrecios, 30000); 
}
