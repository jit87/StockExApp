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
        
        const { nombre, ticker, precio, cantidad, capitalInvertido, industria } = req.body;

        //Busca la acción por id y la guarda en elem
        let elem = await Accion.findById(req.params.id);

        if (!elem) {
            res.status(404).json({ msg:'No esiste esta acción' })
        }

        //Actualizamos las propiedades de la acción
        elem.nombre = nombre;
        elem.ticker = ticker;
        elem.precio = precio;
        elem.cantidad = cantidad;
        elem.capitalInvertido = capitalInvertido;
        elem.industria = industria; 

        //Actualizamos en la BBDD de mongoDB la accion en función del Id, el 2º parametro (elem) carga la información en la BBDD 
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



export async function eliminarAccion(req, res) {
    try {

        let elem = await Accion.findById(req.params.id);
        
        if (!elem) {
            res.status(404).json({ msg: 'No existe la acción' }); 
        }

        await Accion.findByIdAndDelete({ _id: req.params.id });
        res.json({ msg: 'Acción eliminada' });
        

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
    }
    
}
