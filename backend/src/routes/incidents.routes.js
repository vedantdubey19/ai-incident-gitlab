import { Router } from "express";
import {
  listIncidents,
  getIncident,
  updateIncident,
  triggerAnalysis,
  triggerPatch,
  createMR,
  rerunPipeline
} from "../controllers/incidents.controller.js";

const router = Router();

router.get("/", listIncidents);
router.get("/:id", getIncident);
router.patch("/:id", updateIncident);

router.post("/:id/analysis", triggerAnalysis);
router.post("/:id/patch", triggerPatch);
router.post("/:id/create-mr", createMR);
router.post("/:id/rerun", rerunPipeline);

export default router;
