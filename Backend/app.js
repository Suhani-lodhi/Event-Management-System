
import authRouter from './Routes/auth.js'
import authenticate from './Middleware/authentication.js';
import authorize from './Middleware/authorization.js';
import express from "express";
import "dotenv/config.js";
import cors from "cors";


const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use("/auth", authRouter);



// tested the authorization and authenticated middleware
// app.get('/home', authenticate, authorize('ORGANIZER'), (req, res)=>{
//   res.json({
//     msg: "test successfully the middleware"
//   })
// })



app.listen(port, ()=>{
    console.log("app is listening on port", port)
})
