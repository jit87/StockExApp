import express from 'express';
import mongoose from 'mongoose';
import routerEmpresa from './routes/empresaRoutes.js';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import http from 'http';
import session from 'express-session';
import sharedSession from 'express-socket.io-session';
import { configureWebSocket } from './websockets/websocketServer.js';
import { Server as SocketIOServer } from 'socket.io';

//Crear servidor
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

//Configuración de la sesión
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'my-secret',
  resave: true,
  saveUninitialized: true,
});

//Aplicar el middleware de sesión
app.use(sessionMiddleware);

//Crear el servidor HTTP
const server = http.createServer(app);

//Configuración del servidor de WebSocket. Para peticiones en tiempo real
configureWebSocket(server, sessionMiddleware);

//URI de conexión de MongoDB
const uri = process.env.mongoUri || "mongodb://localhost:27017/StockExApp";

async function main() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Conectado a MongoDB correctamente");

    //Ruta de autenticación
    app.use('/', authRoutes);

    //Ruta de gestión de acciones
    app.use('/empresas', routerEmpresa);

    //Iniciar el servidor
    server.listen(process.env.PORT || 4000, () => {
      console.log(`Servidor corriendo en el puerto ${process.env.port || 4000}`);
    });
  } catch (err) {
    console.error(err);
  }
}

main().catch(console.error);
