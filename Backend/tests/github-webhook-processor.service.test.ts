
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  repositoryFindFirst: vi.fn(),
  analysisCreate: vi.fn(),
  findingCreateMany: vi.fn(),

  getRepositoryInstallation: vi.fn(),
  getInstallationAccessToken: vi.fn(),
  listGitHubPullRequestFiles: vi.fn(),
  getGitHubFileContent: vi.fn(),
  createGitHubCheckRun: vi.fn(),

  reviewRepositoryCode: vi.fn(),
  scanRepositorySecurity: vi.fn(),
}));

vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    repository: {
      findFirst: mocks.repositoryFindFirst,
    },
    analysis: {
      create: mocks.analysisCreate,
    },
    finding: {
      createMany: mocks.findingCreateMany,
    },
  },
}));

vi.mock("../src/services/github.service.js", () => ({
  getRepositoryInstallation: mocks.getRepositoryInstallation,
  getInstallationAccessToken: mocks.getInstallationAccessToken,
  listGitHubPullRequestFiles: mocks.listGitHubPullRequestFiles,
  getGitHubFileContent: mocks.getGitHubFileContent,
  createGitHubCheckRun: mocks.createGitHubCheckRun,
}));

vi.mock("../src/services/code-review.service.js", () => ({
  reviewRepositoryCode: mocks.reviewRepositoryCode,
}));

vi.mock("../src/services/security-scanner.service.js", () => ({
  scanRepositorySecurity: mocks.scanRepositorySecurity,
}));

describe("GitHub Webhook Processor Service", () => {
  let processWebhook: typeof import(
    "../src/services/github-webhook-processor.service.js"
  ).processGitHubPullRequestWebhook;

  const repository = {
    id: "repository-1",
    projectId: "project-1",
    fullName: "owner/repository",
  };

  const payload = {
    action: "opened",
    pull_request: {
      number: 42,
      title: "Add authentication",
      head: {
        ref: "feature/auth",
        sha: "abc123",
      },
      base: {
        ref: "main",
      },
    },
    repository: {
      full_name: "owner/repository",
    },
  };

  const codeFinding = {
    severity: "HIGH",
    category: "CODE_QUALITY",
    title: "Unsafe evaluation",
    description: "Dynamic evaluation was detected.",
    impact: "May execute untrusted code.",
    recommendation: "Avoid dynamic evaluation.",
    filePath: "src/app.ts",
    lineStart: 1,
    lineEnd: 1,
    functionName: "authenticate",
    rule: "CODE001",
    scanner: "CODE_REVIEW",
    evidence: "eval(userInput)",
    confidence: 0.95,
  };

  const securityFinding = {
    severity: "CRITICAL",
    title: "Hardcoded secret detected",
    description: "A hardcoded secret was detected.",
    impact: "Credentials may be exposed.",
    recommendation: "Move secrets into environment variables.",
    filePath: "src/app.ts",
    lineStart: 2,
    lineEnd: 2,
    rule: "SEC002",
    scanner: "SECURITY_SCANNER",
    evidence: 'const password = "secret123"',
    confidence: 0.99,
  };

  function expectAnalysis(
    result: Awaited<ReturnType<typeof processWebhook>>,
  ) {
    expect(result.handled).toBe(true);

    if (!("analysis" in result) || !result.analysis) {
      throw new Error(
        "Expected a handled result containing analysis data.",
      );
    }

    return result.analysis;
  }

  function getCheckRun() {
    return mocks.createGitHubCheckRun.mock.calls[0][2];
  }

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    mocks.repositoryFindFirst.mockResolvedValue(repository);

    mocks.getRepositoryInstallation.mockResolvedValue({
      id: 123,
      app_id: 456,
      account: {
        login: "owner",
        id: 789,
        avatar_url: "https://example.com/avatar.png",
      },
      repository_selection: "all",
    });

    mocks.getInstallationAccessToken.mockResolvedValue({
      token: "test-access-token",
      expires_at: "2026-12-31T00:00:00Z",
      permissions: {},
    });

    mocks.listGitHubPullRequestFiles.mockResolvedValue([
      {
        sha: "file-sha-1",
        filename: "src/app.ts",
        status: "modified",
        additions: 5,
        deletions: 2,
        changes: 7,
      },
    ]);

    mocks.getGitHubFileContent.mockResolvedValue(
      "const value = 10;\nexport default value;",
    );

    mocks.reviewRepositoryCode.mockReturnValue([]);

    mocks.scanRepositorySecurity.mockReturnValue({
      findings: [],
      securityScore: 100,
      counts: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      },
    });

    mocks.analysisCreate.mockResolvedValue({
      id: "analysis-1",
    });

    mocks.findingCreateMany.mockResolvedValue({
      count: 0,
    });

    mocks.createGitHubCheckRun.mockResolvedValue({
      id: 999,
    });

    const service = await import(
      "../src/services/github-webhook-processor.service.js"
    );

    processWebhook =
      service.processGitHubPullRequestWebhook;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Input validation", () => {
    it("rejects a payload with a missing repository name", async () => {
      const result = await processWebhook({
        pull_request: {
          number: 42,
        },
      });

      expect(result).toEqual({
        handled: false,
        reason: "Repository full_name is missing.",
      });

      expect(mocks.repositoryFindFirst).not.toHaveBeenCalled();
    });

    it("rejects a payload with a missing pull request number", async () => {
      const result = await processWebhook({
        repository: {
          full_name: "owner/repository",
        },
      });

      expect(result).toEqual({
        handled: false,
        reason: "Pull request number is missing.",
      });

      expect(mocks.repositoryFindFirst).not.toHaveBeenCalled();
    });

    it("rejects a repository not connected to SecureAI", async () => {
      mocks.repositoryFindFirst.mockResolvedValue(null);

      const result = await processWebhook(payload);

      expect(result).toEqual({
        handled: false,
        reason: "Repository is not connected to SecureAI.",
        repository: "owner/repository",
      });

      expect(mocks.getRepositoryInstallation).not.toHaveBeenCalled();
    });

    it("rejects a payload with a missing head SHA", async () => {
      const invalidPayload = {
        ...payload,
        pull_request: {
          ...payload.pull_request,
          head: {
            ref: "feature/auth",
          },
        },
      };

      const result = await processWebhook(invalidPayload);

      expect(result).toEqual({
        handled: false,
        reason: "Pull request head SHA is missing.",
      });

      expect(mocks.analysisCreate).not.toHaveBeenCalled();
    });
  });

  describe("Successful processing", () => {
    it("processes a pull request and creates an analysis", async () => {
      const result = await processWebhook(payload);

      expect(result.handled).toBe(true);

      expect(mocks.repositoryFindFirst).toHaveBeenCalledWith({
        where: {
          fullName: "owner/repository",
          provider: "GITHUB",
        },
        select: {
          id: true,
          projectId: true,
          fullName: true,
        },
      });

      expect(mocks.getRepositoryInstallation).toHaveBeenCalledWith(
        "owner/repository",
      );

      expect(mocks.getInstallationAccessToken).toHaveBeenCalledWith(123);

      expect(mocks.listGitHubPullRequestFiles).toHaveBeenCalledWith(
        "test-access-token",
        "owner/repository",
        42,
      );

      expect(mocks.analysisCreate).toHaveBeenCalledTimes(1);
      expect(mocks.createGitHubCheckRun).toHaveBeenCalledTimes(1);
    });

    it("uses the pull request head SHA to retrieve file content", async () => {
      await processWebhook(payload);

      expect(mocks.getGitHubFileContent).toHaveBeenCalledWith(
        "test-access-token",
        "owner/repository",
        "src/app.ts",
        "abc123",
      );
    });

    it("stores analysis with the correct repository and pull request details", async () => {
      await processWebhook(payload);

      const createCall = mocks.analysisCreate.mock.calls[0][0];

      expect(createCall.data).toMatchObject({
        repositoryId: "repository-1",
        pullRequestId: null,
        status: "COMPLETED",
        trigger: "PULL_REQUEST",
        branch: "feature/auth",
        commitSha: "abc123",
        filesAnalyzed: 1,
        linesAnalyzed: 2,
      });
    });

    it("publishes a completed GitHub Check Run", async () => {
      await processWebhook(payload);

      expect(getCheckRun()).toMatchObject({
        name: "SecureAI PR Analysis",
        headSha: "abc123",
        status: "completed",
        conclusion: "success",
      });
    });

    it("returns repository and pull request information", async () => {
      const result = await processWebhook(payload);

      expect(result).toMatchObject({
        handled: true,
        repositoryId: "repository-1",
        projectId: "project-1",
        repository: "owner/repository",
        pullRequestNumber: 42,
        action: "opened",
        title: "Add authentication",
        sourceBranch: "feature/auth",
        targetBranch: "main",
        headSha: "abc123",
      });
    });
  });

  describe("Changed file handling", () => {
    it("skips deleted files", async () => {
      mocks.listGitHubPullRequestFiles.mockResolvedValue([
        {
          sha: "deleted-sha",
          filename: "src/old.ts",
          status: "deleted",
          additions: 0,
          deletions: 10,
          changes: 10,
        },
      ]);

      const result = await processWebhook(payload);
      const analysis = expectAnalysis(result);

      expect(mocks.getGitHubFileContent).not.toHaveBeenCalled();

      expect(analysis.skippedFiles).toContainEqual({
        filename: "src/old.ts",
        reason: "Deleted file",
      });

      expect(analysis.analyzableFiles).toBe(0);
    });

    it("skips unsupported file types", async () => {
      mocks.listGitHubPullRequestFiles.mockResolvedValue([
        {
          sha: "image-sha",
          filename: "assets/logo.png",
          status: "modified",
          additions: 1,
          deletions: 0,
          changes: 1,
        },
      ]);

      const result = await processWebhook(payload);
      const analysis = expectAnalysis(result);

      expect(mocks.getGitHubFileContent).not.toHaveBeenCalled();

      expect(analysis.skippedFiles).toContainEqual({
        filename: "assets/logo.png",
        reason: "Unsupported file type",
      });
    });

    it("skips files whose content is unavailable", async () => {
      mocks.getGitHubFileContent.mockResolvedValue(null);

      const result = await processWebhook(payload);
      const analysis = expectAnalysis(result);

      expect(analysis.skippedFiles).toContainEqual({
        filename: "src/app.ts",
        reason: "File content unavailable",
      });

      expect(analysis.analyzableFiles).toBe(0);
    });

    it("continues processing when some files are skipped", async () => {
      mocks.listGitHubPullRequestFiles.mockResolvedValue([
        {
          sha: "valid-sha",
          filename: "src/app.ts",
          status: "modified",
          additions: 5,
          deletions: 2,
          changes: 7,
        },
        {
          sha: "deleted-sha",
          filename: "src/old.ts",
          status: "deleted",
          additions: 0,
          deletions: 10,
          changes: 10,
        },
        {
          sha: "image-sha",
          filename: "assets/logo.png",
          status: "modified",
          additions: 1,
          deletions: 0,
          changes: 1,
        },
      ]);

      const result = await processWebhook(payload);
      const analysis = expectAnalysis(result);

      expect(result.handled).toBe(true);
      expect(analysis.analyzableFiles).toBe(1);
      expect(analysis.skippedFiles).toHaveLength(2);
    });

    it("calculates changed lines using all changed files, including skipped files", async () => {
      mocks.listGitHubPullRequestFiles.mockResolvedValue([
        {
          sha: "valid-sha",
          filename: "src/app.ts",
          status: "modified",
          additions: 5,
          deletions: 2,
          changes: 7,
        },
        {
          sha: "deleted-sha",
          filename: "src/old.ts",
          status: "deleted",
          additions: 0,
          deletions: 10,
          changes: 10,
        },
        {
          sha: "image-sha",
          filename: "assets/logo.png",
          status: "modified",
          additions: 3,
          deletions: 1,
          changes: 4,
        },
      ]);

      const result = await processWebhook(payload);
      const analysis = expectAnalysis(result);

      expect(analysis.risk.changedLines).toBe(21);
    });
  });

  describe("Finding persistence", () => {
    it("does not create findings when both scanners return no findings", async () => {
      await processWebhook(payload);

      expect(mocks.findingCreateMany).not.toHaveBeenCalled();
    });

    it("persists code-review findings", async () => {
      mocks.reviewRepositoryCode.mockReturnValue([codeFinding]);

      await processWebhook(payload);

      expect(mocks.findingCreateMany).toHaveBeenCalledTimes(1);

      const savedFindings =
        mocks.findingCreateMany.mock.calls[0][0].data;

      expect(savedFindings).toHaveLength(1);

      expect(savedFindings[0]).toMatchObject({
        analysisId: "analysis-1",
        severity: "HIGH",
        category: "CODE_QUALITY",
        title: "Unsafe evaluation",
        filePath: "src/app.ts",
        lineStart: 1,
        lineEnd: 1,
        functionName: "authenticate",
        rule: "CODE001",
        scanner: "CODE_REVIEW",
      });
    });

    it("persists security findings with SECURITY category", async () => {
      mocks.scanRepositorySecurity.mockReturnValue({
        findings: [securityFinding],
        securityScore: 70,
        counts: {
          critical: 1,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        },
      });

      await processWebhook(payload);

      expect(mocks.findingCreateMany).toHaveBeenCalledTimes(1);

      const savedFindings =
        mocks.findingCreateMany.mock.calls[0][0].data;

      expect(savedFindings).toHaveLength(1);

      expect(savedFindings[0]).toMatchObject({
        analysisId: "analysis-1",
        severity: "CRITICAL",
        category: "SECURITY",
        title: "Hardcoded secret detected",
        filePath: "src/app.ts",
        lineStart: 2,
        lineEnd: 2,
        functionName: null,
        rule: "SEC002",
        scanner: "SECURITY_SCANNER",
      });
    });

    it("persists code-review and security findings together", async () => {
      mocks.reviewRepositoryCode.mockReturnValue([codeFinding]);

      mocks.scanRepositorySecurity.mockReturnValue({
        findings: [securityFinding],
        securityScore: 70,
        counts: {
          critical: 1,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        },
      });

      await processWebhook(payload);

      const savedFindings =
        mocks.findingCreateMany.mock.calls[0][0].data;

      expect(savedFindings).toHaveLength(2);

      expect(
        savedFindings.map(
          (finding: { category: string }) => finding.category,
        ),
      ).toEqual(["CODE_QUALITY", "SECURITY"]);
    });

    it("removes duplicate findings using file, line and title", async () => {
      const duplicateCodeFinding = {
        ...codeFinding,
        title: "Duplicate finding",
      };

      const duplicateSecurityFinding = {
        ...securityFinding,
        title: "Duplicate finding",
        filePath: codeFinding.filePath,
        lineStart: codeFinding.lineStart,
      };

      mocks.reviewRepositoryCode.mockReturnValue([
        duplicateCodeFinding,
      ]);

      mocks.scanRepositorySecurity.mockReturnValue({
        findings: [duplicateSecurityFinding],
        securityScore: 70,
        counts: {
          critical: 1,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        },
      });

      await processWebhook(payload);

      const savedFindings =
        mocks.findingCreateMany.mock.calls[0][0].data;

      expect(savedFindings).toHaveLength(1);
      expect(savedFindings[0].title).toBe("Duplicate finding");
      expect(savedFindings[0].category).toBe("CODE_QUALITY");
    });

    it("does not publish a Check Run when processing fails before analysis creation", async () => {
      mocks.getRepositoryInstallation.mockRejectedValue(
        new Error("GitHub API unavailable"),
      );

      await expect(
        processWebhook(payload),
      ).rejects.toThrow("GitHub API unavailable");

      expect(mocks.analysisCreate).not.toHaveBeenCalled();
      expect(mocks.createGitHubCheckRun).not.toHaveBeenCalled();
    });
  });

  describe("Risk-based GitHub Check Run conclusions", () => {
    it("publishes success when the PR is READY", async () => {
      const result = await processWebhook(payload);
      const analysis = expectAnalysis(result);

      expect(analysis.risk).toMatchObject({
        score: 0,
        level: "LOW",
        mergeReadiness: "READY",
      });

      expect(getCheckRun().conclusion).toBe("success");
    });

    it("publishes neutral when the PR requires review", async () => {
      mocks.reviewRepositoryCode.mockReturnValue([
        {
          ...codeFinding,
          severity: "MEDIUM",
        },
        {
          ...codeFinding,
          title: "Another medium finding",
          severity: "MEDIUM",
          lineStart: 2,
          lineEnd: 2,
        },
        {
          ...codeFinding,
          title: "Third medium finding",
          severity: "MEDIUM",
          lineStart: 3,
          lineEnd: 3,
        },
      ]);

      const result = await processWebhook(payload);
      const analysis = expectAnalysis(result);

      expect(analysis.risk).toMatchObject({
        score: 36,
        level: "MEDIUM",
        mergeReadiness: "REVIEW_REQUIRED",
      });

      expect(getCheckRun().conclusion).toBe("neutral");
    });

    it("publishes failure when a critical security finding blocks the PR", async () => {
      mocks.scanRepositorySecurity.mockReturnValue({
        findings: [securityFinding],
        securityScore: 70,
        counts: {
          critical: 1,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        },
      });

      const result = await processWebhook(payload);
      const analysis = expectAnalysis(result);

      expect(analysis.risk).toMatchObject({
        score: 40,
        level: "MEDIUM",
        mergeReadiness: "BLOCKED",
      });

      expect(getCheckRun().conclusion).toBe("failure");
    });
  });
});
