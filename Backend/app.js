import express from 'express'
import 'dotenv/config.js'
import authRouter from './Routes/auth.js'

const app = express();
const port = process.env.PORT || 4000;


app.use(express.json())
app.use('/auth', authRouter)




app.listen(port, ()=>{
    console.log("app is listening on port", port)
})