import "dotenv/config";
import { reviewFindingWithAI } from "../services/ai-code-review.service.js";

async function main() {
  const result = await reviewFindingWithAI({
    filePath: "src/example.ts",
    language: "typescript",
    code: `
function getUser(id: any) {
  console.log("Fetching user");
  return database.query("SELECT * FROM users WHERE id = " + id);
}
`,
    finding: {
      severity: "MEDIUM",
      category: "CODE_QUALITY",
      title: "Explicit any type",
      description:
        "The function uses the explicit any type, which removes TypeScript type safety.",
      impact:
        "Using any can hide type errors and make the code harder to maintain.",
      recommendation:
        "Replace any with a specific type that represents the expected user ID.",
      lineStart: 2,
      lineEnd: 2,
      functionName: "getUser",
      rule: "TS-ANY",
      evidence: "id: any",
    },
  });

  console.log("\n=== AI REVIEW RESULT ===\n");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("\nAI TEST FAILED:");
  console.error(error);
  process.exit(1);
});