import { prisma } from "../lib/prisma.js";

interface CreateProjectInput {
  name: string;
  description?: string;
}

interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  status?: "ACTIVE" | "ARCHIVED";
}

interface ConnectRepositoryInput {
  name: string;
  fullName: string;
  url: string;
  externalId?: string;
  defaultBranch?: string;
  branch?: string;
  language?: string;
  isPrivate?: boolean;
}

function formatAnalysis(analysis: any) {
  if (!analysis) {
    return null;
  }

  return {
    id: analysis.id,
    status: analysis.status,
    trigger: analysis.trigger,
    branch: analysis.branch,
    commitSha: analysis.commitSha,
    healthScore: analysis.healthScore,
    codeQuality: analysis.codeQuality,
    securityScore: analysis.securityScore,
    performance: analysis.performance,
    architecture: analysis.architecture,
    maintainability: analysis.maintainability,
    filesAnalyzed: analysis.filesAnalyzed,
    linesAnalyzed: analysis.linesAnalyzed,
    startedAt: analysis.startedAt,
    completedAt: analysis.completedAt,
    createdAt: analysis.createdAt,
  };
}

function formatRepository(repository: any) {
  if (!repository) {
    return null;
  }

  return {
    id: repository.id,
    provider: repository.provider,
    externalId: repository.externalId,
    name: repository.name,
    fullName: repository.fullName,
    url: repository.url,
    defaultBranch: repository.defaultBranch,
    branch: repository.branch,
    language: repository.language,
    isPrivate: repository.isPrivate,
    connectedAt: repository.connectedAt,
    lastAnalyzed: repository.lastAnalyzed,
    latestAnalysis: formatAnalysis(
      repository.analyses?.[0],
    ),
  };
}

function formatProject(project: any) {
  const repository = project.repositories?.[0] ?? null;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    repository: formatRepository(repository),
  };
}

export async function listProjects(userId: string) {
  const projects = await prisma.project.findMany({
    where: {
      ownerId: userId,
      status: "ACTIVE",
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      repositories: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
        include: {
          analyses: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  return projects.map(formatProject);
}

export async function getProject(
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
          updatedAt: "desc",
        },
        include: {
          analyses: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  return formatProject(project);
}

export async function createProject(
  userId: string,
  data: CreateProjectInput,
) {
  const project = await prisma.project.create({
    data: {
      ownerId: userId,
      name: data.name,
      description: data.description || null,
    },
  });

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    repository: null,
  };
}

export async function updateProject(
  projectId: string,
  userId: string,
  data: UpdateProjectInput,
) {
  const existingProject =
    await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
    });

  if (!existingProject) {
    return null;
  }

  const project = await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      ...(data.name !== undefined
        ? { name: data.name }
        : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.status !== undefined
        ? { status: data.status }
        : {}),
    },
  });

  return project;
}

export async function deleteProject(
  projectId: string,
  userId: string,
) {
  const existingProject =
    await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
      select: {
        id: true,
      },
    });

  if (!existingProject) {
    return false;
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });

  return true;
}

export async function connectRepository(
  projectId: string,
  userId: string,
  data: ConnectRepositoryInput,
) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    return null;
  }

  const repository = await prisma.repository.create({
    data: {
      projectId,
      provider: "GITHUB",
      externalId: data.externalId ?? null,
      name: data.name,
      fullName: data.fullName,
      url: data.url,
      defaultBranch:
        data.defaultBranch ?? "main",
      branch: data.branch ?? null,
      language: data.language ?? null,
      isPrivate: data.isPrivate ?? false,
    },
  });

  return repository;
}