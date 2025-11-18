import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    pipelineId: { type: Number, required: true },
    pipelineUrl: { type: String, required: true },
    jobId: { type: Number },
    jobName: { type: String },

    status: {
      type: String,
      enum: ["open", "resolved", "ignored"],
      default: "open"
    },
    category: {
      type: String,
      enum: ["config", "dependency", "test", "infra", "timeout", "other", null],
      default: null
    },

    gitRef: { type: String },
    commitSha: { type: String },

    errorSnippet: { type: String },
    logsStored: { type: Boolean, default: false },
    fullLogs: { type: String },

    gitlabCiConfig: { type: String },

    aiAnalysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIAnalysis"
    },
    aiPatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIPatch"
    },
    mergeRequest: {
      id: { type: Number },
      url: { type: String },
      branch: { type: String },
      status: { type: String }
    }
  },
  { timestamps: true }
);

export const Incident = mongoose.model("Incident", incidentSchema);
