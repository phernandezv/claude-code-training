---
titulo: "Qué es un subagente: contexto aislado, devuelve solo resultados"
resumen: El concepto de subagente - un asistente con su propia ventana de contexto, prompt de sistema, herramientas y permisos, que recibe una tarea y devuelve un resumen. Qué carga al empezar, ventajas, costes, cuándo usarlo frente a la conversación principal, forks y /btw.
---

## Objetivos de la lección

- Entender qué es un **subagente** y cómo se relaciona con la conversación principal.
- Saber qué información recibe un subagente al empezar y cuál no.
- Reconocer cuándo delegar compensa y cuándo no.
- Distinguir subagentes, *forks* y preguntas laterales (`/btw`).

## La idea

Un subagente es un **asistente especializado que Claude lanza para hacer una tarea concreta**. Tiene:

- Su **propia ventana de contexto**, independiente de la tuya.
- Su **propio prompt de sistema** (qué es y cómo trabaja).
- Sus **propias herramientas y permisos** (puede ser de solo lectura, por ejemplo).
- Opcionalmente, su **propio modelo** (Haiku para buscar, Opus para razonar…).

La conversación principal le pasa una tarea; el subagente trabaja (lee, busca, ejecuta…) y **devuelve solo el resultado**: un resumen, una lista de hallazgos, un informe.

```text
Conversación principal (tu contexto)
   │  "Busca todos los sitios donde se valida el email y resume cómo lo hacen"
   ▼
┌───────────── Subagente (contexto propio) ─────────────┐
│ Grep … Read … Read … Grep … Read … (40 archivos)       │
│ → cientos de líneas leídas que NO llegan a tu contexto │
└───────────────────────────────────────────────────────┘
   │  Resultado: "Se valida en 4 sitios: … (con archivo:línea)"
   ▼
Conversación principal (solo recibe el resumen)
```

## Por qué es útil: higiene del contexto

Sin subagentes, cada archivo leído y cada salida de comando se acumula en tu conversación, encareciendo cada mensaje y diluyendo lo importante (lección 24). Un subagente hace el trabajo "sucio" en otro contexto y te devuelve lo esencial.

Beneficios:

| Beneficio | Ejemplo |
|---|---|
| **Preservar contexto** | Explorar 50 archivos sin llenar tu conversación |
| **Imponer restricciones** | Un revisor que solo puede leer, nunca editar |
| **Especializar** | Un experto en SQL, en accesibilidad, en seguridad |
| **Reutilizar** | Definido una vez, disponible en todos tus proyectos |
| **Controlar costes** | Tareas simples con un modelo más barato |
| **Paralelizar** | Varios subagentes investigando a la vez (lección 51) |

## Qué recibe un subagente al empezar

Un subagente normal **empieza de cero**: no ve tu historial, ni los archivos que ya leyó Claude, ni las skills que invocaste. Recibe:

- Su **prompt de sistema** (el de su definición) más detalles del entorno.
- El **mensaje de tarea** que Claude redacta al delegar.
- Tus archivos **`CLAUDE.md`** (excepto los integrados Explore y Plan, que los omiten para ser más rápidos; y los que configures con `omitClaudeMd: true`).
- Una instantánea del **estado de Git** (salvo Explore y Plan).
- Las **skills precargadas** que indique su definición.

No recibe tu estilo de salida ni tu memoria automática (puede tener memoria propia).

!!! tip "La calidad depende del encargo"
    Como el subagente no ha visto la conversación, **el mensaje de tarea lo es todo**. Claude lo redacta por ti, pero cuando pides delegar, sé específico: qué buscar, dónde, qué formato de respuesta quieres y qué ignorar.

## Cómo se usan

### Delegación automática

Claude decide delegar según la tarea y la **descripción** de cada subagente disponible. Por ejemplo, ante *"¿dónde se gestionan los reintentos de pago?"*, puede lanzar el subagente de exploración.

### Pidiéndolo explícitamente

```text
> Usa un subagente para ejecutar toda la suite de tests y devuélveme solo
  los tests que fallan con su error resumido.

> Con un subagente de exploración, localiza todos los usos de la función
  legacyFormatPrice y dime cuáles se pueden migrar sin riesgo.
```

### Mencionándolo con `@`

Escribe `@` y elige un subagente de la lista (aparecen como `(agent)`), o escribe `@agent-<nombre>`. Eso **garantiza** que se use ese subagente para la tarea.

## Primer plano y segundo plano

- **Primer plano**: la conversación espera a que termine; los permisos que pida te aparecen directamente.
- **Segundo plano**: sigues trabajando mientras corre; su resultado llega cuando termina. Sus peticiones de permiso aparecen en tu sesión. `Ctrl+B` manda a segundo plano una tarea en curso y `/tasks` lista lo que está corriendo.

En sesiones interactivas, por defecto los subagentes suelen ejecutarse en segundo plano.

## Costes y límites

- Cada subagente hace sus propias peticiones al modelo: **consume tokens** (y cuota) aparte.
- Sus resultados, al volver, **sí entran** en tu contexto: pide resúmenes, no volcados.
- No tiene sentido para cambios rápidos: arrancar desde cero y reunir contexto lleva tiempo.

## ¿Subagente o conversación principal?

| Usa la conversación principal cuando… | Usa un subagente cuando… |
|---|---|
| La tarea necesita ida y vuelta contigo | La tarea es autocontenida y cabe en un resumen |
| Las fases comparten mucho contexto (plan → código → tests) | Genera mucha salida que no necesitas conservar |
| Es un cambio rápido y localizado | Quieres limitar herramientas o permisos |
| La latencia importa | Puedes paralelizar partes independientes |

## Parientes cercanos

| Mecanismo | Qué es | Contexto |
|---|---|---|
| **Subagente** | Asistente especializado con tarea propia | Empieza de cero |
| **Fork** (`/subtask <tarea>`) | Una copia de la conversación actual que trabaja en segundo plano | Hereda **todo** el historial |
| **`/btw <pregunta>`** | Pregunta lateral sobre lo que ya está en la conversación | Ve tu contexto pero no usa herramientas ni lo ensucia |
| **Skill con `context: fork`** | Una skill que se ejecuta dentro de un subagente | Empieza de cero con la skill como tarea |
| **Sesiones en segundo plano / equipos de agentes** | Sesiones independientes que trabajan en paralelo | Cada una su contexto completo |

## Resumen

- Subagente = contexto, prompt, herramientas y modelo propios; recibe una tarea y devuelve un resultado.
- Principal ventaja: mantener limpio tu contexto; además restringe, especializa, abarata y paraleliza.
- Empieza de cero: el encargo debe ser claro.
- No es gratis ni instantáneo: úsalo para trabajo autocontenido o voluminoso.

## Ejercicios

1. Pide a Claude que investigue una pregunta amplia sobre tu repo **con** un subagente y luego **sin** él. Compara `/context`.
2. Ejecuta tu suite de tests a través de un subagente y pide solo los fallos.
3. Prueba `/btw` con una pregunta sobre algo ya discutido y `/subtask` para una tarea paralela.

## Referencias

- [Subagentes](https://code.claude.com/docs/en/sub-agents)
- [Cómo funciona Claude Code: contexto](https://code.claude.com/docs/en/how-claude-code-works)
