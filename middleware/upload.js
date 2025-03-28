const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load environment variables
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // Default 10MB
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'application/pdf,image/jpeg,image/png').split(',');

// Create upload directory if it doesn't exist
const createUploadDir = (userId) => {
  const userDir = path.join(UPLOAD_DIR, userId);
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
  }
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.user || !req.user.id) {
      return cb(new Error('User not authenticated'), null);
    }
    
    const userDir = createUploadDir(req.user.id);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate a secure random filename to prevent path traversal attacks
    const randomName = crypto.randomBytes(16).toString('hex');
    const fileExt = path.extname(file.originalname);
    const safeFileName = `${randomName}${fileExt}`;
    
    // Store original filename in file object for reference
    file.originalFilename = file.originalname;
    file.secureFilename = safeFileName;
    
    cb(null, safeFileName);
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`), false);
  }
};

// Initialize upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

// Middleware to handle file upload errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

// Middleware to validate user access to files
const validateFileAccess = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Get the document from the database
    const Document = require('../models/Document');
    const document = await Document.findById(fileId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if the user owns the document
    if (document.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this file'
      });
    }
    
    // Add document to request for later use
    req.document = document;
    next();
  } catch (error) {
    console.error('Error validating file access:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating file access'
    });
  }
};

module.exports = {
  upload,
  handleUploadErrors,
  validateFileAccess,
  UPLOAD_DIR
};
