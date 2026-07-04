import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  userId?: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;
  assetType: 'link' | 'file';
  eventType: 'link_open' | 'file_open' | 'file_download' | 'qr_scan' | 'resume_view' | 'portfolio_view' | 'lead_submit' | 'page_ping';
  visitorId: string;
  timestamp: Date;
  metadata: {
    browser?: string;
    device?: string;
    os?: string;
    ip?: string;
    country?: string;
    duration?: number; // duration in seconds
    scrollDepth?: number; // max scroll percentage
    leadEmail?: string;
    referer?: string;
  };
}

const EventSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assetId: { type: Schema.Types.ObjectId, required: true, index: true },
    assetType: { type: String, enum: ['link', 'file'], required: true },
    eventType: {
      type: String,
      enum: [
        'link_open',
        'file_open',
        'file_download',
        'qr_scan',
        'resume_view',
        'portfolio_view',
        'lead_submit',
        'page_ping',
      ],
      required: true,
      index: true,
    },
    visitorId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: {
      browser: { type: String },
      device: { type: String },
      os: { type: String },
      ip: { type: String },
      country: { type: String },
      duration: { type: Number },
      scrollDepth: { type: Number },
      leadEmail: { type: String },
      referer: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>('Event', EventSchema);
