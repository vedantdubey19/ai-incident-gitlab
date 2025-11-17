import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || "incident_copilot";

  if (!uri) {
    throw new Error("MONGO_URI not set in environment");
  }

  try {
    await mongoose.connect(uri, { dbName });
    console.log(`✅ MongoDB connected to ${dbName}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}
