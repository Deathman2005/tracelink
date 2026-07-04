import mongoose, { Schema, Document } from 'mongoose';

export interface ILink extends Document {
  userId: mongoose.Types.ObjectId;
  originalUrl: string;
  shortCode: string;
  title?: string;
  description?: string;
  isActive: boolean;
  clicksCount: number;
  requireLeadGate: boolean;
  qrCodeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true, index: true },
    title: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    clicksCount: { type: Number, default: 0 },
    requireLeadGate: { type: Boolean, default: false },
    qrCodeUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ILink>('Link', LinkSchema);
