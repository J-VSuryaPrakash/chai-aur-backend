import { v2 as cloudinary} from "cloudinary"
import { response } from "express";
import fs from "fs"

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath)  return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        // file has been uploaded successfully 
        // console.log("File is uploaded successfully : ", response.url);

        fs.unlinkSync(localFilePath)
        
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        // removed the locally saved temporary file from the server as the upload operation failed
        return null
    }
}

export {uploadOnCloudinary}