const multer = require('multer');
const { cloudinary, hasCloudinaryConfig } = require('../config/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) return next();

  // Create Base64 Data URI supporting all image types dynamically based on mimetype (e.g., image/webp, image/png, etc.)
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

  if (!hasCloudinaryConfig) {
    console.log('Cloudinary not configured. Storing image as Base64 data URI.');
    req.fileUrl = dataUri;
    return next();
  }

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'eventsphere',
      resource_type: 'image'
    });
    req.fileUrl = result.secure_url;
    next();
  } catch (error) {
    console.warn('Cloudinary upload failed. Falling back gracefully to Base64 data URI:', error.message);
    req.fileUrl = dataUri;
    next();
  }
};

module.exports = { upload, uploadToCloudinary };

