import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach } from 'vitest';

let mongod: MongoMemoryServer | null = null;

beforeAll(async () => {
  const localUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/plateful_test';
  try {
    // Attempt fast connection to local MongoDB instance
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
  } catch {
    // Fall back to memory server if local MongoDB is not running
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  // Clean all collections before each test for isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
