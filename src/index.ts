#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { scaffoldCleanProject, addModule, ScaffoldResult } from "./scaffolder.js";

const server = new McpServer({
  name: "mcp-scaffold-al",
  version: "1.0.0",
});

function formatResult(titulo: string, result: ScaffoldResult): string {
  return `✅ ${titulo}: ${result.targetPath}

📁 Carpetas creadas (${result.createdDirectories.length}):
${result.createdDirectories.map((d) => `  - ${d}`).join("\n")}

📄 Archivos generados (${result.createdFiles.length}):
${result.createdFiles.map((f) => `  - ${f}`).join("\n")}

🚀 Instrucciones:
${result.instructions.join("\n")}
`;
}

// Herramienta principal: Generación del monorepo con Arquitectura Limpia y contexto para IA
server.tool(
  "scaffold_clean_project",
  "Crea automáticamente un monorepo con Arquitectura Limpia (Shared/contracts, Backend Deno 2.x con shared-kernel, core, database, platform, composition, apps/api Hono y apps/mcp-server, Frontend Next.js 16, Docs y Http), con CLAUDE.md, GEMINI.md, context/, LAYER.md por capa y un módulo inicial con su MODULE.md, según arquitectura_limpia.md.",
  {
    targetPath: z
      .string()
      .describe("Ruta absoluta o relativa del directorio donde se creará el proyecto"),
    projectName: z
      .string()
      .optional()
      .describe("Nombre del proyecto (por defecto: nombre del directorio destino)"),
    scope: z
      .string()
      .optional()
      .describe("Scope de los paquetes (@<scope>/core, @<scope>/contracts...). Por defecto: projectName en minúsculas"),
    initialModule: z
      .string()
      .optional()
      .describe("Nombre del módulo inicial a generar (ej. productos, clientes, item). Por defecto: 'item'"),
    port: z
      .number()
      .optional()
      .describe("Puerto de escucha para la API HTTP (por defecto: 8001)"),
    dbHost: z
      .string()
      .optional()
      .describe("Host de la base de datos (por defecto: localhost)"),
    dbPort: z
      .number()
      .optional()
      .describe("Puerto de la base de datos (por defecto: 3306)"),
    dbUser: z
      .string()
      .optional()
      .describe("Usuario de la base de datos (por defecto: root)"),
    dbPassword: z
      .string()
      .optional()
      .describe("Contraseña de la base de datos"),
    dbName: z
      .string()
      .optional()
      .describe("Nombre de la base de datos"),
  },
  async (args) => {
    try {
      const result = await scaffoldCleanProject(args);
      return {
        content: [
          {
            type: "text",
            text: `${formatResult("Proyecto con Arquitectura Limpia generado exitosamente en", result)}
🌟 Archivos de Contexto creados:
  - CLAUDE.md y GEMINI.md (Orquestadores globales de contexto)
  - context/rules_architecture.md (Matriz de dependencias y 7 Reglas de Oro)
  - context/ai_development_workflow.md (7 pasos para agregar funcionalidad)
  - LAYER.md en cada capa y MODULE.md en el módulo inicial
`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `❌ Error al generar el proyecto: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Herramienta: agregar un módulo en todas las capas (7 pasos de la sección 5)
server.tool(
  "add_module",
  "Agrega un módulo nuevo a un proyecto generado con scaffold_clean_project siguiendo los 7 pasos de arquitectura_limpia.md: contrato Zod, dominio, casos de uso + test, Drizzle (schema, mapper, repositorio), registro en createContainer, rutas Hono + tool MCP, feature de Frontend, Http/<modulo>.http, MODULE.md y registro en CLAUDE.md/GEMINI.md.",
  {
    targetPath: z.string().describe("Ruta del proyecto generado con scaffold_clean_project"),
    moduleName: z.string().describe("Nombre del módulo en plural y minúsculas (ej. productos, clientes)"),
  },
  async (args) => {
    try {
      const result = await addModule(args);
      return {
        content: [
          {
            type: "text",
            text: formatResult(`Módulo "${args.moduleName}" agregado en`, result),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `❌ Error al agregar el módulo: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Herramienta secundaria: Inspección de cumplimiento arquitectónico
server.tool(
  "inspect_project_structure",
  "Verifica si un directorio cumple con la estructura de arquitectura_limpia.md y cuenta con los archivos de contexto para IA (CLAUDE.md, GEMINI.md, context/ y LAYER.md por capa).",
  {
    targetPath: z.string().describe("Ruta del proyecto a auditar"),
  },
  async ({ targetPath }) => {
    const fullPath = path.resolve(targetPath);
    const requiredFiles = [
      "CLAUDE.md",
      "GEMINI.md",
      "context/rules_architecture.md",
      "context/ai_development_workflow.md",
      ".env.example",
      "Shared/contracts/LAYER.md",
      "Shared/contracts/package.json",
      "Shared/contracts/src/index.ts",
      "Shared/contracts/src/permissions.ts",
      "Shared/contracts/src/roles.ts",
      "Backend/deno.json",
      "Backend/packages/shared-kernel/LAYER.md",
      "Backend/packages/shared-kernel/src/result.ts",
      "Backend/packages/shared-kernel/src/domain-error.ts",
      "Backend/packages/shared-kernel/src/pagination.ts",
      "Backend/packages/core/LAYER.md",
      "Backend/packages/core/src/index.ts",
      "Backend/packages/core/src/shared/application/ports/unit-of-work.port.ts",
      "Backend/packages/core/src/modules/auditoria/application/ports/auditor.port.ts",
      "Backend/packages/core/src/modules/auditoria/domain/services/sanitizar-detalles.ts",
      "Backend/packages/database/LAYER.md",
      "Backend/packages/database/src/connection.ts",
      "Backend/packages/database/src/unit-of-work.ts",
      "Backend/packages/platform/LAYER.md",
      "Backend/packages/platform/src/index.ts",
      "Backend/packages/composition/LAYER.md",
      "Backend/packages/composition/src/container.ts",
      "Backend/apps/api/LAYER.md",
      "Backend/apps/api/main.ts",
      "Backend/apps/api/src/http/safe-handler.ts",
      "Backend/apps/api/src/http/present-result.ts",
      "Backend/apps/mcp-server/LAYER.md",
      "Backend/apps/mcp-server/main.ts",
      "Backend/apps/mcp-server/src/tool-gateway.ts",
      "Frontend/LAYER.md",
      "Frontend/package.json",
      "Frontend/src/lib/http-client.ts",
      "Docs/ddl.sql",
      "Http/health.http",
    ];

    const missing: string[] = [];
    const present: string[] = [];

    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(fullPath, file));
        present.push(file);
      } catch {
        missing.push(file);
      }
    }

    const compliant = missing.length === 0;

    return {
      content: [
        {
          type: "text",
          text: `🔍 Auditoría de Arquitectura para: ${fullPath}

Estado: ${compliant ? "✅ Totalmente conforme" : "⚠️ Faltan archivos o capas"}
Cumplimiento: ${present.length}/${requiredFiles.length} (${Math.round((present.length / requiredFiles.length) * 100)}%)

Archivos encontrados (${present.length}):
${present.map((f) => `  ✓ ${f}`).join("\n")}

${missing.length > 0 ? `Archivos faltantes (${missing.length}):\n${missing.map((f) => `  ✗ ${f}`).join("\n")}` : ""}`,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-scaffold-al server listening on stdio");
}

main().catch((err) => {
  console.error("Fatal error running MCP server:", err);
  process.exit(1);
});
