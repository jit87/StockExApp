import { Schema, model } from "mongoose";

const AccionSchema = new Schema({
    nombre: {
        type: String,
        required: true
    },
    ticker: {
        type: String
    },
    precio: {
        type: Number,
        required: true
    },
    cantidad: {
        type: Number,
        required: true
    },
    capitalInvertido: {
        type: Number,
        required: true
    },
    industria: {
        type: String
    }
});

//Le paso el 3º parámetro porque si no mongoose crearia una coleccion pluralizando accion, es decir, con el nombre accions
export default model('Accion', AccionSchema, 'acciones'); 