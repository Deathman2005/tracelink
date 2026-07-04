import mongoose from 'mongoose';
import Event from '../models/event.model';
import EngagementScore from '../models/score.model';
import Notification from '../models/notification.model';
import Link from '../models/link.model';
import File from '../models/file.model';

class ScoringService {
  /**
   * Recalculates and saves the engagement score for a specific visitor on an asset.
   * @param assetId The ID of the Link or File asset
   * @param assetType 'link' | 'file'
   * @param visitorId The unique visitor ID
   */
  public async calculateAndSaveScore(
    assetId: mongoose.Types.ObjectId,
    assetType: 'link' | 'file',
    visitorId: string
  ): Promise<number> {
    try {
      // 1. Fetch all events for this visitor and asset
      const events = await Event.find({ assetId, visitorId }).sort({ timestamp: 1 });
      if (events.length === 0) return 0;

      // 2. Compute factors
      let sessionCount = 0;
      let maxDuration = 0;
      let maxScrollDepth = 0;
      let downloadsCount = 0;

      let lastEventTime = 0;
      for (const ev of events) {
        // Group sessions: If events are separated by more than 30 minutes, it's a new session
        const evTime = ev.timestamp.getTime();
        if (evTime - lastEventTime > 30 * 60 * 1000) {
          sessionCount++;
        }
        lastEventTime = evTime;

        // Cumulative or max duration
        if (ev.metadata?.duration && ev.metadata.duration > maxDuration) {
          maxDuration = ev.metadata.duration;
        }

        // Scroll depth tracking
        if (ev.metadata?.scrollDepth && ev.metadata.scrollDepth > maxScrollDepth) {
          maxScrollDepth = ev.metadata.scrollDepth;
        }

        // Downloads count
        if (ev.eventType === 'file_download') {
          downloadsCount++;
        }
      }

      // 3. Compute score points (Max: 100)

      // A. Session Count (Max: 30 pts)
      let sessionPoints = 0;
      if (sessionCount === 1) sessionPoints = 10;
      else if (sessionCount === 2) sessionPoints = 20;
      else if (sessionCount >= 3) sessionPoints = 30;

      // B. Time Spent (Max: 30 pts)
      let timePoints = 0;
      if (maxDuration >= 60) timePoints = 30;
      else if (maxDuration >= 10) timePoints = 15;
      else if (maxDuration > 0) timePoints = 5;

      // C. Interactions / Scroll (Max: 20 pts)
      let interactionPoints = 0;
      if (assetType === 'file') {
        if (maxScrollDepth >= 90) interactionPoints = 20;
        else if (maxScrollDepth >= 50) interactionPoints = 10;
      } else {
        // For link tracking, give engagement points for longer reads or lead submit
        const hasLeadSubmit = events.some((ev) => ev.eventType === 'lead_submit');
        if (hasLeadSubmit) interactionPoints = 20;
        else if (maxDuration >= 20) interactionPoints = 10;
      }

      // D. Downloads (Max: 20 pts)
      const downloadPoints = downloadsCount > 0 ? 20 : 0;

      const finalScore = sessionPoints + timePoints + interactionPoints + downloadPoints;

      // 4. Determine interest level
      let interestLevel: 'Low' | 'Medium' | 'High' = 'Low';
      if (finalScore >= 70) interestLevel = 'High';
      else if (finalScore >= 30) interestLevel = 'Medium';

      // 5. Check if score already exists
      const oldScore = await EngagementScore.findOne({ assetId, visitorId });
      const oldLevel = oldScore?.interestLevel || 'Low';

      // 6. Save or update score
      await EngagementScore.findOneAndUpdate(
        { assetId, visitorId },
        {
          assetType,
          score: finalScore,
          interestLevel,
          factors: {
            durationSeconds: maxDuration,
            downloadsCount,
            sessionCount,
            interactCount: events.filter(
              (e) => e.eventType === 'page_ping' || e.eventType === 'lead_submit'
            ).length,
          },
          lastActive: new Date(),
        },
        { upsert: true, new: true }
      );

      // 7. Trigger notification if interest level upgraded to High
      if (interestLevel === 'High' && oldLevel !== 'High') {
        // Fetch asset owner
        let creatorId: mongoose.Types.ObjectId | undefined;
        let assetName = 'Your asset';

        if (assetType === 'link') {
          const l = await Link.findById(assetId);
          creatorId = l?.userId;
          assetName = l?.title || 'your link';
        } else {
          const f = await File.findById(assetId);
          creatorId = f?.userId;
          assetName = f?.originalName || 'your file';
        }

        if (creatorId) {
          await Notification.create({
            userId: creatorId,
            title: '🔥 High Engagement Detected',
            message: `A visitor showed High Interest (Score: ${finalScore}) in "${assetName}".`,
            isRead: false,
          });
        }
      }

      return finalScore;
    } catch (err) {
      console.error('Error computing engagement score:', err);
      return 0;
    }
  }
}

export default new ScoringService();
