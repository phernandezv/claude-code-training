---
titulo: "Proyecto de portafolio: integra Claude en tu stack"
resumen: Proyecto práctico de las secciones 5 y 6 - conectar un servicio por MCP o CLI, crear skills y comandos del equipo, añadir hooks de calidad y seguridad, y automatizar una tarea en CI, todo documentado y versionado en el repositorio.
---

## El reto

Vas a convertir tu repositorio en un entorno donde Claude Code está **integrado con las herramientas del equipo** y trabaja con **guardarraíles**. Al terminar tendrás, versionado en Git:

1. Al menos **una integración externa** (MCP o CLI) con permisos de mínimo privilegio.
2. Al menos **dos skills** (una de conocimiento y una de tarea) y **dos comandos** con argumentos.
3. Al menos **tres hooks**: calidad, seguridad y notificación/registro.
4. Al menos **una automatización** en CI o programada.
5. Documentación para el equipo.

## Criterios de éxito

| # | Criterio | Evidencia |
|---|---|---|
| 1 | Integración funcionando con permisos allow/ask/deny por herramienta | `/mcp` o uso de la CLI + reglas en `settings.json` |
| 2 | Sin secretos en el repo (`${VAR}` en `.mcp.json`) | Revisión del diff |
| 3 | Skill de conocimiento que Claude activa sola | Petición natural que la activa |
| 4 | Skill/comando de tarea con argumentos | `/comando arg1 arg2` funcionando |
| 5 | Hook de calidad (formato/lint) | Archivo formateado o feedback de lint |
| 6 | Hook de seguridad (proteger archivos o comandos) | Intento bloqueado con explicación |
| 7 | Automatización en CI o programada | Ejecución exitosa del workflow |
| 8 | README de la configuración de Claude | `docs/claude-code.md` o similar |

## Fase 1: elige la integración (30 min)

Piensa en la información externa que **más copias a mano** al chat: tickets, errores de producción, datos, documentación. Decide entre MCP y CLI con la tabla de la lección 42.

**Opción MCP (ejemplo con Sentry):**

```bash
claude mcp add --transport http sentry --scope project https://mcp.sentry.dev/mcp
```

```text
/mcp   → Authenticate
```

**Opción CLI (ejemplo con gh):**

```bash
gh auth login
```

Añade permisos en `.claude/settings.json` separando lectura, escritura y destrucción:

```json
{
  "permissions": {
    "allow": ["mcp__sentry__search_issues", "mcp__sentry__get_issue_details"],
    "ask": ["mcp__sentry__update_issue"],
    "deny": []
  }
}
```

## Fase 2: skills (45 min)

**Skill de conocimiento** (Claude la usa cuando hace falta), por ejemplo cómo interpretar vuestros errores o cómo consultar vuestros datos:

```text
.claude/skills/errores-produccion/SKILL.md
```

```markdown
---
name: errores-produccion
description: Cómo investigar errores de producción del proyecto con Sentry y el código. Úsala cuando pregunten por errores, excepciones, caídas o incidencias en producción.
---
1. Busca el error en Sentry (proyecto "<nombre>"), filtra por entorno "production".
2. Obtén el stack trace y localiza el archivo y la línea en el repo.
3. Revisa `git log` del archivo para ver cambios recientes relacionados.
4. Propón la causa raíz y una corrección con test que la reproduzca.
Convenciones: los errores de negocio heredan de DomainError y no se reportan como bugs.
```

**Skill o comando de tarea** con argumentos:

```markdown
---
name: investigar-error
description: Investiga un error concreto de Sentry y propone una corrección
argument-hint: "[id-del-issue-de-sentry]"
disable-model-invocation: true
---
Investiga el error de Sentry $0 siguiendo la skill errores-produccion.
No edites código: entrega un informe con causa raíz, archivos afectados y plan de corrección.
```

Añade un segundo comando útil para tu día a día (p. ej. `/standup`, `/revisar`, `/resumen-pr`).

## Fase 3: hooks (45 min)

Crea `.claude/hooks/` con al menos:

1. **Calidad**: formateo o lint tras `Edit|Write` (lección 50).
2. **Seguridad**: protección de archivos sensibles o bloqueo de comandos peligrosos.
3. **Experiencia**: notificación de escritorio (en tu configuración de usuario) o registro de auditoría.

Prueba cada script por stdin antes de conectarlo:

```bash
echo '{"tool_name":"Edit","tool_input":{"file_path":".env"}}' | .claude/hooks/proteger.sh; echo "exit=$?"
```

Y verifica con `/hooks`.

## Fase 4: automatización (45 min)

Elige una:

- **GitHub Actions**: workflow de menciones `@claude` o de revisión automática de PRs con tu skill.
- **Programada**: workflow con `cron` o una routine que genere un informe semanal.
- **Pre-commit**: revisión rápida del staging con `claude -p` y Haiku.

Requisitos: permisos explícitos (`--allowedTools`), secretos en el gestor del CI, `--max-turns`.

## Fase 5: documentación (20 min)

Crea `docs/claude-code.md` con:

```markdown
# Claude Code en este repositorio

## Integraciones
- Sentry (MCP, alcance project). Autenticación: `/mcp` → Authenticate.

## Skills y comandos
| Comando | Qué hace |
|---|---|
| /investigar-error <id> | Informe de causa raíz de un error de Sentry |
| … | … |

## Hooks
| Hook | Evento | Qué hace |
|---|---|---|
| proteger.sh | PreToolUse (Edit\|Write) | Bloquea .env, secrets/, lockfiles |
| … | … | … |

## Automatizaciones
- `.github/workflows/claude-review.yml`: revisión automática en PRs.

## Cómo desactivar algo
- Hooks: `"disableAllHooks": true` en `.claude/settings.local.json`.
- Un servidor MCP: `/mcp disable <nombre>`.
```

## Fase 6: prueba de extremo a extremo

En una sesión nueva:

```text
> ¿Cuál es el error más frecuente de producción esta semana? Investígalo.
```

Comprueba que: se activa la skill de conocimiento, se usan las herramientas MCP/CLI permitidas sin preguntar, se pide confirmación en las de escritura, los hooks formatean/protegen, y el resultado es útil.

## Entrega

Un PR con toda la configuración (`.claude/`, `.mcp.json`, workflows, docs) y en la descripción: decisiones (MCP vs. CLI, permisos), qué hooks y por qué, y el resultado de la prueba de extremo a extremo.

## Rúbrica

| Aspecto | Básico | Bueno | Excelente |
|---|---|---|---|
| Integración | Funciona | Con permisos por herramienta | Mínimo privilegio + sin secretos + documentada |
| Skills/comandos | Uno | Conocimiento + tarea | Descripciones que activan bien + argumentos + archivos de apoyo |
| Hooks | Uno | Calidad + seguridad | Probados por stdin, rápidos, con mensajes útiles para Claude |
| Automatización | Workflow copiado | Adaptado al repo | Permisos mínimos, límites, útil para el equipo |
| Documentación | — | Lista de piezas | Guía para el equipo con cómo usar y desactivar |

## Referencias

- [MCP](https://code.claude.com/docs/en/mcp) · [Skills](https://code.claude.com/docs/en/skills) · [Hooks](https://code.claude.com/docs/en/hooks-guide) · [GitHub Actions](https://code.claude.com/docs/en/github-actions)
