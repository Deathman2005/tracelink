import mongoose from 'mongoose';
import { MONGO_URI } from './constants';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop legacy unique index on 'slug' field from the 'files' collection if it exists
    try {
      await conn.connection.collection('files').dropIndex('slug_1');
      console.log('Successfully dropped legacy unique index "slug_1" from files collection.');
    } catch (indexError: any) {
      // indexError.code === 27 means IndexNotFound, which is expected if it has been dropped already
      if (indexError.code !== 27) {
        console.warn(`Note: Could not drop legacy index "slug_1": ${indexError.message}`);
      }
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${(error as Error).message}`);
    process.exit(1);
  }
};
