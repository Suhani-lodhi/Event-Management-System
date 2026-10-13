import path from "path";
import fs from 'fs'
import crypto from "crypto";
import multer from "multer";


const uploadDir = "uploads";
fs.mkdirSync(uploadDir, {recursive: true});

const storage = multer.diskStorage({
    destination :uploadDir,
    filename: (req, file, cb) =>{
        cb(null, crypto.randomUUID()+path.extname(file.originalname).toLowerCase());
    }
})

const allowed = ["image/jpeg", "image/png" , "image/webp"];

export const upload = multer({
    storage,
    limits: {fileSize: 5*1024*1024}, 
    fileFilter: (req, file, cb) => {
        if(allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Only JPG, PNG OR WEBP images are allowed"))
    }
});