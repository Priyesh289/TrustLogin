import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import connectDB from './config/mongoDB.js';

import authRouter from './routes/authRoutes.js'
import userRouter from "./routes/userRoutes.js";

const app = express();
const port = process.env.PORT || 8080

const allowedOrigins = [process.env.Frontend_URL]

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight requests for all routes
app.options("*", cors());

//API endpoints
app.get('/', (req, res) => res.send('API working'))
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter)

app.listen(port, async () => {

    console.log(`server has connected port http://localhost:${port}`)
    await connectDB()
})
