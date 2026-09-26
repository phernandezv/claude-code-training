---
titulo: La mentalidad de planificar y luego ejecutar
resumen: Por qué separar exploración, planificación e implementación produce mejores resultados, cuándo merece la pena planificar y cuándo no, y cómo aplicar el flujo explorar → planificar → implementar → verificar.
---

## Objetivos de la lección

- Entender el coste de dejar que Claude "se lance a programar" sin entender el problema.
- Aplicar el flujo **explorar → planificar → implementar → verificar**.
- Decidir cuándo planificar y cuándo ir directo.
- Pedir planes útiles, aunque no uses el modo plan.

## El problema de empezar por el código

Un agente muy capaz tiene una tentación: resolver **rápido**. Si le pides "añade autenticación con Google", puede ponerse a escribir código en segundos… y construir algo que:

- Ignora que el proyecto ya tiene un sistema de sesiones.
- Elige una librería distinta de la que usa el equipo.
- Toca 15 archivos cuando bastaban 4.
- Resuelve el problema que **imaginó**, no el que tenías.

Deshacer eso cuesta más que haber dedicado cinco minutos a entender y acordar el enfoque. Es la misma lógica que con un compañero humano: antes de un cambio grande, se discute el diseño.

## El flujo en cuatro fases

### 1. Explorar

Claude lee el código relevante y responde preguntas **sin modificar nada**.

```text
> Lee src/auth/ y src/middleware/ y explícame cómo funcionan hoy las sesiones.
  ¿Dónde se crea la cookie y dónde se valida? No edites nada.
```

### 2. Planificar

Claude propone un plan concreto: archivos a tocar, pasos, riesgos, cómo se va a verificar.

```text
> Quiero añadir login con Google OAuth reutilizando el sistema de sesiones actual.
  Propón un plan: qué archivos cambian, qué dependencias añadirías, cómo migramos
  usuarios existentes y cómo lo vamos a probar.
```

Tú revisas, preguntas y corriges **antes** de que haya código.

### 3. Implementar

Con el plan aprobado, Claude ejecuta. Ahora el trabajo es mucho más predecible.

```text
> Adelante con el plan. Tras cada paso, ejecuta los tests afectados.
```

### 4. Verificar y cerrar

Tests, lint, revisión del diff, y el commit/PR.

```text
> Ejecuta la suite completa y el lint, resume los cambios y crea un commit
  con un mensaje descriptivo.
```

## ¿Cuándo planificar?

| Planifica si… | Ve directo si… |
|---|---|
| El cambio toca varios archivos o módulos | El cambio es de una o dos líneas |
| No conoces bien esa parte del código | Sabes exactamente qué hay que hacer |
| Hay varias formas razonables de hacerlo | Solo hay una forma obvia |
| Es difícil de revertir (migraciones, APIs públicas) | Se puede deshacer trivialmente |
| La petición es ambigua | El resultado esperado es inequívoco |

Una regla práctica: **si puedes describir el diff en una frase, no necesitas plan.** "Corrige la errata en el título del README" no lo necesita; "mueve la facturación a un servicio independiente", sí.

## Planificar sin modo plan

El modo plan (lecciones 19–20) es la herramienta dedicada, pero la mentalidad funciona también con prompts:

```text
> Antes de escribir código, investiga cómo se hace hoy la paginación en la API,
  y proponme dos alternativas con pros y contras. Espera mi respuesta.
```

La diferencia: en modo plan, Claude Code **impide técnicamente** las ediciones hasta que apruebes. Con un prompt, dependes de que Claude respete la instrucción.

## Deja que Claude te entreviste

Para funcionalidades poco definidas, invierte el papel:

```text
> Quiero añadir un sistema de notificaciones. Antes de planificar, hazme las
  preguntas que necesites para entender los requisitos (canales, frecuencia,
  preferencias de usuario, etc.). Hazlas de una en una.
```

Claude puede usar su herramienta de preguntas (`AskUserQuestion`) para presentarte opciones concretas. Las respuestas alimentan un plan mucho mejor.

## Qué hace bueno a un plan

Un plan útil es **revisable**. Pide que incluya:

- **Objetivo** en una frase.
- **Archivos** que se crean/modifican/borran.
- **Pasos** ordenados y pequeños.
- **Decisiones** tomadas y alternativas descartadas (con el porqué).
- **Riesgos** y cómo mitigarlos.
- **Verificación**: qué tests o comandos demostrarán que funciona.
- **Fuera de alcance**: lo que explícitamente no se va a tocar.

Puedes hacerlo permanente con una línea en `CLAUDE.md`:

```markdown
- Cuando propongas un plan, incluye: archivos afectados, pasos, riesgos,
  verificación y qué queda fuera de alcance.
```

## El coste de planificar

Planificar consume tokens (lectura de archivos y razonamiento) y unos minutos. Por eso no se planifica todo. Pero en cambios medianos y grandes, **el plan se amortiza** evitando reescrituras. Además, en la lección 23 verás cómo usar un modelo potente solo para planificar (`opusplan`) y uno más económico para ejecutar.

## Resumen

- Explorar → planificar → implementar → verificar.
- Planifica cuando hay ambigüedad, varios archivos o riesgo; ve directo en cambios triviales.
- Un buen plan dice qué, dónde, cómo se verifica y qué queda fuera.
- Puedes planificar con prompts, pero el modo plan lo garantiza técnicamente.

## Ejercicios

1. Elige una funcionalidad mediana de tu backlog. Pide a Claude que te entreviste antes de planificar.
2. Pide un plan con las secciones de "Qué hace bueno a un plan". Identifica una decisión con la que no estés de acuerdo y corrígela.
3. Compara: haz un cambio pequeño sin plan y uno mediano con plan. Anota cuántas correcciones necesitaste en cada caso.

## Referencias

- [Buenas prácticas: explorar, planificar, programar](https://code.claude.com/docs/en/best-practices)
- [Modo plan](https://code.claude.com/docs/en/permission-modes)
- [Flujos de trabajo comunes](https://code.claude.com/docs/en/common-workflows)
