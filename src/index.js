// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";


dotenv.config({
    path:'./env '
})


app.on("error",(error)=>{
    console.error("Database connection FAILED",error)
    process.exit(1)
})

connectDB()
.then(() =>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`The server is listening at PORT : ${process.env.PORT}`);
    })
})
.catch((err) =>{
    console.log("MONGODB connection FAILED: ",err);
})







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