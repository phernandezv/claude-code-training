---
titulo: "Claude Code en equipos y empresas: administración, políticas y costes"
resumen: Desplegar Claude Code en una organización - elegir proveedor, distribuir políticas con managed settings (consola, MDM, archivo), qué se puede imponer (permisos, modos, sandbox, MCP, plugins, hooks, modelos, versiones), CLAUDE.md corporativo, visibilidad de uso y costes con analytics y OpenTelemetry, y un plan de adopción.
---

## Objetivos de la lección

- Conocer las decisiones clave al desplegar Claude Code en un equipo u organización.
- Distribuir **políticas** con *managed settings* y saber qué se puede imponer.
- Medir **uso y costes** con los paneles de analítica y OpenTelemetry.
- Plantear un **plan de adopción** gradual.

## Decisión 1: el proveedor

| Opción | Cuándo |
|---|---|
| **Claude Team / Enterprise** | Suscripción por puesto que incluye Claude Code y claude.ai, sin infraestructura. La recomendación por defecto |
| **Claude Console (API)** | Enfoque API, pago por uso |
| **Amazon Bedrock / Google Cloud / Microsoft Foundry** | Aprovechar controles de cumplimiento y facturación existentes en tu nube |

Algunas funciones requieren cuenta de claude.ai (sesiones en la nube, *routines*, Code Review gestionado, Remote Control…), así que la elección del proveedor también define qué funciones tendrá el equipo.

## Decisión 2: cómo llegan las políticas a cada máquina

Las **managed settings** son la configuración de la organización: tienen prioridad sobre la del usuario y la del proyecto.

| Mecanismo | Cómo se entrega |
|---|---|
| **Gestionado desde el servidor** | Consola de administración de claude.ai (Team/Enterprise). Se descarga al arrancar y se refresca periódicamente |
| **Políticas del sistema (MDM)** | macOS: plist `com.anthropic.claudecode`; Windows: registro `HKLM\SOFTWARE\Policies\ClaudeCode` |
| **Archivo** | macOS: `/Library/Application Support/ClaudeCode/managed-settings.json` · Linux/WSL: `/etc/claude-code/managed-settings.json` · Windows: `C:\Program Files\ClaudeCode\managed-settings.json` |

Comprueba qué fuentes están activas en una máquina con `/status`.

## Decisión 3: qué imponer

| Control | Para qué | Ejemplos de claves |
|---|---|---|
| Reglas de permisos | Permitir/denegar herramientas y comandos | `permissions.allow`, `permissions.deny` |
| Solo reglas gestionadas | Que nadie añada sus propias reglas `allow` | `allowManagedPermissionRulesOnly` |
| Modo de arranque y modos prohibidos | Modo inicial; desactivar auto o bypass | `permissions.defaultMode`, `permissions.disableBypassPermissionsMode`, `permissions.disableAutoMode` |
| Sandbox | Aislamiento de archivos y red obligatorio | `sandbox.*` |
| CLAUDE.md corporativo | Instrucciones que no se pueden excluir | Archivo en la ruta de *managed policy* (lección 15) |
| MCP | Qué servidores se permiten o se proveen a todos | Configuración MCP gestionada |
| Plugins | Qué marketplaces se permiten; plugins obligatorios o bloqueados | `extraKnownMarketplaces`, `enabledPlugins` |
| Hooks | Solo los hooks gestionados; URLs permitidas para hooks HTTP | `allowManagedHooksOnly` |
| Modelos | Qué modelos aparecen; tope de esfuerzo | `availableModels`, `maxEffortLevel` |
| Versiones | Versión mínima o rango permitido | `minimumVersion`, `requiredMinimumVersion` |
| Inicio de sesión | Método u organización obligatorios | `forceLoginMethod` |

Ejemplo de `managed-settings.json` para una organización prudente:

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)", "Read(./.env.*)", "Read(~/.aws/**)", "Read(~/.ssh/**)",
      "Bash(git push --force *)", "Bash(curl * | sh)"
    ],
    "disableBypassPermissionsMode": "disable"
  },
  "sandbox": {
    "enabled": true,
    "network": { "allowedDomains": ["registry.npmjs.org", "pypi.org", "*.github.com", "*.acme.internal"] }
  },
  "extraKnownMarketplaces": {
    "acme": { "source": { "source": "github", "repo": "acme/claude-plugins" }, "autoUpdate": true }
  },
  "enabledPlugins": { "acme-dev-tools@acme": true },
  "minimumVersion": "2.1.200"
}
```

!!! tip "Permisos y sandbox se complementan"
    Denegar `WebFetch` no impide que `curl` salga a internet si Bash está permitido. La lista de dominios del **sandbox** cierra ese hueco a nivel de sistema operativo.

Las organizaciones Enterprise que usan claude.ai o la API de Anthropic pueden además restringir modelos, fijar el modelo por defecto y limitar el esfuerzo desde la consola, sin desplegar nada en las máquinas.

## Visibilidad de uso y costes

| Herramienta | Qué ofrece |
|---|---|
| `/usage` | Consumo de la sesión y límites del plan (cada persona) |
| **Panel de analítica** (claude.ai/analytics en Team/Enterprise; Console para API) | Adopción, contribución, uso y gasto por usuario |
| **API de analítica** (Enterprise) | Datos de uso y coste por usuario para tus propios informes |
| **Límites de gasto** | Límites por organización o por usuario en la administración |
| **OpenTelemetry** | Métricas y eventos (sesiones, herramientas, tokens, coste) hacia tu sistema de observabilidad |

### OpenTelemetry

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.acme.internal:4317
claude
```

Estas variables se pueden distribuir en el `env` de las *managed settings* para toda la organización. Sirven para paneles de adopción y coste, alertas y auditoría (por ejemplo, qué herramientas MCP se usan y quién las usa).

## Datos y seguridad

- Revisa las políticas de **uso y retención de datos** de tu plan (existen opciones como la retención cero de datos para ciertos acuerdos).
- Define qué repositorios y qué datos pueden usarse con Claude Code.
- Combina permisos, sandbox, hooks gestionados y listas de MCP/plugins permitidos.
- Revisa los plugins y servidores MCP antes de aprobarlos para la organización.

## Plan de adopción recomendado

1. **Piloto** con un equipo pequeño y motivado: configuración mínima, mucho aprendizaje.
2. **Estándares compartidos**: plantilla de `CLAUDE.md`, `.claude/settings.json` base, skills y agentes comunes en un plugin del equipo (lecciones 61–64).
3. **Políticas**: managed settings con los mínimos de seguridad (secretos, comandos destructivos, sandbox).
4. **Formación**: este curso, sesiones de *pair programming* con Claude, un canal para compartir trucos y fallos.
5. **Medición**: analítica y OpenTelemetry; revisa adopción, coste y calidad (incidencias, tiempos de revisión).
6. **Iteración**: incorpora lo aprendido a CLAUDE.md, skills, hooks y plugins; amplía a más equipos.

## Resumen

- Elige proveedor según facturación, cumplimiento y funciones necesarias.
- *Managed settings* (consola, MDM o archivo) imponen permisos, modos, sandbox, MCP, plugins, hooks, modelos y versiones.
- Mide con analítica, `/usage` y OpenTelemetry.
- Adopta por fases: piloto, estándares, políticas, formación, medición e iteración.

## Ejercicios

1. Redacta un `managed-settings.json` mínimo para tu equipo con reglas de secretos y comandos destructivos.
2. Comprueba con `/status` qué fuentes de configuración están activas en tu máquina.
3. Configura OpenTelemetry con el exportador `console` para ver qué métricas emite Claude Code.
4. Escribe un plan de adopción de una página para tu organización basado en esta lección.

## Referencias

- [Configuración para administradores](https://code.claude.com/docs/en/admin-setup)
- [Managed settings](https://code.claude.com/docs/en/managed-settings)
- [Monitorización con OpenTelemetry](https://code.claude.com/docs/en/monitoring-usage)
- [Analítica](https://code.claude.com/docs/en/analytics) · [Costes](https://code.claude.com/docs/en/costs)
