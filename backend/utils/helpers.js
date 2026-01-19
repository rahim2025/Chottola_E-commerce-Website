const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const sharp = require('sharp');

// Compress and optimize image
exports.compressImage = async (fileBuffer, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 80,
    format = 'jpeg'
  } = options;

  try {
    // Process image with sharp
    const compressedBuffer = await sharp(fileBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(format, {
        quality,
        progressive: true,
        mozjpeg: true // Use mozjpeg for better compression
      })
      .toBuffer();

    return compressedBuffer;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original buffer if compression fails
    return fileBuffer;
  }
};

// Upload image to Cloudinary (with compression)
exports.uploadToCloudinary = async (fileBuffer, folder = 'products', compress = true) => {
  try {
    let bufferToUpload = fileBuffer;

    // Compress image before uploading if enabled
    if (compress) {
      // Different compression settings for different folders
      const compressionOptions = {
        products: { maxWidth: 1920, maxHeight: 1920, quality: 85, format: 'jpeg' },
        avatars: { maxWidth: 500, maxHeight: 500, quality: 80, format: 'jpeg' },
        thumbnails: { maxWidth: 300, maxHeight: 300, quality: 75, format: 'jpeg' }
      };

      const options = compressionOptions[folder] || compressionOptions.products;
      bufferToUpload = await exports.compressImage(fileBuffer, options);
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `chottola/${folder}`,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      );

      streamifier.createReadStream(bufferToUpload).pipe(uploadStream);
    });
  } catch (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

// Delete image from Cloudinary
exports.deleteFromCloudinary = async (imageUrl) => {
  try {
    // Extract public_id from URL
    const urlParts = imageUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    const folder = urlParts[urlParts.length - 2];
    
    const fullPublicId = `chottola/${folder}/${publicId}`;
    
    await cloudinary.uploader.destroy(fullPublicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

// Calculate pagination
exports.getPagination = (page, limit) => {
  const currentPage = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;
  const skip = (currentPage - 1) * pageSize;

  return { page: currentPage, limit: pageSize, skip };
};

// Format success response
exports.successResponse = (res, statusCode, data, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

// Format error response
exports.errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};
