import { Response } from 'express';
import Link from '../models/link.model';
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
    const exists = await Link.findOne({ shortCode: code });
    if (!exists) return code;
    attempts++;
  }
  throw new Error('Could not generate a unique link code.');
};

class LinkController {
  /**
   * Create a new tracked link
   */
  public async createLink(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { originalUrl, title, description, requireLeadGate } = req.body;
      const userId = req.user?.userId;

      if (!originalUrl) {
        res.status(400).json({ message: 'Original URL is required.' });
        return;
      }

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const shortCode = await generateUniqueCode();
      const redirectUrl = `${BASE_URL}/l/${shortCode}`;

      // Generate QR Code data URL
      const qrCodeUrl = await QRService.generateQRCode(redirectUrl);

      // Create primary link document
      const link = await Link.create({
        userId,
        originalUrl,
        shortCode,
        title: title || 'Untitled Link',
        description,
        requireLeadGate: requireLeadGate === true,
        qrCodeUrl,
      });

      // Create corresponding QRCode document in the database
      await QRCodeModel.create({
        userId,
        linkId: link._id,
        code: shortCode,
        qrImageUrl: qrCodeUrl,
      });

      res.status(201).json(link);
    } catch (error: any) {
      if (error.code === 11000 || error.message?.includes('E11000')) {
        res.status(400).json({
          message: 'A duplicate tracking link or shortcode already exists. Please try again.',
        });
        return;
      }
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * List links created by the user
   */
  public async getLinks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const links = await Link.find({ userId }).sort({ createdAt: -1 });
      res.status(200).json(links);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Get single link details
   */
  public async getLinkById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const link = await Link.findOne({ _id: id, userId });
      if (!link) {
        res.status(404).json({ message: 'Link not found.' });
        return;
      }

      res.status(200).json(link);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Update Link settings
   */
  public async updateLink(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { originalUrl, title, description, isActive, requireLeadGate } = req.body;

      const link = await Link.findOne({ _id: id, userId });
      if (!link) {
        res.status(404).json({ message: 'Link not found.' });
        return;
      }

      if (originalUrl !== undefined) link.originalUrl = originalUrl;
      if (title !== undefined) link.title = title;
      if (description !== undefined) link.description = description;
      if (isActive !== undefined) link.isActive = isActive;
      if (requireLeadGate !== undefined) link.requireLeadGate = requireLeadGate;

      await link.save();
      res.status(200).json(link);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Delete Link and corresponding QR codes
   */
  public async deleteLink(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const link = await Link.findOneAndDelete({ _id: id, userId });
      if (!link) {
        res.status(404).json({ message: 'Link not found.' });
        return;
      }

      // Delete connected QR codes from DB
      await QRCodeModel.deleteMany({ linkId: id });

      res.status(200).json({ message: 'Link deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}

export default new LinkController();
