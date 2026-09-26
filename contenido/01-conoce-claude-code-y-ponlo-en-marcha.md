---
titulo: Conoce Claude Code y ponlo en marcha
resumen: Qué es Claude Code, en qué se diferencia de un chat, dónde puedes usarlo y cómo instalarlo, autenticarte y verificar que todo funciona.
---

## Objetivos de la lección

Al terminar podrás:

- Explicar qué es Claude Code y por qué se le llama **agente** y no simplemente "chat con IA".
- Instalarlo en macOS, Linux, WSL o Windows con el método recomendado.
- Iniciar sesión con tu cuenta (o con una API key) y comprobar la instalación con `claude --version` y `claude doctor`.
- Conocer las distintas "superficies" donde vive Claude Code (terminal, IDE, escritorio, web).

## ¿Qué es Claude Code?

Claude Code es una herramienta de programación **agéntica** de Anthropic. En lugar de copiar y pegar fragmentos de código entre un chat y tu editor, Claude Code trabaja **directamente dentro de tu proyecto**: lee archivos, busca en el código, edita, ejecuta comandos en la terminal (tests, linters, `git`…) y verifica el resultado.

La diferencia clave con un asistente de chat tradicional:

| Chat tradicional | Claude Code |
|---|---|
| Tú copias el código relevante al chat | Claude busca y lee los archivos que necesita |
| Te devuelve un bloque de código para pegar | Edita los archivos en tu disco (con tu permiso) |
| No sabe si su propuesta funciona | Ejecuta tests/compilación y corrige si algo falla |
| Una respuesta por pregunta | Un **bucle** de varios pasos hasta cumplir la tarea |

A ese bucle se le llama **bucle agéntico**: *reunir contexto → actuar → verificar*, repetido tantas veces como haga falta. Lo veremos con detalle en la lección 3.

### Dos piezas: el modelo y el "arnés"

- **El modelo** (Claude Opus, Sonnet o Haiku) es el que razona: entiende tu petición, decide qué hacer y escribe código.
- **Claude Code** es la capa que rodea al modelo (el *agentic harness*): le da **herramientas** (leer, editar, ejecutar Bash, buscar en la web…), gestiona el **contexto** que el modelo ve y aplica los **permisos** que tú configuras.

Sin herramientas, un modelo solo puede responder con texto. Con herramientas, puede *actuar*.

## Dónde puedes usar Claude Code

Claude Code es el mismo motor en varias interfaces:

| Superficie | Para qué es ideal |
|---|---|
| **CLI (terminal)** | La experiencia completa; todo el curso se basa en ella |
| **Extensión de VS Code / Cursor** | Ver diffs en el editor, compartir selección de código |
| **Plugin de JetBrains** | IntelliJ, PyCharm, WebStorm, etc. (ejecuta la CLI en la terminal del IDE) |
| **App de escritorio** | Interfaz gráfica sin terminal |
| **Web (claude.ai/code) y móvil** | Sesiones en la nube sobre repos de GitHub, sin instalar nada |
| **GitHub Actions / GitLab CI** | Automatización en tu pipeline (lección 52) |

Todas comparten la misma configuración (`CLAUDE.md`, `settings.json`, skills, MCP…), así que lo que aprendas en la terminal se traslada al resto.

## Requisitos

- **Sistema operativo**: macOS 13+, Windows 10 1809+ (o Server 2019+), Ubuntu 20.04+, Debian 10+, Alpine 3.19+.
- **Hardware**: 4 GB de RAM o más, procesador x64 o ARM64.
- **Conexión a internet** (el modelo corre en la nube).
- **Shell**: Bash, Zsh, PowerShell o CMD.
- **Cuenta**: un plan **Pro, Max, Team o Enterprise** de Claude, o una cuenta de **Claude Console** (API). El plan gratuito de claude.ai no incluye Claude Code. También puedes usar proveedores como Amazon Bedrock, Google Cloud o Microsoft Foundry.

## Instalación

### Instalador nativo (recomendado)

**macOS, Linux y WSL:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows (CMD):**

```bat
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

!!! tip "¿PowerShell o CMD?"
    Si ves `PS C:\...>` en el prompt estás en PowerShell. Si aparece el error *"The token '&&' is not a valid statement separator"*, estás usando el comando de CMD dentro de PowerShell (y al revés: *"'irm' is not recognized"* significa que estás en CMD).

La instalación nativa **se actualiza sola** en segundo plano.

### Alternativas con gestor de paquetes

```bash
# Homebrew (macOS / Linux) – canal estable
brew install --cask claude-code
# o el canal "latest", que recibe versiones en cuanto salen
brew install --cask claude-code@latest

# WinGet (Windows)
winget install Anthropic.ClaudeCode
```

Estas instalaciones **no se actualizan solas**: usa `brew upgrade claude-code` o `winget upgrade Anthropic.ClaudeCode` periódicamente.

### Notas para Windows

Puedes ejecutar Claude Code de forma nativa o dentro de **WSL**:

- **Nativo**: no necesitas permisos de administrador. Si instalas [Git for Windows](https://git-scm.com/downloads/win), Claude usará Git Bash para su herramienta Bash; si no, usará PowerShell.
- **WSL 2**: recomendable si trabajas con herramientas Linux o quieres usar el *sandbox* de comandos. Instala y ejecuta `claude` **dentro** de la terminal de WSL.

## Verificar la instalación

Abre **una terminal nueva** (para que se recargue el `PATH`) y ejecuta:

```bash
claude --version
# Ejemplo de salida: 2.1.xxx (Claude Code)
```

Para un diagnóstico más completo, sin abrir sesión:

```bash
claude doctor
```

`claude doctor` revisa la salud de la instalación, detecta errores en tus archivos de configuración y sugiere correcciones.

!!! warning "command not found: claude"
    Si la terminal no encuentra `claude`, el directorio de instalación (normalmente `~/.local/bin`) no está en tu `PATH`. Añádelo en tu `~/.bashrc` o `~/.zshrc`:

    ```bash
    export PATH="$HOME/.local/bin:$PATH"
    ```

## Autenticación

La primera vez que ejecutes `claude` se abrirá el navegador para iniciar sesión:

```bash
cd ~/proyectos/mi-app
claude
```

Opciones de autenticación:

1. **Suscripción de Claude (Pro/Max/Team/Enterprise)**: inicias sesión con tu cuenta de claude.ai.
2. **Claude Console (API)**: pagas por uso con créditos de la API.
3. **Variable `ANTHROPIC_API_KEY`**: si está definida, Claude Code te pedirá una sola vez que apruebes esa clave en lugar de abrir el navegador.
4. **Proveedores cloud**: Bedrock, Vertex/Agent Platform o Foundry, configurados con variables de entorno.

Dentro de una sesión puedes cambiar de cuenta con `/login` y cerrar sesión con `/logout`. Con `/status` ves la versión, el modelo, la cuenta activa y el estado de conexión.

## Canal de actualizaciones

Por defecto recibes cada versión en cuanto sale (canal `latest`). Si prefieres algo más conservador, usa el canal `stable` (aprox. una semana de retraso, saltándose versiones con regresiones graves). Puedes cambiarlo en `/config` o en `~/.claude/settings.json`:

```json
{
  "autoUpdatesChannel": "stable"
}
```

Para actualizar manualmente en cualquier momento:

```bash
claude update
```

## Tu primer arranque

```bash
cd ruta/a/tu/proyecto
claude
```

Verás una pantalla de bienvenida y un cuadro de entrada. La primera vez que abras Claude en una carpeta te preguntará si **confías** en ella (porque el proyecto podría contener configuración que ejecuta comandos). Acepta solo en proyectos que conozcas.

Prueba algo sencillo:

```text
> ¿Qué hace este proyecto? Dame un resumen de la estructura de carpetas.
```

Claude leerá archivos por su cuenta (verás las herramientas que usa: `Read`, `Glob`, `Grep`…) y te responderá. Para salir: `Ctrl+D` o escribe `/exit`.

## Resumen

- Claude Code = modelo Claude + herramientas + gestión de contexto + permisos.
- Se instala con un comando (`curl … | bash` o `irm … | iex`) y se actualiza solo.
- `claude --version` y `claude doctor` confirman que todo está bien.
- Necesitas un plan de pago de Claude o una cuenta de Console/API.

## Ejercicios

1. Instala Claude Code con el método nativo y ejecuta `claude --version`.
2. Ejecuta `claude doctor` y lee cada línea del informe. ¿Hay algún aviso?
3. Abre `claude` dentro de un proyecto tuyo y pide: *"Explícame la arquitectura de este repositorio en 5 puntos"*. Observa qué herramientas usa.
4. Ejecuta `/status` dentro de la sesión e identifica tu modelo y tu tipo de cuenta.

## Referencias

- [Quickstart oficial](https://code.claude.com/docs/en/quickstart)
- [Instalación avanzada y requisitos](https://code.claude.com/docs/en/setup)
- [Autenticación](https://code.claude.com/docs/en/authentication)
- [Solución de problemas de instalación](https://code.claude.com/docs/en/troubleshoot-install)
