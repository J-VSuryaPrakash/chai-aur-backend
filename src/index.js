// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env '
})
connectDB()







/*


import express from "express"

const app = express()

;( async () =>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("Error: ", error);
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`The server is listening at port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
} )()
//  It isa best practice to put a semicolon before the IIFE - this is because before the line of code
// we might not put a semicolon 



*/