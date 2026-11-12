import fs from "node:fs/promises";
import path from "node:path";
import {
  ProjectConfig,
  generateBackendDenoJson,
  generateEnvExample,
  generateGitignore,
} from "./templates/rootProject.js";
import {
  generatePackageDenoJson,
  generateResultTs,
  generateDomainErrorTs,
  generatePaginationTs,
  generateSharedKernelIndexTs,
  generateContractsPackageJson,
  generatePermissionsTs,
  generateRolesTs,
  generateAuditoriaCatalogoTs,
  generateMcpToolsCatalogoTs,
  generateContractsIndexTs,
  generateAuditorPortTs,
  generateSanitizarDetallesTs,
  generateUnitOfWorkPortTs,
  generateTokenServicePortTs,
  generateMcpToolLoggerPortTs,
  generateCoreIndexTs,
  generateConnectionTs,
  generateAuditoriaSchemaTs,
  generateMcpToolsSchemaTs,
  generateSchemaIndexTs,
  generateMySqlAuditorTs,
  generateMySqlMcpToolLoggerTs,
  generateUnitOfWorkTs,
  generateDatabaseIndexTs,
  generateJwtTokenServiceTs,
  generatePlatformIndexTs,
  generateCompositionConfigTs,
  generateContainerTs,
  generateCompositionIndexTs,
  generateApiMainTs,
  generateApiTypesTs,
  generateSafeHandlerTs,
  generatePresentResultTs,
  generateAuthMiddlewareTs,
  generateApiRoutesIndexTs,
  generateMcpMainTs,
  generateToolGatewayTs,
  generateMcpToolsIndexTs,
  generateFrontendPackageJson,
  generateFrontendTsconfig,
  generateNextConfig,
  generatePostcssConfig,
  generateGlobalsCss,
  generateRootLayoutTsx,
  generateRootPageTsx,
  generateRouteGroupLayoutTsx,
  generateHttpClientTs,
  generateFormattersTs,
  generateHealthHttp,
  generateDocsReadme,
  generateDdlSql,
} from "./templates/layers.js";
import {
  ModuleNames,
  moduleNames,
  generateModuleSchemaTs,
  generateEntityTs,
  generateValueObjectTs,
  generateErrorsTs,
  generateDomainServiceTs,
  generateRepositoryPortTs,
  generateModulePortsTs,
  generateCrearUseCaseTs,
  generateListarUseCaseTs,
  generateModuleIndexTs,
  generateUseCaseTestTs,
  generateDrizzleSchemaTs,
  generateMapperTs,
  generateMySqlRepositoryTs,
  generateModuleDdl,
  generateApiControllerTs,
  generateApiRoutesTs,
  generateMcpModuleToolsTs,
  generateFeatureTypesTs,
  generateFeatureApiTs,
  generateFeatureHookTs,
  generateFeatureComponentTsx,
  generatePanelPageTsx,
  generateModuleHttp,
} from "./templates/modules.js";
import {
  generateAgentContextMd,
  generateModuleListEntry,
  generateRulesArchitectureMd,
  generateAiWorkflowMd,
  getLayers,
  generateLayerMd,
  generateModuleMd,
} from "./templates/aiContext.js";

export interface ScaffoldOptions {
  targetPath: string;
  projectName?: string;
  scope?: string;
  initialModule?: string;
  port?: number;
  dbHost?: string;
  dbPort?: number;
  dbUser?: string;
  dbPassword?: string;
  dbName?: string;
}

export interface AddModuleOptions {
  targetPath: string;
  moduleName: string;
}

export interface ScaffoldResult {
  success: boolean;
  targetPath: string;
  projectName: string;
  createdFiles: string[];
  createdDirectories: string[];
  instructions: string[];
}

interface Writer {
  targetDir: string;
  createdFiles: string[];
  createdDirectories: string[];
  ensureDir(dirPath: string): Promise<void>;
  writeFile(filePath: string, content: string): Promise<void>;
  insertBeforeMarker(filePath: string, marker: string, lines: string[]): Promise<void>;
}

function createWriter(targetDir: string): Writer {
  const createdDirectories: string[] = [];
  const createdFiles: string[] = [];

  return {
    targetDir,
    createdFiles,
    createdDirectories,

    // Función auxiliar para asegurar directorios
    async ensureDir(dirPath: string) {
      await fs.mkdir(dirPath, { recursive: true });
      createdDirectories.push(path.relative(targetDir, dirPath) || ".");
    },

    // Función auxiliar para escribir archivos
    async writeFile(filePath: string, content: string) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf-8");
      createdFiles.push(path.relative(targetDir, filePath));
    },

    // Función auxiliar para registrar líneas antes de un marcador "@scaffold:*" (respeta la indentación)
    async insertBeforeMarker(filePath: string, marker: string, lines: string[]) {
      const content = await fs.readFile(filePath, "utf-8");
      const rows = content.split("\n");
      const index = rows.findIndex((r) => r.includes(marker));
      if (index === -1) {
        throw new Error(`No se encontró el marcador "${marker}" en ${path.relative(targetDir, filePath)}`);
      }
      const indent = rows[index].match(/^\s*/)?.[0] ?? "";
      rows.splice(index, 0, ...lines.map((l) => indent + l));
      await fs.writeFile(filePath, rows.join("\n"), "utf-8");
      const rel = `${path.relative(targetDir, filePath)} (actualizado)`;
      if (!createdFiles.includes(rel)) createdFiles.push(rel);
    },
  };
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function scaffoldCleanProject(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const targetDir = path.resolve(options.targetPath);
  const projectName = options.projectName || path.basename(targetDir) || "CleanProject";
  const scope = (options.scope || projectName).toLowerCase().replace(/^@/, "").replace(/[^a-z0-9-]/g, "-");
  const initialModule = options.initialModule || "item";

  const config: ProjectConfig = {
    projectName,
    scope,
    port: options.port || 8001,
    dbHost: options.dbHost || "localhost",
    dbPort: options.dbPort || 3306,
    dbUser: options.dbUser || "root",
    dbPassword: options.dbPassword || "",
    dbName: options.dbName || `${projectName.toLowerCase().replace(/[^a-z0-9_]/g, "_")}_db`,
  };

  const w = createWriter(targetDir);
  const { ensureDir, writeFile } = w;

  const shared = path.join(targetDir, "Shared", "contracts");
  const backend = path.join(targetDir, "Backend");
  const sk = path.join(backend, "packages", "shared-kernel");
  const core = path.join(backend, "packages", "core");
  const database = path.join(backend, "packages", "database");
  const platform = path.join(backend, "packages", "platform");
  const composition = path.join(backend, "packages", "composition");
  const api = path.join(backend, "apps", "api");
  const mcp = path.join(backend, "apps", "mcp-server");
  const frontend = path.join(targetDir, "Frontend");

  // 1. Crear directorios principales (sección 2 de arquitectura_limpia.md)
  await ensureDir(targetDir);
  await ensureDir(path.join(targetDir, "context"));
  await ensureDir(path.join(shared, "src"));
  await ensureDir(path.join(sk, "src"));
  await ensureDir(path.join(core, "src", "modules"));
  await ensureDir(path.join(core, "tests"));
  await ensureDir(path.join(database, "src", "schema"));
  await ensureDir(path.join(database, "src", "repositories"));
  await ensureDir(path.join(database, "src", "mappers"));
  await ensureDir(path.join(platform, "src"));
  await ensureDir(path.join(composition, "src"));
  await ensureDir(path.join(api, "src"));
  await ensureDir(path.join(mcp, "src"));
  await ensureDir(path.join(frontend, "src", "app"));
  await ensureDir(path.join(frontend, "src", "features"));
  await ensureDir(path.join(frontend, "src", "components", "ui"));
  await ensureDir(path.join(frontend, "src", "lib"));
  await ensureDir(path.join(targetDir, "Docs"));
  await ensureDir(path.join(targetDir, "Http"));

  // 2. Archivos de Contexto para IA (Claude / Gemini)
  await writeFile(path.join(targetDir, "CLAUDE.md"), generateAgentContextMd(config, "Claude"));
  await writeFile(path.join(targetDir, "GEMINI.md"), generateAgentContextMd(config, "Gemini"));
  await writeFile(path.join(targetDir, "context", "rules_architecture.md"), generateRulesArchitectureMd(config));
  await writeFile(path.join(targetDir, "context", "ai_development_workflow.md"), generateAiWorkflowMd(config));

  // 3. Archivos raíz y workspace Deno
  await writeFile(path.join(targetDir, ".env.example"), generateEnvExample(config));
  await writeFile(path.join(targetDir, ".gitignore"), generateGitignore());
  await writeFile(path.join(backend, "deno.json"), generateBackendDenoJson(config));

  // 4. Capa 0: shared-kernel
  await writeFile(path.join(sk, "deno.json"), generatePackageDenoJson(config, "shared-kernel"));
  await writeFile(path.join(sk, "src", "result.ts"), generateResultTs());
  await writeFile(path.join(sk, "src", "domain-error.ts"), generateDomainErrorTs());
  await writeFile(path.join(sk, "src", "pagination.ts"), generatePaginationTs());
  await writeFile(path.join(sk, "src", "index.ts"), generateSharedKernelIndexTs());

  // 5. Capa 1: Shared/contracts
  await writeFile(path.join(shared, "package.json"), generateContractsPackageJson(config));
  await writeFile(path.join(shared, "src", "permissions.ts"), generatePermissionsTs());
  await writeFile(path.join(shared, "src", "roles.ts"), generateRolesTs());
  await writeFile(path.join(shared, "src", "auditoria.catalogo.ts"), generateAuditoriaCatalogoTs());
  await writeFile(path.join(shared, "src", "mcp-tools.ts"), generateMcpToolsCatalogoTs());
  await writeFile(path.join(shared, "src", "index.ts"), generateContractsIndexTs());

  // 6. Capa 2: core (puertos transversales)
  await writeFile(path.join(core, "deno.json"), generatePackageDenoJson(config, "core"));
  await writeFile(
    path.join(core, "src", "shared", "application", "ports", "unit-of-work.port.ts"),
    generateUnitOfWorkPortTs()
  );
  await writeFile(
    path.join(core, "src", "modules", "auditoria", "application", "ports", "auditor.port.ts"),
    generateAuditorPortTs()
  );
  await writeFile(
    path.join(core, "src", "modules", "auditoria", "domain", "services", "sanitizar-detalles.ts"),
    generateSanitizarDetallesTs()
  );
  await writeFile(
    path.join(core, "src", "modules", "autenticacion", "application", "ports", "token-service.port.ts"),
    generateTokenServicePortTs(config)
  );
  await writeFile(
    path.join(core, "src", "modules", "mcp-audit", "application", "ports", "mcp-tool-logger.port.ts"),
    generateMcpToolLoggerPortTs()
  );
  await writeFile(path.join(core, "src", "index.ts"), generateCoreIndexTs());

  // 7. Capa 3A: database
  await writeFile(path.join(database, "deno.json"), generatePackageDenoJson(config, "database"));
  await writeFile(path.join(database, "src", "connection.ts"), generateConnectionTs());
  await writeFile(path.join(database, "src", "unit-of-work.ts"), generateUnitOfWorkTs(config));
  await writeFile(path.join(database, "src", "schema", "auditoria.schema.ts"), generateAuditoriaSchemaTs());
  await writeFile(path.join(database, "src", "schema", "mcp-tools.schema.ts"), generateMcpToolsSchemaTs());
  await writeFile(path.join(database, "src", "schema", "index.ts"), generateSchemaIndexTs());
  await writeFile(path.join(database, "src", "repositories", "mysql-auditor.ts"), generateMySqlAuditorTs(config));
  await writeFile(
    path.join(database, "src", "repositories", "mysql-mcp-tool-logger.ts"),
    generateMySqlMcpToolLoggerTs(config)
  );
  await writeFile(path.join(database, "src", "index.ts"), generateDatabaseIndexTs());

  // 8. Capa 3B: platform
  await writeFile(path.join(platform, "deno.json"), generatePackageDenoJson(config, "platform"));
  await writeFile(path.join(platform, "src", "jwt-token-service.ts"), generateJwtTokenServiceTs(config));
  await writeFile(path.join(platform, "src", "index.ts"), generatePlatformIndexTs());

  // 9. Capa 4: composition
  await writeFile(path.join(composition, "deno.json"), generatePackageDenoJson(config, "composition"));
  await writeFile(path.join(composition, "src", "config.ts"), generateCompositionConfigTs(config));
  await writeFile(path.join(composition, "src", "container.ts"), generateContainerTs(config));
  await writeFile(path.join(composition, "src", "index.ts"), generateCompositionIndexTs());

  // 10. Capa 5A: apps/api
  await writeFile(
    path.join(api, "deno.json"),
    generatePackageDenoJson(config, "api", {
      dev: "deno run --watch -A --env-file=../../../.env main.ts",
      start: "deno run -A --env-file=../../../.env main.ts",
    })
  );
  await writeFile(path.join(api, "main.ts"), generateApiMainTs(config));
  await writeFile(path.join(api, "src", "types.ts"), generateApiTypesTs(config));
  await writeFile(path.join(api, "src", "http", "safe-handler.ts"), generateSafeHandlerTs());
  await writeFile(path.join(api, "src", "http", "present-result.ts"), generatePresentResultTs(config));
  await writeFile(path.join(api, "src", "middlewares", "auth.ts"), generateAuthMiddlewareTs(config));
  await writeFile(path.join(api, "src", "routes", "index.ts"), generateApiRoutesIndexTs());

  // 11. Capa 5B: apps/mcp-server
  await writeFile(
    path.join(mcp, "deno.json"),
    generatePackageDenoJson(config, "mcp-server", {
      dev: "deno run -A --env-file=../../../.env main.ts",
      start: "deno run -A --env-file=../../../.env main.ts",
    })
  );
  await writeFile(path.join(mcp, "main.ts"), generateMcpMainTs(config));
  await writeFile(path.join(mcp, "src", "tool-gateway.ts"), generateToolGatewayTs(config));
  await writeFile(path.join(mcp, "src", "tools", "index.ts"), generateMcpToolsIndexTs());

  // 12. Capa 6: Frontend (Next.js 16 + Tailwind v4)
  await writeFile(path.join(frontend, "package.json"), generateFrontendPackageJson(config));
  await writeFile(path.join(frontend, "tsconfig.json"), generateFrontendTsconfig());
  await writeFile(path.join(frontend, "next.config.ts"), generateNextConfig(config));
  await writeFile(path.join(frontend, "postcss.config.mjs"), generatePostcssConfig());
  await writeFile(path.join(frontend, "src", "app", "globals.css"), generateGlobalsCss());
  await writeFile(path.join(frontend, "src", "app", "layout.tsx"), generateRootLayoutTsx(config));
  await writeFile(path.join(frontend, "src", "app", "page.tsx"), generateRootPageTsx(config));
  for (const grupo of ["(autenticacion)", "(panel)", "(punto-de-venta)"]) {
    await writeFile(path.join(frontend, "src", "app", grupo, "layout.tsx"), generateRouteGroupLayoutTsx(grupo));
  }
  await writeFile(path.join(frontend, "src", "lib", "http-client.ts"), generateHttpClientTs(config));
  await writeFile(path.join(frontend, "src", "lib", "formatters.ts"), generateFormattersTs());

  // 13. Docs y Http
  await writeFile(path.join(targetDir, "Docs", "README.md"), generateDocsReadme(config));
  await writeFile(path.join(targetDir, "Docs", "ddl.sql"), generateDdlSql(config));
  await writeFile(path.join(targetDir, "Http", "health.http"), generateHealthHttp(config));

  // 14. LAYER.md en cada capa
  for (const layer of getLayers(config)) {
    await writeFile(path.join(targetDir, layer.dir, "LAYER.md"), generateLayerMd(layer));
  }

  // 15. Módulo inicial (misma lógica que add_module)
  const n = moduleNames(initialModule);
  await createModule(w, config.scope, config.port, n);

  return {
    success: true,
    targetPath: targetDir,
    projectName,
    createdFiles: w.createdFiles,
    createdDirectories: w.createdDirectories,
    instructions: [
      `1. Abre la terminal en: ${targetDir}`,
      "2. Copia .env.example a .env y ajusta las credenciales de MySQL, JWT_SECRET y MCP_ACCESS_TOKEN",
      "3. Crea la base de datos ejecutando Docs/ddl.sql en MySQL 8",
      "4. Backend: cd Backend && deno task check && deno task test && deno task dev:api",
      "5. Frontend: cd Frontend && npm install && npm run dev",
      "6. Prueba los endpoints con los archivos de Http/",
      "7. El asistente de IA usará CLAUDE.md / GEMINI.md, context/ y los LAYER.md / MODULE.md para guiar el desarrollo.",
    ],
  };
}

export async function addModule(options: AddModuleOptions): Promise<ScaffoldResult> {
  const targetDir = path.resolve(options.targetPath);

  // Leer scope y puerto del proyecto ya generado
  const contractsPkg = path.join(targetDir, "Shared", "contracts", "package.json");
  if (!(await exists(contractsPkg))) {
    throw new Error(`${targetDir} no es un proyecto generado con scaffold_clean_project (falta Shared/contracts/package.json)`);
  }
  const pkg = JSON.parse(await fs.readFile(contractsPkg, "utf-8")) as { name: string };
  const scope = pkg.name.replace(/^@/, "").replace(/\/contracts$/, "");
  const env = await fs.readFile(path.join(targetDir, ".env.example"), "utf-8").catch(() => "");
  const port = Number(env.match(/^PORT=(\d+)/m)?.[1] ?? 8001);

  const w = createWriter(targetDir);
  const n = moduleNames(options.moduleName);
  await createModule(w, scope, port, n);

  return {
    success: true,
    targetPath: targetDir,
    projectName: path.basename(targetDir),
    createdFiles: w.createdFiles,
    createdDirectories: w.createdDirectories,
    instructions: [
      `1. Agrega la tabla "${n.tabla}" a MySQL (ya está en Docs/ddl.sql)`,
      "2. cd Backend && deno task check && deno task test",
      `3. Prueba el módulo con Http/${n.modulo}.http`,
      `4. Página del Frontend: /${n.modulo} (Frontend/src/app/(panel)/${n.modulo}/page.tsx)`,
      `5. Documentación del módulo: Backend/packages/core/src/modules/${n.modulo}/MODULE.md`,
    ],
  };
}

/**
 * Crea un módulo en cada capa siguiendo los 7 pasos de la sección 5 de arquitectura_limpia.md.
 */
async function createModule(w: Writer, scope: string, port: number, n: ModuleNames): Promise<void> {
  const t = w.targetDir;
  const shared = path.join(t, "Shared", "contracts", "src");
  const core = path.join(t, "Backend", "packages", "core");
  const mod = path.join(core, "src", "modules", n.modulo);
  const database = path.join(t, "Backend", "packages", "database", "src");
  const composition = path.join(t, "Backend", "packages", "composition", "src");
  const api = path.join(t, "Backend", "apps", "api", "src");
  const mcp = path.join(t, "Backend", "apps", "mcp-server", "src");
  const feature = path.join(t, "Frontend", "src", "features", n.modulo);

  if (!n.modulo) throw new Error("El nombre del módulo no es válido");
  if (await exists(mod)) throw new Error(`El módulo "${n.modulo}" ya existe en ${path.relative(t, mod)}`);

  const files: Record<string, string[]> = {};
  async function write(capa: string, filePath: string, content: string) {
    await w.writeFile(filePath, content);
    (files[capa] ??= []).push(path.relative(t, filePath).replace(/\\/g, "/"));
  }

  // Directorios del módulo
  for (const dir of ["entities", "value-objects", "errors", "services", "repositories"]) {
    await w.ensureDir(path.join(mod, "domain", dir));
  }
  for (const dir of ["ports", "use-cases"]) {
    await w.ensureDir(path.join(mod, "application", dir));
  }
  for (const dir of ["api", "hooks", "components", "types"]) {
    await w.ensureDir(path.join(feature, dir));
  }

  // Paso 1: Contrato (Shared/contracts)
  await write("1. Contrato — Shared/contracts", path.join(shared, `${n.modulo}.schema.ts`), generateModuleSchemaTs(n));
  await w.insertBeforeMarker(path.join(shared, "index.ts"), "// @scaffold:schemas", [
    `export * from "./${n.modulo}.schema.ts";`,
  ]);
  await w.insertBeforeMarker(path.join(shared, "permissions.ts"), "// @scaffold:permissions", [
    `${n.MODULO}_LEER: "${n.modulo}:leer",`,
    `${n.MODULO}_CREAR: "${n.modulo}:crear",`,
  ]);
  await w.insertBeforeMarker(path.join(shared, "auditoria.catalogo.ts"), "// @scaffold:audit-actions", [
    `${n.ENTIDAD}_CREADO: "${n.tabla}.creado",`,
  ]);
  await w.insertBeforeMarker(path.join(shared, "mcp-tools.ts"), "// @scaffold:mcp-tools", [
    `${n.MODULO}_LISTAR: "${n.tabla}_listar",`,
    `${n.MODULO}_CREAR: "${n.tabla}_crear",`,
  ]);

  // Paso 2: Dominio (core/.../domain)
  const domain = "2. Dominio — core/domain";
  await write(domain, path.join(mod, "domain", "entities", `${n.entidad}.entity.ts`), generateEntityTs(n, scope));
  await write(domain, path.join(mod, "domain", "value-objects", `nombre-${n.entidad}.vo.ts`), generateValueObjectTs(n, scope));
  await write(domain, path.join(mod, "domain", "errors", `${n.entidad}.errors.ts`), generateErrorsTs(n, scope));
  await write(domain, path.join(mod, "domain", "services", `${n.entidad}.service.ts`), generateDomainServiceTs(n, scope));
  await write(domain, path.join(mod, "domain", "repositories", `${n.entidad}.repository.ts`), generateRepositoryPortTs(n, scope));

  // Paso 3: Caso de Uso (core/.../application) + test
  const app = "3. Aplicación — core/application";
  await write(app, path.join(mod, "application", "ports", "index.ts"), generateModulePortsTs(n));
  await write(app, path.join(mod, "application", "use-cases", `crear-${n.entidad}.use-case.ts`), generateCrearUseCaseTs(n, scope));
  await write(app, path.join(mod, "application", "use-cases", `listar-${n.modulo}.use-case.ts`), generateListarUseCaseTs(n, scope));
  await write(app, path.join(mod, "index.ts"), generateModuleIndexTs(n));
  await write(app, path.join(core, "tests", n.modulo, `crear-${n.entidad}.use-case.test.ts`), generateUseCaseTestTs(n, scope));
  await w.insertBeforeMarker(path.join(core, "src", "index.ts"), "// @scaffold:modules", [
    `export * from "./modules/${n.modulo}/index.ts";`,
  ]);

  // Paso 4: Infraestructura (database)
  const infra = "4. Infraestructura — database";
  await write(infra, path.join(database, "schema", `${n.modulo}.schema.ts`), generateDrizzleSchemaTs(n));
  await write(infra, path.join(database, "mappers", `${n.entidad}.mapper.ts`), generateMapperTs(n, scope));
  await write(infra, path.join(database, "repositories", `mysql-${n.entidad}.repository.ts`), generateMySqlRepositoryTs(n, scope));
  await w.insertBeforeMarker(path.join(database, "schema", "index.ts"), "// @scaffold:schemas", [
    `export * from "./${n.modulo}.schema.ts";`,
  ]);
  await w.insertBeforeMarker(path.join(database, "index.ts"), "// @scaffold:repositories", [
    `export { MySql${n.Entidad}Repository } from "./repositories/mysql-${n.entidad}.repository.ts";`,
  ]);
  await w.insertBeforeMarker(path.join(t, "Docs", "ddl.sql"), "-- @scaffold:tables", generateModuleDdl(n).trimEnd().split("\n"));

  // Paso 5: Ensamblaje (composition)
  const container = path.join(composition, "container.ts");
  await w.insertBeforeMarker(container, "// @scaffold:imports", [
    `import { MySql${n.Entidad}Repository } from "@${scope}/database";`,
    `import { Crear${n.Entidad}UseCase, Listar${n.Modulo}UseCase } from "@${scope}/core";`,
  ]);
  const repoVar = `${n.Entidad.charAt(0).toLowerCase()}${n.Entidad.slice(1)}Repository`;
  await w.insertBeforeMarker(container, "// @scaffold:repositories", [
    `const ${repoVar} = new MySql${n.Entidad}Repository(db);`,
  ]);
  await w.insertBeforeMarker(container, "// @scaffold:use-cases", [
    `crear${n.Entidad}: new Crear${n.Entidad}UseCase(${repoVar}, unitOfWork, auditor),`,
    `listar${n.Modulo}: new Listar${n.Modulo}UseCase(${repoVar}),`,
  ]);
  (files["5. Ensamblaje — composition"] ??= []).push("Backend/packages/composition/src/container.ts (registro)");

  // Paso 6: Entrada (apps/api y apps/mcp-server)
  const entrada = "6. Entrada — apps/api y apps/mcp-server";
  await write(entrada, path.join(api, "controllers", `${n.modulo}.controller.ts`), generateApiControllerTs(n, scope));
  await write(entrada, path.join(api, "routes", `${n.modulo}.routes.ts`), generateApiRoutesTs(n, scope));
  await w.insertBeforeMarker(path.join(api, "routes", "index.ts"), "// @scaffold:imports", [
    `import { ${n.moduloCamel}Routes } from "./${n.modulo}.routes.ts";`,
  ]);
  await w.insertBeforeMarker(path.join(api, "routes", "index.ts"), "// @scaffold:routes", [
    `app.route("/api/${n.modulo}", ${n.moduloCamel}Routes);`,
  ]);
  await write(entrada, path.join(mcp, "tools", `${n.modulo}.tools.ts`), generateMcpModuleToolsTs(n, scope));
  await w.insertBeforeMarker(path.join(mcp, "tools", "index.ts"), "// @scaffold:imports", [
    `import { registrar${n.Modulo}Tools } from "./${n.modulo}.tools.ts";`,
  ]);
  await w.insertBeforeMarker(path.join(mcp, "tools", "index.ts"), "// @scaffold:tools", [
    `registrar${n.Modulo}Tools(gateway);`,
  ]);
  await write(entrada, path.join(t, "Http", `${n.modulo}.http`), generateModuleHttp(n, port));

  // Paso 7: Interfaz (Frontend/src/features/<modulo>)
  const ui = "7. Interfaz — Frontend";
  await write(ui, path.join(feature, "types", `${n.modulo}.types.ts`), generateFeatureTypesTs(n, scope));
  await write(ui, path.join(feature, "api", `${n.modulo}.api.ts`), generateFeatureApiTs(n, scope));
  await write(ui, path.join(feature, "hooks", `use-${n.modulo}.ts`), generateFeatureHookTs(n, scope));
  await write(ui, path.join(feature, "components", `${n.Modulo}Vista.tsx`), generateFeatureComponentTsx(n));
  await write(ui, path.join(t, "Frontend", "src", "app", "(panel)", n.modulo, "page.tsx"), generatePanelPageTsx(n));

  // MODULE.md del módulo
  await w.writeFile(path.join(mod, "MODULE.md"), generateModuleMd(scope, n, files));

  // Registrar el módulo en CLAUDE.md y GEMINI.md
  for (const md of ["CLAUDE.md", "GEMINI.md"]) {
    await w.insertBeforeMarker(path.join(t, md), "<!-- @scaffold:modules -->", [generateModuleListEntry(n)]);
  }
}
