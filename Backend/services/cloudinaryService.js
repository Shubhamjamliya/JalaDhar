const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {String} folder - Cloudinary folder path
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadToCloudinary = (buffer, folder = 'uploads', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, ...options },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Upload file from path to Cloudinary
 * @param {String} filePath - Local file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadFileToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, options);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

/**
 * Upload multiple files
 * @param {Array} files - Array of file buffers or paths
 * @param {String} folder - Cloudinary folder path
 * @param {Object} options - Additional upload options
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleFiles = async (files, folder = 'uploads', options = {}) => {
  const uploadPromises = files.map(file => {
    if (Buffer.isBuffer(file)) {
      return uploadToCloudinary(file, folder, options);
    } else if (typeof file === 'string' && fs.existsSync(file)) {
      return uploadFileToCloudinary(file, { folder, ...options });
    } else {
      throw new Error('Invalid file format');
    }
  });

  return Promise.all(uploadPromises);
};

module.exports = {
  uploadToCloudinary,
  uploadFileToCloudinary,
  deleteFromCloudinary,
  uploadMultipleFiles,
  cloudinary
};

