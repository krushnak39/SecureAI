import { prisma } from "./src/lib/prisma.js";
import { runCodebaseChat } from "./src/services/codebase-chat.service.js";

const REPOSITORY_ID = "cmua0wk890001aotxd1kzs733";

const TEST_MESSAGE =
  "Where is the repository analysis endpoint implemented, and what does it do?";

async function main() {
  console.log("[RAG Chat Test] Starting end-to-end RAG test...");

  const repository = await prisma.repository.findUnique({
    where: {
      id: REPOSITORY_ID,
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  if (!repository) {
    throw new Error(
      `Repository not found: ${REPOSITORY_ID}`,
    );
  }

  const project = await prisma.project.findUnique({
    where: {
      id: repository.projectId,
    },
    select: {
      id: true,
      ownerId: true,
      name: true,
    },
  });

  if (!project) {
    throw new Error(
      `Project not found for repository: ${REPOSITORY_ID}`,
    );
  }

  console.log(
    `[RAG Chat Test] Project: ${project.name}`,
  );

  console.log(
    `[RAG Chat Test] Project ID: ${project.id}`,
  );

  console.log(
    "[RAG Chat Test] Sending question:",
  );

  console.log(
    `> ${TEST_MESSAGE}`,
  );

  const result = await runCodebaseChat({
    projectId: project.id,
    userId: project.ownerId,
    message: TEST_MESSAGE,
  });

  console.log("");
  console.log(
    "========== RAG ANSWER ==========",
  );

  console.log(result.answer);

  console.log(
    "========== CITATIONS ==========",
  );

  console.log(
    JSON.stringify(
      result.citations,
      null,
      2,
    ),
  );

  console.log(
    "========== SESSION ==========",
  );

  console.log(result.sessionId);

  const session = await prisma.chatSession.findUnique({
    where: {
      id: result.sessionId,
    },
    select: {
      id: true,
      repositoryId: true,
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          role: true,
          content: true,
          citations: true,
        },
      },
    },
  });

  console.log(
    "========== PERSISTED CHAT ==========",
  );

  console.log(
    JSON.stringify(
      session,
      null,
      2,
    ),
  );

  console.log("");
  console.log(
    "[RAG Chat Test] SUCCESS — End-to-end RAG pipeline completed.",
  );
}

main()
  .catch((error) => {
    console.error(
      "[RAG Chat Test] FAILED:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
