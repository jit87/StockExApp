import { Schema, model } from "mongoose";

const EmpresaSchema = new Schema({
    nombre: {
        type: String,
        required: true
    },
    ticker: {
        type: String
    },
    precio: {
        type: Number
    },
    cantidad: {
        type: Number,
        required: true
    },
    capitalInvertido: {
        type: Number
    },
    industria: {
        type: String
    }
});

//Le paso el 3º parámetro porque si no mongoose crearia una coleccion pluralizando accion, es decir, con el nombre accions
export default model('Empresa', EmpresaSchema, 'empresas'); 