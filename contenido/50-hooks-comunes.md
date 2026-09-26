---
titulo: "Hooks comunes: formatear tras editar, bloquear un comando peligroso, ejecutar una comprobación"
resumen: Recetario de hooks listos para usar - autoformateo con PostToolUse, proteger archivos y bloquear comandos con PreToolUse, lint con feedback, tests obligatorios con Stop, notificaciones de escritorio, reinyectar contexto tras compactar y registro de auditoría.
---

## Objetivos de la lección

- Implementar los hooks más útiles del día a día.
- Entender qué evento, matcher y salida usa cada uno.
- Adaptarlos a tu stack.

!!! note "Requisitos"
    Los ejemplos usan `jq` para leer el JSON de entrada (`brew install jq`, `apt install jq`). Los scripts deben ser ejecutables: `chmod +x .claude/hooks/*.sh`. Usa `"$CLAUDE_PROJECT_DIR"` para referenciarlos desde cualquier directorio.

## 1. Formatear automáticamente tras editar

**Evento**: `PostToolUse` · **Matcher**: `Edit|Write`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/formatear.sh" }
        ]
      }
    ]
  }
}
```

`.claude/hooks/formatear.sh`:

```bash
#!/usr/bin/env bash
# Formatea el archivo recién editado según su extensión.
archivo=$(jq -r '.tool_input.file_path // empty')
[ -z "$archivo" ] || [ ! -f "$archivo" ] && exit 0

case "$archivo" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md) npx --no-install prettier --write "$archivo" >/dev/null 2>&1 ;;
  *.py) ruff format "$archivo" >/dev/null 2>&1 ;;
  *.go) gofmt -w "$archivo" ;;
  *.rs) rustfmt "$archivo" 2>/dev/null ;;
esac
exit 0
```

Claude no ve nada en la conversación, pero el archivo queda formateado. Ahorra tokens: Claude ya no tiene que preocuparse del formato.

## 2. Proteger archivos sensibles

**Evento**: `PreToolUse` · **Matcher**: `Edit|Write` · **Salida**: código 2 para bloquear.

`.claude/hooks/proteger.sh`:

```bash
#!/usr/bin/env bash
# Bloquea ediciones de archivos protegidos y explica el motivo a Claude.
ruta=$(jq -r '.tool_input.file_path // empty')
ruta="${ruta//\\//}"   # normaliza separadores de Windows

protegidos=(".env" "secrets/" "package-lock.json" "pnpm-lock.yaml" "db/migrations/applied/")
for patron in "${protegidos[@]}"; do
  if [[ "$ruta" == *"$patron"* ]]; then
    echo "Bloqueado: '$ruta' está protegido ($patron). Si es necesario cambiarlo, pide al usuario que lo haga o regenera el archivo con la herramienta adecuada." >&2
    exit 2
  fi
done
exit 0
```

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/proteger.sh" }]
      }
    ]
  }
}
```

El mensaje de stderr llega a Claude, que ajusta su enfoque en vez de reintentar a ciegas.

## 3. Bloquear comandos peligrosos

**Evento**: `PreToolUse` · **Matcher**: `Bash` · **Salida**: JSON con `permissionDecision`.

`.claude/hooks/bash-seguro.sh`:

```bash
#!/usr/bin/env bash
cmd=$(jq -r '.tool_input.command // empty')

denegar() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}
preguntar() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$r}}'
  exit 0
}

[[ "$cmd" =~ rm[[:space:]]+-[a-zA-Z]*r[a-zA-Z]*f ]] && denegar "rm -rf no está permitido. Borra archivos concretos."
[[ "$cmd" =~ git[[:space:]]+push.*(--force|-f([[:space:]]|$)) ]] && denegar "Nada de push forzado."
[[ "$cmd" =~ (curl|wget).*\|[[:space:]]*(ba)?sh ]] && denegar "No se ejecuta código descargado."
[[ "$cmd" =~ (DROP|TRUNCATE)[[:space:]]+(TABLE|DATABASE) ]] && preguntar "Operación destructiva sobre la base de datos: confirma."
exit 0
```

!!! warning "Los hooks son una capa, no la única"
    Detectar comandos con expresiones regulares nunca es perfecto (hay muchas formas de escribir lo mismo). Combina hooks con reglas `deny`, el modo auto y, para trabajo de riesgo, un sandbox o contenedor.

## 4. Lint con feedback para Claude

**Evento**: `PostToolUse` · **Matcher**: `Edit|Write` · **Salida**: código 2 para que Claude vea los errores.

```bash
#!/usr/bin/env bash
# .claude/hooks/lint.sh — ejecuta eslint sobre el archivo editado y devuelve errores a Claude
archivo=$(jq -r '.tool_input.file_path // empty')
[[ "$archivo" =~ \.(ts|tsx|js|jsx)$ ]] || exit 0

if ! salida=$(npx --no-install eslint --max-warnings=0 "$archivo" 2>&1); then
  echo "ESLint encontró problemas en $archivo. Corrígelos:" >&2
  echo "$salida" | head -40 >&2
  exit 2
fi
exit 0
```

En `PostToolUse` la herramienta ya se ejecutó, así que el código 2 no la deshace: **envía el texto a Claude** para que corrija en el siguiente paso.

## 5. Tests obligatorios antes de terminar

**Evento**: `Stop` · **Salida**: `decision: "block"` para que Claude siga trabajando.

```bash
#!/usr/bin/env bash
# .claude/hooks/tests-al-terminar.sh
entrada=$(cat)
# Evita bucles infinitos: si ya estamos continuando por este hook, no volver a bloquear.
[ "$(jq -r '.stop_hook_active' <<<"$entrada")" = "true" ] && exit 0
# Solo si hay cambios en el código
git diff --quiet HEAD -- src tests 2>/dev/null && exit 0

if ! salida=$(npm test --silent 2>&1); then
  jq -n --arg r "Los tests fallan. Corrígelos antes de terminar:
$(tail -n 40 <<<"$salida")" '{decision:"block", reason:$r}'
fi
exit 0
```

```json
{
  "hooks": {
    "Stop": [
      { "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/tests-al-terminar.sh", "timeout": 300 }] }
    ]
  }
}
```

!!! tip "/goal"
    Para el caso simple de "sigue hasta que se cumpla X" durante una sesión, el comando `/goal` crea un hook `Stop` temporal basado en un prompt, sin configuración.

## 6. Notificación cuando Claude te necesita

**Evento**: `Notification` · **Matcher**: `permission_prompt|idle_prompt`

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt|idle_prompt",
        "hooks": [
          { "type": "command", "command": "osascript -e 'display notification \"Claude Code te necesita\" with title \"Claude Code\"'" }
        ]
      }
    ]
  }
}
```

En Linux: `notify-send 'Claude Code' 'Te necesita'`. En Windows (PowerShell) puedes usar un *toast* o un simple `[console]::beep()`. Ideal en `~/.claude/settings.json`.

## 7. Reinyectar contexto tras compactar

**Evento**: `SessionStart` · **Matcher**: `compact`

Lo que imprime un hook `SessionStart` se añade al contexto. Útil para recordar el estado tras una compactación:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          { "type": "command", "command": "echo \"Rama: $(git branch --show-current)\"; echo 'Cambios pendientes:'; git status --short | head -20; cat \"$CLAUDE_PROJECT_DIR\"/NOTAS-TAREA.md 2>/dev/null" }
        ]
      }
    ]
  }
}
```

## 8. Registro de auditoría

**Evento**: `PreToolUse` · **Matcher**: `Bash`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "jq -c '{t: now | todate, sesion: .session_id, cmd: .tool_input.command}' >> ~/.claude/auditoria-bash.jsonl" }
        ]
      }
    ]
  }
}
```

## Resumen de recetas

| Objetivo | Evento | Matcher | Mecanismo |
|---|---|---|---|
| Formatear | `PostToolUse` | `Edit\|Write` | Ejecutar formateador, exit 0 |
| Proteger archivos | `PreToolUse` | `Edit\|Write` | exit 2 + stderr |
| Bloquear comandos | `PreToolUse` | `Bash` | JSON `permissionDecision` |
| Lint con feedback | `PostToolUse` | `Edit\|Write` | exit 2 + stderr (Claude corrige) |
| Tests al terminar | `Stop` | — | JSON `decision: "block"` |
| Notificar | `Notification` | `permission_prompt\|idle_prompt` | Comando del sistema |
| Contexto tras compactar | `SessionStart` | `compact` | stdout al contexto |
| Auditoría | `PreToolUse` | `Bash` | Añadir a un log |

## Ejercicios

1. Implementa el hook de formateo para tu stack y compruébalo pidiendo una edición mal formateada.
2. Implementa el de proteger archivos y pide a Claude que edite `.env`.
3. Añade la notificación de escritorio en tu configuración de usuario.
4. Implementa el hook `Stop` de tests y rompe un test a propósito para ver cómo Claude lo arregla.

## Referencias

- [Guía de hooks (ejemplos)](https://code.claude.com/docs/en/hooks-guide)
- [Referencia de hooks: eventos y decisiones](https://code.claude.com/docs/en/hooks)
