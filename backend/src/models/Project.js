import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    gitlabProjectId: { type: Number }, // to be filled using GitLab API later
    gitlabUrl: { type: String, required: true },
    gitlabNamespace: { type: String, default: "" },
    isActive: { type: Boolean, default: true },

    // For hackathon simplicity; in real life, encrypt or use per-user tokens
    gitlabAccessToken: { type: String, required: true }
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
