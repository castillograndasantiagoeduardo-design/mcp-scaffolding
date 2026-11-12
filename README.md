# 🛠️ MCP Server: Clean Architecture Scaffolder (`mcp-scaffold-al`)

Servidor **Model Context Protocol (MCP)** diseñado para crear de forma automática un monorepo con **Arquitectura Limpia + Hexagonal + DDD táctico** según [`arquitectura_limpia.md`](./arquitectura_limpia.md), incorporando un sistema integrado de contexto para asistentes de IA (`CLAUDE.md`, `GEMINI.md`, carpeta `context/`, `LAYER.md` por capa y `MODULE.md` por módulo).

---

## 🌟 Características Principales

1. **Scaffolding Integral:** Genera con una sola llamada todas las capas del monorepo:
   - `Shared/contracts` (`@<scope>/contracts`: esquemas Zod, roles, permisos, acciones de auditoría, tools MCP).
   - `Backend/packages/{shared-kernel, core, database, platform, composition}` y `Backend/apps/{api, mcp-server}` (workspace **Deno 2.x**).
   - `Frontend/src/{app, features, components, lib}` (**Next.js 16 + Tailwind v4**).
   - `Docs/` (DDL MySQL 8 con triggers append-only) y `Http/` (pruebas `.http`).
2. **Código Base Funcional:** `Result` (`ok`/`err`), `DomainError`, `Pagination`, `IUnitOfWork`, `IAuditor`, `sanitizarDetalles`, `createContainer`, `safeHandler`, `presentResult`, `ToolGateway` y `http-client.ts`.
3. **Módulos por Capas:** cada módulo se crea siguiendo los 7 pasos de la arquitectura (contrato → dominio → caso de uso + test → Drizzle → composition → Hono/MCP → Frontend) y queda registrado en `createContainer`, rutas, tools MCP, `Docs/ddl.sql`, `CLAUDE.md` y `GEMINI.md`.
4. **Sistema de Contexto para Modelos de IA:**
   - **`CLAUDE.md`** y **`GEMINI.md`** (en la raíz): índice de contexto, resumen de la arquitectura, mapa de directorios y lista de módulos.
   - **`context/rules_architecture.md`**: filosofía, diagramas Mermaid, matriz de dependencias y las 7 Reglas de Oro.
   - **`context/ai_development_workflow.md`**: los 7 pasos para agregar funcionalidad, con checklist.
   - **`LAYER.md`** en cada capa y **`MODULE.md`** en cada módulo.

**Stack generado:** Deno 2.x · Hono · Drizzle ORM + MySQL 8 · Zod · Next.js 16 + Tailwind v4.

---

## 🧰 Herramientas MCP Expuestas

### 1. `scaffold_clean_project`
Genera automáticamente el monorepo completo en el directorio especificado, incluido el módulo inicial.

**Parámetros:**
- `targetPath` (string, obligatorio): Ruta donde se creará el proyecto.
- `projectName` (string, opcional): Nombre del proyecto (por defecto: nombre de la carpeta).
- `scope` (string, opcional): Scope de los paquetes `@<scope>/...` (por defecto: `projectName` en minúsculas).
- `initialModule` (string, opcional): Módulo inicial a generar (ej. `productos`, `clientes`). Por defecto: `item`.
- `port` (number, opcional): Puerto de la API HTTP (por defecto: `8001`).
- `dbHost` (string, opcional): Host de la base de datos (por defecto: `localhost`).
- `dbPort` (number, opcional): Puerto MySQL (por defecto: `3306`).
- `dbUser` (string, opcional): Usuario MySQL (por defecto: `root`).
- `dbPassword` (string, opcional): Contraseña de la base de datos.
- `dbName` (string, opcional): Nombre de la base de datos.

### 2. `add_module`
Agrega un módulo nuevo en todas las capas de un proyecto ya generado y crea su `MODULE.md`.

**Parámetros:**
- `targetPath` (string, obligatorio): Ruta del proyecto.
- `moduleName` (string, obligatorio): Nombre del módulo en plural y minúsculas (ej. `productos`).

### 3. `inspect_project_structure`
Audita si un proyecto existente cumple con las capas, el código base y los archivos de contexto del estándar.

**Parámetros:**
- `targetPath` (string, obligatorio): Ruta del proyecto a auditar.

---

## ⚙️ Registro y Configuración en Clientes MCP

Primero compila el servidor:

```bash
npm install
npm run build
```

### Antigravity y Claude Desktop

Agrega la siguiente entrada a tu archivo de configuración de MCP (en Claude Desktop: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "scaffold-al": {
      "command": "node",
      "args": [
        "C:\\Users\\ADSO\\Desktop\\MCP_SCAFOLD_AL\\dist\\index.js"
      ]
    }
  }
}
```

### Claude Code

Regístralo desde la terminal:

```bash
claude mcp add scaffold-al -- node "C:\Users\ADSO\Desktop\MCP_SCAFOLD_AL\dist\index.js"
```

O agrega un archivo `.mcp.json` en la raíz de tu proyecto:

```json
{
  "mcpServers": {
    "scaffold-al": {
      "command": "node",
      "args": [
        "C:\\Users\\ADSO\\Desktop\\MCP_SCAFOLD_AL\\dist\\index.js"
      ]
    }
  }
}
```

---

## 🚀 Uso Rápido sin Cliente (CLI / Scripts)

También puedes probar o ejecutar la generación directamente desde Node.js:

```bash
# Compilar cambios de TypeScript:
npm run build

# Iniciar el servidor MCP en stdio:
npm start
```

O llamarlo directamente desde un script de Node:

```js
import { scaffoldCleanProject, addModule } from "./dist/scaffolder.js";

await scaffoldCleanProject({
  targetPath: "../MiProyecto",
  projectName: "MiProyecto",
  initialModule: "clientes",
  port: 8001,
});

await addModule({
  targetPath: "../MiProyecto",
  moduleName: "productos",
});
```

Después, en el proyecto generado:

```bash
cd Backend
deno task check   # Verificación de tipos de api y mcp-server
deno task test    # Tests unitarios de core
deno task dev:api # API REST (requiere .env y MySQL con Docs/ddl.sql)
```
