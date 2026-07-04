import mongoose, { Schema, Document } from 'mongoose';

export interface IQRCode extends Document {
  userId: mongoose.Types.ObjectId;
  linkId?: mongoose.Types.ObjectId;
  fileId?: mongoose.Types.ObjectId;
  code: string;
  qrImageUrl: string;
  scanCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const QRCodeSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    linkId: { type: Schema.Types.ObjectId, ref: 'Link', index: true },
    fileId: { type: Schema.Types.ObjectId, ref: 'File', index: true },
    code: { type: String, required: true, unique: true, index: true },
    qrImageUrl: { type: String, required: true },
    scanCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IQRCode>('QRCode', QRCodeSchema);
