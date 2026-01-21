import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate uploaded files
 */
export const validateUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ 
      message: 'No file uploaded. Please select a file to upload.' 
    });
  }

  // Additional validation if needed
  const file = req.file;
  
  // Validate file size (should be caught by multer, but double-check)
  if (file.size > 10 * 1024 * 1024) {
    return res.status(400).json({ 
      message: 'File too large. Maximum size is 10 MB.' 
    });
  }

  // Validate MIME type
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({ 
      message: 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG.' 
    });
  }

  next();
};

/**
 * Error handler for multer upload errors
 */
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    console.error('Upload error:', err);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum size is 10 MB.' 
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Unexpected file field. Please upload only one file.' 
      });
    }

    return res.status(400).json({ 
      message: err.message || 'File upload failed. Please try again.' 
    });
  }
  
  next();
};
