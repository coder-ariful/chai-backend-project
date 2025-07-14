import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


// Configuration
// cloudinary.config({
//     cloud_name: "dvqtjfme3",
//     api_key: 515126792947119,
//     api_secret: "8R2d_GWLKy4NPA4b4mnn1CYioKo"
// });


cloudinary.config({
    cloud_name: 'dvqtjfme3',
    api_key: 515126792947119,
    api_secret: '8R2d_GWLKy4NPA4b4mnn1CYioKo'
});

// console.log('process.env.CLOUDINARY_CLOUD_NAME :', typeof process.env.CLOUDINARY_CLOUD_NAME);==================== console.log ==========

const uploadOnCloudinary = async (localFilePath) => {
    // console.log('Local file path only here', localFilePath);==================== console.log ==========
    try {
        // if local file path not here  then return 
        if (!localFilePath) return null

        // upload the file on cloudinary 
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: 'auto' })
        // after uploaded file in cloudinary 
        // console.log('File is uploaded on cloudinary :', response.url);==================== console.log ==========
        // console.log("cloudinary response :", response);==================== console.log ==========

        fs.unlinkSync(localFilePath) // delete the photo from local storage.

        // return the data 
        return response;
    } catch (error) {
        // fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed 
        // return null;


        if (fs.existsSync(localFilePath)) {
            // console.log('API KEY', process.env.CLOUDINARY_API_KEY);==================== console.log ==========
            // console.log('cloud_name', process.env.CLOUDINARY_CLOUD_NAME);==================== console.log ==========
            // console.error("Cloudinary Upload Error:", error)==================== console.log ==========
            console.error(error);
            fs.unlinkSync(localFilePath) // (optional — only if file exists)
            return null
        }

    }
}

export { uploadOnCloudinary }