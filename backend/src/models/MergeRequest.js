import mongoose from "mongoose";

const mergeRequestSchema = new mongoose.Schema(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true
    },
    mrId: { type: Number, required: true },
    mrIid: { type: Number, required: true },
    url: { type: String, required: true },
    branchName: { type: String, required: true },
    status: {
      type: String,
      enum: ["opened", "merged", "closed"],
      default: "opened"
    },
    lastCheckedAt: { type: Date }
  },
  { timestamps: true }
);

export const MergeRequest = mongoose.model("MergeRequest", mergeRequestSchema);
