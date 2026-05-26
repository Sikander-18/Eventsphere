const multer = require('multer');
const { cloudinary, hasCloudinaryConfig } = require('../config/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) return next();
  if (!hasCloudinaryConfig) {
    req.fileUrl = '';
    return next();
  }

  try {
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'eventsphere',
      resource_type: 'image'
    });
    req.fileUrl = result.secure_url;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Image upload failed', error: error.message });
  }
};

module.exports = { upload, uploadToCloudinary };

