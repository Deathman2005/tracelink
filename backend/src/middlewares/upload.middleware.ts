import multer from 'multer';

// Use memory storage so we can process and upload files directly via the Storage service
const storage = multer.memoryStorage();

// Allowed file MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/msword', // DOC
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'application/vnd.ms-powerpoint', // PPT
  'image/jpeg',
  'image/png',
  'image/webp',
];

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Invalid file type. Supported formats: PDF, DOCX, PPTX, JPG, PNG, WEBP.'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limits
  },
});
