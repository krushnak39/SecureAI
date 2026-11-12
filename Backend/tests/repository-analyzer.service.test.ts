
import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";

import {
  getLanguage,
  extractAnalyzableRepositoryFiles,
  analyzeRepositoryFiles,
  analyzeRepositoryArchive,
} from "../src/services/repository-analyzer.service.js";

import type {
  AnalyzableRepositoryFile,
} from "../src/services/repository-analyzer.service.js";

function createZip(
  files: Record<string, string | Buffer>,
): Buffer {
  const zip = new AdmZip();

  for (const [path, content] of Object.entries(files)) {
    zip.addFile(
      path,
      Buffer.isBuffer(content) ? content : Buffer.from(content),
    );
  }

  return zip.toBuffer();
}

function createFile(
  path: string,
  language: string,
  content: string,
): AnalyzableRepositoryFile {
  const lines = content
    ? content.split(/\r\n|\r|\n/)
    : [];

  return {
    path,
    language,
    content,
    lines:
      content.endsWith("\n") || content.endsWith("\r")
        ? Math.max(lines.length - 1, 1)
        : lines.length,
  };
}

describe("getLanguage", () => {
  it.each([
    ["app.ts", "TypeScript"],
    ["component.tsx", "TypeScript"],
    ["module.mts", "TypeScript"],
    ["module.cts", "TypeScript"],
    ["app.js", "JavaScript"],
    ["component.jsx", "JavaScript"],
    ["module.mjs", "JavaScript"],
    ["module.cjs", "JavaScript"],
    ["main.py", "Python"],
    ["Main.java", "Java"],
    ["Program.cs", "C#"],
    ["main.go", "Go"],
    ["main.rs", "Rust"],
    ["schema.sql", "SQL"],
    ["index.html", "HTML"],
    ["index.htm", "HTML"],
    ["style.css", "CSS"],
    ["style.scss", "CSS"],
    ["style.sass", "CSS"],
    ["config.json", "JSON"],
    ["config.yml", "YAML"],
    ["config.yaml", "YAML"],
    ["README.md", "Markdown"],
    ["README.mdx", "Markdown"],
    ["main.c", "C"],
    ["header.h", "C/C++"],
    ["main.cpp", "C++"],
    ["main.cc", "C++"],
    ["main.cxx", "C++"],
    ["header.hpp", "C++"],
    ["script.sh", "Shell"],
    ["script.bash", "Shell"],
    ["Dockerfile", "Dockerfile"],
    ["Makefile", "Makefile"],
    ["requirements.txt", "TEXT"],
    ["pom.xml", "XML"],
  ])("detects %s as %s", (path, expected) => {
    expect(getLanguage(path)).toBe(expected);
  });

  it("handles uppercase extensions", () => {
    expect(getLanguage("APP.TS")).toBe("TypeScript");
  });

  it("handles nested paths", () => {
    expect(getLanguage("src/components/App.tsx")).toBe(
      "TypeScript",
    );
  });

  it("returns null for unsupported files", () => {
    expect(getLanguage("image.png")).toBeNull();
    expect(getLanguage(".gitignore")).toBeNull();
    expect(getLanguage("unknown")).toBeNull();
  });
});

describe("extractAnalyzableRepositoryFiles", () => {
  it("extracts supported files from a ZIP archive", () => {
    const archive = createZip({
      "repo/src/app.ts": "const age = 20;",
      "repo/src/main.py": "print('hello')",
    });

    const result = extractAnalyzableRepositoryFiles(archive);

    expect(result.files).toHaveLength(2);
    expect(result.skippedFiles).toBe(0);
    expect(result.archiveBytes).toBe(archive.length);

    expect(result.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "src/app.ts",
          language: "TypeScript",
          content: "const age = 20;",
          lines: 1,
        }),
        expect.objectContaining({
          path: "src/main.py",
          language: "Python",
          content: "print('hello')",
          lines: 1,
        }),
      ]),
    );
  });

  it("handles root-level archive files", () => {
    const archive = createZip({
      "app.ts": "const app = true;",
    });

    const result = extractAnalyzableRepositoryFiles(archive);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("app.ts");
  });

  it("skips unsupported files", () => {
    const archive = createZip({
      "repo/src/app.ts": "const value = 10;",
      "repo/.gitignore": "node_modules",
      "repo/image.png": "image data",
    });

    const result = extractAnalyzableRepositoryFiles(archive);

    expect(result.files).toHaveLength(1);
    expect(result.skippedFiles).toBe(2);
  });

  it("ignores dependency and build directories", () => {
    const archive = createZip({
      "repo/src/app.ts": "const app = true;",
      "repo/node_modules/library/index.js": "module code",
      "repo/dist/bundle.js": "build code",
      "repo/.git/config.ts": "git config",
      "repo/coverage/report.ts": "coverage",
    });

    const result = extractAnalyzableRepositoryFiles(archive);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("src/app.ts");
    expect(result.skippedFiles).toBe(4);
  });

  it("ignores known lock files", () => {
    const archive = createZip({
      "repo/src/app.ts": "const app = true;",
      "repo/package-lock.json": "{}",
      "repo/pnpm-lock.yaml": "lockfileVersion: 1",
      "repo/yarn.lock": "lock data",
      "repo/go.sum": "checksum",
    });

    const result = extractAnalyzableRepositoryFiles(archive);

    expect(result.files).toHaveLength(1);
    expect(result.skippedFiles).toBe(4);
  });

  it("skips binary files", () => {
    const archive = createZip({
      "repo/src/app.ts": "const app = true;",
      "repo/assets/data.json": Buffer.from([0x7b, 0x00, 0x7d]),
    });

    const result = extractAnalyzableRepositoryFiles(archive);

    expect(result.files).toHaveLength(1);
    expect(result.skippedFiles).toBe(1);
  });

  it("normalizes Windows-style archive paths", () => {
    const archive = createZip({
      "repo\\src\\app.ts": "const app = true;",
    });

    const result = extractAnalyzableRepositoryFiles(archive);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("src/app.ts");
  });

  it("counts LF and CRLF lines correctly", () => {
    const archive = createZip({
      "repo/lf.ts": "line 1\nline 2\n",
      "repo/crlf.ts": "line 1\r\nline 2\r\n",
      "repo/single.ts": "single line",
    });

    const result = extractAnalyzableRepositoryFiles(archive);

    expect(
      result.files.find(
        (file: AnalyzableRepositoryFile) => file.path === "lf.ts",
      )?.lines,
    ).toBe(2);

    expect(
      result.files.find(
        (file: AnalyzableRepositoryFile) => file.path === "crlf.ts",
      )?.lines,
    ).toBe(2);

    expect(
      result.files.find(
        (file: AnalyzableRepositoryFile) => file.path === "single.ts",
      )?.lines,
    ).toBe(1);
  });

  it("handles empty supported files", () => {
    const archive = createZip({
      "repo/empty.ts": "",
    });

    const result = extractAnalyzableRepositoryFiles(archive);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].content).toBe("");
    expect(result.files[0].lines).toBe(0);
  });

  it("skips files larger than 5 MB", () => {
    const oversizedFile = Buffer.alloc(
      5 * 1024 * 1024 + 1,
      65,
    );

    const archive = createZip({
      "repo/src/app.ts": "const app = true;",
      "repo/src/large.ts": oversizedFile,
    });

    const result = extractAnalyzableRepositoryFiles(archive);

    expect(result.files).toHaveLength(1);
    expect(result.skippedFiles).toBe(1);
  });

  it("rejects archives exceeding the archive size limit", () => {
    const oversizedArchive = {
      length: 150 * 1024 * 1024 + 1,
    } as Buffer;

    expect(() =>
      extractAnalyzableRepositoryFiles(oversizedArchive),
    ).toThrow(
      "Repository archive is too large for the current analysis limit.",
    );
  });

  it("rejects archives containing more than 20,000 entries", () => {
    const zip = new AdmZip();

    for (let i = 0; i < 20001; i++) {
      zip.addFile(
        `repo/file-${i}.ts`,
        Buffer.from("const value = true;"),
      );
    }

    const archive = zip.toBuffer();

    expect(() =>
      extractAnalyzableRepositoryFiles(archive),
    ).toThrow();
  });
});

describe("analyzeRepositoryFiles", () => {
  it("calculates total files and lines", () => {
    const files = [
      createFile("app.ts", "TypeScript", "line 1\nline 2"),
      createFile("main.py", "Python", "line 1"),
    ];

    const result = analyzeRepositoryFiles(files, 2, 1024);

    expect(result.filesAnalyzed).toBe(2);
    expect(result.linesAnalyzed).toBe(3);
    expect(result.skippedFiles).toBe(2);
    expect(result.archiveBytes).toBe(1024);
  });

  it("groups files by language", () => {
    const files = [
      createFile("app.ts", "TypeScript", "a\nb"),
      createFile("utils.ts", "TypeScript", "a"),
      createFile("main.py", "Python", "a\nb\nc"),
    ];

    const result = analyzeRepositoryFiles(files, 0, 500);

    expect(result.languages).toEqual([
      { language: "TypeScript", files: 2, lines: 3 },
      { language: "Python", files: 1, lines: 3 },
    ]);
  });

  it("sorts languages by file count and then line count", () => {
    const files = [
      createFile("a.ts", "TypeScript", "a"),
      createFile("b.py", "Python", "a\nb\nc"),
      createFile("c.py", "Python", "a"),
      createFile("d.java", "Java", "a\nb"),
      createFile("e.java", "Java", "a"),
    ];

    const result = analyzeRepositoryFiles(files, 0, 100);

    expect(
      result.languages.map(
        (item: { language: string }) => item.language,
      ),
    ).toEqual([
      "Python",
      "Java",
      "TypeScript",
    ]);
  });

  it("handles an empty repository", () => {
    const result = analyzeRepositoryFiles([], 5, 0);

    expect(result).toEqual({
      filesAnalyzed: 0,
      linesAnalyzed: 0,
      skippedFiles: 5,
      archiveBytes: 0,
      languages: [],
    });
  });
});

describe("analyzeRepositoryArchive", () => {
  it("analyzes an entire ZIP archive", () => {
    const archive = createZip({
      "repo/src/app.ts": "const app = true;\nconst ready = true;",
      "repo/src/main.py": "print('hello')",
      "repo/.gitignore": "node_modules",
      "repo/image.png": "image data",
    });

    const result = analyzeRepositoryArchive(archive);

    expect(result.filesAnalyzed).toBe(2);
    expect(result.linesAnalyzed).toBe(3);
    expect(result.skippedFiles).toBe(2);
    expect(result.archiveBytes).toBe(archive.length);

    expect(result.languages).toEqual([
      { language: "TypeScript", files: 1, lines: 2 },
      { language: "Python", files: 1, lines: 1 },
    ]);
  });

  it("returns an empty summary for an empty ZIP archive", () => {
    const archive = createZip({});
    const result = analyzeRepositoryArchive(archive);

    expect(result.filesAnalyzed).toBe(0);
    expect(result.linesAnalyzed).toBe(0);
    expect(result.skippedFiles).toBe(0);
    expect(result.languages).toEqual([]);
  });
});
