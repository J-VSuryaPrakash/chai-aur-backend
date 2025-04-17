import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"

const connectDB = async ()=>{
    try {

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        //  here we should also provide the name of the database for connection
        // console.log("MOGODB - connection : ",connectionInstance)
        console.log(`\n MONGODB connected !! - DB HOST: ${connectionInstance.connection.host}`)
        // 

    } catch (error) {
        console.log("MOGODB Connection FAILED: ", error)
        process.exit(1)
        //  this process is the reference to the current executing process - and we can exit() the process
    }
}


export default connectDB