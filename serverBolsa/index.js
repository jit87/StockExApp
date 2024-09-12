import express from 'express';
import mongoose from 'mongoose';
import routerEmpresa from './routes/empresa.js'; 
import cors from 'cors'; 
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js'


// Crear servidor
const app = express();

// Habilitar middleware para parsear JSON
app.use(express.json());

//Para solucionar el problema CORS
app.use(cors());

//Para las variables de entorno
dotenv.config();

// URI de conexión
const uri = "mongodb://localhost:27017/StockExApp";

async function main() {
    try {
        //Conectar al cliente. Usamos la librería mongoose.
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Conectado a MongoDB correctamente");

        //Ruta principal
        app.get('/', (req, res) => {
            res.send('StockExApp Server Running');
        });

        //Permite usar objetos js
        app.use(express.json()); 


        //Ruta de autenticación
        app.use('/', authRoutes);

        
        //Ruta de la gestión de acciones
        app.use('/empresas', routerEmpresa); 


        //Iniciar servidor en el puerto 4000
        app.listen(4000, () => {
            console.log("El servidor está corriendo correctamente en el puerto 4000");
        });





    } catch (err) {
        console.error(err);
    }
}

main().catch(console.error);




