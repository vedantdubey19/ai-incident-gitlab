import mongoose from "mongoose";

const aiAnalysisSchema = new mongoose.Schema(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true
    },
    summary: { type: String, required: true },
    rootCause: { type: String, required: true },
    category: {
      type: String,
      enum: ["config", "dependency", "test", "infra", "timeout", "other"],
      required: true
    },
    confidence: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const AIAnalysis = mongoose.model("AIAnalysis", aiAnalysisSchema);
