import { Server as SocketIOServer } from 'socket.io';
import axios from 'axios';
import Empresa from '../models/Empresa.js';
import dotenv from 'dotenv';
import sharedsession from 'express-socket.io-session'; 

dotenv.config();
const { FINNHUB_API_KEY, TOKEN_SECRET } = process.env;

//Almacena las conexiones de usuario
const userConnections = new Map(); 

export function configureWebSocket(server) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
  });


  //Obtener empresas distintas
  async function obtenerEmpresasDistintas() {
    try {
      const empresasDistintas = await Empresa.aggregate([
        { $group: { _id: "$ticker", empresa: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$empresa" } }
      ]);
      return empresasDistintas;
    } catch (error) {
      console.error('Error al obtener empresas distintas:', error);
      return [];
    }
  }


  //Ajustar la función para actualizar precios basada en los IDs de los usuarios conectados
  async function actualizarPrecios() {

    try {
      
      const empresasDistintas = await obtenerEmpresasDistintas();
      //const empresas = await Empresa.find();

      for (const empresa of empresasDistintas) {
        const { data } = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${empresa.ticker}&token=${FINNHUB_API_KEY}`);
        const nuevoPrecio = data.c;
        console.log(`Nuevo precio para ${empresa.ticker}: ${nuevoPrecio}`);

        if (nuevoPrecio !== empresa.precio) {
          //empresa.precio = nuevoPrecio;
          //await empresa.save();

          //Actualiza todas las instancias de la empresa con el nuevo precio
          await Empresa.updateMany({ ticker: empresa.ticker }, { precio: nuevoPrecio });

          //Emitir el evento de actualización de precios solo a los usuarios conectados
          userConnections.forEach((socketId) => {
            io.to(socketId).emit('priceUpdate', {
              empresaId: empresa._id,
              nuevoPrecio: empresa.precio,
              variacion: nuevoPrecio > empresa.precio ? 'up' : 'down'
            });
          });
        }
      }
      console.log(' --------------------------'); 
      console.log('| Siguiente actualización  |'); 
      console.log(' --------------------------'); 
    } catch (error) {
      console.error('Error al actualizar precios:', error);
    }
  }

  // Actualiza cada 25 segundos
  setInterval(actualizarPrecios, 30000);
}
