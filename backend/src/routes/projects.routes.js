import { Router } from "express";
import {
  connectProject,
  listProjects,
  getProject,
  updateProject
} from "../controllers/projects.controller.js";

const router = Router();

router.post("/connect", connectProject);
router.get("/", listProjects);
router.get("/:id", getProject);
router.patch("/:id", updateProject);

export default router;
