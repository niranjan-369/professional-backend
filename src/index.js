// require('dotenv').config({path: './env'});
import dotenv from "dotenv";

import connectDB from "./db/index.js";
import {app} from "./app.js"

dotenv.config({
    path:'./env'
})



connectDB()
.then(() =>{
    app.listen(process.env.PORT || 8000, () =>{
        console.log(`Server is running on Port: ${process.env.PORT}`);
    })
    
    app.get('/', (req, res) => {
        res.send("yeah buddy how are you..");
    })

    app.on('error',() => {
        console.error("Error: ",error);
        throw error;
    })

})
.catch((err) => {
    console.log("MongoDB connection failed !!!",err);
})

/*

import express from "express";
const app = express();

;( async()=> {

    try {
        await mongoose.connect('${process.env.MONGODB_URL}'/'${DB_NAME}');
        app.on("error",()=>{
            console.log("ERR: ",error);
            throw error;
            
        })

        app.listen(process.env.PORT, () => { 
            console.log('App is listing on port ${process.env.PORT}');
        })

    } catch (error) {
        console.error("Error : ",error);
        throw error;
    }

})()
    
*/