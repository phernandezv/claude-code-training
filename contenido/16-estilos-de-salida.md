---
titulo: "Estilos de salida: elegir cómo te responde Claude"
resumen: Los estilos integrados (Default, Proactive, Concise, Explanatory, Learning), cómo cambiarlos con /output-style o settings, y cómo crear tus propios estilos con frontmatter y keep-coding-instructions.
---

## Objetivos de la lección

- Entender qué es un **estilo de salida** y en qué se diferencia de `CLAUDE.md`.
- Conocer los estilos integrados y cuándo usar cada uno.
- Cambiar de estilo durante la sesión o fijarlo por defecto.
- Crear un estilo personalizado para tu equipo o para ti.

## ¿Qué es un estilo de salida?

Un estilo de salida es un conjunto de instrucciones que definen el **rol, el tono y el formato** de las respuestas de Claude durante toda la sesión. En vez de escribir en cada prompt "sé breve" o "explícame el porqué", eliges un estilo una vez.

| Mecanismo | Responde a la pregunta… |
|---|---|
| `CLAUDE.md` | ¿Qué debe **saber** Claude de este proyecto? |
| Estilo de salida | ¿**Cómo** debe comunicarse y trabajar conmigo? |
| Hooks | ¿Qué debe **ocurrir siempre**, sin excepción? |

Igual que `CLAUDE.md`, un estilo **guía** pero no garantiza nada; para obligaciones usa hooks.

## Estilos integrados

| Estilo | Qué cambia | Úsalo cuando… |
|---|---|---|
| **Default** | Nada: las instrucciones estándar de ingeniería de software | Uso general |
| **Proactive** | Empieza a implementar enseguida y asume decisiones rutinarias en vez de preguntar | Quieres avanzar rápido y corregir sobre la marcha |
| **Concise** | Va directo al resultado: sin preámbulos, narración ni resúmenes finales | Las respuestas por defecto te parecen largas |
| **Explanatory** | Añade bloques breves de `★ Insight` explicando el porqué de sus decisiones | Estás conociendo un código nuevo o quieres aprender el razonamiento |
| **Learning** | Además de explicar, te deja **fragmentos para que los escribas tú** (`TODO(human)`) | Quieres practicar programando mientras se hace la tarea |

### Proactive

Claude empieza a trabajar en cuanto envías la tarea, sin pararse a preguntar por detalles rutinarios, y no entra en modo plan salvo que se lo pidas. Aun así, está instruido para consultarte antes de borrar datos o tocar sistemas compartidos o de producción. **No cambia tu modo de permisos**: si estás en Manual, seguirás viendo los diálogos de aprobación.

### Concise

La primera frase dice qué pasó o cuál es la respuesta. Las preguntas simples se responden en una a tres frases. Sigue dando información completa cuando la pides explícitamente o cuando importa para la seguridad (errores, tests fallidos, confirmaciones de acciones destructivas).

### Explanatory

Hace la tarea igual que Default y añade bloques de este estilo:

```text
★ Insight ─────────────────────────────────────
- Este repo registra todas las rutas en router.ts, por eso el endpoint nuevo
  se añade ahí y no con un decorador.
- La validación se hace con zod en la capa HTTP para que los servicios reciban
  siempre datos ya tipados.
─────────────────────────────────────────────────
```

### Learning

Claude implementa lo rutinario, pero cuando llega a una decisión de diseño interesante deja un comentario `TODO(human)` en el archivo y te pide que lo escribas tú, con contexto y pistas. Cuando terminas, te da su opinión y continúa. Ideal para formación de juniors o para aprender un lenguaje nuevo.

## Cambiar de estilo

**Con el comando** (desde el siguiente mensaje):

```text
/output-style concise
/output-style            ← lista los disponibles y marca el actual
```

**Con el menú**: `/config` → *Output style*.

Ambos guardan la elección en `.claude/settings.local.json` (solo para ti, en este proyecto).

**En un archivo de configuración**:

```json
{
  "outputStyle": "Explanatory"
}
```

- En `~/.claude/settings.json` → tu estilo por defecto en todos los proyectos.
- En `.claude/settings.json` → el estilo del proyecto para todo el equipo.

!!! warning "Mayúsculas"
    En el archivo el valor distingue mayúsculas: escribe `Proactive`, `Concise`, `Explanatory`, `Learning`. `"explanatory"` en minúsculas no coincide y te deja en Default. (El comando `/output-style` sí ignora mayúsculas.)

## Crear un estilo personalizado

Un estilo es un archivo Markdown con *frontmatter* y las instrucciones.

### Dónde guardarlo

| Nivel | Carpeta |
|---|---|
| Usuario | `~/.claude/output-styles/` |
| Proyecto | `.claude/output-styles/` |
| Organización | `.claude/output-styles/` dentro del directorio de *managed settings* |

Los plugins también pueden incluir estilos (lección 55).

### Frontmatter

| Campo | Descripción |
|---|---|
| `name` | Nombre del estilo (por defecto, el nombre del archivo) |
| `description` | Descripción que aparece en el selector |
| `keep-coding-instructions` | `true` para **conservar** las instrucciones de ingeniería de software de Claude Code junto a tu estilo. Por defecto `false` |

!!! tip "keep-coding-instructions"
    Si tu estilo solo cambia **cómo comunica** Claude y quieres que siga programando igual, pon `keep-coding-instructions: true`. Déjalo en `false` solo si vas a usar Claude Code para algo que no es programar (por ejemplo, redactar documentación o analizar datos).

### Ejemplo 1: revisor en español para el equipo

`.claude/output-styles/revisor-es.md`:

```markdown
---
name: Revisor ES
description: Respuestas en español, estructuradas y con riesgos explícitos
keep-coding-instructions: true
---
Responde siempre en español neutro. El código, los nombres de variables y los
mensajes de commit se escriben en inglés.

Estructura cada respuesta final así:
1. **Resultado**: una frase con lo que hiciste o la respuesta.
2. **Cambios**: lista de archivos tocados con una línea cada uno.
3. **Verificación**: comandos ejecutados y su resultado.
4. **Riesgos**: cualquier cosa que un revisor humano debería mirar.

No uses emojis. No repitas el enunciado de la tarea.
```

### Ejemplo 2: diagramas primero

```markdown
---
name: Diagramas primero
description: Cada explicación arranca con un diagrama Mermaid
keep-coding-instructions: true
---
Cuando expliques código, arquitectura o flujos de datos, empieza con un
diagrama Mermaid y luego explica en prosa.

- `flowchart TD` para control de flujo, `sequenceDiagram` para peticiones.
- Máximo 15 nodos por diagrama.
```

### Ejemplo 3: un asistente que no programa

```markdown
---
name: Redactor técnico
description: Escribe documentación para usuarios finales
---
Eres un redactor técnico. Tu trabajo es escribir y mejorar documentación en
`docs/` para usuarios no técnicos: frases cortas, voz activa, ejemplos
concretos y sin jerga. Nunca modifiques código fuente.
```

Activa tu estilo con `/output-style revisor-es` o desde `/config`. En la terminal, los archivos de estilos se leen al arrancar: si creas o editas uno, reinicia la sesión.

## Estilos, coste y caché

El estilo activo se envía completo en cada petición (el Default no añade nada). Además, cambiar de estilo a mitad de sesión invalida parte de la **caché de prompts** para el siguiente mensaje, así que no lo cambies constantemente.

## Resumen

- Estilo de salida = cómo se comunica y trabaja Claude durante toda la sesión.
- Integrados: Default, Proactive, Concise, Explanatory, Learning.
- `/output-style <nombre>` o `"outputStyle"` en settings (con mayúsculas correctas).
- Estilos propios en `.claude/output-styles/*.md`, con `keep-coding-instructions: true` si sigues programando.

## Ejercicios

1. Prueba la misma pregunta con `Concise` y con `Explanatory` y compara.
2. Activa `Learning` y pide una función pequeña; completa el `TODO(human)` que te deje.
3. Crea el estilo "Revisor ES" en tu proyecto y úsalo en una tarea real.
4. Fija tu estilo favorito en `~/.claude/settings.json`.

## Referencias

- [Estilos de salida](https://code.claude.com/docs/en/output-styles)
- [Settings](https://code.claude.com/docs/en/settings)
