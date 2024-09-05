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

export default model('Accion', AccionSchema); 