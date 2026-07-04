import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  userId: mongoose.Types.ObjectId;
  originalName: string;
  s3Key: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx' | 'ppt' | 'pptx' | 'image' | 'other';
  shortCode: string;
  size: number;
  downloadCount: number;
  viewCount: number;
  requireLeadGate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true },
    s3Key: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'ppt', 'pptx', 'image', 'other'],
      default: 'other',
    },
    shortCode: { type: String, required: true, unique: true, index: true },
    size: { type: Number, required: true },
    downloadCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    requireLeadGate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IFile>('File', FileSchema);
