import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  //console.log(token); 

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    //Revisar bien que usuarioId este con el mismo nombre en otras partes si no puede fallar
    req.usuarioId = decoded._id;
    next();
  });
  
};

export default authenticate; 
