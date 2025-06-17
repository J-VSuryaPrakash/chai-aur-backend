import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
// here we try to specify the limit of the json type data that our server can accept

app.use(express.urlencoded({extended: true, limit: "16kb"}))
// here we are trying to take the data from the url

app.use(express.static("public"))
// if there are any assets like file or images we keep them in the public folder

app.use(cookieParser())
// Using the cookie parser i can access the users browser cookies or set the cookies in the users browser


export { app }