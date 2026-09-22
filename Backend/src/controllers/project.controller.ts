import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  connectRepository,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "../services/project.service.js";

import {
  connectRepositorySchema,
  createProjectSchema,
  updateProjectSchema,
} from "../utils/project.validation.js";

type ProjectParams = {
  id: string;
};

function getAuthenticatedUserId(
  req: Request,
): string | null {
  return req.userId ?? null;
}

export async function getProjects(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const projects = await listProjects(userId);

    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectById(
  req: Request<ProjectParams>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const project = await getProject(
      req.params.id,
      userId,
    );

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const result = createProjectSchema.safeParse(
      req.body,
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message:
          result.error.issues[0]?.message ??
          "Invalid project data",
      });

      return;
    }

    const project = await createProject(
      userId,
      result.data,
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProjectController(
  req: Request<ProjectParams>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const result = updateProjectSchema.safeParse(
      req.body,
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message:
          result.error.issues[0]?.message ??
          "Invalid project data",
      });

      return;
    }

    const project = await updateProject(
      req.params.id,
      userId,
      result.data,
    );

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProjectController(
  req: Request<ProjectParams>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const deleted = await deleteProject(
      req.params.id,
      userId,
    );

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function connectRepositoryController(
  req: Request<ProjectParams>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const result =
      connectRepositorySchema.safeParse(
        req.body,
      );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message:
          result.error.issues[0]?.message ??
          "Invalid repository data",
      });

      return;
    }

    const repository =
      await connectRepository(
        req.params.id,
        userId,
        result.data,
      );

    if (!repository) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });

      return;
    }

    res.status(201).json({
      success: true,
      message: "Repository connected successfully",
      repository,
    });
  } catch (error) {
    next(error);
  }
}