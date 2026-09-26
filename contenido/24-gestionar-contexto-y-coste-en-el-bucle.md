---
titulo: Gestionar contexto y coste a lo largo del bucle
resumen: De dónde sale el gasto de tokens, cómo medirlo con /usage y /context, la caché de prompts, y un repertorio de técnicas para mantener sesiones rápidas y baratas - /clear, /compact, modelo y esfuerzo, subagentes, MCP, hooks y skills.
---

## Objetivos de la lección

- Entender **por qué** una sesión se encarece a medida que avanza.
- Medir consumo con `/usage`, `/context` y la barra de estado.
- Aprovechar la **caché de prompts**.
- Aplicar técnicas concretas para reducir tokens sin perder calidad.

## De dónde sale el coste

Cada vez que envías un mensaje, Claude Code manda al modelo **todo el contexto**: system prompt, herramientas, `CLAUDE.md`, la conversación completa, los archivos leídos, las salidas de comandos… Por eso:

- Una sesión larga cuesta más **por mensaje** que una corta.
- Leer un archivo enorme o una salida de 5.000 líneas "se paga" en todas las peticiones posteriores.
- El razonamiento (*thinking*) se factura como tokens de salida.

### La caché de prompts

Claude Code usa automáticamente la **caché de prompts**: la parte del contexto que no cambia entre peticiones se lee de caché, a una fracción del precio. Consecuencias prácticas:

- Mantener la sesión estable (mismo modelo, mismo estilo) aprovecha la caché.
- Cambiar de modelo o de estilo a mitad invalida parte de la caché (lecciones 16 y 22).
- La caché caduca tras un tiempo sin actividad: al volver de un descanso largo, el primer mensaje es más caro.

## Medir

### `/usage`

Muestra el coste de la sesión (calculado a precio de lista), la duración, líneas cambiadas, el uso por modelo (entrada, salida, lectura y escritura de caché) y, en planes de suscripción, tu consumo respecto a los límites del plan. `/cost` y `/stats` son alias.

!!! note "Suscripción vs. API"
    En planes Pro/Max el coste en dólares de la sesión es orientativo (no se te factura así); lo relevante es tu consumo de los límites del plan. En Console/API sí es tu gasto real.

### `/context`

La cuadrícula de uso del contexto con sugerencias (MCP pesados, memoria inflada…). Lección 7.

### Barra de estado

Configura con `/statusline` una barra que muestre el porcentaje de contexto usado para verlo de un vistazo.

### En modo headless

```bash
claude -p "…" --output-format json | jq '{coste: .total_cost_usd, sesion: .session_id}'
```

## Técnicas para reducir consumo

### 1. Una tarea, un contexto

- `/clear` al cambiar a trabajo no relacionado. El contexto viejo encarece cada mensaje y distrae.
- Antes de limpiar, `/rename` para poder volver con `/resume`.

### 2. Compacta con intención

```text
/compact conserva las decisiones de diseño del módulo de pagos y los tests pendientes
```

Y en tu `CLAUDE.md`:

```markdown
# Instrucciones de compactación
Al compactar, conserva: decisiones de arquitectura, comandos que funcionaron,
errores pendientes y el estado de la lista de tareas.
```

### 3. Modelo y esfuerzo adecuados

- Sonnet para la mayoría del trabajo; Opus para lo complejo (lección 21).
- Baja el esfuerzo (`/effort low` o `medium`) en tareas simples.
- `opusplan` para planificar con Opus y ejecutar con Sonnet (lección 23).

### 4. Prompts específicos

"Mejora este código" provoca que Claude lea medio repositorio. "Añade validación de email en `src/api/users.ts` en la función `createUser`" va al grano. **La precisión ahorra lecturas.**

### 5. Delegar lo verboso a subagentes

Ejecutar la suite completa de tests, leer logs enormes o explorar muchos archivos genera mucha salida. Un **subagente** hace ese trabajo en su propio contexto y devuelve solo un resumen (lección 49):

```text
> Usa un subagente para ejecutar toda la suite de tests y devuélveme solo
  la lista de tests que fallan con su error resumido.
```

### 6. MCP con moderación

Las herramientas MCP se cargan bajo demanda (solo sus nombres ocupan contexto hasta usarse), pero cada servidor suma. Desactiva los que no uses con `/mcp`. Cuando exista una **CLI** equivalente (`gh`, `aws`, `gcloud`…), suele ser más eficiente (lección 37).

### 7. Mueve instrucciones de `CLAUDE.md` a skills

Todo `CLAUDE.md` viaja en cada petición. Los procedimientos largos como skills solo se cargan al usarse (lecciones 14 y 39).

### 8. Filtra salidas con hooks

Un hook puede **reducir lo que Claude ve**. Por ejemplo, un hook `PreToolUse` que reescribe los comandos de test para mostrar solo los fallos:

```bash
#!/usr/bin/env bash
# ~/.claude/hooks/solo-fallos.sh — reescribe comandos de test para filtrar la salida
entrada=$(cat)
cmd=$(jq -r '.tool_input.command' <<<"$entrada")
if [[ "$cmd" =~ ^(npm\ test|pnpm\ test|pytest) ]]; then
  nuevo="$cmd 2>&1 | grep -E -A4 '(FAIL|Error|error:|failed)' | head -80"
  jq -n --arg c "$nuevo" --argjson ti "$(jq '.tool_input' <<<"$entrada")" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"allow",updatedInput:($ti + {command:$c})}}'
else
  echo '{}'
fi
```

Lo verás en detalle en las lecciones 44–46.

### 9. Plugins de inteligencia de código

Para lenguajes tipados, los plugins de *code intelligence* (servidores de lenguaje) permiten "ir a la definición" o "buscar referencias" sin leer archivos enteros.

### 10. Evita leer lo que no necesitas

- Pide rangos: *"lee solo la función `calculateTotal`"*.
- Excluye carpetas pesadas con permisos `deny` de lectura (`Read(./dist/**)`, `Read(./node_modules/**)`) si Claude tiende a explorarlas.

## Por qué el uso "se dispara" en sesiones largas

- El contexto crece con cada lectura y salida.
- La compactación automática ayuda, pero el resumen también ocupa espacio.
- Si trabajas con varios subagentes o equipos de agentes, cada uno consume su propio contexto.

La solución casi siempre es la misma: **sesiones más cortas y enfocadas**.

## Checklist rápido

- [ ] ¿Esta sesión tiene contexto de tareas anteriores que ya no importan? → `/clear`
- [ ] ¿Es una tarea simple con Opus en esfuerzo alto? → baja modelo o esfuerzo
- [ ] ¿Hay MCPs que no uso? → `/mcp` y desactívalos
- [ ] ¿Mi `CLAUDE.md` tiene procedimientos largos? → skills
- [ ] ¿Voy a leer logs o salidas enormes? → subagente o hook de filtrado

## Resumen

- El coste escala con el contexto: cada mensaje reenvía todo.
- Mide con `/usage` y `/context`; aprovecha la caché evitando cambios innecesarios.
- Sesiones enfocadas, compactación guiada, el modelo justo, subagentes para lo verboso, hooks y skills para descargar contexto.

## Ejercicios

1. Anota el resultado de `/usage` al final de una sesión real. ¿Qué modelo consumió más?
2. Repite una tarea en una sesión "sucia" (con contexto previo) y en una limpia. Compara.
3. Añade una sección de instrucciones de compactación a tu `CLAUDE.md`.
4. Delega la ejecución de la suite de tests a un subagente y compara el contexto consumido.

## Referencias

- [Gestionar costes](https://code.claude.com/docs/en/costs)
- [Caché de prompts](https://code.claude.com/docs/en/prompt-caching)
- [Ventana de contexto](https://code.claude.com/docs/en/context-window)
