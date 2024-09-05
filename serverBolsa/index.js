import express from 'express';
import mongoose from 'mongoose';
import routerAccion from './routes/accion.js'; 
import cors from 'cors'; 

// Crear servidor
const app = express();

// Habilitar middleware para parsear JSON
app.use(express.json());

//Para solucionar el problema CORS
app.use(cors());

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

        
        //Ruta de la gestión de acciones
        app.use('/acciones', routerAccion); 


        //Iniciar servidor en el puerto 4000
        app.listen(4000, () => {
            console.log("El servidor está corriendo correctamente en el puerto 4000");
        });

    } catch (err) {
        console.error(err);
    }
}

main().catch(console.error);


