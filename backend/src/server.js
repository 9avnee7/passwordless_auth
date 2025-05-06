require("dotenv").config();
const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes=require('./routes/auth-routes')
const mongoose=require("mongoose")
const cookieParser = require('cookie-parser');


app.use(cors());


app.use(express.json());


app.use(cookieParser())

mongoose.connect(process.env.MongoDB_URL).then(result=>console.log('mongodb connected')).catch(e=>console.error('error occured',e));


app.use('/api/auth',authRoutes)


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});