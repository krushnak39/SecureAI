import { prisma } from "../lib/prisma.js";

export async function listProjectDependencies(
  projectId: string,
  userId: string,
) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    include: {
      repositories: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const repository = project.repositories[0];

  if (!repository) {
    return {
      projectId,
      repository: null,
      dependencies: [],
      summary: {
        total: 0,
        direct: 0,
        transitive: 0,
        vulnerable: 0,
        outdated: 0,
        healthy: 0,
      },
    };
  }

  const dependencies = await prisma.dependency.findMany({
    where: {
      repositoryId: repository.id,
    },
    orderBy: [
      {
        ecosystem: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  return {
    projectId,

    repository: {
      id: repository.id,
      name: repository.name,
      fullName: repository.fullName,
      branch: repository.branch,
      defaultBranch: repository.defaultBranch,
      lastAnalyzed: repository.lastAnalyzed,
    },

    dependencies,

    summary: {
      total: dependencies.length,

      direct: dependencies.filter(
        (dependency) =>
          dependency.type === "DIRECT",
      ).length,

      transitive: dependencies.filter(
        (dependency) =>
          dependency.type === "TRANSITIVE",
      ).length,

      vulnerable: dependencies.filter(
        (dependency) =>
          dependency.status === "VULNERABLE",
      ).length,

      outdated: dependencies.filter(
        (dependency) =>
          dependency.status === "OUTDATED",
      ).length,

      healthy: dependencies.filter(
        (dependency) =>
          dependency.status === "HEALTHY",
      ).length,
    },
  };
}