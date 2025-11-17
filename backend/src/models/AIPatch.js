import mongoose from "mongoose";

const aiPatchSchema = new mongoose.Schema(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true
    },
    diff: { type: String, required: true },
    description: { type: String },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    }
  },
  { timestamps: true }
);

export const AIPatch = mongoose.model("AIPatch", aiPatchSchema);
