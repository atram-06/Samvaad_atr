const cloudinary = require('cloudinary').v2;
const CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Initializing Cloudinary Storage...');
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'social-media-app',
        allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'avi', 'mp3', 'wav', 'm4a', 'aac'],
        resource_type: 'auto' // Auto-detect image, video, or audio
    }
});
console.log('Cloudinary Storage Initialized');

module.exports = { cloudinary, storage };
