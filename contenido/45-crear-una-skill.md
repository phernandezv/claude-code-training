---
titulo: Crear una skill
resumen: Paso a paso para crear una skill - estructura de carpeta, frontmatter completo, escribir una buena descripción, instrucciones concisas, archivos de apoyo y scripts, inyección de contexto dinámico, herramientas preaprobadas, ejecutar en un subagente, probar y depurar.
---

## Objetivos de la lección

- Crear una skill desde cero y probarla.
- Dominar los campos del *frontmatter* más útiles.
- Escribir descripciones que hagan que Claude la use en el momento justo.
- Usar archivos de apoyo, scripts e inyección de contexto dinámico.
- Depurar una skill que no se activa (o se activa demasiado).

## Paso 1: crear la carpeta

```bash
# Skill del proyecto (compartida vía Git)
mkdir -p .claude/skills/informe-dependencias

# o personal (todos tus proyectos)
mkdir -p ~/.claude/skills/informe-dependencias
```

El nombre de la carpeta será el comando: `/informe-dependencias`. Usa minúsculas y guiones.

## Paso 2: escribir `SKILL.md`

```markdown
---
name: informe-dependencias
description: Analiza las dependencias del proyecto y genera un informe de paquetes desactualizados o vulnerables. Úsala cuando pregunten por dependencias, actualizaciones, vulnerabilidades o "npm audit".
allowed-tools: Bash(npm outdated *) Bash(npm audit *) Read
---
## Estado actual
!`npm outdated --json || true`

## Auditoría de seguridad
!`npm audit --json --omit=dev || true`

## Tu tarea
Con los datos anteriores, genera un informe en Markdown con:
1. **Vulnerabilidades** agrupadas por severidad (crítica → baja), con el paquete afectado y la versión que lo corrige.
2. **Actualizaciones mayores** pendientes (cambio de major), con enlace al changelog si lo conoces.
3. **Actualizaciones seguras** (minor/patch) que se pueden aplicar ya.
4. Una recomendación de orden de actualización.
No modifiques package.json ni el lockfile.
```

Qué pasa aquí:

- **`description`**: qué hace y **cuándo** usarla, con palabras que usaría un usuario.
- **`allowed-tools`**: durante el turno en que se invoca, esas herramientas no piden permiso.
- **`` !`comando` ``**: **inyección de contexto dinámico**. Claude Code ejecuta el comando **antes** de pasar la skill a Claude y sustituye la línea por su salida. Claude recibe datos reales, no la instrucción de obtenerlos.
- `|| true`: un comando que termina con error aborta la skill entera; `npm outdated` devuelve código 1 cuando hay paquetes desactualizados, así que lo neutralizamos.

## Paso 3: probar

```text
> ¿Tenemos dependencias con vulnerabilidades?       ← Claude debería elegir la skill
/informe-dependencias                              ← invocación directa
```

En la terminal, las skills nuevas o modificadas se detectan sin reiniciar en la mayoría de casos; si no aparece, usa `/reload-skills` o reinicia la sesión.

## Referencia del frontmatter

| Campo | Para qué |
|---|---|
| `name` | Nombre del comando (por defecto, el de la carpeta) |
| `description` | **Recomendado.** Qué hace y cuándo usarla |
| `when_to_use` | Frases o ejemplos adicionales de cuándo activarla |
| `argument-hint` | Pista de argumentos en el autocompletado, p. ej. `[issue] [rama]` |
| `arguments` | Nombres para argumentos posicionales (`$issue`, `$rama`) |
| `disable-model-invocation` | `true` = solo tú puedes invocarla |
| `user-invocable` | `false` = solo Claude puede invocarla |
| `allowed-tools` | Herramientas preaprobadas durante el turno de invocación |
| `disallowed-tools` | Herramientas prohibidas mientras la skill está activa |
| `model` | Modelo a usar durante ese turno |
| `effort` | Nivel de esfuerzo durante ese turno |
| `context: fork` | Ejecutar en un subagente aislado |
| `agent` | Tipo de subagente para `context: fork` (p. ej. `Explore`) |
| `paths` | Solo se activa automáticamente al trabajar con archivos que coinciden |
| `hooks` | Hooks que se registran al invocar la skill |
| `shell` | `bash` (defecto) o `powershell` para la inyección de comandos |

El *frontmatter* solo se lee si `---` es la **primera línea** del archivo.

## Escribir una buena descripción

La descripción decide si Claude usará la skill. Buenas prácticas:

- **Primero el caso de uso principal**; las descripciones largas se recortan en el listado.
- Incluye **verbos y palabras clave** reales: "desplegar", "publicar versión", "release", "changelog".
- Di **cuándo no** usarla si hay riesgo de confusión.

| ❌ | ✅ |
|---|---|
| "Utilidades de base de datos" | "Consultas de solo lectura a la BD de pedidos: esquema, consultas típicas y métricas. Úsala para preguntas sobre pedidos, pagos o usuarios." |
| "Ayuda con releases" | "Publica una nueva versión: changelog, bump de versión, tag y notas de release. Úsala cuando pidan publicar, lanzar o etiquetar una versión." |

## Escribir las instrucciones

- **Conciso**: una vez cargada, la skill permanece en el contexto; cada línea cuesta.
- **Imperativo y verificable**: "ejecuta X", "comprueba Y", no narraciones.
- **Lo importante arriba**: tras compactar, las skills largas pueden recortarse por el final.
- Menos de ~500 líneas; el detalle, a archivos de apoyo.

## Archivos de apoyo y scripts

```text
informe-dependencias/
├── SKILL.md
├── politica-actualizaciones.md
└── scripts/
    └── resumen.py
```

Referéncialos desde `SKILL.md` para que Claude sepa cuándo leerlos:

```markdown
## Recursos
- Política del equipo sobre versiones mayores: [politica-actualizaciones.md](politica-actualizaciones.md)
- Para un resumen tabular ejecuta: `python ${CLAUDE_SKILL_DIR}/scripts/resumen.py`
```

`${CLAUDE_SKILL_DIR}` apunta a la carpeta de la skill, así funciona sea cual sea el directorio actual. También existe `${CLAUDE_PROJECT_DIR}` (raíz del proyecto) y `${CLAUDE_SESSION_ID}`.

## Bloques de comandos multilínea

````markdown
## Entorno
```!
node --version
git branch --show-current
git status --short
```
````

!!! warning "Seguridad de la inyección"
    Los comandos inyectados **no piden permiso** al renderizar la skill, pero sí se comprueban contra tus reglas: si una regla `deny` los bloquea (o no están permitidos fuera del modo auto), la invocación se aborta. Revisa las skills de terceros antes de usarlas. Se puede desactivar con `"disableSkillShellExecution": true`.

## Ejecutar en un subagente: `context: fork`

Para tareas pesadas que no quieres que llenen tu contexto:

```markdown
---
name: auditoria-accesibilidad
description: Audita la accesibilidad de los componentes de UI y devuelve un informe.
context: fork
agent: Explore
---
Revisa los componentes de `src/components/` buscando problemas de accesibilidad
(roles ARIA, contraste declarado, etiquetas de formularios, foco). Devuelve una
lista priorizada con archivo:línea y la corrección sugerida.
```

La skill se ejecuta como un subagente (en segundo plano por defecto) y solo vuelve el resultado. Usa `background: false` si quieres esperar el resultado en el mismo turno. Solo tiene sentido para skills con una **tarea** concreta, no para guías.

## Depurar

| Problema | Qué revisar |
|---|---|
| No aparece en `/` | Ruta correcta (`.claude/skills/<nombre>/SKILL.md`), `user-invocable` no es `false` |
| Claude no la usa sola | Descripción con palabras clave; `disable-model-invocation` no es `true`; pregunta "¿qué skills tienes?" |
| Se activa cuando no debe | Descripción más específica, o `disable-model-invocation: true` |
| El frontmatter no se aplica | `---` en la primera línea; YAML válido (`claude --debug` muestra el error) |
| "Shell command failed" | Un comando inyectado devolvió error; añade `\|\| true` si es esperado |

También puedes validar la sintaxis con `claude plugin validate .claude/skills`.

## Resumen

- Carpeta + `SKILL.md` con frontmatter (`description` sobre todo) e instrucciones concisas.
- `` !`cmd` `` inyecta datos reales; `allowed-tools` evita permisos repetidos.
- Archivos de apoyo con `${CLAUDE_SKILL_DIR}`; `context: fork` para aislar tareas pesadas.
- Prueba invocándola a mano y con peticiones naturales; depura con `--debug`.

## Ejercicios

1. Crea la skill `informe-dependencias` (adaptada a tu gestor: npm, pnpm, pip, cargo…) y pruébala.
2. Crea una skill de conocimiento con `user-invocable: false` sobre un área de tu dominio.
3. Convierte una tarea pesada en una skill con `context: fork` y compara el contexto consumido.
4. Rompe a propósito el YAML del frontmatter y observa el comportamiento con `claude --debug`.

## Referencias

- [Skills: crear, configurar y depurar](https://code.claude.com/docs/en/skills)
- [Agent Skills (estándar abierto)](https://agentskills.io)
