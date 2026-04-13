const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const sharp = require('sharp');

const normalizeUploadInput = (input) => {
  if (Buffer.isBuffer(input)) {
    return { buffer: input, mimetype: undefined, originalname: undefined };
  }

  if (input && Buffer.isBuffer(input.buffer)) {
    return {
      buffer: input.buffer,
      mimetype: input.mimetype,
      originalname: input.originalname
    };
  }

  throw new Error('Invalid upload input: expected a Buffer or a multer file');
};

// Compress and optimize image BEFORE uploading to Cloudinary (to save storage space)
exports.compressImage = async (fileBuffer, options = {}) => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 80,
    format = 'webp',
    sourceMimeType
  } = options;

  try {
    // Preserve animated GIFs as-is (sharp would otherwise flatten to a single frame)
    if (sourceMimeType === 'image/gif') {
      const meta = await sharp(fileBuffer, { animated: true }).metadata();
      if ((meta.pages || 1) > 1) {
        return fileBuffer;
      }
      // non-animated GIFs can be converted safely
    }

    const img = sharp(fileBuffer)
      .rotate()
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });

    if (format === 'webp') {
      return await img.webp({ quality, effort: 4 }).toBuffer();
    }

    if (format === 'avif') {
      return await img.avif({ quality, effort: 4 }).toBuffer();
    }

    if (format === 'png') {
      return await img.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    }

    // jpeg fallback
    return await img.jpeg({ quality, progressive: true, mozjpeg: true }).toBuffer();
  } catch (error) {
    console.error('Error compressing image:', error);
    return fileBuffer;
  }
};

// Upload image to Cloudinary (with pre-upload compression to save Cloudinary storage)
// Accepts either a raw Buffer or a multer file object ({ buffer, mimetype, originalname }).
// Returns the full Cloudinary upload result.
exports.uploadToCloudinary = async (input, folder = 'products', compressOrOptions = true) => {
  try {
    const { buffer: fileBuffer, mimetype } = normalizeUploadInput(input);

    let bufferToUpload = fileBuffer;

    const compress = typeof compressOrOptions === 'boolean' ? compressOrOptions : true;
    const overrideOptions =
      typeof compressOrOptions === 'object' && compressOrOptions !== null ? compressOrOptions : {};

    // Compress image before uploading if enabled
    if (compress) {
      const compressionOptions = {
        products: { maxWidth: 1600, maxHeight: 1600, quality: 80, format: 'webp' },
        categories: { maxWidth: 800, maxHeight: 800, quality: 80, format: 'webp' },
        avatars: { maxWidth: 500, maxHeight: 500, quality: 80, format: 'webp' },
        thumbnails: { maxWidth: 300, maxHeight: 300, quality: 75, format: 'webp' }
      };

      const baseOptions = compressionOptions[folder] || compressionOptions.products;
      bufferToUpload = await exports.compressImage(fileBuffer, {
        ...baseOptions,
        ...overrideOptions,
        sourceMimeType: mimetype
      });
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `chottola/${folder}`,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
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
exports.deleteFromCloudinary = async (imageUrlOrImageObj) => {
  try {
    const imageUrl =
      typeof imageUrlOrImageObj === 'string'
        ? imageUrlOrImageObj
        : imageUrlOrImageObj?.url;

    if (!imageUrl || typeof imageUrl !== 'string') {
      return;
    }

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
