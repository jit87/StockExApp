import Accion from "../models/Accion.js";


export async function agregarAccion(req, res) {

    try {

        const { nombre, ticker, precio, cantidad, capitalInvertido, industria } = req.body;
        
        //Creamos la accion
        const nuevaAccion = new Accion({
            nombre,
            ticker,
            precio,
            cantidad,
            capitalInvertido,
            industria
        });

        //Guargamos la accion en la BBDD
        const resultado = await nuevaAccion.save(); 
        res.status(201).json(resultado);
        
    } catch (error) {
        console.log(error);
        res.status(400).json({ msg: error.msg });
    }

}