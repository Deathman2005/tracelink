import { Response } from 'express';
import User from '../models/user.model';
import File from '../models/file.model';
import StorageService from '../services/storage.service';
import QRService from '../services/qr.service';
import QRCodeModel from '../models/qr.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { BASE_URL } from '../config/constants';

/**
 * Helper to generate unique short alphanumeric codes
 */
const generateUniqueCode = async (): Promise<string> => {
  let attempts = 0;
  while (attempts < 10) {
    const code = Math.random().toString(36).substring(2, 8);
    const exists = await File.findOne({ shortCode: code });
    if (!exists) return code;
    attempts++;
  }
  throw new Error('Could not generate a unique file code.');
};

class FileController {
  /**
   * Upload and register a new tracked document file
   */
  public async uploadFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = req.file;
      const userId = req.user?.userId;
      const { requireLeadGate } = req.body;

      if (!file) {
        res.status(400).json({ message: 'No file uploaded.' });
        return;
      }

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Determine file type category
      let fileType: 'pdf' | 'docx' | 'ppt' | 'pptx' | 'image' | 'other' = 'other';
      if (file.mimetype === 'application/pdf') {
        fileType = 'pdf';
      } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
      ) {
        fileType = 'docx';
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        fileType = 'pptx';
      } else if (file.mimetype === 'application/vnd.ms-powerpoint') {
        fileType = 'ppt';
      } else if (file.mimetype.startsWith('image/')) {
        fileType = 'image';
      }

      const shortCode = await generateUniqueCode();

      const user = await User.findById(userId);
      const userConfig = user?.storageConfig;

      // Write file via storage service
      const { s3Key, fileUrl } = await StorageService.saveFile(file, shortCode, userConfig);

      // Web viewer redirection URL
      const viewerUrl = `${BASE_URL}/f/${shortCode}`;

      // Generate QR Code data URL
      const qrCodeUrl = await QRService.generateQRCode(viewerUrl);

      // Create primary File document
      const fileDoc = await File.create({
        userId,
        originalName: file.originalname,
        s3Key,
        fileUrl,
        fileType,
        shortCode,
        size: file.size,
        requireLeadGate: requireLeadGate === true || requireLeadGate === 'true',
      });

      // Create corresponding QRCode document in the database
      await QRCodeModel.create({
        userId,
        fileId: fileDoc._id,
        code: shortCode,
        qrImageUrl: qrCodeUrl,
      });

      res.status(201).json(fileDoc);
    } catch (error: any) {
      if (error.code === 11000 || error.message?.includes('E11000')) {
        res.status(400).json({
          message: 'A duplicate tracking asset or shortcode already exists. Please try again.',
        });
        return;
      }
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Get all files uploaded by user
   */
  public async getFiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const files = await File.find({ userId }).sort({ createdAt: -1 });
      
      // Join qrImageUrl from QRCodes collection
      const filesWithQr = [];
      for (const f of files) {
        const qr = await QRCodeModel.findOne({ fileId: f._id });
        filesWithQr.push({
          ...f.toObject(),
          qrCodeUrl: qr?.qrImageUrl || '',
        });
      }

      res.status(200).json(filesWithQr);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Get single file metadata
   */
  public async getFileById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const fileDoc = await File.findOne({ _id: id, userId });
      if (!fileDoc) {
        res.status(404).json({ message: 'File not found.' });
        return;
      }

      const qr = await QRCodeModel.findOne({ fileId: fileDoc._id });

      res.status(200).json({
        ...fileDoc.toObject(),
        qrCodeUrl: qr?.qrImageUrl || '',
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Update file settings (e.g. Lead Gate toggle)
   */
  public async updateFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { requireLeadGate } = req.body;

      const fileDoc = await File.findOne({ _id: id, userId });
      if (!fileDoc) {
        res.status(404).json({ message: 'File not found.' });
        return;
      }

      if (requireLeadGate !== undefined) {
        fileDoc.requireLeadGate = requireLeadGate === true || requireLeadGate === 'true';
      }

      await fileDoc.save();
      res.status(200).json(fileDoc);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Delete file from DB and disk storage
   */
  public async deleteFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const fileDoc = await File.findOne({ _id: id, userId });
      if (!fileDoc) {
        res.status(404).json({ message: 'File not found.' });
        return;
      }

      const user = await User.findById(userId);
      const userConfig = user?.storageConfig;

      // Delete from physical storage
      await StorageService.deleteFile(fileDoc.s3Key, userConfig);

      // Delete database entries
      await File.deleteOne({ _id: id });
      await QRCodeModel.deleteMany({ fileId: id });

      res.status(200).json({ message: 'File deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}

export default new FileController();
