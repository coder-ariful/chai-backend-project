import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        const connectInstance = await mongoose.connect(`${process.env.MONGODB_URL}${DB_NAME}`)

        console.log(`\n KnowToKnow : ${connectInstance}`);
        console.log(`\n MongoDB connected !! DB Host : ${connectInstance.connection.host}`);
    } catch (error) {
        console.error('MongoDB Connection Error :', error)
        // throw error  --- second type 
        process.exit(1) // this is from node.js 
    }
}

export default connectDB;