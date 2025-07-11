import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = express();

// middleware here only..
app.use(cors({
    origin : process.env.CORS_ORIGIN,  // for connect to frontend with backend use cors
    credentials : true
}))

app.use(express.json({limit : '16kb'}));
app.use(express.urlencoded({extended : true, limit : '16kb'}));
app.use(express.static("public"));

app.use(cookieParser());


export { app }