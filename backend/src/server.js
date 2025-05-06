require("dotenv").config();
const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes=require('./routes/auth-routes')
const mongoose=require("mongoose")
const cookieParser = require('cookie-parser');


app.use(cors({
  origin: ['http://localhost:5173','http://15.207.106.66/'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'], // ✅ Add your custom header here
}));


app.use(express.json());


app.use(cookieParser())

mongoose.connect(process.env.MongoDB_URL).then(result=>console.log('mongodb connected')).catch(e=>console.error('error occured',e));


app.use('/auth',authRoutes)


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});