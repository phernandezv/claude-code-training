---
titulo: Entrar en modo plan y leer un plan
resumen: Las formas de activar el modo plan (Shift+Tab, /plan, --permission-mode plan, defaultMode), qué puede y qué no puede hacer Claude mientras planifica, y cómo leer un plan de forma crítica.
---

## Objetivos de la lección

- Activar el modo plan de todas las formas posibles.
- Saber qué se permite y qué se bloquea durante la planificación.
- Leer un plan con ojo crítico: detectar huecos, supuestos y riesgos.

## Entrar en modo plan

| Forma | Cuándo usarla |
|---|---|
| `Shift+Tab` hasta ver `⏸ plan mode on` | En mitad de una sesión |
| `/plan <descripción>` | Entrar y empezar a planificar una tarea en un paso |
| `claude --permission-mode plan` | Arrancar la sesión ya planificando |
| `"defaultMode": "plan"` en `.claude/settings.json` | Que el proyecto arranque siempre en plan |
| VS Code: indicador de modo → *Plan* | En la extensión |

Ejemplos:

```bash
claude --permission-mode plan
```

```text
/plan migrar la autenticación de JWT en localStorage a cookies httpOnly
```

Para salir sin aprobar ningún plan, vuelve a pulsar `Shift+Tab`.

## Qué hace Claude en modo plan

- **Lee** archivos y busca en el código libremente.
- **Ejecuta comandos de exploración**: los de solo lectura siempre; otros, según tu configuración (con el clasificador del modo auto si está disponible, o pidiendo permiso).
- **Hace preguntas** si algo es ambiguo.
- **Escribe el plan** en un archivo de plan.
- **No edita tu código fuente** hasta que apruebes.

El plan se guarda como archivo (por defecto en `~/.claude/plans`; configurable con `plansDirectory`, p. ej. `"plansDirectory": "./plans"` para versionarlos en el repo). Además, el plan **sobrevive a la compactación**: se vuelve a inyectar desde disco.

## Cómo pedir un buen plan

```text
/plan Queremos permitir que los usuarios exporten sus pedidos a CSV desde
el panel. Requisitos: máx. 10.000 filas, respetar los filtros activos, no
bloquear la petición HTTP. Incluye archivos afectados, pasos, riesgos,
cómo lo probamos y qué queda fuera de alcance.
```

Cuanto más claros sean los **requisitos** y **restricciones**, mejor será el plan.

## Anatomía de un plan

Un plan típico tiene esta forma:

```markdown
## Plan: Exportación de pedidos a CSV

### Contexto
- Los filtros del panel se serializan en `useOrderFilters()` (web/src/hooks).
- La API ya tiene `GET /orders` con los mismos filtros (api/src/orders/routes.ts).
- Hay una cola BullMQ en api/src/jobs para tareas largas.

### Enfoque
Generar el CSV en un job en segundo plano y notificar con un enlace de descarga.

### Pasos
1. api: nuevo endpoint `POST /orders/export` que encola un job con los filtros.
2. api: job `exportOrders` que pagina de 1.000 en 1.000 y escribe en S3.
3. api: endpoint `GET /exports/:id` para consultar estado y URL firmada.
4. web: botón "Exportar CSV" + sondeo de estado + descarga.
5. Tests: unitarios del job, integración de los endpoints, e2e del botón.

### Riesgos
- Exportaciones enormes → límite de 10.000 filas y aviso al usuario.
- Datos personales en S3 → URL firmada con caducidad de 15 min.

### Verificación
- `pnpm --filter api test`, `pnpm --filter web test`, e2e `export.spec.ts`.

### Fuera de alcance
- Exportación a Excel; programación de exportaciones periódicas.
```

## Leer un plan con ojo crítico

No apruebes por inercia. Repasa esta lista:

| Pregunta | Qué buscar |
|---|---|
| ¿Ha entendido el problema? | ¿El objetivo coincide con lo que querías? |
| ¿Se basa en el código real? | ¿Cita archivos y funciones concretos que existen, o es genérico? |
| ¿Reutiliza lo que hay? | ¿Propone una librería nueva cuando ya existe una en el proyecto? |
| ¿El alcance es el justo? | ¿Toca más archivos de los necesarios? ¿Falta alguno obvio? |
| ¿Qué supone? | Supuestos implícitos ("asumo que siempre hay un usuario logueado") |
| ¿Cómo se verifica? | ¿Hay tests concretos o solo "probar que funciona"? |
| ¿Qué puede salir mal? | Migraciones, compatibilidad, rendimiento, seguridad |
| ¿Qué queda fuera? | ¿Coincide con tus expectativas? |

!!! tip "Pregunta antes de aprobar"
    Puedes seguir conversando en modo plan: *"¿por qué un job y no streaming directo?"*, *"¿qué pasa si el usuario cierra la pestaña?"*. Claude ajustará el plan sin tocar código.

## Señales de un plan flojo

- Vago: "actualizar los componentes necesarios".
- Sin rutas de archivo reales.
- Sin verificación o con "probar manualmente".
- Mezcla la tarea con refactors no pedidos.
- No menciona riesgos en un cambio que claramente los tiene.

Si ves esto, **pide más exploración** antes de aprobar: *"Lee primero X e Y y rehaz el plan con rutas concretas"*.

## Modo plan como herramienta de aprendizaje

El modo plan también sirve para **entender** código sin riesgo:

```text
(plan mode)
> Explícame el ciclo de vida de una petición en este backend, desde que entra
  por el router hasta que se escribe en la base de datos. Cita archivos y líneas.
```

Perfecto para *onboarding* en un repo nuevo.

## Resumen

- `Shift+Tab`, `/plan`, `--permission-mode plan` o `defaultMode: "plan"`.
- En plan, Claude lee y explora pero no edita tu código hasta que apruebas.
- Los planes se guardan en archivos y sobreviven a la compactación.
- Lee el plan como revisarías un diseño: código real, alcance, supuestos, verificación, riesgos.

## Ejercicios

1. Arranca `claude --permission-mode plan` en un repo que conozcas poco y pide una explicación de su arquitectura.
2. Usa `/plan` para una funcionalidad mediana e identifica al menos un supuesto implícito en el plan.
3. Configura `"plansDirectory": "./plans"` y comprueba que el plan aparece en tu proyecto.

## Referencias

- [Modo plan](https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode)
- [Referencia de settings: plansDirectory](https://code.claude.com/docs/en/settings-reference)
