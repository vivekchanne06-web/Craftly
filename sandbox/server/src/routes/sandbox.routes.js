import { Router } from "express";
import { createPod, getActivePod, findActivePodByProjectId } from '../kubernetes/pod.js';
import { createService } from '../kubernetes/service.js';
import { createSandboxKey } from '../config/redis.js';
import { v7 as uuid } from "uuid";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import Project from "../models/project.model.js";

const router = Router();

router.post('/project', authMiddleware, async (req, res) => {
    const { title } = req.body;

    const newProject = new Project({
        user: req.user.id,
        title
    });

    await newProject.save();

    return res.status(201).json({
        message: 'Project created successfully',
        project: newProject
    });
});

router.post("/start", authMiddleware, async (req, res) => {
    const projectId = req.body.projectId;

    const project = await Project.findOne({ _id: projectId, user: req.user.id });

    if (!project) {
        return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // 1. Check if an existing sandbox pod is already active for this project
    let activeSandboxId = null;

    if (project.sandboxId) {
        const pod = await getActivePod(project.sandboxId);
        if (pod) {
            activeSandboxId = project.sandboxId;
        }
    }

    if (!activeSandboxId) {
        const activePod = await findActivePodByProjectId(projectId);
        if (activePod) {
            activeSandboxId = activePod.metadata?.labels?.sandboxId;
            if (activeSandboxId) {
                project.sandboxId = activeSandboxId;
                await project.save();
            }
        }
    }

    if (activeSandboxId) {
        // Refresh TTL in Redis so the active sandbox does not expire while in use
        await createSandboxKey(activeSandboxId);

        return res.status(200).json({
            message: 'Connected to existing sandbox environment',
            sandboxId: activeSandboxId,
            previewUrl: `http://${activeSandboxId}.preview.localhost`
        });
    }

    // 2. No active pod exists — create a new sandbox specifically to restore/mount the project
    const sandboxId = uuid();

    project.sandboxId = sandboxId;
    await project.save();

    await Promise.all([
        createPod(sandboxId, projectId),
        createService(sandboxId, projectId),
        createSandboxKey(sandboxId)
    ]);

    return res.status(201).json({
        message: 'Sandbox environment created successfully',
        sandboxId,
        previewUrl: `http://${sandboxId}.preview.localhost`
    });
});

router.get("/project", authMiddleware, async (req, res) => {
    const projects = await Project.find({ user: req.user.id }).sort({ updatedAt: -1 });

    return res.status(200).json({
        message: 'Projects retrieved successfully',
        projects
    });
});

export default router;