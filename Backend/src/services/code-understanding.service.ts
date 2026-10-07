import { createHash } from "node:crypto";

import ts from "typescript";

import type { AnalyzableRepositoryFile } from "./repository-analyzer.service.js";

export type CodeSymbolKind =
  | "file"
  | "function"
  | "method"
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "variable";

export type CodeChunkContextType =
  | "FILE_CONTEXT"
  | "SYMBOL_CONTEXT";

export interface CodeUnderstandingImport {
  module: string;
  names: string[];
  isTypeOnly: boolean;
  line: number;
}

export interface CodeUnderstandingExport {
  name: string;
  line: number;
}

export interface CodeUnderstandingSymbol {
  name: string;
  kind: CodeSymbolKind;

  startLine: number;
  endLine: number;

  parentSymbol: string | null;

  parameters: string[];

  complexity: number;

  exported: boolean;
}

export interface CodeUnderstandingChunk {
  filePath: string;

  symbolName: string | null;

  contextType: CodeChunkContextType;

  /**
   * Controls whether this chunk should be sent
   * to the future embedding pipeline.
   *
   * FILE_CONTEXT:
   * false
   *
   * SYMBOL_CONTEXT:
   * true for meaningful code symbols such as
   * functions, methods, classes, interfaces,
   * types and enums.
   */
  embeddingEligible: boolean;

  startLine: number;
  endLine: number;

  language: string;

  content: string;

  tokenCount: number;

  hash: string;

  metadata: {
    kind: CodeSymbolKind;

    language: string;

    imports: CodeUnderstandingImport[];

    exports: CodeUnderstandingExport[];

    complexity: number;

    parameters: string[];

    parentSymbol: string | null;

    symbolCount: number;

    contextType: CodeChunkContextType;

    embeddingEligible: boolean;
  };
}

export interface CodeUnderstandingFile {
  filePath: string;

  language: string;

  lines: number;

  imports: CodeUnderstandingImport[];

  exports: CodeUnderstandingExport[];

  symbols: CodeUnderstandingSymbol[];

  complexity: number;

  chunks: CodeUnderstandingChunk[];
}

export interface CodeUnderstandingResult {
  files: CodeUnderstandingFile[];

  chunks: CodeUnderstandingChunk[];

  summary: {
    filesAnalyzed: number;

    chunksCreated: number;

    symbolsDetected: number;

    functionsDetected: number;

    classesDetected: number;

    interfacesDetected: number;

    importsDetected: number;

    exportsDetected: number;
  };
}

export function understandRepositoryCode(
  repositoryFiles: AnalyzableRepositoryFile[],
): CodeUnderstandingResult {
  const files: CodeUnderstandingFile[] = [];

  const chunks: CodeUnderstandingChunk[] = [];

  let symbolsDetected = 0;
  let functionsDetected = 0;
  let classesDetected = 0;
  let interfacesDetected = 0;
  let importsDetected = 0;
  let exportsDetected = 0;

  for (const repositoryFile of repositoryFiles) {
    const result =
      understandFile(repositoryFile);

    files.push(result);

    chunks.push(
      ...result.chunks,
    );

    symbolsDetected +=
      result.symbols.length;

    functionsDetected +=
      result.symbols.filter(
        (symbol) =>
          symbol.kind === "function" ||
          symbol.kind === "method",
      ).length;

    classesDetected +=
      result.symbols.filter(
        (symbol) =>
          symbol.kind === "class",
      ).length;

    interfacesDetected +=
      result.symbols.filter(
        (symbol) =>
          symbol.kind === "interface",
      ).length;

    importsDetected +=
      result.imports.length;

    exportsDetected +=
      result.exports.length;
  }

  return {
    files,
    chunks,

    summary: {
      filesAnalyzed: files.length,
      chunksCreated: chunks.length,
      symbolsDetected,
      functionsDetected,
      classesDetected,
      interfacesDetected,
      importsDetected,
      exportsDetected,
    },
  };
}

function understandFile(
  repositoryFile: AnalyzableRepositoryFile,
): CodeUnderstandingFile {
  const isTypeScript =
    repositoryFile.language ===
      "TypeScript" ||
    repositoryFile.path.endsWith(".ts") ||
    repositoryFile.path.endsWith(".tsx");

  const isJavaScript =
    repositoryFile.language ===
      "JavaScript" ||
    repositoryFile.path.endsWith(".js") ||
    repositoryFile.path.endsWith(".jsx");

  if (
    isTypeScript ||
    isJavaScript
  ) {
    return understandTypeScriptFile(
      repositoryFile,
    );
  }

  return createFallbackFileUnderstanding(
    repositoryFile,
  );
}

function understandTypeScriptFile(
  repositoryFile: AnalyzableRepositoryFile,
): CodeUnderstandingFile {
  const scriptKind =
    getScriptKind(
      repositoryFile.path,
    );

  const sourceFile =
    ts.createSourceFile(
      repositoryFile.path,
      repositoryFile.content,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    );

  const imports =
    extractImports(sourceFile);

  const exports =
    extractExports(sourceFile);

  const symbols: CodeUnderstandingSymbol[] =
    [];

  visitTopLevelNodes(
    sourceFile,
    sourceFile.statements,
    symbols,
  );

  const fileComplexity =
    calculateComplexity(
      sourceFile,
    );

  const chunks =
    createTypeScriptChunks(
      repositoryFile,
      sourceFile,
      imports,
      exports,
      symbols,
      fileComplexity,
    );

  return {
    filePath:
      repositoryFile.path,

    language:
      repositoryFile.language,

    lines:
      repositoryFile.lines,

    imports,

    exports,

    symbols,

    complexity:
      fileComplexity,

    chunks,
  };
}

function visitTopLevelNodes(
  sourceFile: ts.SourceFile,
  nodes: readonly ts.Node[],
  symbols: CodeUnderstandingSymbol[],
): void {
  for (const node of nodes) {
    extractNodeSymbol(
      sourceFile,
      node,
      symbols,
      null,
    );
  }
}

function extractNodeSymbol(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  symbols: CodeUnderstandingSymbol[],
  parentSymbol: string | null,
): void {
  if (
    ts.isFunctionDeclaration(node) &&
    node.name
  ) {
    symbols.push(
      createSymbol(
        sourceFile,
        node.name.text,
        "function",
        node,
        parentSymbol,
        getParameters(node),
      ),
    );

    return;
  }

  if (
    ts.isClassDeclaration(node)
  ) {
    const className =
      node.name?.text ||
      "AnonymousClass";

    symbols.push(
      createSymbol(
        sourceFile,
        className,
        "class",
        node,
        parentSymbol,
        [],
      ),
    );

    for (const member of node.members) {
      if (
        ts.isMethodDeclaration(
          member,
        ) &&
        member.name
      ) {
        symbols.push(
          createSymbol(
            sourceFile,
            getPropertyName(
              member.name,
            ),
            "method",
            member,
            className,
            getParameters(member),
          ),
        );
      }

      if (
        ts.isGetAccessorDeclaration(
          member,
        ) &&
        member.name
      ) {
        symbols.push(
          createSymbol(
            sourceFile,
            `get ${getPropertyName(
              member.name,
            )}`,
            "method",
            member,
            className,
            getParameters(member),
          ),
        );
      }

      if (
        ts.isSetAccessorDeclaration(
          member,
        ) &&
        member.name
      ) {
        symbols.push(
          createSymbol(
            sourceFile,
            `set ${getPropertyName(
              member.name,
            )}`,
            "method",
            member,
            className,
            getParameters(member),
          ),
        );
      }
    }

    return;
  }

  if (
    ts.isInterfaceDeclaration(node)
  ) {
    symbols.push(
      createSymbol(
        sourceFile,
        node.name.text,
        "interface",
        node,
        parentSymbol,
        [],
      ),
    );

    return;
  }

  if (
    ts.isTypeAliasDeclaration(node)
  ) {
    symbols.push(
      createSymbol(
        sourceFile,
        node.name.text,
        "type",
        node,
        parentSymbol,
        [],
      ),
    );

    return;
  }

  if (
    ts.isEnumDeclaration(node)
  ) {
    symbols.push(
      createSymbol(
        sourceFile,
        node.name.text,
        "enum",
        node,
        parentSymbol,
        [],
      ),
    );

    return;
  }

  if (
    ts.isVariableStatement(node)
  ) {
    for (
      const declaration of
        node.declarationList
          .declarations
    ) {
      if (
        ts.isIdentifier(
          declaration.name,
        )
      ) {
        symbols.push(
          createSymbol(
            sourceFile,
            declaration.name.text,
            "variable",
            node,
            parentSymbol,
            [],
          ),
        );
      }

      if (
        declaration.initializer &&
        (
          ts.isArrowFunction(
            declaration.initializer,
          ) ||
          ts.isFunctionExpression(
            declaration.initializer,
          )
        )
      ) {
        const functionNode =
          declaration.initializer;

        const name =
          declaration.name.getText(
            sourceFile,
          );

        symbols.push(
          createSymbol(
            sourceFile,
            name,
            "function",
            functionNode,
            parentSymbol,
            getParameters(
              functionNode,
            ),
          ),
        );
      }
    }
  }
}

function createSymbol(
  sourceFile: ts.SourceFile,
  name: string,
  kind: CodeSymbolKind,
  node: ts.Node,
  parentSymbol: string | null,
  parameters: string[],
): CodeUnderstandingSymbol {
  const startLine =
    getLineNumber(
      sourceFile,
      node.getStart(
        sourceFile,
      ),
    );

  const endLine =
    getLineNumber(
      sourceFile,
      node.getEnd(),
    );

  return {
    name,

    kind,

    startLine,

    endLine,

    parentSymbol,

    parameters,

    complexity:
      calculateComplexity(node),

    exported:
      hasExportModifier(node),
  };
}

function extractImports(
  sourceFile: ts.SourceFile,
): CodeUnderstandingImport[] {
  const imports: CodeUnderstandingImport[] =
    [];

  for (
    const statement of
      sourceFile.statements
  ) {
    if (
      !ts.isImportDeclaration(
        statement,
      )
    ) {
      continue;
    }

    const module =
      getStringLiteralValue(
        statement.moduleSpecifier,
      );

    if (!module) {
      continue;
    }

    const names: string[] = [];

    let isTypeOnly = false;

    const clause =
      statement.importClause;

    if (clause) {
      isTypeOnly =
        clause.isTypeOnly;

      if (clause.name) {
        names.push(
          clause.name.text,
        );
      }

      if (
        clause.namedBindings
      ) {
        if (
          ts.isNamespaceImport(
            clause.namedBindings,
          )
        ) {
          names.push(
            `* as ${clause.namedBindings.name.text}`,
          );
        } else {
          for (
            const element of
              clause
                .namedBindings
                .elements
          ) {
            names.push(
              element.name.text,
            );
          }
        }
      }
    }

    imports.push({
      module,

      names,

      isTypeOnly,

      line:
        getLineNumber(
          sourceFile,
          statement.getStart(
            sourceFile,
          ),
        ),
    });
  }

  return imports;
}

function extractExports(
  sourceFile: ts.SourceFile,
): CodeUnderstandingExport[] {
  const exports: CodeUnderstandingExport[] =
    [];

  for (
    const statement of
      sourceFile.statements
  ) {
    if (
      ts.isExportDeclaration(
        statement,
      )
    ) {
      if (
        statement.exportClause &&
        ts.isNamedExports(
          statement.exportClause,
        )
      ) {
        for (
          const element of
            statement
              .exportClause
              .elements
        ) {
          exports.push({
            name:
              element.name.text,

            line:
              getLineNumber(
                sourceFile,
                element.getStart(
                  sourceFile,
                ),
              ),
          });
        }
      }

      continue;
    }

    if (
      hasExportModifier(
        statement,
      )
    ) {
      const name =
        getNodeName(statement);

      if (name) {
        exports.push({
          name,

          line:
            getLineNumber(
              sourceFile,
              statement.getStart(
                sourceFile,
              ),
            ),
        });
      }
    }
  }

  return exports;
}

function createTypeScriptChunks(
  repositoryFile: AnalyzableRepositoryFile,
  sourceFile: ts.SourceFile,
  imports: CodeUnderstandingImport[],
  exports: CodeUnderstandingExport[],
  symbols: CodeUnderstandingSymbol[],
  fileComplexity: number,
): CodeUnderstandingChunk[] {
  const chunks: CodeUnderstandingChunk[] =
    [];

  /*
   * FILE_CONTEXT
   *
   * This chunk represents the entire file.
   * It is useful for repository understanding,
   * architecture analysis and contextual lookup,
   * but is intentionally NOT embedded by default.
   */
  chunks.push(
    createChunk(
      repositoryFile,
      null,
      "FILE_CONTEXT",
      false,
      1,
      repositoryFile.lines,
      repositoryFile.content,
      {
        kind: "file",

        language:
          repositoryFile.language,

        imports,

        exports,

        complexity:
          fileComplexity,

        parameters: [],

        parentSymbol: null,

        symbolCount:
          symbols.length,
      },
    ),
  );

  /*
   * SYMBOL_CONTEXT
   *
   * Symbol chunks are the primary candidates
   * for the future embedding/RAG pipeline.
   */
  for (const symbol of symbols) {
    const content =
      getLines(
        repositoryFile.content,
        symbol.startLine,
        symbol.endLine,
      );

    const embeddingEligible =
      isSymbolEmbeddingEligible(
        symbol,
      );

    chunks.push(
      createChunk(
        repositoryFile,
        symbol.name,
        "SYMBOL_CONTEXT",
        embeddingEligible,
        symbol.startLine,
        symbol.endLine,
        content,
        {
          kind:
            symbol.kind,

          language:
            repositoryFile.language,

          imports,

          exports,

          complexity:
            symbol.complexity,

          parameters:
            symbol.parameters,

          parentSymbol:
            symbol.parentSymbol,

          symbolCount: 1,
        },
      ),
    );
  }

  return chunks;
}

function createFallbackFileUnderstanding(
  repositoryFile: AnalyzableRepositoryFile,
): CodeUnderstandingFile {
  /*
   * Non-TypeScript/JavaScript files currently
   * receive only FILE_CONTEXT.
   *
   * This keeps the engine useful immediately
   * while leaving room for language-specific
   * parsers later.
   */
  const chunk =
    createChunk(
      repositoryFile,
      null,
      "FILE_CONTEXT",
      false,
      1,
      repositoryFile.lines,
      repositoryFile.content,
      {
        kind: "file",

        language:
          repositoryFile.language,

        imports: [],

        exports: [],

        complexity: 1,

        parameters: [],

        parentSymbol: null,

        symbolCount: 0,
      },
    );

  return {
    filePath:
      repositoryFile.path,

    language:
      repositoryFile.language,

    lines:
      repositoryFile.lines,

    imports: [],

    exports: [],

    symbols: [],

    complexity: 1,

    chunks: [chunk],
  };
}

function createChunk(
  repositoryFile: AnalyzableRepositoryFile,
  symbolName: string | null,
  contextType: CodeChunkContextType,
  embeddingEligible: boolean,
  startLine: number,
  endLine: number,
  content: string,
  metadata: Omit<
    CodeUnderstandingChunk["metadata"],
    "contextType" | "embeddingEligible"
  >,
): CodeUnderstandingChunk {
  const normalizedContent =
    content.trim();

  const enrichedMetadata = {
    ...metadata,

    contextType,

    embeddingEligible,
  };

  return {
    filePath:
      repositoryFile.path,

    symbolName,

    contextType,

    embeddingEligible,

    startLine,

    endLine,

    language:
      repositoryFile.language,

    content:
      normalizedContent,

    tokenCount:
      estimateTokenCount(
        normalizedContent,
      ),

    hash:
      createHash("sha256")
        .update(normalizedContent)
        .digest("hex"),

    metadata:
      enrichedMetadata,
  };
}

/**
 * Determines which symbol types are useful
 * semantic units for embedding.
 *
 * Embedded:
 * - functions
 * - methods
 * - classes
 * - interfaces
 * - types
 * - enums
 *
 * Not embedded:
 * - variables
 *
 * Variables are intentionally excluded because
 * large repositories can contain many tiny
 * constants/variables that create noisy,
 * low-value embeddings.
 */
function isSymbolEmbeddingEligible(
  symbol: CodeUnderstandingSymbol,
): boolean {
  switch (symbol.kind) {
    case "function":
    case "method":
    case "class":
    case "interface":
    case "type":
    case "enum":
      return true;

    case "variable":
    case "file":
    default:
      return false;
  }
}

function getScriptKind(
  filePath: string,
): ts.ScriptKind {
  const lower =
    filePath.toLowerCase();

  if (
    lower.endsWith(".tsx")
  ) {
    return ts.ScriptKind.TSX;
  }

  if (
    lower.endsWith(".jsx")
  ) {
    return ts.ScriptKind.JSX;
  }

  if (
    lower.endsWith(".js")
  ) {
    return ts.ScriptKind.JS;
  }

  return ts.ScriptKind.TS;
}

function getParameters(
  node:
    | ts.FunctionDeclaration
    | ts.MethodDeclaration
    | ts.ArrowFunction
    | ts.FunctionExpression
    | ts.ConstructorDeclaration
    | ts.GetAccessorDeclaration
    | ts.SetAccessorDeclaration,
): string[] {
  return node.parameters.map(
    (parameter) =>
      parameter.name.getText(),
  );
}

function getPropertyName(
  name: ts.PropertyName,
): string {
  if (
    ts.isIdentifier(name)
  ) {
    return name.text;
  }

  if (
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }

  return name.getText();
}

function getNodeName(
  node: ts.Node,
): string | null {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node)
  ) {
    return (
      node.name?.text ??
      null
    );
  }

  if (
    ts.isVariableStatement(node)
  ) {
    const first =
      node.declarationList
        .declarations[0];

    return first &&
      ts.isIdentifier(
        first.name,
      )
      ? first.name.text
      : null;
  }

  return null;
}

/**
 * TypeScript 7 no longer exposes `modifiers`
 * directly on the base `Node` type.
 *
 * `ts.canHaveModifiers()` narrows the node to
 * modifier-capable nodes, after which
 * `ts.getModifiers()` safely retrieves them.
 */
function hasExportModifier(
  node: ts.Node,
): boolean {
  if (
    !ts.canHaveModifiers(node)
  ) {
    return false;
  }

  const modifiers =
    ts.getModifiers(node);

  if (!modifiers) {
    return false;
  }

  return modifiers.some(
    (modifier) =>
      modifier.kind ===
      ts.SyntaxKind.ExportKeyword,
  );
}

function getStringLiteralValue(
  node: ts.Expression,
): string | null {
  if (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(
      node,
    )
  ) {
    return node.text;
  }

  return null;
}

function getLineNumber(
  sourceFile: ts.SourceFile,
  position: number,
): number {
  return (
    sourceFile.getLineAndCharacterOfPosition(
      position,
    ).line + 1
  );
}

function getLines(
  content: string,
  startLine: number,
  endLine: number,
): string {
  return content
    .split(/\r?\n/)
    .slice(
      startLine - 1,
      endLine,
    )
    .join("\n");
}

function estimateTokenCount(
  content: string,
): number {
  if (!content.trim()) {
    return 0;
  }

  /*
   * This is intentionally an estimate.
   *
   * Actual tokenizer counts depend on the
   * embedding/LLM model used later.
   */
  return Math.max(
    1,
    Math.ceil(
      content.length / 4,
    ),
  );
}

function calculateComplexity(
  node: ts.Node,
): number {
  let complexity = 1;

  const visit = (
    current: ts.Node,
  ) => {
    switch (current.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.CaseClause:
      case ts.SyntaxKind.CatchClause:
        complexity++;
        break;

      case ts.SyntaxKind.ConditionalExpression:
        complexity++;
        break;

      case ts.SyntaxKind.BinaryExpression: {
        const binary =
          current as ts.BinaryExpression;

        if (
          binary.operatorToken.kind ===
            ts.SyntaxKind.AmpersandAmpersandToken ||
          binary.operatorToken.kind ===
            ts.SyntaxKind.BarBarToken ||
          binary.operatorToken.kind ===
            ts.SyntaxKind.QuestionQuestionToken
        ) {
          complexity++;
        }

        break;
      }
    }

    ts.forEachChild(
      current,
      visit,
    );
  };

  ts.forEachChild(
    node,
    visit,
  );

  return complexity;
}