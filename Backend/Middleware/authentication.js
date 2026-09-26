import 'dotenv/config.js'
import jwt from 'jsonwebtoken'

const authenticate = async (req, res, next) =>{
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        res.status(401).json({msg: "Token not sent"})
    }

    const token= authHeader.split(' ')[1];

    try{
       const decoded= jwt.verify(token, process.env.JWT_SECRET);
       console.log("decoded ----> " ,decoded);
       req.user = decoded;
       next();
    }
    catch{
       return res.status(401).json({ msg: "Invalid or expired token" });
    }

}

export default authenticate;