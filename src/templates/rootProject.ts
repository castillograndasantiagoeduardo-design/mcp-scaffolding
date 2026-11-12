/**
 * Plantillas para los archivos raíz del monorepo:
 * Backend/deno.json (workspace Deno 2.x), .env.example, .gitignore
 */

export interface ProjectConfig {
  projectName: string;
  scope: string;
  port: number;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword?: string;
  dbName: string;
}

export function generateBackendDenoJson(config: ProjectConfig): string {
  const s = config.scope;
  return JSON.stringify(
    {
      workspace: [
        "./packages/shared-kernel",
        "./packages/core",
        "./packages/database",
        "./packages/platform",
        "./packages/composition",
        "./apps/api",
        "./apps/mcp-server",
      ],
      imports: {
        [`@${s}/contracts`]: "../Shared/contracts/src/index.ts",
        zod: "npm:zod@^3.24.2",
        hono: "jsr:@hono/hono@^4.6.0",
        "hono/cors": "jsr:@hono/hono@^4.6.0/cors",
        "drizzle-orm": "npm:drizzle-orm@^0.38.0",
        "drizzle-orm/": "npm:/drizzle-orm@^0.38.0/",
        "mysql2/promise": "npm:mysql2@^3.11.0/promise",
        jose: "npm:jose@^5.9.0",
        "@modelcontextprotocol/sdk/": "npm:/@modelcontextprotocol/sdk@^1.6.1/",
        "@std/assert": "jsr:@std/assert@^1.0.0",
      },
      tasks: {
        "dev:api": "cd apps/api && deno task dev",
        "dev:mcp": "cd apps/mcp-server && deno task dev",
        test: "deno test packages/core/tests",
        check: "deno check apps/api/main.ts apps/mcp-server/main.ts",
      },
      compilerOptions: {
        strict: true,
      },
    },
    null,
    2
  ) + "\n";
}

export function generateEnvExample(config: ProjectConfig): string {
  return `# Servidor HTTP (Backend/apps/api)
PORT=${config.port}
FRONTEND_URL=http://localhost:3000

# Seguridad (JWT HS256 - @${config.scope}/platform)
JWT_SECRET=clave_secreta_super_segura_aqui_cambiar_en_produccion
JWT_EXPIRATION=15m

# Base de Datos MySQL 8 (@${config.scope}/database)
DB_HOST=${config.dbHost}
DB_PORT=${config.dbPort}
DB_USER=${config.dbUser}
DB_PASSWORD=${config.dbPassword || ""}
DB_NAME=${config.dbName}

# Servidor MCP (Backend/apps/mcp-server): token JWT del usuario en sesión
MCP_ACCESS_TOKEN=

# Frontend (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:${config.port}
`;
}

export function generateGitignore(): string {
  return `# Variables de entorno privadas
.env
.env.local

# Deno
.deno/
deno.lock

# Node / Next.js
node_modules/
.next/
out/
next-env.d.ts

# Logs y Temporales
*.log
npm-debug.log*

# SO
.DS_Store
Thumbs.db
`;
}
