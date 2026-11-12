/**
 * Plantillas para los archivos de contexto de IA:
 * CLAUDE.md, GEMINI.md, context/*.md, LAYER.md por capa y MODULE.md por módulo.
 */

import { ProjectConfig } from "./rootProject.js";
import { ModuleNames } from "./modules.js";

// -------------------------------------------------------------
// CLAUDE.md / GEMINI.md
// -------------------------------------------------------------
export function generateAgentContextMd(config: ProjectConfig, asistente: "Claude" | "Gemini"): string {
  const s = config.scope;
  return `# 🤖 Contexto Global del Proyecto - ${config.projectName}

> **Documento Maestro de Contexto para Asistentes de IA (${asistente})**
> Punto de entrada para entender la arquitectura, reglas, flujo de trabajo y módulos de este monorepo con **Clean Architecture + Hexagonal + DDD táctico**.

---

## ⚠️ Instrucción Obligatoria

**Antes de modificar una capa, lee su \`LAYER.md\` y el \`MODULE.md\` del módulo que vas a tocar.** Si una petición contradice la matriz de dependencias o las 7 Reglas de Oro, detente y explícalo antes de escribir código.

---

## 🧭 1. Índice de Archivos de Contexto

| Archivo | Propósito | Cuándo consultarlo |
| :--- | :--- | :--- |
| **[\`context/rules_architecture.md\`](./context/rules_architecture.md)** | Filosofía, diagramas, matriz de dependencias y las 7 Reglas de Oro. | **SIEMPRE** antes de escribir código. |
| **[\`context/ai_development_workflow.md\`](./context/ai_development_workflow.md)** | Los 7 pasos para agregar funcionalidad, con checklist. | Al recibir "crea el módulo X", "agrega el endpoint Y", etc. |
| **\`<capa>/LAYER.md\`** | Propósito, importaciones permitidas/prohibidas, restricciones y ejemplo de la capa. | Antes de modificar cualquier archivo de esa capa. |
| **\`Backend/packages/core/src/modules/<modulo>/MODULE.md\`** | Entidades, casos de uso, errores y archivos del módulo en cada capa. | Antes de modificar un módulo. |

**LAYER.md por capa:**

| Capa | LAYER.md |
| :--- | :--- |
| \`@${s}/shared-kernel\` | [\`Backend/packages/shared-kernel/LAYER.md\`](./Backend/packages/shared-kernel/LAYER.md) |
| \`@${s}/contracts\` | [\`Shared/contracts/LAYER.md\`](./Shared/contracts/LAYER.md) |
| \`@${s}/core\` | [\`Backend/packages/core/LAYER.md\`](./Backend/packages/core/LAYER.md) |
| \`@${s}/database\` | [\`Backend/packages/database/LAYER.md\`](./Backend/packages/database/LAYER.md) |
| \`@${s}/platform\` | [\`Backend/packages/platform/LAYER.md\`](./Backend/packages/platform/LAYER.md) |
| \`@${s}/composition\` | [\`Backend/packages/composition/LAYER.md\`](./Backend/packages/composition/LAYER.md) |
| \`@${s}/api\` | [\`Backend/apps/api/LAYER.md\`](./Backend/apps/api/LAYER.md) |
| \`@${s}/mcp-server\` | [\`Backend/apps/mcp-server/LAYER.md\`](./Backend/apps/mcp-server/LAYER.md) |
| \`Frontend\` | [\`Frontend/LAYER.md\`](./Frontend/LAYER.md) |

---

## 🏛️ 2. Resumen Ejecutivo de la Arquitectura

- **Backend:** Workspace **Deno 2.x** con TypeScript.
- **HTTP:** **Hono** (\`apps/api\`). **IA:** Servidor **MCP** (\`apps/mcp-server\`).
- **Persistencia:** **Drizzle ORM + MySQL 8** (\`mysql2/promise\`).
- **Validación en frontera:** **Zod** (\`Shared/contracts\`).
- **Frontend:** **Next.js 16** (App Router + Features) + **Tailwind v4**.
- **Dependencias:** siempre apuntan hacia adentro (hacia \`core\` y \`shared-kernel\`).
- **Errores de negocio:** \`Result<T, DomainError>\`, nunca \`throw\`.
- **Ensamblaje:** solo en \`createContainer\` (\`@${s}/composition\`).

---

## 🌳 3. Mapa de Directorios

\`\`\`text
${config.projectName}/
├── CLAUDE.md / GEMINI.md       # 🌟 Orquestadores de contexto para IA
├── context/                    # 📜 rules_architecture.md, ai_development_workflow.md
├── Shared/
│   └── contracts/              # @${s}/contracts (Esquemas Zod, Roles, Permisos RBAC)
├── Backend/                    # Workspace Deno 2.x (deno.json)
│   ├── packages/
│   │   ├── shared-kernel/      # @${s}/shared-kernel (Result<T,E>, DomainError, Pagination)
│   │   ├── core/               # @${s}/core (Entidades, Value Objects, Casos de Uso, Puertos)
│   │   ├── database/           # @${s}/database (Drizzle ORM, MySQL2, Repositorios, UnitOfWork)
│   │   ├── platform/           # @${s}/platform (Servicios técnicos: JWT HS256, ...)
│   │   └── composition/        # @${s}/composition (Contenedor DI: createContainer)
│   └── apps/
│       ├── api/                # @${s}/api (Servidor HTTP REST con Hono)
│       └── mcp-server/         # @${s}/mcp-server (Servidor MCP para Agentes IA)
├── Frontend/                   # Next.js 16 (App Router + Features + Tailwind v4)
│   └── src/{app, features, components, lib}
├── Docs/                       # Documentación técnica (DDL SQL, ADRs, guías)
└── Http/                       # Pruebas funcionales ejecutables (.http)
\`\`\`

---

## 📦 4. Módulos del Proyecto

Cada módulo vive en \`Backend/packages/core/src/modules/<modulo>/\` y tiene su \`MODULE.md\`:

<!-- @scaffold:modules -->

---

## ⚡ 5. Reglas de Oro (resumen — detalle en \`context/rules_architecture.md\`)

1. **Ley de Dependencia Estricta:** respeta la matriz de importaciones.
2. **Pureza de \`core\`:** nada de \`drizzle-orm\`, \`mysql2\`, \`hono\`, \`jose\`, \`argon2\`, \`nodemailer\` ni \`Deno.env\`.
3. **\`Result<T, DomainError>\`:** ninguna regla de negocio lanza \`throw\`.
4. **Sin instanciación manual** fuera de \`composition\`.
5. **Validación Zod obligatoria** en la frontera.
6. **Auditoría transversal** con \`IAuditor\` y \`sanitizarDetalles\`.
7. **Integridad de BD:** tablas append-only, correcciones por movimiento inverso.

---

## 🚀 6. Comandos Frecuentes

\`\`\`bash
# Backend (desde Backend/)
deno task dev:api      # API REST Hono
deno task dev:mcp      # Servidor MCP (stdio)
deno task test         # Tests unitarios de core
deno task check        # Verificación de tipos

# Frontend (desde Frontend/)
npm install && npm run dev
\`\`\`
`;
}

export function generateModuleListEntry(n: ModuleNames): string {
  return `- **\`${n.modulo}\`** — Entidad \`${n.Entidad}\` · [MODULE.md](./Backend/packages/core/src/modules/${n.modulo}/MODULE.md)`;
}

// -------------------------------------------------------------
// context/rules_architecture.md
// -------------------------------------------------------------
export function generateRulesArchitectureMd(config: ProjectConfig): string {
  const s = config.scope;
  const p = config.projectName;
  return `# 🏛️ Reglas de Arquitectura Limpia — ${p}

> **Documento de Referencia Arquitectónica (Clean Architecture + Domain-Driven Design)**
> Describe cómo está organizado el monorepo de **${p}**, cómo interactúa cada capa en tiempo de ejecución y cuáles son las reglas obligatorias que preservan la pureza del dominio.

---

## 1. Filosofía Arquitectónica

**${p}** está diseñado bajo los principios de **Clean Architecture (Arquitectura Limpia)**, **Arquitectura Hexagonal (Puertos y Adaptadores)** y **Domain-Driven Design (DDD) táctico**.

El objetivo central es **aislar las reglas de negocio** de cualquier detalle técnico externo (base de datos MySQL, framework HTTP Hono, protocolo MCP de IA o interfaz Next.js).

\`\`\`mermaid
flowchart TB
    subgraph External ["Capa Externa: Entradas y Clientes"]
        UI["Frontend Web (Next.js 16)"]
        HTTP["Adaptador Primario: API REST (Hono)"]
        MCP["Adaptador Primario: Servidor MCP (IA)"]
    end

    subgraph Wiring ["Capa de Ensamblaje (Inyección de Dependencias)"]
        COMP["Composition Root (@${s}/composition)"]
    end

    subgraph Infra ["Capa de Infraestructura (Adaptadores Secundarios)"]
        DB["Persistencia (@${s}/database - Drizzle + MySQL 8)"]
        PLAT["Servicios Técnicos (@${s}/platform - JWT, Argon2, TOTP, SMTP)"]
    end

    subgraph CoreDomain ["Núcleo del Sistema (Dominio y Aplicación)"]
        APP["Casos de Uso y Puertos (@${s}/core - Application)"]
        DOM["Entidades, Value Objects y Reglas (@${s}/core - Domain)"]
        SK["Primitivas Base (@${s}/shared-kernel - Result, DomainError)"]
    end

    subgraph SharedContracts ["Frontera de Datos Compartida"]
        ZOD["Contratos y Esquemas (@${s}/contracts - Zod)"]
    end

    UI -->|Peticiones HTTP JSON| HTTP
    HTTP -->|Delega ejecución| COMP
    MCP -->|Delega ejecución| COMP
    COMP -->|Instancia e inyecta| APP
    COMP -->|Conecta adaptadores| DB
    COMP -->|Conecta adaptadores| PLAT
    DB -.->|Implementa Puertos| APP
    PLAT -.->|Implementa Puertos| APP
    APP --> DOM
    DOM --> SK
    UI --> ZOD
    HTTP --> ZOD
    MCP --> ZOD
    APP --> ZOD
\`\`\`

---

## 2. Flujo de una Petición (Adaptadores Primarios)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente (Frontend / Agente IA)
    participant Entry as Adaptador Primario (Hono API / MCP Tool)
    participant Zod as @${s}/contracts (Zod)
    participant UC as Caso de Uso (@${s}/core)
    participant Repo as Repositorio (@${s}/database)
    participant Audit as IAuditor (@${s}/database)

    Cliente->>Entry: Petición (HTTP Request / MCP CallTool)
    Entry->>Entry: Verifica Autenticación JWT y Permiso RBAC
    Entry->>Zod: Valida payload en frontera (safeParse)
    alt Validación Zod falla
        Zod-->>Entry: Errores de formato
        Entry-->>Cliente: 400 Bad Request (VALIDATION_ERROR)
    else Validación Zod exitosa
        Entry->>UC: container.useCase.execute(dto, actorContext)
        UC->>Repo: Lee / Persiste entidades (vía Puerto)
        Repo-->>UC: Entidades de dominio
        UC->>Audit: Registra evento inmutable ({ antes, despues })
        UC-->>Entry: Result.ok(data) o Result.err(DomainError)
        Entry->>Entry: presentResult() mapea Result a HTTP Status / MCP Response
        Entry-->>Cliente: Respuesta estandarizada JSON
    end
\`\`\`

---

## 3. Las 7 Reglas de Oro de esta Arquitectura (No Negociables)

Para evitar la degradación arquitectónica (acoplamiento espagueti), todo código nuevo o modificación debe cumplir estas **7 reglas estrictas**:

### Regla 1: Ley de Dependencia Estricta (Matriz de Importaciones)
Las dependencias **siempre apuntan hacia adentro** (hacia \`core\` y \`shared-kernel\`). Ninguna capa interna puede saber nada de una capa externa.

| Paquete / Capa | ✅ Puede importar de | ❌ PROHIBIDO importar de |
| :--- | :--- | :--- |
| **\`shared-kernel\`** | *(Ninguno — TypeScript puro)* | Cualquier paquete o librería externa |
| **\`Shared/contracts\`** | \`zod\` | \`core\`, \`database\`, \`platform\`, \`api\`, \`Frontend\` |
| **\`core\`** | \`shared-kernel\`, \`Shared/contracts\` | \`database\` (Drizzle/MySQL), \`platform\` (JWT/Argon2), \`api\` (Hono), \`composition\` |
| **\`database\`** | \`core\`, \`shared-kernel\`, \`drizzle-orm\`, \`mysql2\` | \`platform\`, \`composition\`, \`api\`, \`mcp-server\` |
| **\`platform\`** | \`core\`, \`shared-kernel\`, \`Shared/contracts\` | \`database\`, \`composition\`, \`api\`, \`mcp-server\` |
| **\`composition\`** | \`core\`, \`database\`, \`platform\`, \`shared-kernel\`, \`Shared/contracts\` | \`api\`, \`mcp-server\`, \`Frontend\` |
| **\`apps/api\` y \`mcp-server\`** | \`composition\`, \`core\` *(solo tipos/errores)*, \`shared-kernel\`, \`Shared/contracts\` | \`database\` (repositorios/Drizzle directo), \`platform\` directo |
| **\`Frontend\`** | \`Shared/contracts\`, librerías React/Next.js | **Cualquier paquete de \`Backend/\`** |

---

### Regla 2: Pureza Absoluta de \`core\`
* En \`Backend/packages/core\` está **terminantemente prohibido** importar \`drizzle-orm\`, \`mysql2\`, \`hono\`, \`jose\`, \`argon2\`, \`nodemailer\` o usar \`Deno.env\` directamente.
* Si un caso de uso necesita enviar un correo, firmar un token, consultar la hora o ejecutar una transacción SQL, debe definir una **interfaz (Puerto)** en \`core\` e inyectarla por constructor.

---

### Regla 3: Prohibición de Excepciones para Flujo de Negocio (\`Result<T, DomainError>\`)
* Ninguna regla de negocio fallida (ej. usuario inactivo, turno de caja ya abierto, stock insuficiente, factura ya anulada) puede lanzar \`throw new Error(...)\`.
* Todo fallo de dominio esperado debe devolverse como \`Result.err(new DomainError('CODIGO', 'Mensaje'))\`.
* Las excepciones (\`try/catch\`) solo se usan en los adaptadores de infraestructura (\`database\`, \`platform\`, \`safeHandler\`) para atrapar fallos técnicos catastróficos (caída de red MySQL, timeout SMTP).

---

### Regla 4: Prohibición de Instanciación Manual fuera de \`composition\`
* Ningún controlador de \`apps/api\` ni herramienta de \`apps/mcp-server\` puede hacer \`new MySqlUsuarioRepository(...)\` ni \`new CrearUsuarioUseCase(...)\`.
* Todo caso de uso se registra en \`Backend/packages/composition/src/container.ts\` (\`createContainer\`) y se consume ya ensamblado desde \`AppContainer\`.

---

### Regla 5: Validación Obligatoria en la Frontera con Zod
* Ningún dato proveniente del exterior (body JSON, query params, parámetros de rutas o argumentos de herramientas MCP) puede entrar a un caso de uso sin pasar primero por un esquema Zod de \`@${s}/contracts\`.
* Tampoco se deben duplicar validaciones de negocio complejas en los controladores: el controlador valida la **estructura** con Zod y el caso de uso valida las **invariantes del negocio**.

---

### Regla 6: Auditoría Transversal e Inmutabilidad (\`IAuditor\`)
* Todo caso de uso que **cree, actualice, anule o cambie el estado** de una entidad debe inyectar el puerto \`IAuditor\` y registrar la operación.
* El detalle de auditoría sigue el contrato \`{ antes: {...}, despues: {...} }\` registrando únicamente los campos afectados.
* **Sanitización obligatoria:** Jamás se registran en auditoría \`password_hash\`, \`totp_secret\`, tokens JWT ni códigos de recuperación (se filtran mediante \`sanitizarDetalles\`).

---

### Regla 7: Respeto a las Reglas de Integridad de Base de Datos
* **Tablas Append-Only:** \`movimientos_inventario\` (Kardex) y \`logs_auditoria\` son estrictamente inmutables (protegidas por triggers en MySQL que bloquean \`UPDATE\` y \`DELETE\`).
* **Correcciones contables y de stock:** Una entrada de inventario o venta equivocada nunca se borra ni se edita en el Kardex; se compensa insertando un nuevo movimiento inverso (\`ajuste_entrada\`, \`ajuste_salida\`, \`anulacion_entrada\`, \`devolucion_venta\`).
* **Sede Principal Reservada:** La sucursal con \`id_sucursal = 1\` (*Sede Principal - Sistema*) es estructural y no puede ser inactivada ni eliminada.
`;
}

// -------------------------------------------------------------
// context/ai_development_workflow.md
// -------------------------------------------------------------
export function generateAiWorkflowMd(config: ProjectConfig): string {
  const s = config.scope;
  return `# 🤖 Flujo de Trabajo para Asistentes de IA (AI Development Workflow)

Protocolo que la IA debe seguir estrictamente al agregar o modificar funcionalidades. El orden de trabajo siempre es **de adentro hacia afuera**.

> 💡 Para crear un módulo nuevo completo usa la herramienta MCP **\`add_module\`**: genera los archivos de los 7 pasos, el \`MODULE.md\` y actualiza \`CLAUDE.md\` / \`GEMINI.md\`.

---

## 📋 Los 7 Pasos para Agregar una Funcionalidad

### Paso 1: Contrato (\`Shared/contracts\`)
- Crea el esquema Zod de entrada/salida en \`src/<modulo>.schema.ts\` y expórtalo en \`src/index.ts\`.
- Si aplica, agrega el permiso en \`permissions.ts\` y la acción en \`auditoria.catalogo.ts\`.

### Paso 2: Dominio (\`Backend/packages/core/.../domain\`)
- Crea o actualiza la Entidad, los Value Objects, los errores de dominio (\`DomainError\`) y la firma del método en la interfaz \`I*Repository\`.

### Paso 3: Caso de Uso (\`Backend/packages/core/.../application/use-cases\`)
- Implementa el caso de uso inyectando los puertos necesarios y el \`IAuditor\`.
- Firma: \`execute(input, contexto): Promise<Result<Output, DomainError>>\`.
- Escribe su test unitario en \`core/tests/\`.

### Paso 4: Infraestructura (\`Backend/packages/database\` o \`platform\`)
- Si agregaste tablas o métodos al repositorio, actualiza el esquema Drizzle, el Mapper (\`toDomain\` / \`toPersistence\`) y el repositorio \`MySql*Repository\`.
- Agrega la tabla a \`Docs/ddl.sql\`.

### Paso 5: Ensamblaje (\`Backend/packages/composition\`)
- Registra el nuevo caso de uso en \`createContainer\` (\`container.ts\`).

### Paso 6: Entrada (\`Backend/apps/api\` y/o \`apps/mcp-server\`)
- Crea la ruta en Hono y el método del controlador usando \`safeHandler\` + \`presentResult\`.
- Y/o registra la Tool MCP con \`ToolGateway.register(...)\`.
- Agrega las pruebas en \`Http/<modulo>.http\`.

### Paso 7: Interfaz (\`Frontend/src/features/<modulo>\`)
- Conecta el servicio HTTP en \`api/\`, el hook en \`hooks/\`, el componente visual en \`components/\` y los tipos de vista en \`types/\`.

---

## ✅ Checklist de Verificación de Calidad

Antes de dar por terminada una tarea, verifica:

- [ ] ¿Leí el \`LAYER.md\` de cada capa modificada y el \`MODULE.md\` del módulo?
- [ ] ¿Ninguna importación viola la matriz de la Regla 1?
- [ ] ¿\`core\` sigue sin importar \`drizzle-orm\`, \`mysql2\`, \`hono\`, \`jose\`, \`argon2\`, \`nodemailer\` ni \`Deno.env\`?
- [ ] ¿Todo fallo de negocio retorna \`Result.err(new DomainError(...))\` en lugar de \`throw\`?
- [ ] ¿El caso de uso está registrado en \`createContainer\` y no hay \`new\` de repositorios/casos de uso en \`apps/\`?
- [ ] ¿Toda entrada externa pasa por un esquema Zod de \`@${s}/contracts\`?
- [ ] ¿Los casos de uso que mutan estado inyectan \`IAuditor\` con \`{ antes, despues }\`?
- [ ] ¿Se respetan las tablas append-only (sin \`UPDATE\`/\`DELETE\`)?
- [ ] ¿Pasan \`deno task check\` y \`deno task test\`?
- [ ] ¿Se actualizó \`Http/<modulo>.http\` y el \`MODULE.md\`?
`;
}

// -------------------------------------------------------------
// LAYER.md por capa
// -------------------------------------------------------------
export interface LayerInfo {
  dir: string;
  title: string;
  purpose: string;
  contents: string[];
  canImport: string[];
  cannotImport: string[];
  restrictions: string[];
  example: string;
}

export function getLayers(config: ProjectConfig): LayerInfo[] {
  const s = config.scope;
  return [
    {
      dir: "Backend/packages/shared-kernel",
      title: `Capa 0: \`@${s}/shared-kernel\``,
      purpose: "Es el cimiento más interno del sistema. **No depende de ningún paquete ni librería externa.**",
      contents: [
        "`Result<T, E>`: Mónada funcional (`Result.ok(valor)` o `Result.err(error)`) que reemplaza el uso de `throw` para errores de negocio.",
        "`DomainError`: Clase base inmutable con `code` (ej. `'STOCK_INSUFICIENTE'`) y `message`.",
        "`Pagination`: Tipos base para consultas paginadas.",
      ],
      canImport: ["*(Ninguno — TypeScript puro)*"],
      cannotImport: ["Cualquier paquete o librería externa"],
      restrictions: [
        "No agregar dependencias (ni npm, ni jsr, ni otros paquetes del workspace).",
        "Ninguna regla de negocio fallida lanza `throw`: se devuelve `Result.err(new DomainError('CODIGO', 'Mensaje'))` (Regla 3).",
        "`DomainError` es inmutable y no extiende `Error`.",
      ],
      example: `import { Result, DomainError } from '@${s}/shared-kernel';

if (stockActual < cantidadSolicitada) {
  return Result.err(new DomainError('STOCK_INSUFICIENTE', 'No hay unidades suficientes en la sucursal.'));
}
return Result.ok(stockActual - cantidadSolicitada);`,
    },
    {
      dir: "Shared/contracts",
      title: `Capa 1: \`@${s}/contracts\``,
      purpose: "Es el **idioma común** entre el Frontend, la API REST, el servidor MCP y el Core. **Solo depende de `zod`.**",
      contents: [
        "Esquemas de validación de entrada (`Crear<Entidad>Schema`, `Listar<Modulo>QuerySchema`).",
        "Tipos inferidos con `z.infer<typeof Schema>` (DTOs).",
        "Catálogo oficial de roles (`ROLES`), permisos (`PERMISSIONS`), acciones de auditoría (`AUDIT_ACTIONS`) y nombres de herramientas MCP (`MCP_TOOLS`).",
      ],
      canImport: ["`zod`"],
      cannotImport: ["`core`", "`database`", "`platform`", "`api`", "`Frontend`"],
      restrictions: [
        "`contracts` valida la **forma** del dato; `core` valida las **reglas de negocio**. No mezclar.",
        "Ningún dato externo entra a un caso de uso sin pasar por un esquema de este paquete (Regla 5).",
        "Todo permiso nuevo se agrega en `permissions.ts` y toda acción auditable en `auditoria.catalogo.ts`.",
      ],
      example: `import { CrearProductoSchema } from '@${s}/contracts';

const parsed = CrearProductoSchema.safeParse(body);
if (!parsed.success) return presentValidationError(c, parsed.error);`,
    },
    {
      dir: "Backend/packages/core",
      title: `Capa 2: \`@${s}/core\``,
      purpose: "Es el **corazón del software**. Cada módulo en `src/modules/<modulo>/` se divide en `domain/` (entities, value-objects, errors, services, repositories) y `application/` (ports, use-cases).",
      contents: [
        "`domain/entities`: Entidades con identidad e invariantes de negocio.",
        "`domain/value-objects`: Objetos de valor inmutables.",
        "`domain/errors`: Errores específicos del módulo (extienden `DomainError`).",
        "`domain/services`: Servicios de dominio puros (ej. `sanitizarDetalles`).",
        "`domain/repositories`: Interfaces (Puertos) de persistencia (`I<Entidad>Repository`).",
        "`application/ports`: Interfaces hacia servicios técnicos (`ITokenService`, `IUnitOfWork`, `IAuditor`).",
        "`application/use-cases`: Casos de Uso (1 clase = 1 acción o flujo del sistema).",
        "`tests/`: Tests unitarios de casos de uso con adaptadores en memoria.",
      ],
      canImport: ["`shared-kernel`", "`Shared/contracts`"],
      cannotImport: ["`database` (Drizzle/MySQL)", "`platform` (JWT/Argon2)", "`api` (Hono)", "`composition`"],
      restrictions: [
        "**Regla 2:** prohibido importar `drizzle-orm`, `mysql2`, `hono`, `jose`, `argon2`, `nodemailer` o usar `Deno.env`. Para correo, tokens, hora o transacciones se define un Puerto y se inyecta por constructor.",
        "**Regla 3:** todo fallo de negocio retorna `Result.err(new DomainError(...))`; nunca `throw`.",
        "**Regla 6:** todo caso de uso que cree, actualice, anule o cambie estado inyecta `IAuditor` y registra `{ antes, despues }`.",
        "Un caso de uso recibe sus dependencias por **constructor** (solo interfaces), expone un único `execute(input, contexto)` y retorna `Promise<Result<Output, DomainError>>`.",
      ],
      example: `export class CrearProductoUseCase {
  constructor(
    private readonly repositorio: IProductoRepository,
    private readonly unitOfWork: IUnitOfWork,
    private readonly auditor: IAuditor,
  ) {}

  async execute(input: CrearProductoInput, contexto: ContextoActor): Promise<Result<ProductoSnapshot, DomainError>> {
    const creado = Producto.crear(input);
    if (!creado.ok) return creado;
    // ... persistir vía puerto y auditar con this.auditor.registrar({ ... detalles: { antes, despues } })
  }
}`,
    },
    {
      dir: "Backend/packages/database",
      title: `Capa 3A: \`@${s}/database\``,
      purpose: "Adaptador secundario. Habla con **MySQL 8.0** mediante **Drizzle ORM** y `mysql2/promise`, implementando los puertos de `core` (DIP).",
      contents: [
        "`schema/`: Definición de las tablas en Drizzle.",
        "`repositories/`: Clases `MySql<Entidad>Repository` que implementan `I<Entidad>Repository`, más `MySqlAuditor` y `MySqlMcpToolLogger`.",
        "`mappers/`: Traducen filas planas de SQL a Entidades ricas de `core` y viceversa (`toDomain`, `toPersistence`).",
        "`unit-of-work.ts`: Implementa `IUnitOfWork` con transacciones reales (`BEGIN`, `COMMIT`, `ROLLBACK`).",
      ],
      canImport: ["`core`", "`shared-kernel`", "`drizzle-orm`", "`mysql2`"],
      cannotImport: ["`platform`", "`composition`", "`api`", "`mcp-server`"],
      restrictions: [
        "Los repositorios usan `dbActual(this.db)` para participar en la transacción del `IUnitOfWork`.",
        "`try/catch` solo para fallos técnicos (caída de red MySQL) — Regla 3.",
        "**Regla 7:** `logs_auditoria` (y `movimientos_inventario`) son append-only; nunca `UPDATE`/`DELETE`. Las correcciones se hacen insertando un movimiento inverso.",
        "`MySqlAuditor` siempre pasa los detalles por `sanitizarDetalles` (Regla 6).",
      ],
      example: `export class MySqlProductoRepository implements IProductoRepository {
  constructor(private readonly db: Database) {}

  async buscarPorId(id: number): Promise<Producto | null> {
    const [row] = await dbActual(this.db).select().from(productosTable).where(eq(productosTable.id, id)).limit(1);
    return row ? ProductoMapper.toDomain(row) : null;
  }
}`,
    },
    {
      dir: "Backend/packages/platform",
      title: `Capa 3B: \`@${s}/platform\``,
      purpose: "Adaptador secundario. Provee implementaciones de criptografía, red, correo e IA para los puertos de `core`.",
      contents: [
        "`JwtTokenService` → implementa `ITokenService` (HS256).",
        "Aquí se agregan `Argon2PasswordHasher` (`IPasswordHasher`), `TotpService` (`ITotpService`), `SmtpMailer` (`IMailer`) y `GeminiAsistenteService` cuando el proyecto los necesite.",
      ],
      canImport: ["`core`", "`shared-kernel`", "`Shared/contracts`"],
      cannotImport: ["`database`", "`composition`", "`api`", "`mcp-server`"],
      restrictions: [
        "Cada servicio implementa un puerto definido en `core` (nunca al revés).",
        "`try/catch` solo para fallos técnicos (timeout SMTP, token mal formado) y se traducen a `Result.err(DomainError)`.",
        "No lee `Deno.env`: recibe su configuración por constructor desde `composition`.",
      ],
      example: `export class JwtTokenService implements ITokenService {
  async verificar(token: string): Promise<Result<TokenPayload, DomainError>> {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: ["HS256"] });
      return Result.ok({ usuarioId: Number(payload.sub), rol: String(payload.rol) });
    } catch {
      return Result.err(new DomainError("TOKEN_INVALIDO", "El token es inválido o ha expirado."));
    }
  }
}`,
    },
    {
      dir: "Backend/packages/composition",
      title: `Capa 4: \`@${s}/composition\``,
      purpose: "Es el **Composition Root**. Es el **único paquete** que conoce a `core`, `database` y `platform` simultáneamente.",
      contents: [
        "`createContainer(config)`: instancia el pool de MySQL, los repositorios y los servicios de plataforma e inyecta todo dentro de los casos de uso.",
        "`AppContainer`: tipo del contenedor listo para `apps/api` y `apps/mcp-server`.",
        "`loadConfigFromEnv()`: lee la configuración del entorno (Fail-Fast).",
      ],
      canImport: ["`core`", "`database`", "`platform`", "`shared-kernel`", "`Shared/contracts`"],
      cannotImport: ["`api`", "`mcp-server`", "`Frontend`"],
      restrictions: [
        "**No contiene ni una sola línea de lógica de negocio.**",
        "**Regla 4:** todo caso de uso se registra en `src/container.ts` y se consume ya ensamblado.",
      ],
      example: `export function createContainer(config: AppConfig) {
  const db = createDatabase(config.db);
  const auditor = new MySqlAuditor(db);
  const unitOfWork = new MySqlUnitOfWork(db);
  const productoRepository = new MySqlProductoRepository(db);

  return {
    crearProducto: new CrearProductoUseCase(productoRepository, unitOfWork, auditor),
  };
}`,
    },
    {
      dir: "Backend/apps/api",
      title: `Capa 5A: \`@${s}/api\` (Hono)`,
      purpose: "Adaptador primario: puerta de entrada HTTP REST al Backend.",
      contents: [
        "`main.ts`: crea el contenedor, monta middlewares y rutas.",
        "`src/middlewares/auth.ts`: `requireAuth` (JWT, usuario e IP) y `requirePermission` (RBAC).",
        "`src/routes/`: rutas Hono por módulo.",
        "`src/controllers/`: validan con Zod e invocan casos de uso desde `c.get('container')`.",
        "`src/http/safe-handler.ts` y `src/http/present-result.ts`.",
      ],
      canImport: ["`composition`", "`core` *(solo tipos/errores)*", "`shared-kernel`", "`Shared/contracts`"],
      cannotImport: ["`database` (repositorios/Drizzle directo)", "`platform` directo"],
      restrictions: [
        "Flujo: middlewares validan JWT y permiso RBAC → el controlador valida `c.req.json()`/`c.req.query()` con un esquema de contracts → invoca el caso de uso desde `c.get('container')` → `presentResult(c, result)`.",
        "`presentResult` convierte los códigos de `DomainError` en HTTP semánticos (`404`, `409`, `422`, `403`, `200`, `201`).",
        "**Regla 4:** prohibido `new MySql...Repository(...)` o `new ...UseCase(...)` aquí.",
        "**Regla 5:** sin validaciones de negocio en el controlador; solo estructura con Zod.",
      ],
      example: `crear: safeHandler(async (c) => {
  const parsed = CrearProductoSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return presentValidationError(c, parsed.error);
  const result = await c.get("container").crearProducto.execute(parsed.data, c.get("actor"));
  return presentResult(c, result, 201);
}),`,
    },
    {
      dir: "Backend/apps/mcp-server",
      title: `Capa 5B: \`@${s}/mcp-server\``,
      purpose: "Adaptador primario: expone los casos de uso como herramientas MCP para Agentes IA.",
      contents: [
        "`main.ts`: crea el contenedor, verifica `MCP_ACCESS_TOKEN` y conecta por stdio.",
        "`src/tool-gateway.ts`: `ToolGateway` valida el esquema Zod, comprueba el permiso del rol en sesión, ejecuta el caso de uso y registra en `logs_mcp_tools`.",
        "`src/tools/`: herramientas por módulo.",
      ],
      canImport: ["`composition`", "`core` *(solo tipos/errores)*", "`shared-kernel`", "`Shared/contracts`"],
      cannotImport: ["`database` (repositorios/Drizzle directo)", "`platform` directo"],
      restrictions: [
        "Toda herramienta se registra con `gateway.register(...)`; nunca con `server.tool` directo (se perdería validación, RBAC y log).",
        "Los nombres de herramientas salen de `MCP_TOOLS` en contracts.",
        "**Regla 4:** prohibido instanciar repositorios o casos de uso.",
      ],
      example: `gateway.register({
  name: MCP_TOOLS.PRODUCTOS_CREAR,
  description: "Crea un producto.",
  schema: CrearProductoSchema,
  permission: PERMISSIONS.PRODUCTOS_CREAR,
  execute: (input, container, actor) => container.crearProducto.execute(input, actor),
});`,
    },
    {
      dir: "Frontend",
      title: "Capa 6: `Frontend/` (Next.js 16 — Arquitectura por Features)",
      purpose: "Completamente desacoplado del Backend: solo se comunica por HTTP y comparte esquemas vía `@" + s + "/contracts`.",
      contents: [
        "`src/app/`: Solo define las páginas del App Router (`(autenticacion)`, `(panel)`, `(punto-de-venta)`) y delega el renderizado a `src/features/`.",
        "`src/features/<modulo>/`: `api/` (llamadas a `http-client.ts` tipadas con contracts), `hooks/` (estado, paginación, mutaciones), `components/` (tablas, modales, vistas), `types/` (tipos de vista).",
        "`src/components/ui/`: Sistema de diseño reutilizable.",
        "`src/lib/`: `http-client.ts` (con renovación automática de `refresh_token`) y formateadores.",
      ],
      canImport: ["`Shared/contracts`", "librerías React/Next.js"],
      cannotImport: ["**Cualquier paquete de `Backend/`**"],
      restrictions: [
        "Toda llamada HTTP pasa por `src/lib/http-client.ts`.",
        "Las páginas de `src/app/` no contienen lógica: importan componentes de `src/features/`.",
        "Validar formularios con los esquemas de contracts antes de enviar.",
      ],
      example: `export const productosApi = {
  listar: (page = 1) => httpClient.get<PaginaProductos>("/api/productos?page=" + page),
  crear: (input: CrearProductoInput) => httpClient.post<ProductoDto>("/api/productos", input),
};`,
    },
  ];
}

export function generateLayerMd(layer: LayerInfo): string {
  return `# 🧱 ${layer.title}

> Ruta: \`${layer.dir}\`
> Antes de modificar esta capa lee este archivo, \`context/rules_architecture.md\` y el \`MODULE.md\` del módulo afectado.

---

## 🎯 Propósito

${layer.purpose}

## 📦 ¿Qué contiene?

${layer.contents.map((c) => `- ${c}`).join("\n")}

---

## 🔗 Dependencias (Regla 1)

| ✅ Puede importar de | ❌ PROHIBIDO importar de |
| :--- | :--- |
| ${layer.canImport.join(", ")} | ${layer.cannotImport.join(", ")} |

---

## 🚫 Restricciones de la Capa

${layer.restrictions.map((r) => `- ${r}`).join("\n")}

---

## 🛠️ Forma de Uso

\`\`\`typescript
${layer.example}
\`\`\`
`;
}

// -------------------------------------------------------------
// MODULE.md por módulo
// -------------------------------------------------------------
export function generateModuleMd(scope: string, n: ModuleNames, files: Record<string, string[]>): string {
  const layerSections = Object.entries(files)
    .map(([capa, lista]) => `### ${capa}\n${lista.map((f) => `- \`${f}\``).join("\n")}`)
    .join("\n\n");

  return `# 📦 Módulo \`${n.modulo}\`

> Antes de modificar este módulo lee el \`LAYER.md\` de la capa que vas a tocar.

---

## 🎯 Propósito

Gestiona el ciclo de vida de la entidad **\`${n.Entidad}\`** (creación con nombre único y listado paginado), respetando la arquitectura limpia de extremo a extremo.

---

## 🧩 Dominio

| Elemento | Nombre | Descripción |
| :--- | :--- | :--- |
| Entidad | \`${n.Entidad}\` | \`id\`, \`nombre\`, \`descripcion\`, \`activo\`, \`creadoEn\`. Se crea con \`${n.Entidad}.crear()\` y se reconstruye con \`${n.Entidad}.reconstruir()\`. |
| Value Object | \`Nombre${n.Entidad}\` | Nombre recortado de 2 a 120 caracteres. |
| Servicio de dominio | \`verificarNombre${n.Entidad}Disponible\` | Falla si ya existe un \`${n.entidad}\` con el mismo nombre. |
| Puerto | \`I${n.Entidad}Repository\` | \`buscarPorId\`, \`buscarPorNombre\`, \`listar\`, \`guardar\`. |

## ⚠️ Errores de Dominio

| Código | Clase | HTTP |
| :--- | :--- | :--- |
| \`${n.ENTIDAD}_NO_ENCONTRADO\` | \`${n.Entidad}NoEncontradoError\` | 404 |
| \`${n.ENTIDAD}_DUPLICADO\` | \`${n.Entidad}DuplicadoError\` | 409 |
| \`${n.ENTIDAD}_NOMBRE_INVALIDO\` | \`${n.Entidad}NombreInvalidoError\` | 422 |
| \`${n.ENTIDAD}_YA_INACTIVO\` | \`${n.Entidad}YaInactivoError\` | 422 |

## ⚙️ Casos de Uso

| Caso de uso | Clave en \`AppContainer\` | Puertos inyectados | Permiso | Audita |
| :--- | :--- | :--- | :--- | :--- |
| \`Crear${n.Entidad}UseCase\` | \`crear${n.Entidad}\` | \`I${n.Entidad}Repository\`, \`IUnitOfWork\`, \`IAuditor\` | \`PERMISSIONS.${n.MODULO}_CREAR\` | ✅ \`AUDIT_ACTIONS.${n.ENTIDAD}_CREADO\` |
| \`Listar${n.Modulo}UseCase\` | \`listar${n.Modulo}\` | \`I${n.Entidad}Repository\` | \`PERMISSIONS.${n.MODULO}_LEER\` | ❌ (solo lectura) |

---

## 📁 Archivos por Capa

${layerSections}

---

## 🚫 Restricciones

- El dominio de \`${n.modulo}\` no importa \`drizzle-orm\`, \`mysql2\`, \`hono\`, \`jose\` ni \`Deno.env\` (Regla 2).
- Ningún fallo de negocio usa \`throw\`: retorna \`Result.err(new ${n.Entidad}...Error())\` (Regla 3).
- \`MySql${n.Entidad}Repository\` y los casos de uso solo se instancian en \`createContainer\` (Regla 4).
- Toda entrada pasa por \`Crear${n.Entidad}Schema\` / \`Listar${n.Modulo}QuerySchema\` (Regla 5).
- Todo caso de uso nuevo que mute \`${n.tabla}\` inyecta \`IAuditor\` y registra \`{ antes, despues }\` (Regla 6).
- Nuevos códigos de error deben seguir los sufijos que entiende \`presentResult\` (\`_NO_ENCONTRADO\`, \`_DUPLICADO\`, \`_YA_EXISTE\`).

---

## 🛠️ Forma de Uso

**HTTP (\`Http/${n.modulo}.http\`):**
\`\`\`http
POST /api/${n.modulo}
Authorization: Bearer <token>
Content-Type: application/json

{ "nombre": "Ejemplo de ${n.entidad}" }
\`\`\`

**MCP:** herramientas \`${n.tabla}_listar\` y \`${n.tabla}_crear\`.

**Desde un adaptador primario:**
\`\`\`typescript
const result = await container.crear${n.Entidad}.execute({ nombre: "Ejemplo" }, actor);
if (!result.ok) console.log(result.error.code); // ${n.ENTIDAD}_DUPLICADO, ...
\`\`\`

**Frontend:**
\`\`\`typescript
import { use${n.Modulo} } from "@/features/${n.modulo}/hooks/use-${n.modulo}";
const { pagina, crear } = use${n.Modulo}();
\`\`\`

---

## ➕ Cómo extender el módulo

Sigue los 7 pasos de \`context/ai_development_workflow.md\` (contrato → dominio → caso de uso + test → infraestructura → composition → api/mcp → frontend) y actualiza este archivo.

<!-- Paquete: @${scope}/core -->
`;
}
