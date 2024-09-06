import Empresa from "../models/Empresa.js";



export async function agregarEmpresa(req, res) {

    try {

        const { nombre, ticker, precio, cantidad, capitalInvertido, industria } = req.body;
        
        //Creamos la Empresa
        const nuevaEmpresa = new Empresa({
            nombre,
            ticker,
            precio,
            cantidad,
            capitalInvertido,
            industria
        });

        //Guargamos la Empresa en la BBDD
        const resultado = await nuevaEmpresa.save(); 
        res.status(201).json(resultado);
        
    } catch (error) {
        console.log(error);
        res.status(400).json({ msg: error.msg });
    }

}



export async function obtenerEmpresas(req, res) {

    try {

        const empresas = await Empresa.find(); 
        res.json(empresas); 

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
    }
    
}



export async function actualizarEmpresa(req, res) {

    try {
        
        const { nombre, ticker, precio, cantidad, capitalInvertido, industria } = req.body;

        //Busca la acción por id y la guarda en elem
        let elem = await Empresa.findById(req.params.id);

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

        //Actualizamos en la BBDD de mongoDB la Empresa en función del Id, el 2º parametro (elem) carga la información en la BBDD 
        elem = await Empresa.findOneAndUpdate(
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



export async function eliminarEmpresa(req, res) {
    try {

        let elem = await Empresa.findById(req.params.id);
        
        if (!elem) {
            res.status(404).json({ msg: 'No existe la acción' }); 
        }

        await Empresa.findByIdAndDelete({ _id: req.params.id });
        res.json({ msg: 'Acción eliminada' });
        

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
    }
    
}
