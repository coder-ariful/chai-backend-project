import mongoose from "mongoose";
import { DB_NAME } from "./constants";

// efi function && efi start with commonly ";"   
// ()()


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