/**
 * Plantillas para el código base de cada capa:
 * shared-kernel, contracts, core, database, platform, composition, apps (api, mcp-server), Frontend, Http y Docs.
 */

import { ProjectConfig } from "./rootProject.js";

// -------------------------------------------------------------
// DENO.JSON DE CADA PAQUETE DEL WORKSPACE
// -------------------------------------------------------------
export function generatePackageDenoJson(config: ProjectConfig, packageName: string, tasks?: Record<string, string>): string {
  const json: Record<string, unknown> = {
    name: `@${config.scope}/${packageName}`,
    version: "0.1.0",
    exports: tasks ? "./main.ts" : "./src/index.ts",
  };
  if (tasks) json.tasks = tasks;
  return JSON.stringify(json, null, 2) + "\n";
}

// -------------------------------------------------------------
// CAPA 0: SHARED-KERNEL (TypeScript puro, sin dependencias)
// -------------------------------------------------------------
export function generateResultTs(): string {
  return `/**
 * Result<T, E>: reemplaza el uso de throw para errores de negocio.
 * Uso: Result.ok(valor) | Result.err(new DomainError("CODIGO", "Mensaje"))
 */

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
  },
  err<E>(error: E): Result<never, E> {
    return { ok: false, error };
  },
};
`;
}

export function generateDomainErrorTs(): string {
  return `/**
 * DomainError: clase base inmutable para todo fallo de negocio esperado.
 * No extiende Error: nunca se lanza, se devuelve dentro de Result.err(...).
 */

export class DomainError {
  constructor(
    public readonly code: string,
    public readonly message: string,
  ) {
    Object.freeze(this);
  }
}
`;
}

export function generatePaginationTs(): string {
  return `/**
 * Tipos base para consultas paginadas.
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function toOffset({ page, pageSize }: PaginationParams): number {
  return (Math.max(page, 1) - 1) * pageSize;
}
`;
}

export function generateSharedKernelIndexTs(): string {
  return `export { Result } from "./result.ts";
export { DomainError } from "./domain-error.ts";
export { toOffset, type Paginated, type PaginationParams } from "./pagination.ts";
`;
}

// -------------------------------------------------------------
// CAPA 1: SHARED/CONTRACTS (solo depende de zod)
// -------------------------------------------------------------
export function generateContractsPackageJson(config: ProjectConfig): string {
  return JSON.stringify(
    {
      name: `@${config.scope}/contracts`,
      version: "0.1.0",
      private: true,
      type: "module",
      main: "./src/index.ts",
      types: "./src/index.ts",
      exports: { ".": "./src/index.ts" },
      dependencies: { zod: "^3.24.2" },
    },
    null,
    2
  ) + "\n";
}

export function generatePermissionsTs(): string {
  return `/**
 * Catálogo oficial de permisos RBAC.
 * add_module agrega aquí los permisos de cada módulo.
 */

export const PERMISSIONS = {
  // @scaffold:permissions
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
`;
}

export function generateRolesTs(): string {
  return `/**
 * Catálogo oficial de roles y su matriz de permisos.
 */
import { PERMISSIONS, type Permission } from "./permissions.ts";

export const ROLES = {
  ADMIN: "admin",
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_PERMISSIONS: Record<Rol, readonly Permission[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
};

export function tienePermiso(rol: string, permiso: Permission): boolean {
  const permisos = ROLE_PERMISSIONS[rol as Rol];
  return permisos ? permisos.includes(permiso) : false;
}
`;
}

export function generateAuditoriaCatalogoTs(): string {
  return `/**
 * Catálogo de acciones de auditoría (logs_auditoria).
 */

export const AUDIT_ACTIONS = {
  // @scaffold:audit-actions
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
`;
}

export function generateMcpToolsCatalogoTs(): string {
  return `/**
 * Nombres oficiales de las herramientas MCP expuestas por apps/mcp-server.
 */

export const MCP_TOOLS = {
  // @scaffold:mcp-tools
} as const;

export type McpToolName = (typeof MCP_TOOLS)[keyof typeof MCP_TOOLS];
`;
}

export function generateContractsIndexTs(): string {
  return `export * from "./roles.ts";
export * from "./permissions.ts";
export * from "./auditoria.catalogo.ts";
export * from "./mcp-tools.ts";
// @scaffold:schemas
`;
}

// -------------------------------------------------------------
// CAPA 2: CORE (puertos transversales)
// -------------------------------------------------------------
export function generateAuditorPortTs(): string {
  return `/**
 * Puerto IAuditor (Regla 6): todo caso de uso que cree, actualice, anule o
 * cambie el estado de una entidad lo inyecta y registra la operación.
 */

export interface ContextoActor {
  usuarioId: number;
  rol: string;
  ip: string | null;
}

export interface DetallesAuditoria {
  antes: Record<string, unknown> | null;
  despues: Record<string, unknown> | null;
}

export interface EventoAuditoria {
  accion: string;
  entidad: string;
  entidadId: string | number;
  detalles: DetallesAuditoria;
  contexto: ContextoActor;
}

export interface IAuditor {
  registrar(evento: EventoAuditoria): Promise<void>;
}
`;
}

export function generateSanitizarDetallesTs(): string {
  return `/**
 * Servicio de dominio puro: elimina campos sensibles antes de auditar.
 * Jamás se registran password_hash, totp_secret, tokens JWT ni códigos de recuperación.
 */

const CAMPOS_SENSIBLES = new Set([
  "password",
  "password_hash",
  "passwordHash",
  "totp_secret",
  "totpSecret",
  "token",
  "access_token",
  "accessToken",
  "refresh_token",
  "refreshToken",
  "codigos_recuperacion",
  "codigosRecuperacion",
]);

export function sanitizarDetalles<T>(valor: T): T {
  if (Array.isArray(valor)) {
    return valor.map((v) => sanitizarDetalles(v)) as T;
  }
  if (valor !== null && typeof valor === "object" && !(valor instanceof Date)) {
    const limpio: Record<string, unknown> = {};
    for (const [clave, v] of Object.entries(valor)) {
      if (!CAMPOS_SENSIBLES.has(clave)) limpio[clave] = sanitizarDetalles(v);
    }
    return limpio as T;
  }
  return valor;
}
`;
}

export function generateUnitOfWorkPortTs(): string {
  return `/**
 * Puerto IUnitOfWork: ejecuta un trabajo dentro de una transacción
 * (BEGIN / COMMIT / ROLLBACK) en operaciones compuestas.
 */

export interface IUnitOfWork {
  ejecutar<T>(trabajo: () => Promise<T>): Promise<T>;
}
`;
}

export function generateTokenServicePortTs(config: ProjectConfig): string {
  return `/**
 * Puerto ITokenService: firma y verifica tokens de acceso.
 * Implementado por JwtTokenService en @${config.scope}/platform.
 */
import type { DomainError, Result } from "@${config.scope}/shared-kernel";

export interface TokenPayload {
  usuarioId: number;
  rol: string;
}

export interface ITokenService {
  firmar(payload: TokenPayload): Promise<string>;
  verificar(token: string): Promise<Result<TokenPayload, DomainError>>;
}
`;
}

export function generateMcpToolLoggerPortTs(): string {
  return `/**
 * Puerto IMcpToolLogger: registra cada ejecución de herramienta MCP (logs_mcp_tools).
 */

export interface EjecucionMcpTool {
  herramienta: string;
  usuarioId: number;
  argumentos: unknown;
  exito: boolean;
  error: string | null;
  duracionMs: number;
}

export interface IMcpToolLogger {
  registrar(ejecucion: EjecucionMcpTool): Promise<void>;
}
`;
}

export function generateCoreIndexTs(): string {
  return `// Puertos y servicios transversales
export type { IUnitOfWork } from "./shared/application/ports/unit-of-work.port.ts";
export type {
  ContextoActor,
  DetallesAuditoria,
  EventoAuditoria,
  IAuditor,
} from "./modules/auditoria/application/ports/auditor.port.ts";
export { sanitizarDetalles } from "./modules/auditoria/domain/services/sanitizar-detalles.ts";
export type { ITokenService, TokenPayload } from "./modules/autenticacion/application/ports/token-service.port.ts";
export type { EjecucionMcpTool, IMcpToolLogger } from "./modules/mcp-audit/application/ports/mcp-tool-logger.port.ts";

// Módulos de dominio
// @scaffold:modules
`;
}

// -------------------------------------------------------------
// CAPA 3A: DATABASE (Drizzle ORM + MySQL 8)
// -------------------------------------------------------------
export function generateConnectionTs(): string {
  return `/**
 * Pool de MySQL 8 (mysql2/promise) + instancia de Drizzle ORM.
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema/index.ts";

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export function createDatabase(config: DatabaseConfig) {
  const pool = mysql.createPool({ ...config, connectionLimit: 10 });
  return drizzle(pool, { schema, mode: "default" });
}

export type Database = ReturnType<typeof createDatabase>;
`;
}

export function generateAuditoriaSchemaTs(): string {
  return `/**
 * logs_auditoria: tabla APPEND-ONLY (Regla 7). Triggers en Docs/ddl.sql bloquean UPDATE y DELETE.
 */
import { int, json, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const logsAuditoriaTable = mysqlTable("logs_auditoria", {
  id: int("id").autoincrement().primaryKey(),
  accion: varchar("accion", { length: 100 }).notNull(),
  entidad: varchar("entidad", { length: 100 }).notNull(),
  entidadId: varchar("entidad_id", { length: 64 }).notNull(),
  detalles: json("detalles").notNull(),
  usuarioId: int("usuario_id").notNull(),
  ip: varchar("ip", { length: 64 }),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});
`;
}

export function generateMcpToolsSchemaTs(): string {
  return `/**
 * logs_mcp_tools: registro de cada herramienta MCP ejecutada.
 */
import { boolean, int, json, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const logsMcpToolsTable = mysqlTable("logs_mcp_tools", {
  id: int("id").autoincrement().primaryKey(),
  herramienta: varchar("herramienta", { length: 100 }).notNull(),
  usuarioId: int("usuario_id").notNull(),
  argumentos: json("argumentos"),
  exito: boolean("exito").notNull(),
  error: text("error"),
  duracionMs: int("duracion_ms").notNull(),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});
`;
}

export function generateSchemaIndexTs(): string {
  return `export * from "./auditoria.schema.ts";
export * from "./mcp-tools.schema.ts";
// @scaffold:schemas
`;
}

export function generateMySqlAuditorTs(config: ProjectConfig): string {
  return `/**
 * Implementación de IAuditor sobre logs_auditoria. Sanitiza siempre los detalles.
 */
import { type EventoAuditoria, type IAuditor, sanitizarDetalles } from "@${config.scope}/core";
import type { Database } from "../connection.ts";
import { logsAuditoriaTable } from "../schema/index.ts";
import { dbActual } from "../unit-of-work.ts";

export class MySqlAuditor implements IAuditor {
  constructor(private readonly db: Database) {}

  async registrar(evento: EventoAuditoria): Promise<void> {
    await dbActual(this.db).insert(logsAuditoriaTable).values({
      accion: evento.accion,
      entidad: evento.entidad,
      entidadId: String(evento.entidadId),
      detalles: sanitizarDetalles(evento.detalles),
      usuarioId: evento.contexto.usuarioId,
      ip: evento.contexto.ip,
    });
  }
}
`;
}

export function generateMySqlMcpToolLoggerTs(config: ProjectConfig): string {
  return `/**
 * Implementación de IMcpToolLogger sobre logs_mcp_tools.
 */
import { type EjecucionMcpTool, type IMcpToolLogger, sanitizarDetalles } from "@${config.scope}/core";
import type { Database } from "../connection.ts";
import { logsMcpToolsTable } from "../schema/index.ts";
import { dbActual } from "../unit-of-work.ts";

export class MySqlMcpToolLogger implements IMcpToolLogger {
  constructor(private readonly db: Database) {}

  async registrar(ejecucion: EjecucionMcpTool): Promise<void> {
    await dbActual(this.db).insert(logsMcpToolsTable).values({
      herramienta: ejecucion.herramienta,
      usuarioId: ejecucion.usuarioId,
      argumentos: sanitizarDetalles(ejecucion.argumentos),
      exito: ejecucion.exito,
      error: ejecucion.error,
      duracionMs: ejecucion.duracionMs,
    });
  }
}
`;
}

export function generateUnitOfWorkTs(config: ProjectConfig): string {
  return `/**
 * Implementación de IUnitOfWork: BEGIN / COMMIT / ROLLBACK reales sobre MySQL.
 * Los repositorios usan dbActual(this.db) para participar en la transacción en curso.
 * Si el trabajo lanza un fallo técnico se hace ROLLBACK (Regla 3).
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type { IUnitOfWork } from "@${config.scope}/core";
import type { Database } from "./connection.ts";

const transaccionActual = new AsyncLocalStorage<Database>();

export function dbActual(db: Database): Database {
  return transaccionActual.getStore() ?? db;
}

export class MySqlUnitOfWork implements IUnitOfWork {
  constructor(private readonly db: Database) {}

  async ejecutar<T>(trabajo: () => Promise<T>): Promise<T> {
    return await this.db.transaction((tx) => transaccionActual.run(tx as unknown as Database, trabajo));
  }
}
`;
}

export function generateDatabaseIndexTs(): string {
  return `export { createDatabase, type Database, type DatabaseConfig } from "./connection.ts";
export { dbActual, MySqlUnitOfWork } from "./unit-of-work.ts";
export { MySqlAuditor } from "./repositories/mysql-auditor.ts";
export { MySqlMcpToolLogger } from "./repositories/mysql-mcp-tool-logger.ts";
export * from "./schema/index.ts";
// @scaffold:repositories
`;
}

// -------------------------------------------------------------
// CAPA 3B: PLATFORM (servicios técnicos)
// -------------------------------------------------------------
export function generateJwtTokenServiceTs(config: ProjectConfig): string {
  return `/**
 * JwtTokenService: implementa ITokenService con JWT HS256 (jose).
 */
import { jwtVerify, SignJWT } from "jose";
import type { ITokenService, TokenPayload } from "@${config.scope}/core";
import { DomainError, Result } from "@${config.scope}/shared-kernel";

export class JwtTokenService implements ITokenService {
  private readonly key: Uint8Array;

  constructor(secret: string, private readonly expiracion = "15m") {
    this.key = new TextEncoder().encode(secret);
  }

  async firmar(payload: TokenPayload): Promise<string> {
    return await new SignJWT({ rol: payload.rol })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(payload.usuarioId))
      .setIssuedAt()
      .setExpirationTime(this.expiracion)
      .sign(this.key);
  }

  async verificar(token: string): Promise<Result<TokenPayload, DomainError>> {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: ["HS256"] });
      return Result.ok({ usuarioId: Number(payload.sub), rol: String(payload.rol) });
    } catch {
      return Result.err(new DomainError("TOKEN_INVALIDO", "El token es inválido o ha expirado."));
    }
  }
}
`;
}

export function generatePlatformIndexTs(): string {
  return `export { JwtTokenService } from "./jwt-token-service.ts";
`;
}

// -------------------------------------------------------------
// CAPA 4: COMPOSITION (Composition Root)
// -------------------------------------------------------------
export function generateCompositionConfigTs(config: ProjectConfig): string {
  return `/**
 * Configuración del contenedor leída del entorno (Fail-Fast).
 */
import type { DatabaseConfig } from "@${config.scope}/database";

export interface AppConfig {
  db: DatabaseConfig;
  jwtSecret: string;
  jwtExpiracion: string;
}

function requireEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) throw new Error("[CONFIG] Variable de entorno requerida no encontrada: " + key);
  return value;
}

export function loadConfigFromEnv(): AppConfig {
  return {
    db: {
      host: requireEnv("DB_HOST"),
      port: Number(requireEnv("DB_PORT")),
      user: requireEnv("DB_USER"),
      password: Deno.env.get("DB_PASSWORD") ?? "",
      database: requireEnv("DB_NAME"),
    },
    jwtSecret: requireEnv("JWT_SECRET"),
    jwtExpiracion: Deno.env.get("JWT_EXPIRATION") ?? "15m",
  };
}
`;
}

export function generateContainerTs(config: ProjectConfig): string {
  return `/**
 * createContainer: ÚNICO lugar donde se instancian repositorios, servicios y casos de uso (Regla 4).
 * No contiene ni una sola línea de lógica de negocio.
 */
import {
  createDatabase,
  MySqlAuditor,
  MySqlMcpToolLogger,
  MySqlUnitOfWork,
} from "@${config.scope}/database";
import { JwtTokenService } from "@${config.scope}/platform";
import type { AppConfig } from "./config.ts";
// @scaffold:imports

export function createContainer(config: AppConfig) {
  const db = createDatabase(config.db);

  // Adaptadores transversales
  const auditor = new MySqlAuditor(db);
  const unitOfWork = new MySqlUnitOfWork(db);
  const mcpToolLogger = new MySqlMcpToolLogger(db);
  const tokenService = new JwtTokenService(config.jwtSecret, config.jwtExpiracion);

  // Repositorios
  // @scaffold:repositories

  return {
    tokenService,
    mcpToolLogger,
    // Casos de uso
    // @scaffold:use-cases
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
`;
}

export function generateCompositionIndexTs(): string {
  return `export { createContainer, type AppContainer } from "./container.ts";
export { loadConfigFromEnv, type AppConfig } from "./config.ts";
`;
}

// -------------------------------------------------------------
// CAPA 5A: APPS/API (Hono)
// -------------------------------------------------------------
export function generateApiMainTs(config: ProjectConfig): string {
  return `/**
 * Servidor HTTP REST (Hono). Adaptador primario: solo consume el contenedor ya ensamblado.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createContainer, loadConfigFromEnv } from "@${config.scope}/composition";
import type { AppEnv } from "./src/types.ts";
import { registrarRutas } from "./src/routes/index.ts";

const container = createContainer(loadConfigFromEnv());
const app = new Hono<AppEnv>();

app.use("*", cors({ origin: Deno.env.get("FRONTEND_URL") ?? "http://localhost:3000", credentials: true }));
app.use("*", async (c, next) => {
  c.set("container", container);
  await next();
});

app.get("/api/health", (c) => c.json({ ok: true, data: { estado: "saludable", timestamp: new Date().toISOString() } }));

registrarRutas(app);

const port = Number(Deno.env.get("PORT") ?? "${config.port}");
console.log("🚀 API ${config.projectName} escuchando en http://localhost:" + port);
Deno.serve({ port }, app.fetch);
`;
}

export function generateApiTypesTs(config: ProjectConfig): string {
  return `import type { AppContainer } from "@${config.scope}/composition";
import type { ContextoActor } from "@${config.scope}/core";

export type AppEnv = {
  Variables: {
    container: AppContainer;
    actor: ContextoActor;
  };
};
`;
}

export function generateSafeHandlerTs(): string {
  return `/**
 * safeHandler: atrapa SOLO fallos técnicos catastróficos (Regla 3) y responde 500.
 */
import type { Context } from "hono";
import type { AppEnv } from "../types.ts";

export function safeHandler(handler: (c: Context<AppEnv>) => Promise<Response>) {
  return async (c: Context<AppEnv>): Promise<Response> => {
    try {
      return await handler(c);
    } catch (error) {
      console.error("[API] Error técnico no controlado:", error);
      return c.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } }, 500);
    }
  };
}
`;
}

export function generatePresentResultTs(config: ProjectConfig): string {
  return `/**
 * presentResult: convierte Result<T, DomainError> en una respuesta HTTP semántica.
 */
import type { Context } from "hono";
import type { ZodError } from "zod";
import type { DomainError, Result } from "@${config.scope}/shared-kernel";

export type HttpStatus = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 422;

export function statusFromCode(code: string): HttpStatus {
  if (code === "VALIDATION_ERROR") return 400;
  if (code === "NO_AUTENTICADO" || code === "TOKEN_INVALIDO") return 401;
  if (code === "PERMISO_DENEGADO") return 403;
  if (code.endsWith("_NO_ENCONTRADO")) return 404;
  if (code.endsWith("_DUPLICADO") || code.endsWith("_YA_EXISTE")) return 409;
  return 422;
}

export function presentResult<T>(c: Context, result: Result<T, DomainError>, successStatus: 200 | 201 = 200): Response {
  if (result.ok) {
    return c.json({ ok: true, data: result.value }, successStatus);
  }
  return c.json(
    { ok: false, error: { code: result.error.code, message: result.error.message } },
    statusFromCode(result.error.code),
  );
}

export function presentValidationError(c: Context, error: ZodError): Response {
  return c.json(
    {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Datos de entrada inválidos", detalles: error.flatten().fieldErrors },
    },
    400,
  );
}
`;
}

export function generateAuthMiddlewareTs(config: ProjectConfig): string {
  return `/**
 * Middlewares: verifican el JWT, extraen usuario e IP y comprueban el permiso RBAC de la ruta.
 */
import type { MiddlewareHandler } from "hono";
import { type Permission, tienePermiso } from "@${config.scope}/contracts";
import type { AppEnv } from "../types.ts";

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ ok: false, error: { code: "NO_AUTENTICADO", message: "Token no suministrado." } }, 401);
  }

  const verificado = await c.get("container").tokenService.verificar(header.slice(7).trim());
  if (!verificado.ok) {
    return c.json({ ok: false, error: { code: verificado.error.code, message: verificado.error.message } }, 401);
  }

  c.set("actor", {
    usuarioId: verificado.value.usuarioId,
    rol: verificado.value.rol,
    ip: c.req.header("x-forwarded-for") ?? null,
  });
  await next();
};

export function requirePermission(permiso: Permission): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!tienePermiso(c.get("actor").rol, permiso)) {
      return c.json({ ok: false, error: { code: "PERMISO_DENEGADO", message: "No tienes permiso: " + permiso } }, 403);
    }
    await next();
  };
}
`;
}

export function generateApiRoutesIndexTs(): string {
  return `/**
 * Agregador central de rutas de la API.
 */
import type { Hono } from "hono";
import type { AppEnv } from "../types.ts";
// @scaffold:imports

export function registrarRutas(app: Hono<AppEnv>): void {
  // @scaffold:routes
}
`;
}

// -------------------------------------------------------------
// CAPA 5B: APPS/MCP-SERVER
// -------------------------------------------------------------
export function generateMcpMainTs(config: ProjectConfig): string {
  return `/**
 * Servidor MCP para Agentes IA (stdio). Adaptador primario: solo consume el contenedor.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createContainer, loadConfigFromEnv } from "@${config.scope}/composition";
import { ToolGateway } from "./src/tool-gateway.ts";
import { registrarTools } from "./src/tools/index.ts";

const container = createContainer(loadConfigFromEnv());

const token = Deno.env.get("MCP_ACCESS_TOKEN");
if (!token) {
  console.error("[MCP] Falta MCP_ACCESS_TOKEN (token JWT del usuario en sesión).");
  Deno.exit(1);
}

const sesion = await container.tokenService.verificar(token);
if (!sesion.ok) {
  console.error("[MCP] " + sesion.error.message);
  Deno.exit(1);
}

const server = new McpServer({ name: "${config.scope}-mcp-server", version: "0.1.0" });
const gateway = new ToolGateway(server, container, { usuarioId: sesion.value.usuarioId, rol: sesion.value.rol, ip: null });

registrarTools(gateway);

await server.connect(new StdioServerTransport());
console.error("[MCP] ${config.projectName} mcp-server escuchando en stdio");
`;
}

export function generateToolGatewayTs(config: ProjectConfig): string {
  return `/**
 * ToolGateway: intercepta cada llamada del modelo de IA, valida el esquema Zod,
 * comprueba el permiso RBAC del usuario en sesión, ejecuta el caso de uso del
 * contenedor y registra la ejecución en logs_mcp_tools.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import { type Permission, tienePermiso } from "@${config.scope}/contracts";
import type { AppContainer } from "@${config.scope}/composition";
import type { ContextoActor } from "@${config.scope}/core";
import type { DomainError, Result } from "@${config.scope}/shared-kernel";

export interface ToolDefinition<S extends z.ZodRawShape, T> {
  name: string;
  description: string;
  schema: z.ZodObject<S>;
  permission: Permission;
  execute: (input: z.output<z.ZodObject<S>>, container: AppContainer, actor: ContextoActor) => Promise<Result<T, DomainError>>;
}

interface ToolResponse {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

export class ToolGateway {
  constructor(
    private readonly server: McpServer,
    private readonly container: AppContainer,
    private readonly actor: ContextoActor,
  ) {}

  register<S extends z.ZodRawShape, T>(tool: ToolDefinition<S, T>): void {
    this.server.tool(tool.name, tool.description, tool.schema.shape as z.ZodRawShape, async (args: unknown) => {
      const inicio = Date.now();
      const respuesta = await this.ejecutar(tool, args);
      await this.container.mcpToolLogger
        .registrar({
          herramienta: tool.name,
          usuarioId: this.actor.usuarioId,
          argumentos: args,
          exito: !respuesta.isError,
          error: respuesta.isError ? respuesta.content[0].text : null,
          duracionMs: Date.now() - inicio,
        })
        .catch((error) => console.error("[MCP] No se pudo registrar en logs_mcp_tools:", error));
      return respuesta;
    });
  }

  private async ejecutar<S extends z.ZodRawShape, T>(tool: ToolDefinition<S, T>, args: unknown): Promise<ToolResponse> {
    if (!tienePermiso(this.actor.rol, tool.permission)) {
      return this.error("PERMISO_DENEGADO", "No tienes permiso: " + tool.permission);
    }

    const parsed = tool.schema.safeParse(args);
    if (!parsed.success) {
      return this.error("VALIDATION_ERROR", JSON.stringify(parsed.error.flatten().fieldErrors));
    }

    try {
      const result = await tool.execute(parsed.data, this.container, this.actor);
      if (!result.ok) return this.error(result.error.code, result.error.message);
      return { content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }] };
    } catch (error) {
      console.error("[MCP] Error técnico no controlado:", error);
      return this.error("INTERNAL_ERROR", "Error interno al ejecutar la herramienta");
    }
  }

  private error(code: string, message: string): ToolResponse {
    return { isError: true, content: [{ type: "text", text: code + ": " + message }] };
  }
}
`;
}

export function generateMcpToolsIndexTs(): string {
  return `/**
 * Registro central de herramientas MCP.
 */
import type { ToolGateway } from "../tool-gateway.ts";
// @scaffold:imports

export function registrarTools(gateway: ToolGateway): void {
  // @scaffold:tools
}
`;
}

// -------------------------------------------------------------
// CAPA 6: FRONTEND (Next.js 16 + Tailwind v4)
// -------------------------------------------------------------
export function generateFrontendPackageJson(config: ProjectConfig): string {
  return JSON.stringify(
    {
      name: `@${config.scope}/frontend`,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        // contracts se enlaza como symlink: necesita su propio node_modules (zod)
        postinstall: "npm install --prefix ../Shared/contracts --no-audit --no-fund",
      },
      dependencies: {
        [`@${config.scope}/contracts`]: "file:../Shared/contracts",
        next: "^16.0.0",
        react: "^19.2.0",
        "react-dom": "^19.2.0",
        zod: "^3.24.2",
      },
      devDependencies: {
        "@tailwindcss/postcss": "^4.1.0",
        "@types/node": "^22.10.2",
        "@types/react": "^19.2.0",
        "@types/react-dom": "^19.2.0",
        tailwindcss: "^4.1.0",
        typescript: "^5.7.2",
      },
    },
    null,
    2
  ) + "\n";
}

export function generateFrontendTsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: false,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        allowImportingTsExtensions: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  ) + "\n";
}

export function generateNextConfig(config: ProjectConfig): string {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los contratos se comparten como código TypeScript fuente
  transpilePackages: ["@${config.scope}/contracts"],
};

export default nextConfig;
`;
}

export function generatePostcssConfig(): string {
  return `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`;
}

export function generateGlobalsCss(): string {
  return `@import "tailwindcss";
`;
}

export function generateRootLayoutTsx(config: ProjectConfig): string {
  return `import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "${config.projectName}",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
`;
}

export function generateRootPageTsx(config: ProjectConfig): string {
  return `export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">${config.projectName}</h1>
      <p className="mt-2 text-slate-600">Las páginas viven en src/app y delegan el renderizado a src/features.</p>
    </main>
  );
}
`;
}

export function generateRouteGroupLayoutTsx(grupo: string): string {
  return `import type { ReactNode } from "react";

/** Layout del contexto ${grupo}: solo estructura, sin lógica de negocio. */
export default function Layout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl p-6">{children}</div>;
}
`;
}

export function generateHttpClientTs(config: ProjectConfig): string {
  return `/**
 * Cliente HTTP único del Frontend. Renueva el access token con el refresh_token
 * (cookie httpOnly) cuando la API responde 401 y reintenta una vez.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:${config.port}";

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; detalles?: unknown } };

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

async function renovarToken(): Promise<boolean> {
  try {
    const res = await fetch(API_URL + "/api/auth/refresh", { method: "POST", credentials: "include" });
    if (!res.ok) return false;
    const body = (await res.json()) as ApiResponse<{ accessToken: string }>;
    if (!body.ok) return false;
    accessToken = body.data.accessToken;
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, init: RequestInit = {}, reintentar = true): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", "Bearer " + accessToken);

  let res: Response;
  try {
    res = await fetch(API_URL + path, { ...init, headers, credentials: "include" });
  } catch {
    return { ok: false, error: { code: "RED_NO_DISPONIBLE", message: "No se pudo conectar con la API" } };
  }

  if (res.status === 401 && reintentar && (await renovarToken())) {
    return request<T>(path, init, false);
  }

  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return { ok: false, error: { code: "RESPUESTA_INVALIDA", message: "HTTP " + res.status } };
  }
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
`;
}

export function generateFormattersTs(): string {
  return `/**
 * Formateadores transversales de la UI.
 */

export function formatearFecha(valor: string | Date | null): string {
  if (!valor) return "—";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(valor));
}

export function formatearMoneda(valor: number, moneda = "USD"): string {
  return new Intl.NumberFormat("es", { style: "currency", currency: moneda }).format(valor);
}
`;
}

// -------------------------------------------------------------
// HTTP Y DOCS
// -------------------------------------------------------------
export function generateHealthHttp(config: ProjectConfig): string {
  return `@baseUrl = http://localhost:${config.port}/api

### Estado de la API
GET {{baseUrl}}/health
`;
}

export function generateDocsReadme(config: ProjectConfig): string {
  return `# 📚 Documentación Técnica — ${config.projectName}

| Documento | Contenido |
| :--- | :--- |
| [\`ddl.sql\`](./ddl.sql) | DDL de MySQL 8 con tablas, índices y triggers append-only |
| [\`../context/rules_architecture.md\`](../context/rules_architecture.md) | Reglas de arquitectura (7 Reglas de Oro) |
| [\`../context/ai_development_workflow.md\`](../context/ai_development_workflow.md) | Guía paso a paso para agregar funcionalidad |
| \`Backend/packages/core/src/modules/<modulo>/MODULE.md\` | Guía por módulo |

Agrega aquí los ADRs (\`ADR-XXX-titulo.md\`) y el SRS del proyecto.
`;
}

export function generateDdlSql(config: ProjectConfig): string {
  return `-- DDL MySQL 8 — ${config.projectName}
CREATE DATABASE IF NOT EXISTS \`${config.dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`${config.dbName}\`;

-- logs_auditoria: APPEND-ONLY (Regla 7)
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(100) NOT NULL,
  entidad_id VARCHAR(64) NOT NULL,
  detalles JSON NOT NULL,
  usuario_id INT NOT NULL,
  ip VARCHAR(64) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DELIMITER $$
CREATE TRIGGER trg_logs_auditoria_no_update BEFORE UPDATE ON logs_auditoria
FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'logs_auditoria es append-only: UPDATE no permitido';
END$$
CREATE TRIGGER trg_logs_auditoria_no_delete BEFORE DELETE ON logs_auditoria
FOR EACH ROW BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'logs_auditoria es append-only: DELETE no permitido';
END$$
DELIMITER ;

-- logs_mcp_tools: ejecuciones de herramientas MCP
CREATE TABLE IF NOT EXISTS logs_mcp_tools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  herramienta VARCHAR(100) NOT NULL,
  usuario_id INT NOT NULL,
  argumentos JSON NULL,
  exito BOOLEAN NOT NULL,
  error TEXT NULL,
  duracion_ms INT NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tablas de módulos
-- @scaffold:tables
`;
}
