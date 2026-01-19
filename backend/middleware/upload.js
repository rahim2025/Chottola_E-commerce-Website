const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  
  // Check extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (before compression)
  },
  fileFilter: fileFilter
});

// Middleware to compress uploaded images
const compressImages = async (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  try {
    // Handle single file
    if (req.file) {
      req.file.buffer = await sharp(req.file.buffer)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
        .toBuffer();
    }

    // Handle multiple files
    if (req.files && Array.isArray(req.files)) {
      req.files = await Promise.all(
        req.files.map(async (file) => {
          file.buffer = await sharp(file.buffer)
            .resize(1920, 1920, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 85, progressive: true, mozjpeg: true })
            .toBuffer();
          return file;
        })
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = upload;
module.exports.compressImages = compressImages;
