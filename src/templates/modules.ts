/**
 * Plantillas para los archivos que genera un módulo en cada capa
 * (contracts, core domain/application, database, api, mcp-server, Frontend, Http).
 */

export interface ModuleNames {
  modulo: string; // productos
  Modulo: string; // Productos
  moduloCamel: string; // productos
  entidad: string; // producto
  Entidad: string; // Producto
  MODULO: string; // PRODUCTOS
  ENTIDAD: string; // PRODUCTO
  tabla: string; // productos
}

function pascal(str: string): string {
  return str
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

function singular(str: string): string {
  if (/[lrndjy]es$/.test(str)) return str.slice(0, -2);
  if (str.endsWith("s")) return str.slice(0, -1);
  return str;
}

export function moduleNames(moduleName: string): ModuleNames {
  const modulo = moduleName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const entidad = singular(modulo);
  const Modulo = pascal(modulo);
  const Entidad = pascal(entidad);
  return {
    modulo,
    Modulo,
    moduloCamel: Modulo.charAt(0).toLowerCase() + Modulo.slice(1),
    entidad,
    Entidad,
    MODULO: modulo.replace(/-/g, "_").toUpperCase(),
    ENTIDAD: entidad.replace(/-/g, "_").toUpperCase(),
    tabla: modulo.replace(/-/g, "_"),
  };
}

// -------------------------------------------------------------
// 1. CONTRACTS
// -------------------------------------------------------------
export function generateModuleSchemaTs(n: ModuleNames): string {
  return `/**
 * Contratos del módulo ${n.modulo}: validan la FORMA del dato en la frontera.
 */
import { z } from "zod";

export const Crear${n.Entidad}Schema = z.object({
  nombre: z.string().trim().min(2).max(120),
  descripcion: z.string().trim().max(500).optional(),
});
export type Crear${n.Entidad}Input = z.infer<typeof Crear${n.Entidad}Schema>;

export const Listar${n.Modulo}QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type Listar${n.Modulo}Query = z.infer<typeof Listar${n.Modulo}QuerySchema>;

export const ${n.Entidad}Schema = z.object({
  id: z.number().int(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  activo: z.boolean(),
  creadoEn: z.string().nullable(),
});
export type ${n.Entidad}Dto = z.infer<typeof ${n.Entidad}Schema>;
`;
}

// -------------------------------------------------------------
// 2. CORE — DOMAIN
// -------------------------------------------------------------
export function generateEntityTs(n: ModuleNames, scope: string): string {
  return `/**
 * Entidad ${n.Entidad}: identidad e invariantes de negocio. Sin dependencias técnicas.
 */
import { DomainError, Result } from "@${scope}/shared-kernel";
import { Nombre${n.Entidad} } from "../value-objects/nombre-${n.entidad}.vo.ts";
import { ${n.Entidad}YaInactivoError } from "../errors/${n.entidad}.errors.ts";

export interface ${n.Entidad}Props {
  id: number | null;
  nombre: Nombre${n.Entidad};
  descripcion: string | null;
  activo: boolean;
  creadoEn: Date | null;
}

export interface ${n.Entidad}Snapshot {
  id: number | null;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creadoEn: string | null;
}

export class ${n.Entidad} {
  private constructor(private readonly props: ${n.Entidad}Props) {}

  static crear(datos: { nombre: string; descripcion?: string | null }): Result<${n.Entidad}, DomainError> {
    const nombre = Nombre${n.Entidad}.crear(datos.nombre);
    if (!nombre.ok) return nombre;
    return Result.ok(
      new ${n.Entidad}({ id: null, nombre: nombre.value, descripcion: datos.descripcion ?? null, activo: true, creadoEn: null }),
    );
  }

  static reconstruir(props: ${n.Entidad}Props): ${n.Entidad} {
    return new ${n.Entidad}(props);
  }

  get id(): number | null {
    return this.props.id;
  }
  get nombre(): string {
    return this.props.nombre.value;
  }
  get descripcion(): string | null {
    return this.props.descripcion;
  }
  get activo(): boolean {
    return this.props.activo;
  }

  desactivar(): Result<void, DomainError> {
    if (!this.props.activo) return Result.err(new ${n.Entidad}YaInactivoError(this.props.id));
    this.props.activo = false;
    return Result.ok(undefined);
  }

  toSnapshot(): ${n.Entidad}Snapshot {
    return {
      id: this.props.id,
      nombre: this.props.nombre.value,
      descripcion: this.props.descripcion,
      activo: this.props.activo,
      creadoEn: this.props.creadoEn ? this.props.creadoEn.toISOString() : null,
    };
  }
}
`;
}

export function generateValueObjectTs(n: ModuleNames, scope: string): string {
  return `/**
 * Value Object inmutable: nombre de ${n.entidad}.
 */
import { DomainError, Result } from "@${scope}/shared-kernel";
import { ${n.Entidad}NombreInvalidoError } from "../errors/${n.entidad}.errors.ts";

export class Nombre${n.Entidad} {
  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  static crear(valor: string): Result<Nombre${n.Entidad}, DomainError> {
    const limpio = valor.trim();
    if (limpio.length < 2 || limpio.length > 120) return Result.err(new ${n.Entidad}NombreInvalidoError());
    return Result.ok(new Nombre${n.Entidad}(limpio));
  }

  /** Solo para datos ya validados que vienen de persistencia. */
  static reconstruir(valor: string): Nombre${n.Entidad} {
    return new Nombre${n.Entidad}(valor);
  }

  equals(otro: Nombre${n.Entidad}): boolean {
    return this.value.toLowerCase() === otro.value.toLowerCase();
  }
}
`;
}

export function generateErrorsTs(n: ModuleNames, scope: string): string {
  return `/**
 * Errores de dominio del módulo ${n.modulo} (extienden DomainError, nunca se lanzan).
 */
import { DomainError } from "@${scope}/shared-kernel";

export class ${n.Entidad}NoEncontradoError extends DomainError {
  constructor(id: number | null) {
    super("${n.ENTIDAD}_NO_ENCONTRADO", "No existe ${n.entidad} con id " + id + ".");
  }
}

export class ${n.Entidad}DuplicadoError extends DomainError {
  constructor(nombre: string) {
    super("${n.ENTIDAD}_DUPLICADO", "Ya existe ${n.entidad} con el nombre '" + nombre + "'.");
  }
}

export class ${n.Entidad}NombreInvalidoError extends DomainError {
  constructor() {
    super("${n.ENTIDAD}_NOMBRE_INVALIDO", "El nombre de ${n.entidad} debe tener entre 2 y 120 caracteres.");
  }
}

export class ${n.Entidad}YaInactivoError extends DomainError {
  constructor(id: number | null) {
    super("${n.ENTIDAD}_YA_INACTIVO", "El ${n.entidad} " + id + " ya está inactivo.");
  }
}
`;
}

export function generateDomainServiceTs(n: ModuleNames, scope: string): string {
  return `/**
 * Servicio de dominio puro del módulo ${n.modulo}.
 */
import { DomainError, Result } from "@${scope}/shared-kernel";
import type { ${n.Entidad} } from "../entities/${n.entidad}.entity.ts";
import { ${n.Entidad}DuplicadoError } from "../errors/${n.entidad}.errors.ts";

export function verificarNombre${n.Entidad}Disponible(existente: ${n.Entidad} | null): Result<void, DomainError> {
  if (existente) return Result.err(new ${n.Entidad}DuplicadoError(existente.nombre));
  return Result.ok(undefined);
}
`;
}

export function generateRepositoryPortTs(n: ModuleNames, scope: string): string {
  return `/**
 * Puerto de persistencia de ${n.Entidad}. Lo implementa MySql${n.Entidad}Repository en @${scope}/database.
 */
import type { Paginated, PaginationParams } from "@${scope}/shared-kernel";
import type { ${n.Entidad} } from "../entities/${n.entidad}.entity.ts";

export interface I${n.Entidad}Repository {
  buscarPorId(id: number): Promise<${n.Entidad} | null>;
  buscarPorNombre(nombre: string): Promise<${n.Entidad} | null>;
  listar(paginacion: PaginationParams): Promise<Paginated<${n.Entidad}>>;
  guardar(entidad: ${n.Entidad}): Promise<${n.Entidad}>;
}
`;
}

// -------------------------------------------------------------
// 3. CORE — APPLICATION
// -------------------------------------------------------------
export function generateModulePortsTs(n: ModuleNames): string {
  return `/**
 * Puertos técnicos que usan los casos de uso de ${n.modulo}.
 * Si el módulo necesita correo, tokens, hora o IA, define aquí su interfaz (Regla 2).
 */
export type { ContextoActor, IAuditor } from "../../../auditoria/application/ports/auditor.port.ts";
export type { IUnitOfWork } from "../../../../shared/application/ports/unit-of-work.port.ts";
`;
}

export function generateCrearUseCaseTs(n: ModuleNames, scope: string): string {
  return `/**
 * Caso de uso: crear ${n.entidad}. Persiste vía puerto, audita con IAuditor y retorna Result.
 */
import { AUDIT_ACTIONS, type Crear${n.Entidad}Input } from "@${scope}/contracts";
import { DomainError, Result } from "@${scope}/shared-kernel";
import { ${n.Entidad}, type ${n.Entidad}Snapshot } from "../../domain/entities/${n.entidad}.entity.ts";
import type { I${n.Entidad}Repository } from "../../domain/repositories/${n.entidad}.repository.ts";
import { verificarNombre${n.Entidad}Disponible } from "../../domain/services/${n.entidad}.service.ts";
import type { ContextoActor, IAuditor, IUnitOfWork } from "../ports/index.ts";

export class Crear${n.Entidad}UseCase {
  constructor(
    private readonly repositorio: I${n.Entidad}Repository,
    private readonly unitOfWork: IUnitOfWork,
    private readonly auditor: IAuditor,
  ) {}

  async execute(input: Crear${n.Entidad}Input, contexto: ContextoActor): Promise<Result<${n.Entidad}Snapshot, DomainError>> {
    const creado = ${n.Entidad}.crear(input);
    if (!creado.ok) return creado;

    return await this.unitOfWork.ejecutar(async (): Promise<Result<${n.Entidad}Snapshot, DomainError>> => {
      const disponible = verificarNombre${n.Entidad}Disponible(await this.repositorio.buscarPorNombre(creado.value.nombre));
      if (!disponible.ok) return disponible;

      const guardado = await this.repositorio.guardar(creado.value);
      const despues = guardado.toSnapshot();

      await this.auditor.registrar({
        accion: AUDIT_ACTIONS.${n.ENTIDAD}_CREADO,
        entidad: "${n.tabla}",
        entidadId: despues.id ?? 0,
        detalles: { antes: null, despues: { ...despues } },
        contexto,
      });

      return Result.ok(despues);
    });
  }
}
`;
}

export function generateListarUseCaseTs(n: ModuleNames, scope: string): string {
  return `/**
 * Caso de uso: listar ${n.modulo} paginados (solo lectura, no audita).
 */
import type { Listar${n.Modulo}Query } from "@${scope}/contracts";
import { DomainError, type Paginated, Result } from "@${scope}/shared-kernel";
import type { ${n.Entidad}Snapshot } from "../../domain/entities/${n.entidad}.entity.ts";
import type { I${n.Entidad}Repository } from "../../domain/repositories/${n.entidad}.repository.ts";
import type { ContextoActor } from "../ports/index.ts";

export class Listar${n.Modulo}UseCase {
  constructor(private readonly repositorio: I${n.Entidad}Repository) {}

  async execute(input: Listar${n.Modulo}Query, _contexto: ContextoActor): Promise<Result<Paginated<${n.Entidad}Snapshot>, DomainError>> {
    const pagina = await this.repositorio.listar({ page: input.page, pageSize: input.pageSize });
    return Result.ok({ ...pagina, items: pagina.items.map((e) => e.toSnapshot()) });
  }
}
`;
}

export function generateModuleIndexTs(n: ModuleNames): string {
  return `export * from "./domain/entities/${n.entidad}.entity.ts";
export * from "./domain/value-objects/nombre-${n.entidad}.vo.ts";
export * from "./domain/errors/${n.entidad}.errors.ts";
export * from "./domain/services/${n.entidad}.service.ts";
export type * from "./domain/repositories/${n.entidad}.repository.ts";
export * from "./application/use-cases/crear-${n.entidad}.use-case.ts";
export * from "./application/use-cases/listar-${n.modulo}.use-case.ts";
`;
}

export function generateUseCaseTestTs(n: ModuleNames, scope: string): string {
  return `/**
 * Test unitario de Crear${n.Entidad}UseCase con adaptadores en memoria (sin MySQL).
 */
import { assertEquals } from "@std/assert";
import type { Paginated } from "@${scope}/shared-kernel";
import {
  Crear${n.Entidad}UseCase,
  type EventoAuditoria,
  type I${n.Entidad}Repository,
  type IUnitOfWork,
  ${n.Entidad},
  Nombre${n.Entidad},
} from "../../src/index.ts";

class RepositorioEnMemoria implements I${n.Entidad}Repository {
  items: ${n.Entidad}[] = [];
  buscarPorId(id: number) {
    return Promise.resolve(this.items.find((i) => i.id === id) ?? null);
  }
  buscarPorNombre(nombre: string) {
    return Promise.resolve(this.items.find((i) => i.nombre.toLowerCase() === nombre.toLowerCase()) ?? null);
  }
  listar(): Promise<Paginated<${n.Entidad}>> {
    return Promise.resolve({ items: this.items, total: this.items.length, page: 1, pageSize: 20 });
  }
  guardar(entidad: ${n.Entidad}) {
    const s = entidad.toSnapshot();
    const guardado = ${n.Entidad}.reconstruir({
      id: this.items.length + 1,
      nombre: Nombre${n.Entidad}.reconstruir(s.nombre),
      descripcion: s.descripcion,
      activo: s.activo,
      creadoEn: new Date(),
    });
    this.items.push(guardado);
    return Promise.resolve(guardado);
  }
}

const unitOfWork: IUnitOfWork = { ejecutar: (trabajo) => trabajo() };
const actor = { usuarioId: 1, rol: "admin", ip: null };

Deno.test("Crear${n.Entidad}UseCase crea y registra auditoría", async () => {
  const eventos: EventoAuditoria[] = [];
  const useCase = new Crear${n.Entidad}UseCase(new RepositorioEnMemoria(), unitOfWork, {
    registrar: (e) => Promise.resolve(void eventos.push(e)),
  });

  const result = await useCase.execute({ nombre: "Ejemplo" }, actor);

  assertEquals(result.ok, true);
  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].detalles.antes, null);
});

Deno.test("Crear${n.Entidad}UseCase rechaza nombre duplicado", async () => {
  const repo = new RepositorioEnMemoria();
  const useCase = new Crear${n.Entidad}UseCase(repo, unitOfWork, { registrar: () => Promise.resolve() });

  await useCase.execute({ nombre: "Ejemplo" }, actor);
  const result = await useCase.execute({ nombre: "ejemplo" }, actor);

  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.code, "${n.ENTIDAD}_DUPLICADO");
});

Deno.test("Crear${n.Entidad}UseCase rechaza nombre inválido sin auditar", async () => {
  const eventos: EventoAuditoria[] = [];
  const useCase = new Crear${n.Entidad}UseCase(new RepositorioEnMemoria(), unitOfWork, {
    registrar: (e) => Promise.resolve(void eventos.push(e)),
  });

  const result = await useCase.execute({ nombre: " " }, actor);

  assertEquals(result.ok, false);
  assertEquals(eventos.length, 0);
});
`;
}

// -------------------------------------------------------------
// 4. DATABASE
// -------------------------------------------------------------
export function generateDrizzleSchemaTs(n: ModuleNames): string {
  return `/**
 * Tabla ${n.tabla} (Drizzle ORM - MySQL 8).
 */
import { boolean, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const ${n.moduloCamel}Table = mysqlTable("${n.tabla}", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 120 }).notNull().unique(),
  descripcion: text("descripcion"),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export type ${n.Entidad}Row = typeof ${n.moduloCamel}Table.$inferSelect;
export type Nuevo${n.Entidad}Row = typeof ${n.moduloCamel}Table.$inferInsert;
`;
}

export function generateMapperTs(n: ModuleNames, scope: string): string {
  return `/**
 * Mapper: traduce filas SQL a la entidad ${n.Entidad} de core y viceversa.
 */
import { ${n.Entidad}, Nombre${n.Entidad} } from "@${scope}/core";
import type { ${n.Entidad}Row, Nuevo${n.Entidad}Row } from "../schema/${n.modulo}.schema.ts";

export const ${n.Entidad}Mapper = {
  toDomain(row: ${n.Entidad}Row): ${n.Entidad} {
    return ${n.Entidad}.reconstruir({
      id: row.id,
      nombre: Nombre${n.Entidad}.reconstruir(row.nombre),
      descripcion: row.descripcion,
      activo: row.activo,
      creadoEn: row.creadoEn,
    });
  },

  toPersistence(entidad: ${n.Entidad}): Nuevo${n.Entidad}Row {
    return {
      nombre: entidad.nombre,
      descripcion: entidad.descripcion,
      activo: entidad.activo,
    };
  },
};
`;
}

export function generateMySqlRepositoryTs(n: ModuleNames, scope: string): string {
  return `/**
 * MySql${n.Entidad}Repository: implementa I${n.Entidad}Repository con Drizzle.
 */
import { count, desc, eq } from "drizzle-orm";
import type { ${n.Entidad}, I${n.Entidad}Repository } from "@${scope}/core";
import { type Paginated, type PaginationParams, toOffset } from "@${scope}/shared-kernel";
import type { Database } from "../connection.ts";
import { dbActual } from "../unit-of-work.ts";
import { ${n.moduloCamel}Table } from "../schema/${n.modulo}.schema.ts";
import { ${n.Entidad}Mapper } from "../mappers/${n.entidad}.mapper.ts";

export class MySql${n.Entidad}Repository implements I${n.Entidad}Repository {
  constructor(private readonly db: Database) {}

  async buscarPorId(id: number): Promise<${n.Entidad} | null> {
    const [row] = await dbActual(this.db).select().from(${n.moduloCamel}Table).where(eq(${n.moduloCamel}Table.id, id)).limit(1);
    return row ? ${n.Entidad}Mapper.toDomain(row) : null;
  }

  async buscarPorNombre(nombre: string): Promise<${n.Entidad} | null> {
    const [row] = await dbActual(this.db).select().from(${n.moduloCamel}Table).where(eq(${n.moduloCamel}Table.nombre, nombre)).limit(1);
    return row ? ${n.Entidad}Mapper.toDomain(row) : null;
  }

  async listar(paginacion: PaginationParams): Promise<Paginated<${n.Entidad}>> {
    const db = dbActual(this.db);
    const rows = await db
      .select()
      .from(${n.moduloCamel}Table)
      .orderBy(desc(${n.moduloCamel}Table.id))
      .limit(paginacion.pageSize)
      .offset(toOffset(paginacion));
    const [{ total }] = await db.select({ total: count() }).from(${n.moduloCamel}Table);
    return { items: rows.map(${n.Entidad}Mapper.toDomain), total, page: paginacion.page, pageSize: paginacion.pageSize };
  }

  async guardar(entidad: ${n.Entidad}): Promise<${n.Entidad}> {
    const db = dbActual(this.db);
    const datos = ${n.Entidad}Mapper.toPersistence(entidad);
    let id = entidad.id;
    if (id === null) {
      const [insertado] = await db.insert(${n.moduloCamel}Table).values(datos).$returningId();
      id = insertado.id;
    } else {
      await db.update(${n.moduloCamel}Table).set(datos).where(eq(${n.moduloCamel}Table.id, id));
    }
    const guardado = await this.buscarPorId(id);
    if (!guardado) throw new Error("[DB] No se pudo leer ${n.tabla} " + id + " tras guardarlo");
    return guardado;
  }
}
`;
}

export function generateModuleDdl(n: ModuleNames): string {
  return `CREATE TABLE IF NOT EXISTS ${n.tabla} (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  descripcion TEXT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;
}

// -------------------------------------------------------------
// 6. APPS — API (Hono) y MCP-SERVER
// -------------------------------------------------------------
export function generateApiControllerTs(n: ModuleNames, scope: string): string {
  return `/**
 * Controlador de ${n.modulo}: valida con Zod (forma), invoca el caso de uso del contenedor
 * y delega la respuesta a presentResult. Sin lógica de negocio ni instanciación manual.
 */
import { Crear${n.Entidad}Schema, Listar${n.Modulo}QuerySchema } from "@${scope}/contracts";
import { safeHandler } from "../http/safe-handler.ts";
import { presentResult, presentValidationError } from "../http/present-result.ts";

export const ${n.moduloCamel}Controller = {
  listar: safeHandler(async (c) => {
    const parsed = Listar${n.Modulo}QuerySchema.safeParse(c.req.query());
    if (!parsed.success) return presentValidationError(c, parsed.error);
    const result = await c.get("container").listar${n.Modulo}.execute(parsed.data, c.get("actor"));
    return presentResult(c, result);
  }),

  crear: safeHandler(async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = Crear${n.Entidad}Schema.safeParse(body);
    if (!parsed.success) return presentValidationError(c, parsed.error);
    const result = await c.get("container").crear${n.Entidad}.execute(parsed.data, c.get("actor"));
    return presentResult(c, result, 201);
  }),
};
`;
}

export function generateApiRoutesTs(n: ModuleNames, scope: string): string {
  return `/**
 * Rutas de ${n.modulo}: JWT + permiso RBAC por ruta.
 */
import { Hono } from "hono";
import { PERMISSIONS } from "@${scope}/contracts";
import type { AppEnv } from "../types.ts";
import { requireAuth, requirePermission } from "../middlewares/auth.ts";
import { ${n.moduloCamel}Controller } from "../controllers/${n.modulo}.controller.ts";

export const ${n.moduloCamel}Routes = new Hono<AppEnv>();

${n.moduloCamel}Routes.use("*", requireAuth);
${n.moduloCamel}Routes.get("/", requirePermission(PERMISSIONS.${n.MODULO}_LEER), ${n.moduloCamel}Controller.listar);
${n.moduloCamel}Routes.post("/", requirePermission(PERMISSIONS.${n.MODULO}_CREAR), ${n.moduloCamel}Controller.crear);
`;
}

export function generateMcpModuleToolsTs(n: ModuleNames, scope: string): string {
  return `/**
 * Herramientas MCP del módulo ${n.modulo}. ToolGateway valida, autoriza, ejecuta y registra.
 */
import { Crear${n.Entidad}Schema, Listar${n.Modulo}QuerySchema, MCP_TOOLS, PERMISSIONS } from "@${scope}/contracts";
import type { ToolGateway } from "../tool-gateway.ts";

export function registrar${n.Modulo}Tools(gateway: ToolGateway): void {
  gateway.register({
    name: MCP_TOOLS.${n.MODULO}_LISTAR,
    description: "Lista ${n.modulo} paginados.",
    schema: Listar${n.Modulo}QuerySchema,
    permission: PERMISSIONS.${n.MODULO}_LEER,
    execute: (input, container, actor) => container.listar${n.Modulo}.execute(input, actor),
  });

  gateway.register({
    name: MCP_TOOLS.${n.MODULO}_CREAR,
    description: "Crea un ${n.entidad}.",
    schema: Crear${n.Entidad}Schema,
    permission: PERMISSIONS.${n.MODULO}_CREAR,
    execute: (input, container, actor) => container.crear${n.Entidad}.execute(input, actor),
  });
}
`;
}

// -------------------------------------------------------------
// 7. FRONTEND — features/<modulo>
// -------------------------------------------------------------
export function generateFeatureTypesTs(n: ModuleNames, scope: string): string {
  return `/**
 * Tipos de vista del módulo ${n.modulo}.
 */
import type { ${n.Entidad}Dto } from "@${scope}/contracts";

export interface Pagina${n.Modulo} {
  items: ${n.Entidad}Dto[];
  total: number;
  page: number;
  pageSize: number;
}
`;
}

export function generateFeatureApiTs(n: ModuleNames, scope: string): string {
  return `/**
 * Servicio HTTP de ${n.modulo}, tipado con @${scope}/contracts.
 */
import type { Crear${n.Entidad}Input, ${n.Entidad}Dto } from "@${scope}/contracts";
import { httpClient } from "@/lib/http-client";
import type { Pagina${n.Modulo} } from "../types/${n.modulo}.types";

export const ${n.moduloCamel}Api = {
  listar: (page = 1, pageSize = 20) => httpClient.get<Pagina${n.Modulo}>("/api/${n.modulo}?page=" + page + "&pageSize=" + pageSize),
  crear: (input: Crear${n.Entidad}Input) => httpClient.post<${n.Entidad}Dto>("/api/${n.modulo}", input),
};
`;
}

export function generateFeatureHookTs(n: ModuleNames, scope: string): string {
  return `"use client";

/**
 * Estado, paginación y mutaciones del módulo ${n.modulo}.
 */
import { useCallback, useEffect, useState } from "react";
import { Crear${n.Entidad}Schema, type Crear${n.Entidad}Input } from "@${scope}/contracts";
import { ${n.moduloCamel}Api } from "../api/${n.modulo}.api";
import type { Pagina${n.Modulo} } from "../types/${n.modulo}.types";

export function use${n.Modulo}() {
  const [pagina, setPagina] = useState<Pagina${n.Modulo} | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (page = 1) => {
    setCargando(true);
    const res = await ${n.moduloCamel}Api.listar(page);
    if (res.ok) {
      setPagina(res.data);
      setError(null);
    } else {
      setError(res.error.message);
    }
    setCargando(false);
  }, []);

  const crear = useCallback(async (input: Crear${n.Entidad}Input): Promise<boolean> => {
    const parsed = Crear${n.Entidad}Schema.safeParse(input);
    if (!parsed.success) {
      setError("Datos inválidos: revisa el formulario.");
      return false;
    }
    const res = await ${n.moduloCamel}Api.crear(parsed.data);
    if (!res.ok) {
      setError(res.error.message);
      return false;
    }
    await cargar(pagina?.page ?? 1);
    return true;
  }, [cargar, pagina?.page]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { pagina, cargando, error, cargar, crear };
}
`;
}

export function generateFeatureComponentTsx(n: ModuleNames): string {
  return `"use client";

/**
 * Vista del módulo ${n.modulo}: formulario de creación + tabla.
 */
import { type FormEvent, useState } from "react";
import { use${n.Modulo} } from "../hooks/use-${n.modulo}";

export function ${n.Modulo}Vista() {
  const { pagina, cargando, error, crear } = use${n.Modulo}();
  const [nombre, setNombre] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (await crear({ nombre })) setNombre("");
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">${n.Modulo}</h1>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
          className="flex-1 rounded border border-slate-300 px-3 py-2"
        />
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">Crear</button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {cargando && <p className="text-sm text-slate-500">Cargando…</p>}

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">ID</th>
            <th className="py-2">Nombre</th>
            <th className="py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {pagina?.items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{item.id}</td>
              <td className="py-2">{item.nombre}</td>
              <td className="py-2">{item.activo ? "Activo" : "Inactivo"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
`;
}

export function generatePanelPageTsx(n: ModuleNames): string {
  return `import { ${n.Modulo}Vista } from "@/features/${n.modulo}/components/${n.Modulo}Vista";

export default function ${n.Modulo}Page() {
  return <${n.Modulo}Vista />;
}
`;
}

// -------------------------------------------------------------
// 8. HTTP
// -------------------------------------------------------------
export function generateModuleHttp(n: ModuleNames, port: number): string {
  return `@baseUrl = http://localhost:${port}/api
@token = PEGA_AQUI_UN_ACCESS_TOKEN_JWT

### Listar ${n.modulo}
GET {{baseUrl}}/${n.modulo}?page=1&pageSize=20
Authorization: Bearer {{token}}

### Crear ${n.entidad} (201)
POST {{baseUrl}}/${n.modulo}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre": "Ejemplo de ${n.entidad}",
  "descripcion": "Creado desde Http/${n.modulo}.http"
}

### Crear ${n.entidad} duplicado (409 ${n.ENTIDAD}_DUPLICADO)
POST {{baseUrl}}/${n.modulo}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre": "Ejemplo de ${n.entidad}"
}

### Crear ${n.entidad} inválido (400 VALIDATION_ERROR)
POST {{baseUrl}}/${n.modulo}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre": ""
}

### Sin token (401 NO_AUTENTICADO)
GET {{baseUrl}}/${n.modulo}
`;
}
