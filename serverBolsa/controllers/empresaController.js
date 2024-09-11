import Empresa from "../models/Empresa.js";



export async function agregarEmpresa(req, res) {

  const { nombre, ticker, precio, cantidad, capitalInvertido, industria } = req.body;

  const nuevaEmpresa = new Empresa({
    nombre,
    ticker,
    precio,
    cantidad,
    capitalInvertido,
    industria,
    usuarioId: req.usuarioId
  });
  
  try {
    const empresaGuardada = await nuevaEmpresa.save();
    res.status(201).json(empresaGuardada);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }

}



export async function obtenerEmpresas(req, res) {

    try {
        const empresas = await Empresa.find({ usuarioId: req.usuarioId }); 
        res.json(empresas); 

        } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }

}



export async function actualizarEmpresa(req, res) {

     try {
        const { nombre, ticker, precio, cantidad, capitalInvertido, industria } = req.body;

        //Busca la empresa por ID
        const empresa = await Empresa.findById(req.params.id);

        if (!empresa) {
            return res.status(404).json({ msg: 'No existe esta empresa' });
        }

        //Verifica si la empresa pertenece al usuario autenticado
        if (empresa.usuarioId.toString() !== req.usuarioId) {
            return res.status(403).json({ message: 'No tienes permiso para actualizar esta empresa' });
        }

        //Actualizamos las propiedades de la empresa
        empresa.nombre = nombre || empresa.nombre;
        empresa.ticker = ticker || empresa.ticker;
        empresa.precio = precio || empresa.precio;
        empresa.cantidad = cantidad || empresa.cantidad;
        empresa.capitalInvertido = capitalInvertido || empresa.capitalInvertido;
        empresa.industria = industria || empresa.industria;

        //Guardamos en BBDD
        const empresaActualizada = await empresa.save();

        res.json(empresaActualizada);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
    
}



export async function eliminarEmpresa (req, res) {

   try {
        
        //Busca la empresa por ID
        const empresa = await Empresa.findById(req.params.id);
        
        if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });

        //Verifica si la empresa pertenece al usuario autenticado
        if (empresa.usuarioId.toString() !== req.usuarioId) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar esta empresa' });
        }
        
        //Eliminamos
        await empresa.remove();
            res.json({ message: 'Empresa eliminada' });
        } catch (err) {
            res.status(500).json({ message: err.message });
    }
    
};


  

export async function obtenerEmpresa (req, res) {

    try {
      
        const empresa = await Empresa.findById(req.params.id);

        if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });

        // Verifica si la empresa pertenece al usuario autenticado
        if (empresa.usuarioId.toString() !== req.usuarioId) {
          return res.status(403).json({ message: 'No tienes permiso para acceder a esta empresa' });
        }

        res.json(empresa);

      } catch (err) {
            res.status(500).json({ message: err.message });
    }
    
};

