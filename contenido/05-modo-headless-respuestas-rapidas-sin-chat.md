---
titulo: "Modo headless: respuestas rápidas sin el chat"
resumen: Usar claude -p para preguntas puntuales, pipes, scripts y automatización - formatos de salida (text, json, stream-json), JSON Schema, herramientas preaprobadas, --bare y continuación de conversaciones.
---

## Objetivos de la lección

- Ejecutar Claude Code **sin interfaz interactiva** con `-p` / `--print`.
- Encadenar Claude con otras herramientas de la terminal usando *pipes*.
- Obtener salida estructurada (`--output-format json`, `--json-schema`) y procesarla con `jq`.
- Controlar permisos en ejecuciones desatendidas (`--allowedTools`, `--permission-mode`).
- Continuar conversaciones headless (`--continue`, `--resume`).

## ¿Qué es el modo headless?

Con `-p` Claude Code recibe un prompt, hace su trabajo (con el mismo bucle agéntico y las mismas herramientas) y **imprime el resultado en stdout**. No hay cuadro de entrada ni diálogos. Es perfecto para:

- Preguntas rápidas sin abrir una sesión.
- Scripts, alias y tareas de `npm`.
- CI/CD, cron y hooks de Git (lección 47).

```bash
claude -p "¿Qué hace el módulo de autenticación?"
```

El proceso termina con **código 0** si todo va bien y distinto de 0 si falla, así que puedes usarlo en condiciones de shell:

```bash
if claude -p "¿Hay credenciales hardcodeadas en src/? Responde solo SI o NO" | grep -q "^NO"; then
  echo "OK"
fi
```

## Pipes: Claude como filtro Unix

`claude -p` lee de **stdin**, así que puedes pasarle la salida de otros comandos:

```bash
# Explicar un error de compilación
npm run build 2>&1 | claude -p "explica la causa raíz de este error en 3 líneas"

# Resumir un log
tail -n 200 logs/app.log | claude -p "resume los errores y agrúpalos por tipo" > resumen.txt

# Revisar un diff sin darle acceso a git
git diff main | claude -p "revisa este diff y señala posibles bugs"
```

!!! tip "Pasar el diff es más seguro"
    Si le pasas el diff por stdin, Claude no necesita permiso para ejecutar `git`. Es una forma sencilla de limitar lo que puede hacer.

El contenido por stdin tiene un límite de 10 MB; para entradas mayores, guarda un archivo y menciónalo en el prompt.

### Un "linter" con IA en `package.json`

```json
{
  "scripts": {
    "lint:ortografia": "git diff main | claude -p \"eres un corrector ortográfico. Para cada error en este diff indica archivo:línea y el problema. No digas nada más.\""
  }
}
```

```bash
npm run lint:ortografia
```

## Formatos de salida

| `--output-format` | Qué devuelve |
|---|---|
| `text` (por defecto) | Solo el texto de la respuesta |
| `json` | Un objeto JSON con `result`, `session_id`, uso de tokens, `total_cost_usd`, etc. |
| `stream-json` | Un JSON por línea con cada evento en tiempo real |

```bash
claude -p "Resume este proyecto" --output-format json | jq -r '.result'
```

Guardar el ID de sesión para continuar después:

```bash
session_id=$(claude -p "Empieza una revisión de seguridad" --output-format json | jq -r '.session_id')
```

### Salida con esquema (JSON Schema)

Si necesitas datos con una forma concreta, combina `--output-format json` con `--json-schema`. El resultado validado aparece en el campo `structured_output`:

```bash
claude -p "Extrae los nombres de las funciones exportadas de src/utils.ts" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"funciones":{"type":"array","items":{"type":"string"}}},"required":["funciones"]}' \
  | jq '.structured_output.funciones'
```

### Streaming

```bash
claude -p "Explica la recursión" --output-format stream-json --verbose --include-partial-messages
```

Cada línea es un evento; la última es un mensaje `result` con el texto final, el coste y los metadatos.

## Permisos en modo headless

No hay nadie para pulsar "Yes", así que tienes que decidir de antemano qué se permite. En `-p` el modo inicial por defecto es **Manual**, y lo que requeriría aprobación se deniega.

### Preaprobar herramientas

```bash
claude -p "Ejecuta los tests y arregla los fallos" --allowedTools "Bash,Read,Edit"
```

Puedes usar la sintaxis de reglas para ser más preciso (lección 15):

```bash
claude -p "Mira mis cambios en staging y crea un commit adecuado" \
  --allowedTools "Bash(git diff *),Bash(git log *),Bash(git status *),Bash(git commit *)"
```

El ` *` final (con espacio) permite cualquier argumento después de ese prefijo.

### Elegir un modo

```bash
claude -p "Aplica las correcciones del linter" --permission-mode acceptEdits
claude -p "Actualiza dependencias y ejecuta tests" --permission-mode auto
claude -p "Ejecuta la suite" --permission-mode dontAsk --allowedTools "Bash(npm test)"
```

También existe `--disallowedTools` para prohibir herramientas concretas y `--max-turns` para limitar el número de turnos agénticos.

## Modo `--bare`: arranque rápido y reproducible

Por defecto, `claude -p` carga lo mismo que una sesión interactiva: `CLAUDE.md`, hooks, skills, MCP, plugins… Con `--bare` se salta todo ese descubrimiento automático:

```bash
claude --bare -p "Resume README.md" --allowedTools "Read"
```

Ventajas: arranca más rápido y da **el mismo resultado en cualquier máquina** (no le afectan los hooks o MCP que alguien tenga en su `~/.claude`). Ideal para CI.

!!! note "Autenticación en bare"
    En modo bare no se usa el login de tu suscripción ni el llavero del sistema: necesitas `ANTHROPIC_API_KEY` (o las credenciales de tu proveedor cloud).

Lo que necesites lo pasas explícitamente:

| Para cargar | Usa |
|---|---|
| Instrucciones extra | `--append-system-prompt "…"` o `--append-system-prompt-file archivo` |
| Configuración | `--settings archivo.json` |
| Servidores MCP | `--mcp-config archivo.json` |
| Subagentes | `--agents '<json>'` |
| Un plugin | `--plugin-dir ruta` |

## Personalizar el system prompt

```bash
gh pr diff "$1" | claude -p \
  --append-system-prompt "Eres un ingeniero de seguridad. Revisa vulnerabilidades." \
  --output-format json
```

`--append-system-prompt` añade instrucciones manteniendo el comportamiento de Claude Code. `--system-prompt` lo **reemplaza** por completo (úsalo con cuidado).

## Continuar conversaciones

```bash
# Primera petición
claude -p "Revisa este código buscando problemas de rendimiento"

# Continúa la conversación más reciente
claude -p "Ahora céntrate en las consultas a la base de datos" --continue
claude -p "Genera un resumen de todos los problemas" --continue

# Continuar una sesión concreta por ID
claude -p "Sigue con la revisión" --resume "$session_id"
```

## Comandos slash en `-p`

Las skills y comandos personalizados funcionan si los incluyes en el prompt (`claude -p "/revisar-pr 123"`). Algunos comandos integrados aceptan argumento, por ejemplo `/model sonnet`. Los que solo tienen sentido en la interfaz (como `/login`) no están disponibles.

## Recetas útiles

```bash
# Alias para preguntar rápido desde cualquier sitio
alias q='claude -p'
q "¿cómo listo los puertos abiertos en macOS?"

# Generar mensaje de commit a partir de lo que está en staging
git diff --cached | claude -p "escribe un mensaje de commit convencional (feat/fix/...) de una línea"

# Explicar por qué falla un comando
npm test 2>&1 | tail -n 80 | claude -p "¿por qué falla esto y cómo lo arreglo?"
```

## Resumen

- `claude -p "prompt"` = Claude Code sin interfaz, con salida por stdout y código de salida.
- Lee de stdin → úsalo en pipes.
- `--output-format json` + `jq` para scripts; `--json-schema` para datos con forma garantizada.
- Controla permisos con `--allowedTools`, `--permission-mode` y `--bare` en CI.

## Ejercicios

1. Crea un alias `q='claude -p'` y hazle tres preguntas sobre tu proyecto.
2. Pasa la salida de `git log --oneline -20` a Claude y pide un changelog agrupado por tipo.
3. Usa `--json-schema` para extraer una lista de endpoints de tu API y guárdala en `endpoints.json`.
4. Ejecuta una tarea con `--output-format json` y muestra con `jq` el coste (`total_cost_usd`) y el `session_id`; después continúa esa sesión con `--resume`.

## Referencias

- [Ejecutar Claude Code programáticamente (headless)](https://code.claude.com/docs/en/headless)
- [Referencia de la CLI](https://code.claude.com/docs/en/cli-reference)
- [Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview)
