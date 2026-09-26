---
titulo: Convenciones, comandos de build y arquitectura
resumen: Qué información poner en CLAUDE.md para que Claude trabaje como alguien del equipo - comandos exactos, convenciones que difieren de lo estándar, mapa de la arquitectura y reglas del repositorio, con plantillas para varios stacks.
---

## Objetivos de la lección

- Saber qué **tres bloques** de información dan más valor en un `CLAUDE.md`.
- Escribir comandos de build/test que Claude pueda ejecutar sin adivinar.
- Documentar convenciones y arquitectura de forma útil (y breve).
- Tener plantillas listas para proyectos Node, Python y monorepos.

## El filtro: ¿Claude podría deducirlo solo?

Antes de añadir una línea, pregúntate: **"si la quito, ¿Claude cometería un error?"**. Claude ya sabe programar y lee tu código. Lo valioso es lo que **no puede deducir** o lo que haría distinto por defecto.

| Merece estar | Sobra |
|---|---|
| Comandos no obvios (`make test-integration`, flags especiales) | "Es un proyecto React" (lo ve en `package.json`) |
| Convenciones que difieren de lo habitual | Convenciones estándar del lenguaje |
| Decisiones de arquitectura y el "porqué" | Documentación de API extensa (enlázala) |
| Trampas conocidas ("no toques X porque Y") | Información que cambia cada semana |
| Normas de ramas, commits y PRs | Tutoriales o explicaciones largas |

## Bloque 1: comandos

Es la sección más valiosa. Sé **exacto**: comando completo, desde qué carpeta y qué necesita.

```markdown
## Comandos
- Instalar dependencias: `pnpm install`
- Servidor local: `pnpm dev` → http://localhost:5173
- Tests unitarios: `pnpm test` (Vitest). Un solo archivo: `pnpm test src/cart/cart.test.ts`
- Tests e2e: `pnpm e2e` (necesita `pnpm dev` corriendo)
- Tipos: `pnpm typecheck`
- Lint con autofix: `pnpm lint --fix`
- Migraciones: `pnpm db:migrate` (usa DATABASE_URL de .env.local)
```

Consejos:

- Indica **cómo ejecutar un solo test**: Claude verifica más rápido y barato que con la suite completa.
- Menciona **dependencias externas** (Docker, Redis, variables de entorno).
- Si hay un comando "de cierre", dilo: *"Antes de terminar una tarea: `pnpm lint && pnpm typecheck && pnpm test`"*.

## Bloque 2: convenciones

Solo las que **se desvían** de lo que Claude haría por defecto, y de forma **verificable**:

```markdown
## Convenciones de código
- Módulos ES (`import`/`export`), nunca `require`.
- Componentes React: función + hooks; nada de clases.
- Nombres de archivo en kebab-case: `user-profile.tsx`.
- Fechas siempre con `date-fns`; no uses `moment`.
- Tests junto al archivo: `foo.ts` → `foo.test.ts`.
- Textos visibles al usuario: siempre vía `t('clave')` (i18n), nunca literales.
```

Evita lo vago: *"escribe código limpio"* no dice nada; *"funciones de menos de 40 líneas; extrae helpers a `src/lib/`"* sí.

## Bloque 3: arquitectura

Un **mapa corto** de dónde vive cada cosa y cómo fluye, más las decisiones clave:

```markdown
## Arquitectura
- `src/http/` – rutas y handlers (Fastify). Solo validan y llaman a servicios.
- `src/services/` – lógica de negocio. No importan nada de `http/`.
- `src/repos/` – acceso a datos (Drizzle ORM). Única capa que habla con la BD.
- `src/jobs/` – tareas en cola (BullMQ).
- Flujo: handler → service → repo. Nunca handler → repo directamente.

### Decisiones
- Usamos IDs ULID, no autoincrementales (se exponen en URLs).
- Dinero en céntimos (enteros), nunca `float`.
```

## Bloque extra: normas del repositorio

```markdown
## Git y PRs
- Ramas: `feat/…`, `fix/…`, `chore/…`.
- Commits: Conventional Commits (`feat(cart): …`).
- Nunca hagas commit directamente en `main`.
- Cada PR debe incluir tests y actualizar CHANGELOG.md si cambia la API pública.
```

## Plantillas por stack

### Node/TypeScript (web)

```markdown
# Tienda – frontend

## Comandos
- `npm ci` · `npm run dev` · `npm test` · `npm run lint` · `npm run build`
- Un test: `npx vitest run ruta/al/archivo.test.ts`

## Stack
- React 19 + Vite, TanStack Query para datos del servidor, Zustand para estado local.

## Convenciones
- Estilos con Tailwind; no crees archivos .css nuevos.
- Llamadas HTTP solo desde `src/api/*` (cliente generado desde OpenAPI: `npm run gen:api`).

## Antes de terminar
- `npm run lint && npm test`
```

### Python (servicio)

```markdown
# Servicio de facturación

## Entorno
- Python 3.12 con uv: `uv sync`
- Variables: copia `.env.example` a `.env`

## Comandos
- Tests: `uv run pytest -q` · un test: `uv run pytest tests/test_invoice.py::test_total`
- Lint/format: `uv run ruff check --fix . && uv run ruff format .`
- Tipos: `uv run mypy src`

## Convenciones
- Pydantic v2 para modelos de entrada/salida.
- Importes monetarios con `Decimal`, nunca `float`.
- Las funciones públicas llevan type hints y docstring de una línea.
```

### Monorepo

```markdown
# Monorepo (pnpm + Turborepo)

## Estructura
- `apps/web` (Next.js), `apps/api` (NestJS), `packages/ui`, `packages/config`

## Comandos
- Todo: `pnpm turbo run build test lint`
- Solo un paquete: `pnpm --filter @acme/api test`

## Reglas
- `packages/ui` no puede depender de `apps/*`.
- Cada app tiene su propio CLAUDE.md con detalles específicos.
```

## Longitud y estructura

- Objetivo: **menos de ~200 líneas** por archivo. Más largo = más contexto consumido y peor adherencia.
- Usa **encabezados y viñetas**: Claude escanea la estructura como una persona.
- Si crece demasiado, divide: importaciones con `@`, reglas por ruta en `.claude/rules/` (lección 15) o skills (lección 44).

## Mantenerlo vivo

Trata `CLAUDE.md` como código:

- Añade una regla **cuando Claude cometa el mismo error dos veces**.
- Añade lo que una **code review** detecte y Claude debería haber sabido.
- **Revísalo en los PRs** y elimina lo obsoleto.
- Puedes pedírselo a Claude al final de una sesión: *"¿Qué deberíamos añadir a CLAUDE.md de lo que aprendiste hoy?"*

## Resumen

- Prioriza: comandos exactos → convenciones no estándar → mapa de arquitectura → normas de Git.
- Solo lo que Claude no deduciría solo; concreto y verificable.
- Breve, estructurado y mantenido como parte del repo.

## Ejercicios

1. Reescribe la sección de comandos de tu `CLAUDE.md` incluyendo cómo ejecutar **un solo test**.
2. Añade un mapa de arquitectura de 5–8 líneas.
3. Pide a Claude una tarea pequeña y comprueba si respeta las convenciones. Si falla algo, conviértelo en una regla concreta.

## Referencias

- [Buenas prácticas: escribir un CLAUDE.md efectivo](https://code.claude.com/docs/en/best-practices)
- [Memoria y CLAUDE.md](https://code.claude.com/docs/en/memory)
- [Bases de código grandes y monorepos](https://code.claude.com/docs/en/large-codebases)
