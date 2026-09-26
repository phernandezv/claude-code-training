---
titulo: "Herramientas CLI vs. servidores MCP: cuándo usar cada uno"
resumen: Criterios para elegir entre una CLI y un servidor MCP - disponibilidad, coste de contexto, autenticación, control de permisos, portabilidad a la web y CI, y cómo combinarlos con skills que enseñan a usarlos.
---

## Objetivos de la lección

- Comparar CLI y MCP con criterios concretos.
- Decidir qué usar para cada integración de tu equipo.
- Combinar CLI/MCP con skills para enseñar a Claude a usarlos bien.

## Dos caminos al mismo sitio

Para que Claude interactúe con GitHub puedes:

- **CLI**: instalar `gh`, autenticarte, y Claude ejecuta `gh pr list` con Bash.
- **MCP**: conectar el servidor MCP de GitHub y Claude llama a `mcp__github__list_pull_requests`.

Ambos funcionan. ¿Cuál conviene?

## Comparación

| Criterio | CLI | MCP |
|---|---|---|
| **Coste de contexto** | Nulo hasta usarla | Bajo (nombres cargados; esquemas bajo demanda) |
| **Conocimiento previo de Claude** | Alto para CLIs populares | Descubre las herramientas por sus descripciones |
| **Autenticación** | La de tu terminal (`gh auth`, perfiles…) | Gestionada por el servidor (OAuth, tokens), integrada con `/mcp` |
| **Salida** | Texto libre; hay que filtrar (`jq`, `grep`) | Estructurada y a menudo más concisa |
| **Permisos** | Reglas `Bash(...)` por patrón de comando; cuidado con variantes | Reglas por herramienta (`mcp__srv__tool`), más fáciles de acotar |
| **Datos como recursos** (`@`) | No | Sí |
| **Sin instalación local** (web, móvil, entornos gestionados) | Requiere que la CLI esté instalada | Los servidores remotos funcionan sin instalar nada |
| **Servicios sin CLI** (Notion, Figma, Linear…) | A veces no existe | Suele existir un servidor oficial |
| **Composición con la shell** | Excelente (pipes, scripts) | Limitada a lo que exponga el servidor |
| **Riesgo de "comando creativo"** | Claude puede combinar flags inesperados | Solo puede hacer lo que el servidor ofrece |

## Reglas prácticas

**Prefiere la CLI cuando:**

- Existe una CLI madura y Claude la conoce bien (`gh`, `git`, `docker`, `kubectl`, `aws`).
- Necesitas componer con otras herramientas o scripts.
- Ya tienes autenticación configurada en tu terminal.
- Quieres el mínimo impacto en contexto.

**Prefiere MCP cuando:**

- No hay CLI (o es incómoda) para ese servicio.
- Quieres **permisos precisos por operación** (leer sí, borrar no) sin pelearte con patrones de comandos.
- Trabajas en **entornos sin tu terminal**: Claude Code en la web, sesiones en la nube, compañeros sin la CLI instalada.
- Necesitas **recursos** referenciables con `@` o **prompts** predefinidos.
- El servicio requiere OAuth y no quieres gestionar tokens a mano.

**Usa ambos cuando:** cada uno cubra algo distinto. Por ejemplo, `gh` para el día a día de PRs y el servidor MCP de GitHub en sesiones en la nube.

## Tabla de decisión rápida

| Integración | Recomendación típica |
|---|---|
| GitHub/GitLab | CLI (`gh`/`glab`); MCP en web/nube |
| Docker, Kubernetes | CLI |
| AWS/GCP/Azure | CLI con perfiles de mínimo privilegio |
| Base de datos | MCP de solo lectura (permisos más claros) o `psql` con usuario lector |
| Sentry, Datadog | MCP (búsquedas estructuradas) o CLI si ya la usas |
| Notion, Confluence, Figma, Linear, Jira | MCP |
| Slack, correo | MCP con `ask` para enviar |
| Navegador (pruebas e2e, capturas) | MCP de Playwright / Claude in Chrome |
| Herramientas internas | Script/CLI propio documentado; MCP propio si se usa desde muchos sitios |

## El tercer ingrediente: skills

Tanto la CLI como MCP dan **capacidad**; una **skill** da **conocimiento de cómo usarla bien** en tu contexto (lecciones 38–41):

```markdown
---
name: consultas-bd
description: Cómo consultar la base de datos de pedidos. Úsala cuando necesites datos de pedidos, pagos o usuarios.
---
# Consultas a la base de datos
- Usa el servidor MCP `db` (solo lectura). Nunca `psql` directo.
- Tablas clave: orders(id, user_id, status, total_cents, created_at), payments(...)
- Los importes están en céntimos.
- Limita siempre con `LIMIT 100` salvo que se pida un agregado.
- Para "pedidos atascados": status = 'pending' AND created_at < now() - interval '1 hour'.
```

Así, Claude no tiene que explorar el esquema cada vez y aplica tus convenciones.

## Coste en perspectiva

- Una CLI sin usar: **0 tokens**.
- Un servidor MCP con *tool search*: unos pocos tokens por nombre de herramienta hasta que se usa.
- Un servidor MCP sin *tool search* (algunos entornos/proxies): **todas** las definiciones al inicio, lo que puede ser mucho.

Revisa `/context` si tienes muchos servidores conectados.

## Resumen

- CLI: eficiente, componible, usa tu autenticación; ideal para herramientas populares.
- MCP: permisos finos, funciona sin instalación local, cubre servicios sin CLI, añade recursos y prompts.
- Skills: el conocimiento de cómo usar ambas en tu equipo.

## Ejercicios

1. Haz la tabla de decisión para las 5 integraciones que más usa tu equipo.
2. Realiza la misma tarea (p. ej. listar PRs con su estado de CI) con `gh` y con el MCP de GitHub. Compara contexto y resultado.
3. Escribe una skill que enseñe a Claude a usar una de tus integraciones según vuestras convenciones.

## Referencias

- [Extender Claude Code (comparativas)](https://code.claude.com/docs/en/features-overview)
- [Buenas prácticas: CLI y MCP](https://code.claude.com/docs/en/best-practices)
- [MCP](https://code.claude.com/docs/en/mcp)
