import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getArchitecture(req: Request, res: Response) {
  try {
    const userId = req.userId;

    const projectIdParam = req.params.projectId;
    const projectId = Array.isArray(projectIdParam)
      ? projectIdParam[0]
      : projectIdParam;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
      include: {
        repositories: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const repository = project.repositories[0];

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "No repository connected to this project",
      });
    }

    const analysis = await prisma.analysis.findFirst({
      where: {
        repositoryId: repository.id,
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        architectureComponents: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            outgoingRelationships: true,
            incomingRelationships: true,
          },
        },
        findings: {
          where: {
            category: "ARCHITECTURE",
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!analysis) {
      return res.json({
        success: true,
        data: {
          analysis: null,
          architecture: {
            health: null,
            components: [],
            relationships: [],
            findings: [],
          },
        },
      });
    }

    const components = analysis.architectureComponents.map((component) => ({
      id: component.id,
      name: component.name,
      type: component.type,
      technology: component.technology,
      description: component.description,
      files: component.files,
      health: component.health,
    }));

    const relationshipMap = new Map<
      string,
      {
        id: string;
        sourceId: string;
        targetId: string;
        relation: string;
        metadata: unknown;
      }
    >();

    for (const component of analysis.architectureComponents) {
      for (const relationship of component.outgoingRelationships) {
        relationshipMap.set(relationship.id, {
          id: relationship.id,
          sourceId: relationship.sourceId,
          targetId: relationship.targetId,
          relation: relationship.relation,
          metadata: relationship.metadata,
        });
      }
    }

    const relationships = Array.from(relationshipMap.values());

    const findings = analysis.findings.map((finding) => ({
      id: finding.id,
      severity: finding.severity,
      title: finding.title,
      description: finding.description,
      impact: finding.impact,
      recommendation: finding.recommendation,
      filePath: finding.filePath,
      lineStart: finding.lineStart,
      lineEnd: finding.lineEnd,
      functionName: finding.functionName,
      rule: finding.rule,
      scanner: finding.scanner,
      evidence: finding.evidence,
      confidence: finding.confidence,
    }));

    return res.json({
      success: true,
      data: {
        analysis: {
          id: analysis.id,
          branch: analysis.branch,
          commitSha: analysis.commitSha,
          createdAt: analysis.createdAt,
          completedAt: analysis.completedAt,
        },
        architecture: {
          health: analysis.architecture,
          components,
          relationships,
          findings,
        },
      },
    });
  } catch (error) {
    console.error(
      "[Architecture API] Failed to fetch architecture:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch architecture data",
    });
  }
}