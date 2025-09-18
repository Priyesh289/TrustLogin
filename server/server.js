import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import connectDB from './config/mongoDB.js';

import authRouter from './routes/authRoutes.js'
import userRouter from "./routes/userRoutes.js";

const app = express();
const port = process.env.PORT || 8080

const allowedOrigins = ['http://localhost:5173']

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }))

//API endpoints
app.get('/', (req, res) => res.send('API working'))
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter)

app.listen(port, async () => {

    console.log(`server has connected port http://localhost:${port}`)
    await connectDB()
})
