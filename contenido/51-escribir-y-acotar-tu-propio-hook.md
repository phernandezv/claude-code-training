---
titulo: Escribir y acotar tu propio hook
resumen: Diseñar un hook desde cero - elegir evento y matcher, leer la entrada, decidir la salida (código o JSON), acotar su alcance (usuario, proyecto, local, skill, subagente), hooks de tipo prompt, hooks asíncronos, timeouts, rendimiento, seguridad y depuración con --debug-file.
---

## Objetivos de la lección

- Diseñar un hook propio con un proceso repetible.
- Elegir el **alcance** correcto para que se aplique donde debe (y solo ahí).
- Usar hooks de tipo `prompt` para decisiones que requieren criterio.
- Hacer hooks rápidos, seguros y fáciles de depurar.

## Proceso de diseño en 6 pasos

1. **¿Qué debe ocurrir siempre?** Escribe la regla en una frase: *"No se pueden añadir dependencias nuevas sin que yo lo apruebe."*
2. **¿En qué momento?** Elige el evento: antes de actuar (`PreToolUse`), después (`PostToolUse`), al terminar (`Stop`), al enviar un prompt (`UserPromptSubmit`)…
3. **¿Sobre qué?** Elige el matcher: `Bash`, `Edit|Write`, `mcp__db__.*`…
4. **¿Qué necesito leer?** Revisa los campos de entrada del evento (`tool_input.command`, `tool_input.file_path`, `prompt`…).
5. **¿Qué respuesta?** Permitir (exit 0), bloquear con explicación (exit 2 + stderr), decidir con JSON (`allow`/`deny`/`ask`), añadir contexto, o pedir que continúe (`decision: "block"` en Stop).
6. **¿Dónde vive?** Usuario, proyecto, local, skill o subagente.

## Ejemplo completo: aprobar dependencias nuevas

**Regla**: cuando Claude intente instalar un paquete, preguntarme siempre, y denegar gestores que no usa el proyecto.

`.claude/hooks/dependencias.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cmd=$(jq -r '.tool_input.command // empty')

responder() {  # $1 = allow|deny|ask, $2 = motivo
  jq -n --arg d "$1" --arg r "$2" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:$d,permissionDecisionReason:$r}}'
  exit 0
}

# Este proyecto usa pnpm: bloquear npm/yarn para instalar
if [[ "$cmd" =~ ^(npm|yarn)[[:space:]]+(install|i|add)[[:space:]]+[^-] ]]; then
  responder deny "Este proyecto usa pnpm. Usa 'pnpm add <paquete>'."
fi

# Añadir paquetes nuevos requiere confirmación humana
if [[ "$cmd" =~ ^pnpm[[:space:]]+add[[:space:]] ]]; then
  responder ask "Se va a añadir una dependencia nueva: revisa licencia, mantenimiento y tamaño."
fi

exit 0   # cualquier otro comando: flujo normal de permisos
```

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/dependencias.sh", "timeout": 10 }]
      }
    ]
  }
}
```

### Probarlo sin Claude

Los hooks son programas normales: pruébalos pasando un JSON por stdin.

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"npm install lodash"}}' | .claude/hooks/dependencias.sh
echo '{"tool_name":"Bash","tool_input":{"command":"pnpm add zod"}}' | .claude/hooks/dependencias.sh
echo '{"tool_name":"Bash","tool_input":{"command":"pnpm test"}}' | .claude/hooks/dependencias.sh; echo "exit=$?"
```

## Acotar el alcance

| Quiero que el hook se aplique… | Dónde definirlo |
|---|---|
| A mí, en todos mis proyectos (notificaciones, auditoría personal) | `~/.claude/settings.json` |
| A todo el equipo en este repo (formato, protección, tests) | `.claude/settings.json` + scripts en `.claude/hooks/` en Git |
| Solo a mí en este repo (experimentos) | `.claude/settings.local.json` |
| Solo mientras se usa una skill concreta | Frontmatter `hooks:` de la skill |
| Solo mientras corre un subagente | Frontmatter `hooks:` del subagente |
| A toda la organización | *Managed settings* |
| A quien instale mi plugin | `hooks/hooks.json` del plugin |

### Hooks en una skill

```markdown
---
name: operaciones-bd
description: Tareas de mantenimiento de la base de datos de desarrollo.
disable-model-invocation: true
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/solo-bd-dev.sh"
---
Realiza la tarea de mantenimiento indicada: $ARGUMENTS
```

Los hooks de una skill se registran al invocarla y siguen activos el resto de la sesión. Los de un subagente solo mientras ese subagente trabaja.

### Acotar con el matcher y dentro del script

- Matcher lo más estrecho posible (`Edit|Write` mejor que `*`).
- Dentro del script, sal pronto (`exit 0`) si el caso no aplica: extensión de archivo, ruta, comando.
- Usa `cwd` o `$CLAUDE_PROJECT_DIR` para limitar a rutas del proyecto.

## Hooks de tipo `prompt`: cuando hace falta criterio

Algunas comprobaciones no se pueden expresar con una regex. Un hook `prompt` envía el contexto a un modelo (Haiku por defecto) que responde `{"ok": true}` o `{"ok": false, "reason": "…"}`:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Revisa si Claude ha completado todo lo que pidió el usuario, incluidos tests y documentación si se pidieron. Si falta algo, responde {\"ok\": false, \"reason\": \"lo que falta\"}; si está completo, {\"ok\": true}."
          }
        ]
      }
    ]
  }
}
```

- En `Stop`, `ok: false` hace que Claude siga trabajando con el motivo como siguiente instrucción.
- En `PreToolUse`, `ok: false` deniega la llamada.
- Existe también `type: "agent"` (experimental), que lanza un subagente con herramientas para verificar.

Tienen coste (una llamada al modelo) y son menos deterministas que un script: úsalos para lo que de verdad requiere juicio.

## Hooks asíncronos

Para tareas lentas que no deben bloquear (tests largos, notificar a un servicio):

```json
{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/tests-lentos.sh", "async": true }
```

Claude sigue trabajando; cuando el hook termina, su resultado llega en la siguiente interacción. Un hook asíncrono **no puede bloquear** la acción.

## Rendimiento

- Los hooks de `PreToolUse` se ejecutan **antes de cada llamada**: un hook lento ralentiza toda la sesión.
- Fija `timeout` (segundos) razonables.
- Evita arrancar herramientas pesadas en cada llamada (p. ej., un linter de todo el proyecto); limita al archivo afectado.

## Seguridad al escribir hooks

- **Entrecomilla variables** (`"$archivo"`) y valida rutas: los valores vienen de lo que Claude intenta hacer.
- Usa rutas absolutas o `"$CLAUDE_PROJECT_DIR"/…` para los scripts.
- No imprimas secretos en stdout (en algunos eventos llega al contexto de Claude).
- Revisa hooks de terceros antes de usarlos: se ejecutan con tus permisos.

## Depuración

| Técnica | Para qué |
|---|---|
| `/hooks` | Ver qué hooks están cargados y de dónde |
| `Ctrl+O` | Ver en la transcripción el resultado de un hook (bloqueos, errores) |
| `claude --debug-file /tmp/claude.log` | Log detallado: qué hooks coinciden, códigos de salida, stdout y stderr |
| Probar por stdin | `echo '{…}' \| script.sh` antes de conectarlo |

Problemas típicos:

- **No se dispara**: matcher incorrecto (¿`Edit|Write` o `Write` solo?), archivo de settings que no se carga, carpeta sin confianza aceptada.
- **"hook error"**: el script falla (permiso de ejecución, `jq` no instalado, ruta errónea).
- **El JSON no hace nada**: debe empezar por `{`, terminar en `}` y el script salir con 0; revisa `hookEventName`.
- **Bucle infinito en Stop**: comprueba `stop_hook_active` antes de volver a bloquear.

## Resumen

- Diseña: regla → evento → matcher → entrada → salida → alcance.
- Acota con el nivel de configuración, el matcher y salidas tempranas en el script.
- `prompt`/`agent` para decisiones con criterio; `async` para lo lento.
- Prueba por stdin, depura con `--debug-file`, cuida rendimiento y seguridad.

## Ejercicios

1. Implementa el hook de dependencias adaptado a tu gestor de paquetes y pruébalo por stdin.
2. Mueve un hook de proyecto al frontmatter de una skill y comprueba que solo actúa tras invocarla.
3. Crea un hook `prompt` en `Stop` que verifique que se actualizó el CHANGELOG cuando cambia la API pública.
4. Usa `--debug-file` para ver la ejecución de tus hooks.

## Referencias

- [Guía de hooks](https://code.claude.com/docs/en/hooks-guide)
- [Referencia de hooks](https://code.claude.com/docs/en/hooks)
