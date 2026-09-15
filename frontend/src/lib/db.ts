import mongoose from 'mongoose';

const DEFAULT_MONGO_URI =
  'mongodb+srv://aryar0779:1%40Nitinarya@dean-rgia-webgite.vepjrc8.mongodb.net/binaryvidya?retryWrites=true&w=majority&appName=dean-rgia-webgite';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_MONGO_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error('[MongoDB Connection Error]:', err);
    throw err;
  }

  return cached.conn;
}
