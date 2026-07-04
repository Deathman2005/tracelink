import mongoose, { Schema, Document } from 'mongoose';

export interface IEngagementScore extends Document {
  assetId: mongoose.Types.ObjectId;
  assetType: 'link' | 'file';
  visitorId: string;
  score: number;
  interestLevel: 'Low' | 'Medium' | 'High';
  factors: {
    durationSeconds: number;
    downloadsCount: number;
    sessionCount: number;
    interactCount: number;
  };
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EngagementScoreSchema: Schema = new Schema(
  {
    assetId: { type: Schema.Types.ObjectId, required: true, index: true },
    assetType: { type: String, enum: ['link', 'file'], required: true },
    visitorId: { type: String, required: true, index: true },
    score: { type: Number, default: 0, min: 0, max: 100, index: true },
    interestLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
      index: true,
    },
    factors: {
      durationSeconds: { type: Number, default: 0 },
      downloadsCount: { type: Number, default: 0 },
      sessionCount: { type: Number, default: 0 },
      interactCount: { type: Number, default: 0 },
    },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IEngagementScore>('EngagementScore', EngagementScoreSchema);
