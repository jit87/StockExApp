import express from 'express';
import mongoose from 'mongoose';
import routerEmpresa from './routes/empresa.js'; 
import cors from 'cors'; 
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';


//Crear servidor
//Para peticiones http normales, estáticas
const app = express();


//Habilitar middleware para parsear JSON
app.use(express.json());


//Configurar CORS
const corsOptions = {
  origin: 'http://localhost:4200',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true,
};
app.use(cors(corsOptions));


//Cargar variables de entorno
dotenv.config();


//Crear el servidor HTTP
const server = http.createServer(app);


//Configuración del servidor de WebSocket
//(creado para comunicarnos en tiempo real con la API)
//para obtener el precio de las acciones cada vez que varíe
const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});


//URI de conexión de MongoDB
const uri = process.env.mongoUri || "mongodb://localhost:27017/StockExApp";


async function main() {

 try { 
    //Conectar a MongoDB
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Conectado a MongoDB correctamente");

     
    //Configurar WebSocket
    io.on('connection', (socket) => {
      console.log('Nuevo cliente conectado:', socket.id);

      socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
      });
    });

     
    //Vincular el objeto `io` a la solicitud para su uso en controladores
    app.use((req, res, next) => {
      req.io = io;
      next();
    });

     
    //Ruta de autenticación
    app.use('/', authRoutes);
     

    //Ruta de gestión de acciones
    app.use('/empresas', routerEmpresa);
     

    //Iniciar el servidor
    server.listen(process.env.port || 4000, () => {
      console.log(`Servidor corriendo en el puerto ${process.env.port || 4000}`);
    });
     
  } catch (err) {
    console.error(err);
    }
    
}

main().catch(console.error);
