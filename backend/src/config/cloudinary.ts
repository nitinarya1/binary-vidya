import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcqgca3p4',
  api_key: process.env.CLOUDINARY_API_KEY || '859622467181683',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'v3V44AtCU0JlB-TwyEsAl_fL1gE',
  secure: true,
});

export default cloudinary;
