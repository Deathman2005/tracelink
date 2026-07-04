import { Request, Response } from 'express';
import Link from '../models/link.model';
import File from '../models/file.model';
import Event from '../models/event.model';
import Lead from '../models/lead.model';
import QRCodeModel from '../models/qr.model';
import ScoringService from '../services/scoring.service';
import { parseRequestDetails } from '../utils/tracker-parser';
import { CORS_ORIGIN } from '../config/constants';
import crypto from 'crypto';

/**
 * Helper to ensure visitorId exists in cookie or returns a new one
 */
const getOrCreateVisitorId = (req: Request, res: Response): string => {
  let visitorId = req.cookies?.visitorId;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    res.cookie('visitorId', visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });
  }
  return visitorId;
};

class EventController {
  /**
   * Handle short link redirection tracking.
   * Route: GET /l/:code
   */
  public async handleLinkRedirect(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const { email, qr } = req.query; // 'qr' flag indicates if accessed via QR scan

      const link = await Link.findOne({ shortCode: code });
      if (!link) {
        res.status(404).send('<h1>Link Not Found</h1>');
        return;
      }

      if (!link.isActive) {
        res.status(403).send('<h1>This link has been deactivated</h1>');
        return;
      }

      const visitorId = getOrCreateVisitorId(req, res);
      const parsedDetails = parseRequestDetails(req);

      // Check if Lead Gate is required and email is not provided yet
      if (link.requireLeadGate && !email) {
        // Check if visitor has already submitted their email in the past
        const existingLead = await Lead.findOne({ assetId: link._id, visitorId });
        if (!existingLead) {
          // Redirect to frontend lead capture page
          res.redirect(`${CORS_ORIGIN}/l/${code}?gate=true`);
          return;
        }
      }

      // If email is provided, save as lead
      if (email && typeof email === 'string') {
        const leadExists = await Lead.findOne({ assetId: link._id, email: email.toLowerCase() });
        if (!leadExists) {
          await Lead.create({
            userId: link.userId,
            assetId: link._id,
            assetType: 'link',
            email: email.toLowerCase(),
            visitorId,
          });

          // Log lead submission event
          await Event.create({
            userId: link.userId,
            assetId: link._id,
            assetType: 'link',
            eventType: 'lead_submit',
            visitorId,
            metadata: {
              ...parsedDetails,
              leadEmail: email.toLowerCase(),
            },
          });
        }
      }

      // Increment click count on Link
      link.clicksCount += 1;
      await link.save();

      // Log link open event
      const eventType = qr === 'true' ? 'qr_scan' : 'link_open';
      await Event.create({
        userId: link.userId,
        assetId: link._id,
        assetType: 'link',
        eventType,
        visitorId,
        metadata: {
          ...parsedDetails,
          leadEmail: email ? (email as string).toLowerCase() : undefined,
        },
      });

      // Increment scan count on QRCode if qr=true
      if (qr === 'true') {
        await QRCodeModel.updateOne({ code }, { $inc: { scanCount: 1 } });
      }

      // Trigger Engagement Score update in background
      ScoringService.calculateAndSaveScore(link._id, 'link', visitorId).catch(console.error);

      // Redirect visitor to final URL
      res.redirect(link.originalUrl);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Get File metadata for frontend document viewer
   * Route: GET /api/events/file-meta/:code
   */
  public async getFileMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const visitorId = getOrCreateVisitorId(req, res);

      const fileDoc = await File.findOne({ shortCode: code }).select('-s3Key');
      if (!fileDoc) {
        res.status(404).json({ message: 'Document not found.' });
        return;
      }

      const parsedDetails = parseRequestDetails(req);

      // Log file open event
      await Event.create({
        userId: fileDoc.userId,
        assetId: fileDoc._id,
        assetType: 'file',
        eventType: 'file_open',
        visitorId,
        metadata: parsedDetails,
      });

      // Check if lead gate is already unlocked
      let isUnlocked = !fileDoc.requireLeadGate;
      if (fileDoc.requireLeadGate) {
        const lead = await Lead.findOne({ assetId: fileDoc._id, visitorId });
        if (lead) {
          isUnlocked = true;
        }
      }

      // Increment view count on File
      fileDoc.viewCount += 1;
      await fileDoc.save();

      // Trigger Score update
      ScoringService.calculateAndSaveScore(fileDoc._id, 'file', visitorId).catch(console.error);

      res.status(200).json({
        file: fileDoc,
        isUnlocked,
        visitorId,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Submit lead details to unlock asset
   * Route: POST /api/events/lead
   */
  public async submitLead(req: Request, res: Response): Promise<void> {
    try {
      const { assetId, assetType, email, name, company } = req.body;
      const visitorId = getOrCreateVisitorId(req, res);

      if (!assetId || !assetType || !email) {
        res.status(400).json({ message: 'Missing required parameters.' });
        return;
      }

      // Find owner of the asset
      let ownerId;
      if (assetType === 'link') {
        const link = await Link.findById(assetId);
        ownerId = link?.userId;
      } else {
        const fileDoc = await File.findById(assetId);
        ownerId = fileDoc?.userId;
      }

      if (!ownerId) {
        res.status(404).json({ message: 'Asset owner not found.' });
        return;
      }

      const parsedDetails = parseRequestDetails(req);

      // Save lead
      await Lead.create({
        userId: ownerId,
        assetId,
        assetType,
        email: email.toLowerCase(),
        name,
        company,
        visitorId,
      });

      // Log lead submit event
      await Event.create({
        userId: ownerId,
        assetId,
        assetType,
        eventType: 'lead_submit',
        visitorId,
        metadata: {
          ...parsedDetails,
          leadEmail: email.toLowerCase(),
        },
      });

      // Trigger Score update
      ScoringService.calculateAndSaveScore(assetId, assetType, visitorId).catch(console.error);

      res.status(200).json({ message: 'Lead submitted, access granted.', visitorId });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Record periodic duration and scroll depth heartbeats.
   * Route: POST /api/events/ping
   */
  public async recordPing(req: Request, res: Response): Promise<void> {
    try {
      const { assetId, assetType, duration, scrollDepth } = req.body;
      const visitorId = getOrCreateVisitorId(req, res);

      if (!assetId || !assetType) {
        res.status(400).json({ message: 'Missing asset identifiers.' });
        return;
      }

      // Find owner
      let ownerId;
      if (assetType === 'link') {
        const link = await Link.findById(assetId);
        ownerId = link?.userId;
      } else {
        const fileDoc = await File.findById(assetId);
        ownerId = fileDoc?.userId;
      }

      const parsedDetails = parseRequestDetails(req);

      // Record a background ping event containing engagement parameters
      await Event.create({
        userId: ownerId,
        assetId,
        assetType,
        eventType: 'page_ping',
        visitorId,
        metadata: {
          ...parsedDetails,
          duration: Number(duration),
          scrollDepth: Number(scrollDepth || 0),
        },
      });

      // Update Engagement Score
      const newScore = await ScoringService.calculateAndSaveScore(assetId, assetType, visitorId);

      res.status(200).json({ score: newScore });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Direct download tracking logic.
   * Route: GET /api/events/download/:code
   */
  public async handleFileDownload(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const visitorId = getOrCreateVisitorId(req, res);

      const fileDoc = await File.findOne({ shortCode: code });
      if (!fileDoc) {
        res.status(404).send('<h1>File Not Found</h1>');
        return;
      }

      const parsedDetails = parseRequestDetails(req);

      // Log download event
      await Event.create({
        userId: fileDoc.userId,
        assetId: fileDoc._id,
        assetType: 'file',
        eventType: 'file_download',
        visitorId,
        metadata: parsedDetails,
      });

      // Increment file download counter
      fileDoc.downloadCount += 1;
      await fileDoc.save();

      // Trigger Score update
      ScoringService.calculateAndSaveScore(fileDoc._id, 'file', visitorId).catch(console.error);

      // Redirect to the direct file serving path
      res.redirect(fileDoc.fileUrl);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}

export default new EventController();
