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



export async function obtenerAcciones(req, res) {

    try {

        const acciones = await Accion.find(); 
        res.json(acciones); 

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
    }
    
}



export async function actualizarAccion(req, res) {
    try {
        
        const { nombre, ticker, precio, cantidad, capitalInvertido, industria  } = req.body;
        let elem = await Accion.findById(req.params.id);

        if (!elem) {
            res.status(404).json({ msg:'No esiste esta acción' })
        }

        elem.nombre = nombre;
        elem.ticker = ticker;
        elem.precio = precio;
        elem.cantidad = cantidad;
        elem.capitalInvertido = capitalInvertido;
        elem.industria = industria; 

        elem = await Accion.findOneAndUpdate(
            { _id: req.params.id },
            elem,
            { new: true }  
        ); 

        res.json(elem); 

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
}

