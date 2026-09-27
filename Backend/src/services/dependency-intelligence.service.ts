import type {
  DetectedDependency,
} from "./dependency-analyzer.service.js";

type EnrichedDependency =
  Omit<DetectedDependency, "status"> & {
    status: "HEALTHY" | "OUTDATED";
  };

interface RegistryResult {
  latestVersion: string | null;
  status: "HEALTHY" | "OUTDATED";
}

interface NpmRegistryResponse {
  "dist-tags"?: {
    latest?: string;
  };
}

function parseVersion(
  version: string,
): number[] | null {
  const normalized = version
    .trim()
    .replace(/^[vV]/, "")
    .split("-")[0];

  const parts = normalized.split(".");

  if (
    parts.length < 1 ||
    parts.length > 3
  ) {
    return null;
  }

  const numbers = parts.map((part) => {
    const match = part.match(/^\d+/);

    return match
      ? Number(match[0])
      : NaN;
  });

  if (
    numbers.some(
      (value) => Number.isNaN(value),
    )
  ) {
    return null;
  }

  while (numbers.length < 3) {
    numbers.push(0);
  }

  return numbers.slice(0, 3);
}

function compareVersions(
  currentVersion: string,
  latestVersion: string,
): number | null {
  const current =
    parseVersion(currentVersion);

  const latest =
    parseVersion(latestVersion);

  if (!current || !latest) {
    return null;
  }

  for (
    let index = 0;
    index < 3;
    index += 1
  ) {
    if (
      current[index] <
      latest[index]
    ) {
      return -1;
    }

    if (
      current[index] >
      latest[index]
    ) {
      return 1;
    }
  }

  return 0;
}

async function getNpmLatestVersion(
  packageName: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(
        packageName,
      )}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data =
      (await response.json()) as NpmRegistryResponse;

    return (
      data["dist-tags"]?.latest ??
      null
    );
  } catch {
    return null;
  }
}

async function evaluateNpmDependency(
  dependency: DetectedDependency,
): Promise<RegistryResult> {
  const latestVersion =
    await getNpmLatestVersion(
      dependency.name,
    );

  if (!latestVersion) {
    return {
      latestVersion: null,
      status: "HEALTHY",
    };
  }

  /*
   * Wildcard and tag/range versions cannot
   * safely be compared as concrete versions.
   */
  if (
    dependency.currentVersion === "*" ||
    dependency.currentVersion === "latest" ||
    dependency.currentVersion === "managed"
  ) {
    return {
      latestVersion,
      status: "OUTDATED",
    };
  }

  const comparison =
    compareVersions(
      dependency.currentVersion,
      latestVersion,
    );

  if (comparison === null) {
    return {
      latestVersion,
      status: "HEALTHY",
    };
  }

  return {
    latestVersion,
    status:
      comparison < 0
        ? "OUTDATED"
        : "HEALTHY",
  };
}

function buildRecommendation(
  status: "HEALTHY" | "OUTDATED",
  currentVersion: string,
  latestVersion: string | null,
): string | null {
  if (
    status === "OUTDATED" &&
    latestVersion
  ) {
    return `Update this dependency from ${currentVersion} to ${latestVersion} after reviewing compatibility and changelog changes.`;
  }

  if (status === "HEALTHY") {
    return "Dependency is currently aligned with the latest known registry version.";
  }

  return null;
}

export async function enrichDependenciesWithIntelligence(
  dependencies: DetectedDependency[],
): Promise<EnrichedDependency[]> {
  const enriched: EnrichedDependency[] = [];

  for (const dependency of dependencies) {
    let result: RegistryResult = {
      latestVersion: null,
      status: "HEALTHY",
    };

    if (
      dependency.ecosystem === "NPM"
    ) {
      result =
        await evaluateNpmDependency(
          dependency,
        );
    }

    enriched.push({
      ...dependency,
      latestVersion:
        result.latestVersion,
      status: result.status,
      recommendation:
        buildRecommendation(
          result.status,
          dependency.currentVersion,
          result.latestVersion,
        ),
    });
  }

  return enriched;
}