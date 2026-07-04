import { Response } from 'express';
import mongoose from 'mongoose';
import Link from '../models/link.model';
import File from '../models/file.model';
import Event from '../models/event.model';
import Lead from '../models/lead.model';
import Notification from '../models/notification.model';
import EngagementScore from '../models/score.model';
import { AuthRequest } from '../middlewares/auth.middleware';

class AnalyticsController {
  /**
   * Retrieve KPI dashboard summary cards data
   */
  public async getDashboardKPIs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Count user links & files
      const totalLinks = await Link.countDocuments({ userId });
      const totalFiles = await File.countDocuments({ userId });

      // Aggregate Total Clicks
      const linksAgg = await Link.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) as any } },
        { $group: { _id: null, totalClicks: { $sum: '$clicksCount' } } },
      ]);
      const totalClicks = linksAgg[0]?.totalClicks || 0;

      // Aggregate Total Downloads & Views
      const filesAgg = await File.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) as any } },
        {
          $group: {
            _id: null,
            totalDownloads: { $sum: '$downloadCount' },
            totalViews: { $sum: '$viewCount' },
          },
        },
      ]);
      const totalDownloads = filesAgg[0]?.totalDownloads || 0;
      const totalViews = filesAgg[0]?.totalViews || 0;

      // Distinct Visitors count from Events
      const uniqueVisitorsAgg = await Event.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) as any } },
        { $group: { _id: '$visitorId' } },
        { $count: 'count' },
      ]);
      const uniqueVisitors = uniqueVisitorsAgg[0]?.count || 0;

      // Unique Returning Visitors count
      const returningVisitorsAgg = await Event.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) as any } },
        {
          $group: {
            _id: { visitorId: '$visitorId', date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } } },
          },
        },
        { $group: { _id: '$_id.visitorId', visitDays: { $sum: 1 } } },
        { $match: { visitDays: { $gt: 1 } } },
        { $count: 'count' },
      ]);
      const returningVisitors = returningVisitorsAgg[0]?.count || 0;

      // Avg Engagement Score
      // 1. Get user assets IDs
      const userLinks = await Link.find({ userId }).select('_id');
      const userFiles = await File.find({ userId }).select('_id');
      const assetIds = [...userLinks.map((l) => l._id), ...userFiles.map((f) => f._id)];

      const scoreAgg = await EngagementScore.aggregate([
        { $match: { assetId: { $in: assetIds } } },
        { $group: { _id: null, avgScore: { $avg: '$score' } } },
      ]);
      const avgEngagementScore = Math.round(scoreAgg[0]?.avgScore || 0);

      res.status(200).json({
        totalLinks,
        totalFiles,
        totalClicks,
        totalDownloads,
        totalViews,
        uniqueVisitors,
        returningVisitors,
        avgEngagementScore,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Time series chart data (clicks, views, downloads) over 30 days
   */
  public async getTrafficCharts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Date window: past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const chartData = await Event.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId) as any,
            timestamp: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              type: '$eventType',
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.date',
            events: {
              $push: {
                type: '$_id.type',
                count: '$count',
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Map back to a clean key-value timeline format for Recharts
      const timeline = chartData.map((day) => {
        const clicks = day.events.find((e: any) => e.type === 'link_open' || e.type === 'qr_scan')?.count || 0;
        const opens = day.events.find((e: any) => e.type === 'file_open')?.count || 0;
        const downloads = day.events.find((e: any) => e.type === 'file_download')?.count || 0;

        return {
          date: day._id,
          clicks,
          opens,
          downloads,
          total: clicks + opens + downloads,
        };
      });

      res.status(200).json(timeline);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Browser, Device and OS visitor breakdown distribution counts
   */
  public async getVisitorDistribution(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Aggregate Device distribution
      const devices = await Event.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) as any, eventType: { $ne: 'page_ping' } } },
        { $group: { _id: '$metadata.device', value: { $sum: 1 } } },
        { $project: { name: { $ifNull: ['$_id', 'Desktop'] }, value: 1, _id: 0 } },
        { $sort: { value: -1 } },
      ]);

      // Aggregate Browser distribution
      const browsers = await Event.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) as any, eventType: { $ne: 'page_ping' } } },
        { $group: { _id: '$metadata.browser', value: { $sum: 1 } } },
        { $project: { name: { $ifNull: ['$_id', 'Unknown'] }, value: 1, _id: 0 } },
        { $sort: { value: -1 } },
      ]);

      // Aggregate Referer sources distribution
      const referers = await Event.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) as any, eventType: { $ne: 'page_ping' } } },
        { $group: { _id: '$metadata.referer', value: { $sum: 1 } } },
        { $project: { name: { $ifNull: ['$_id', 'Direct'] }, value: 1, _id: 0 } },
        { $sort: { value: -1 } },
      ]);

      // Aggregate Country distribution
      const countries = await Event.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) as any, eventType: { $ne: 'page_ping' } } },
        { $group: { _id: '$metadata.country', value: { $sum: 1 } } },
        { $project: { name: { $ifNull: ['$_id', 'Unknown'] }, value: 1, _id: 0 } },
        { $sort: { value: -1 } },
      ]);

      res.status(200).json({ devices, browsers, referers, countries });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Retrieve list of leads submitted
   */
  public async getLeads(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const leads = await Lead.find({ userId })
        .populate('assetId', 'title originalName originalUrl shortCode')
        .sort({ createdAt: -1 });

      res.status(200).json(leads);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Retrieve Engagement Scores list
   */
  public async getScores(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Fetch user link and file IDs
      const links = await Link.find({ userId }).select('_id');
      const files = await File.find({ userId }).select('_id');
      const assetIds = [...links.map((l) => l._id), ...files.map((f) => f._id)];

      // Retrieve engagement scores
      const scores = await EngagementScore.find({ assetId: { $in: assetIds } })
        .sort({ score: -1 })
        .limit(100);

      // Populate manually to handle union ref type (Link or File)
      const populatedScores = [];
      for (const s of scores) {
        let assetName = 'Unknown Asset';
        let assetType = s.assetType;
        let shortCode = '';

        if (assetType === 'link') {
          const l = await Link.findById(s.assetId);
          assetName = l?.title || l?.originalUrl || 'Link';
          shortCode = l?.shortCode || '';
        } else {
          const f = await File.findById(s.assetId);
          assetName = f?.originalName || 'File';
          shortCode = f?.shortCode || '';
        }

        // Get associated lead if email was captured
        const lead = await Lead.findOne({ assetId: s.assetId, visitorId: s.visitorId });

        populatedScores.push({
          _id: s._id,
          visitorId: s.visitorId,
          score: s.score,
          interestLevel: s.interestLevel,
          factors: s.factors,
          lastActive: s.lastActive,
          assetName,
          assetType,
          shortCode,
          leadEmail: lead?.email || 'Anonymous Visitor',
          leadName: lead?.name,
          leadCompany: lead?.company,
        });
      }

      res.status(200).json(populatedScores);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Retrieve recent tracking logs for activity feed
   */
  public async getRecentEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const events = await Event.find({ userId, eventType: { $ne: 'page_ping' } })
        .sort({ timestamp: -1 })
        .limit(20);

      const timeline = [];
      for (const e of events) {
        let assetName = 'Asset';
        let shortCode = '';

        if (e.assetType === 'link') {
          const l = await Link.findById(e.assetId);
          assetName = l?.title || 'Link';
          shortCode = l?.shortCode || '';
        } else {
          const f = await File.findById(e.assetId);
          assetName = f?.originalName || 'File';
          shortCode = f?.shortCode || '';
        }

        timeline.push({
          _id: e._id,
          assetId: e.assetId,
          assetType: e.assetType,
          assetName,
          shortCode,
          eventType: e.eventType,
          visitorId: e.visitorId,
          timestamp: e.timestamp,
          metadata: e.metadata,
        });
      }

      res.status(200).json(timeline);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Fetch user notifications
   */
  public async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Mark user notifications as read
   */
  public async markNotificationsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
      res.status(200).json({ message: 'Notifications marked as read.' });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}

export default new AnalyticsController();
