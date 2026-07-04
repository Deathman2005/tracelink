import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  refreshToken?: string;
  storageConfig?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    bucketName?: string;
    endpoint?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    refreshToken: { type: String },
    storageConfig: {
      accessKeyId: { type: String },
      secretAccessKey: { type: String },
      bucketName: { type: String },
      endpoint: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
