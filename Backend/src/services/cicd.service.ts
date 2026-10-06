import { prisma } from "../lib/prisma.js";

import { CIWorkflowStatus, CheckStatus, PullRequestStatus } from "../generated/prisma/client.js";

import {
  dispatchGitHubWorkflow,
  getRepositoryInstallation,
  getInstallationAccessToken,
  listGitHubCheckRuns,
  listGitHubPullRequests,
  listGitHubWorkflowRuns,
  listGitHubWorkflows,
} from "./github.service.js";

function mapWorkflowStatus(
  status: string,
  conclusion: string | null,
): CIWorkflowStatus {
  if (status === "queued") {
    return "QUEUED";
  }

  if (status === "in_progress") {
    return "RUNNING";
  }

  switch (conclusion) {
    case "success":
      return "SUCCESS";

    case "cancelled":
      return "CANCELLED";

    case "failure":
    case "timed_out":
    case "action_required":
      return "FAILED";

    default:
      return "QUEUED";
  }
}

function mapCheckStatus(
  status: string,
  conclusion: string | null,
): CheckStatus {
  if (status === "queued") {
    return "QUEUED";
  }

  if (status === "in_progress") {
    return "RUNNING";
  }

  switch (conclusion) {
    case "success":
    case "skipped":
      return "SUCCESS";

    case "cancelled":
      return "CANCELLED";

    case "failure":
    case "timed_out":
    case "action_required":
      return "FAILED";

    default:
      return "QUEUED";
  }
}

function mapPullRequestStatus(
  state: "open" | "closed",
  mergedAt: string | null,
): PullRequestStatus {
  if (mergedAt) {
    return "MERGED";
  }

  if (state === "closed") {
    return "CLOSED";
  }

  return "OPEN";
}

function calculateDuration(
  startedAt: Date | null,
  completedAt: Date | null,
): number | null {
  if (!startedAt || !completedAt) {
    return null;
  }

  const milliseconds =
    completedAt.getTime() -
    startedAt.getTime();

  if (milliseconds < 0) {
    return null;
  }

  return Math.round(milliseconds / 1000);
}

async function getRepositoryWithInstallation(
  projectId: string,
) {
  const repository =
    await prisma.repository.findFirst({
      where: {
        projectId,
      },
    });

  if (!repository) {
    throw new Error(
      "No GitHub repository is connected to this project",
    );
  }

  const installation =
    await getRepositoryInstallation(
      repository.fullName,
    );

  const token =
    await getInstallationAccessToken(
      installation.id,
      [Number(repository.externalId)],
    );


  return {
    repository,
    installation,
    accessToken: token.token,
  };
}

export async function syncPullRequests(
  projectId: string,
) {
  const {
    repository,
    accessToken,
  } =
    await getRepositoryWithInstallation(
      projectId,
    );

  const pullRequests =
    await listGitHubPullRequests(
      accessToken,
      repository.fullName,
    );

  for (const pullRequest of pullRequests) {
    const status =
      mapPullRequestStatus(
        pullRequest.state,
        pullRequest.merged_at,
      );

    await prisma.pullRequest.upsert({
      where: {
        repositoryId_number: {
          repositoryId:
            repository.id,
          number:
            pullRequest.number,
        },
      },

      create: {
        repositoryId:
          repository.id,
        externalId:
          pullRequest.id,
        number:
          pullRequest.number,
        title:
          pullRequest.title,
        author:
          pullRequest.user?.login ??
          null,
        sourceBranch:
          pullRequest.head.ref,
        targetBranch:
          pullRequest.base.ref,
        status,
        url:
          pullRequest.html_url,
        createdAt:
          new Date(
            pullRequest.created_at,
          ),
        updatedAt:
          new Date(
            pullRequest.updated_at,
          ),
        mergedAt:
          pullRequest.merged_at
            ? new Date(
                pullRequest.merged_at,
              )
            : null,
      },

      update: {
        externalId:
          pullRequest.id,
        title:
          pullRequest.title,
        author:
          pullRequest.user?.login ??
          null,
        sourceBranch:
          pullRequest.head.ref,
        targetBranch:
          pullRequest.base.ref,
        status,
        url:
          pullRequest.html_url,
        updatedAt:
          new Date(
            pullRequest.updated_at,
          ),
        mergedAt:
          pullRequest.merged_at
            ? new Date(
                pullRequest.merged_at,
              )
            : null,
      },
    });
  }

  return pullRequests.length;
}

export async function syncCIWorkflows(
  projectId: string,
) {
  const {
    repository,
    accessToken,
  } =
    await getRepositoryWithInstallation(
      projectId,
    );

  const [
    workflows,
    workflowRuns,
  ] = await Promise.all([
    listGitHubWorkflows(
      accessToken,
      repository.fullName,
    ),

    listGitHubWorkflowRuns(
      accessToken,
      repository.fullName,
    ),
  ]);

  const workflowMap =
    new Map<number, string>();

  for (const workflow of workflows) {
    const databaseWorkflow =
      await prisma.cIWorkflow.upsert({
        where: {
          repositoryId_workflowFile: {
            repositoryId:
              repository.id,
            workflowFile:
              workflow.path,
          },
        },

        create: {
          repositoryId:
            repository.id,
          name:
            workflow.name,
          workflowFile:
            workflow.path,
        },

        update: {
          name:
            workflow.name,
        },
      });

    workflowMap.set(
      workflow.id,
      databaseWorkflow.id,
    );
  }

  let runsSynced = 0;
  let checksSynced = 0;

  for (const run of workflowRuns) {
    /*
     * GitHub workflow runs contain
     * workflow_id. This identifies the
     * workflow that owns the run.
     */
    const databaseWorkflowId =
      workflowMap.get(
        Number(run.workflow_id),
      );

    if (!databaseWorkflowId) {
      continue;
    }

    const startedAt =
      run.run_started_at
        ? new Date(
            run.run_started_at,
          )
        : null;

    const completedAt =
      run.status === "completed"
        ? new Date(
            run.updated_at,
          )
        : null;

    const runStatus =
      mapWorkflowStatus(
        run.status,
        run.conclusion,
      );

    const databaseRun =
      await prisma.cIWorkflowRun.upsert({
        where: {
          id: `${repository.id}-${run.id}`,
        },

        create: {
          id: `${repository.id}-${run.id}`,
          workflowId:
            databaseWorkflowId,
          externalId:
            String(run.id),
          branch:
            run.head_branch,
          commitSha:
            run.head_sha,
          status:
            runStatus,
          startedAt,
          completedAt,
        },

        update: {
          workflowId:
            databaseWorkflowId,
          branch:
            run.head_branch,
          commitSha:
            run.head_sha,
          status:
            runStatus,
          startedAt,
          completedAt,
        },
      });

    runsSynced += 1;

    if (!run.head_sha) {
      continue;
    }

    try {
      const checks =
        await listGitHubCheckRuns(
          accessToken,
          repository.fullName,
          run.head_sha,
        );

      for (const check of checks) {
        const checkStatus =
          mapCheckStatus(
            check.status,
            check.conclusion,
          );

        const checkId =
          `${databaseRun.id}-${check.id}`;

        const completedAt =
          check.completed_at
            ? new Date(
                check.completed_at,
              )
            : null;

        await prisma.cICheck.upsert({
          where: {
            id: checkId,
          },

          create: {
            id: checkId,
            runId:
              databaseRun.id,
            name:
              check.name,
            status:
              checkStatus,
            conclusion:
              check.conclusion,
            logsUrl:
              check.html_url,
            completedAt,
          },

          update: {
            name:
              check.name,
            status:
              checkStatus,
            conclusion:
              check.conclusion,
            logsUrl:
              check.html_url,
            completedAt,
          },
        });

        checksSynced += 1;
      }
    } catch (error) {
      console.warn(
        `Unable to sync checks for workflow run ${run.id}:`,
        error,
      );
    }
  }

  return {
    workflows:
      workflows.length,
    runs:
      runsSynced,
    checks:
      checksSynced,
  };
}

export async function syncCICD(
  projectId: string,
) {
  const [
    pullRequests,
    workflows,
  ] = await Promise.all([
    syncPullRequests(projectId),
    syncCIWorkflows(projectId),
  ]);

  return {
    pullRequests,
    workflows,
  };
}

export async function getCICDOverview(
  projectId: string,
) {
  const repository =
    await prisma.repository.findFirst({
      where: {
        projectId,
      },
    });

  if (!repository) {
    throw new Error(
      "No GitHub repository is connected to this project",
    );
  }

  const [
    workflows,
    runs,
    pullRequests,
  ] = await Promise.all([
    prisma.cIWorkflow.findMany({
      where: {
        repositoryId:
          repository.id,
      },

      include: {
        runs: {
          include: {
            checks: true,
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 50,
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    }),

    prisma.cIWorkflowRun.findMany({
      where: {
        workflow: {
          repositoryId:
            repository.id,
        },
      },

      include: {
        workflow: true,
        checks: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 50,
    }),

    prisma.pullRequest.findMany({
      where: {
        repositoryId:
          repository.id,
      },

      orderBy: {
        updatedAt: "desc",
      },

      take: 50,
    }),
  ]);

  const successfulRuns =
    runs.filter(
      (run) =>
        run.status === "SUCCESS",
    ).length;

  const completedRuns =
    runs.filter(
      (run) =>
        run.status ===
          "SUCCESS" ||
        run.status ===
          "FAILED" ||
        run.status ===
          "CANCELLED",
    ).length;

  const workflowSuccessRate =
    completedRuns > 0
      ? Math.round(
          (successfulRuns /
            completedRuns) *
            1000,
        ) / 10
      : 0;

  const durations =
    runs
      .map((run) =>
        calculateDuration(
          run.startedAt,
          run.completedAt,
        ),
      )
      .filter(
        (
          value,
        ): value is number =>
          value !== null,
      );

  const averageDuration =
    durations.length > 0
      ? Math.round(
          durations.reduce(
            (sum, value) =>
              sum + value,
            0,
          ) /
            durations.length,
        )
      : 0;

  return {
    repository: {
      id:
        repository.id,
      name:
        repository.name,
      fullName:
        repository.fullName,
      branch:
        repository.branch,
    },

    metrics: {
      workflowSuccessRate,
      activeWorkflows:
        workflows.length,
      pullRequests:
        pullRequests.length,
      averageDuration,
      totalRuns:
        runs.length,
    },

    workflows,
    runs,
    pullRequests,
  };
}

export async function triggerCIAnalysis(
  projectId: string,
) {
  const {
    repository,
    accessToken,
  } =
    await getRepositoryWithInstallation(
      projectId,
    );

  const workflows =
    await listGitHubWorkflows(
      accessToken,
      repository.fullName,
    );

  const activeWorkflow =
    workflows.find(
      (workflow) =>
        workflow.state ===
        "active",
    );


  if (!activeWorkflow) {
    throw new Error(
      "No active GitHub Actions workflow was found",
    );
  }

  await dispatchGitHubWorkflow(
    accessToken,
    repository.fullName,
    activeWorkflow.id,
    "feature",
  );

  return {
    name: activeWorkflow.name,
    workflow: activeWorkflow.name,
    file: activeWorkflow.path,
    workflowFile: activeWorkflow.path,
    branch: "feature",
  };
}









