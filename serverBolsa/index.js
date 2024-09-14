import express from 'express';
import mongoose from 'mongoose';
import routerEmpresa from './routes/empresa.js';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import http from 'http';
import { configureWebSocket } from './websockets/websocketServer.js';

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

//Crear el servidor HTTP
const server = http.createServer(app);

//Configuración del servidor de WebSocket. Para peticiones en tiempo real
configureWebSocket(server);

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
    server.listen(process.env.port || 4000, () => {
      console.log(`Servidor corriendo en el puerto ${process.env.port || 4000}`);
    });
  } catch (err) {
    console.error(err);
  }
}

main().catch(console.error);
