import { Router } from "express";
import { handleGitlabWebhook } from "../controllers/webhooks.controller.js";

const router = Router();

// GitLab webhook target: POST /api/webhooks/gitlab
router.post("/gitlab", handleGitlabWebhook);

export default router;
