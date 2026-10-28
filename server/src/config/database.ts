import mongoose from 'mongoose';
import { config } from './env';

export async function connectDB(uri?: string): Promise<void> {
  const mongoUri = uri || config.MONGODB_URI;
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
