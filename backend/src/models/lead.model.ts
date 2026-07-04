import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  userId: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;
  assetType: 'link' | 'file';
  email: string;
  name?: string;
  company?: string;
  visitorId: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assetId: { type: Schema.Types.ObjectId, required: true, index: true },
    assetType: { type: String, enum: ['link', 'file'], required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String },
    company: { type: String },
    visitorId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILead>('Lead', LeadSchema);
