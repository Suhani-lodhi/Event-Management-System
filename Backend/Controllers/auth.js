import {StatusCodes} from 'http-status-codes'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import 'dotenv/config.js'

const participantSignup = async (req, res) =>{
   const userData =req.body;
   console.log(userData);

   const salt= await bcrypt.genSalt(10);   
   userData.password=await bcrypt.hash(userData.password, salt);

   // add data to database

   const token = jwt.sign({email: userData.email, password:userData.password}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME})
   
   res.status(StatusCodes.CREATED).json({
    token: token,
    msg: "participant sign up"
   })
}

const organizerSignup = async (req, res) =>{
const userData =req.body;
   console.log(userData);
   userData.role='ORGANIZER';
   const salt= await bcrypt.genSalt(10);   
   userData.password=await bcrypt.hash(userData.password, salt);

   // add data to database

   const token = jwt.sign({email: userData.email, password:userData.password}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME})
   
   res.status(StatusCodes.CREATED).json({
    token: token,
    msg: "organizer sign up"
   })
}

const login = async (req, res) =>{
const {username, email, password} =req.body;
   res.status(StatusCodes.CREATED).json({
    username:username,
    email:email,
    msg: "login successfully"
   })
}

export {
  participantSignup,
  organizerSignup,
  login
}