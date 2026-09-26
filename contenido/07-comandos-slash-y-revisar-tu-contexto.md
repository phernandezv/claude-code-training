---
titulo: Comandos slash y revisar tu contexto
resumen: Los comandos integrados más útiles (/help, /context, /compact, /clear, /usage, /model, /config, /init, /memory, /doctor…) y cómo entender y administrar la ventana de contexto.
---

## Objetivos de la lección

- Descubrir y usar los **comandos slash** integrados.
- Entender qué es la **ventana de contexto** y qué la llena.
- Inspeccionar el contexto con `/context` y liberarlo con `/compact` y `/clear`.
- Consultar coste y límites de uso con `/usage`.

## ¿Qué es un comando slash?

Cualquier mensaje que empiece por `/` es un **comando**: una acción de Claude Code (no un prompt al modelo) o una *skill*. Escribe `/` y aparecerá un menú filtrable con todos los disponibles, incluidos los personalizados que crees (lección 47) y los de plugins.

```text
/help            → ayuda y lista de comandos
/                → menú de autocompletado
```

## Los comandos que más usarás

### Sesión y contexto

| Comando | Para qué sirve |
|---|---|
| `/clear [nombre]` | Empieza una conversación nueva con contexto vacío (la anterior se guarda) |
| `/compact [instrucciones]` | Resume la conversación para liberar espacio, opcionalmente con un foco |
| `/context` | Muestra una cuadrícula de colores con lo que ocupa el contexto |
| `/resume`, `/rename`, `/branch` | Gestión de sesiones (lección 6) |
| `/rewind` | Volver a un checkpoint (lección 3) |
| `/export [archivo]` | Exportar la conversación |
| `/btw <pregunta>` | Pregunta lateral que no se añade al hilo |
| `/recap` | Resumen de una línea de la sesión |

### Modelo y comportamiento

| Comando | Para qué sirve |
|---|---|
| `/model [modelo]` | Cambiar de modelo (lección 26) |
| `/effort [nivel]` | Nivel de esfuerzo/razonamiento: `low`, `medium`, `high`, `xhigh`, `max`, `auto` |
| `/fast [on\|off]` | Modo rápido |
| `/plan [descripción]` | Entrar en modo plan |
| `/output-style [estilo]` | Cambiar el estilo de respuesta (lección 19) |
| `/config` | Panel de ajustes (tema, modelo, etc.); también `/config clave=valor` |

### Proyecto y configuración

| Comando | Para qué sirve |
|---|---|
| `/init` | Genera un `CLAUDE.md` inicial analizando el repo (lección 12) |
| `/memory` | Editar archivos `CLAUDE.md` y la memoria automática |
| `/permissions` | Ver/editar reglas allow/ask/deny (lección 17) |
| `/add-dir <ruta>` | Dar acceso a otro directorio durante la sesión |
| `/mcp` | Estado y autenticación de servidores MCP (lección 37) |
| `/hooks` | Ver los hooks configurados (lección 49) |
| `/skills` | Listar skills disponibles (lección 43) |
| `/plugin` | Gestionar plugins (lección 62) |
| `/agents` | Gestionar subagentes (lección 57) |

### Diagnóstico y cuenta

| Comando | Para qué sirve |
|---|---|
| `/status` | Versión, modelo, cuenta, conectividad |
| `/doctor` | Revisión de la instalación y configuración, con sugerencias |
| `/usage` | Coste de la sesión, límites del plan y estadísticas (`/cost` y `/stats` son alias) |
| `/diff` | Ver los cambios del árbol de trabajo |
| `/tasks` | Ver tareas en segundo plano (lección 9) |
| `/feedback` | Reportar un problema a Anthropic |
| `/login`, `/logout` | Cambiar de cuenta |

### Revisión de código

| Comando | Para qué sirve |
|---|---|
| `/review` (alias de `/code-review`) | Revisar el diff actual, una rama o un PR |
| `/security-review` | Revisar los cambios de la rama buscando vulnerabilidades |

Los veremos en la lección 33.

## La ventana de contexto

El **contexto** es todo lo que el modelo "ve" en cada petición. Incluye:

- El *system prompt* de Claude Code y las definiciones de herramientas.
- Tus archivos `CLAUDE.md` y la memoria automática.
- Las descripciones de skills y los nombres de herramientas MCP.
- **Toda la conversación**: tus mensajes, respuestas, contenido de archivos leídos, salidas de comandos…

Cada modelo tiene un límite (típicamente 200.000 tokens, y 1 millón en algunos modelos/planes). Cuanto más lleno está:

- **Más cuesta** cada mensaje (se reenvía todo, aunque la caché ayuda).
- **Más ruido** compite con lo importante; las instrucciones antiguas pueden diluirse.

### Ver el contexto: `/context`

```text
/context
```

Muestra una cuadrícula de colores con cuánto ocupa cada categoría (system prompt, herramientas, MCP, memoria/CLAUDE.md, skills, mensajes) y sugerencias de optimización, por ejemplo servidores MCP que ocupan mucho o archivos de memoria demasiado grandes. Úsalo cuando:

- La sesión se vuelve lenta o cara.
- Sospechas que un MCP o un `CLAUDE.md` enorme está ocupando demasiado.
- Vas a empezar una tarea grande y quieres saber cuánto margen tienes.

### Liberar contexto

**`/clear`**: la opción más limpia cuando cambias de tarea. Contexto a cero (la conversación anterior sigue guardada).

**`/compact`**: sustituye el historial por un resumen. Puedes guiar el resumen:

```text
/compact céntrate en los cambios de la API de pagos y los tests que siguen fallando
```

**Compactación automática**: cuando te acercas al límite, Claude Code primero descarta salidas antiguas de herramientas y luego resume la conversación automáticamente. Puedes ajustar cuándo ocurre con `/autocompact` (por ejemplo `/autocompact 500k`).

### Qué sobrevive a la compactación

| Elemento | Tras compactar |
|---|---|
| System prompt y estilo de salida | Se mantienen |
| `CLAUDE.md` raíz y reglas sin `paths` | Se vuelven a leer de disco |
| Memoria automática | Se vuelve a inyectar |
| El plan del modo plan | Se vuelve a inyectar |
| Archivos leídos/editados | Se releen hasta 5 (los modificados más recientemente) |
| Skills invocadas | Se reinyectan (con un límite de tamaño) |
| Instrucciones que diste al principio en el chat | **Pueden perderse** (quedan resumidas) |

!!! tip "Regla de oro"
    Si una instrucción debe cumplirse **siempre**, no la digas solo en el chat: ponla en `CLAUDE.md` (lección 12). El chat se compacta; `CLAUDE.md` se recarga.

También puedes añadir una sección "Compact Instructions" en tu `CLAUDE.md` para indicar qué conservar siempre al compactar.

## Coste y límites: `/usage`

```text
/usage
```

Muestra el coste de la sesión, tus límites de uso del plan y estadísticas de actividad. En planes Pro/Max/Team/Enterprise incluye un desglose de qué consume tu cuota. Profundizaremos en la lección 28.

## Personalizar la barra de estado

Con `/statusline` puedes configurar una barra de estado que muestre, por ejemplo, el modelo, la rama de Git y el porcentaje de contexto usado. Descríbelo en lenguaje natural:

```text
/statusline muestra el modelo, la rama de git y el % de contexto usado
```

En la lección 10 verás cómo personalizarla a fondo junto con atajos, tema y terminal.

## Resumen

- Escribe `/` para descubrir comandos; `/help` para ayuda.
- `/context` diagnostica, `/compact` resume, `/clear` reinicia.
- La compactación automática existe, pero lo importante debe vivir en `CLAUDE.md`.
- `/usage` para coste y límites, `/status` y `/doctor` para diagnóstico.

## Ejercicios

1. Escribe `/` y recorre el menú. Anota cinco comandos que no conocías.
2. Ejecuta `/context` al inicio de una sesión y otra vez tras pedir a Claude que lea varios archivos grandes. Compara.
3. Ejecuta `/compact céntrate en X` y pregunta a Claude qué recuerda de la conversación.
4. Configura una barra de estado con `/statusline`.

## Referencias

- [Comandos integrados](https://code.claude.com/docs/en/commands)
- [Explorar la ventana de contexto](https://code.claude.com/docs/en/context-window)
- [Barra de estado](https://code.claude.com/docs/en/statusline)
