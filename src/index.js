// require ('dotenv').config()
// require('dotenv').config({path : './env'})

import dotenv from 'dotenv'
import connectDB from "./DB/index.js";
import { app } from './app.js';
// efi function && efi start with commonly ";"   
// ()()

// dotenv.config({path : './.env'})
dotenv.config()

connectDB()
.then(()=>{
    app.on("error", (error)=>{
        console.log('After DB connection there is App create problem or Error', error);
        throw error
    })
    
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is Running at : http://localhost:${process.env.PORT}`);
    })
})
.catch(error => {
    console.log("error in index connect : ", error);
    
})








/*
import express from "express"
const app = express()

;(async()=> {
try {
   await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
   app.on("error", (error)=> {
        console.log("after db connect app error :", error);
        throw error
   })
      
   app.listen(process.env.PORT,()=>{
    console.log(`App is listening on port ${process.env.PORT}`);
   })
} catch (error) {
    // console.log(error);
    console.error('Error :', error)
    throw error
}
})()

*/