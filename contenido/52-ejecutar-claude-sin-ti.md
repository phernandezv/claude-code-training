---
titulo: "Ejecutar Claude sin ti: CI, tareas programadas y pre-commit"
resumen: Automatizar Claude Code fuera de la sesión interactiva - GitHub Actions (menciones @claude, revisión de PRs, skills y cron), GitLab CI, scripts con claude -p, hooks de pre-commit de Git, /loop y tareas programadas, routines en la nube, y buenas prácticas de seguridad y coste.
---

## Objetivos de la lección

- Integrar Claude en **GitHub Actions** (y conocer la opción de GitLab).
- Usar `claude -p` en scripts, *pre-commit hooks* de Git y trabajos programados.
- Conocer `/loop`, las tareas programadas y las *routines* en la nube.
- Aplicar buenas prácticas de seguridad, reproducibilidad y coste.

## Principios para ejecuciones desatendidas

Sin nadie delante para aprobar permisos, hay que decidirlo todo de antemano:

| Principio | Cómo |
|---|---|
| **Permisos explícitos** | `--allowedTools` y/o `--permission-mode dontAsk`; nunca `--dangerously-skip-permissions` fuera de un contenedor aislado |
| **Reproducibilidad** | `--bare` (no carga hooks, MCP ni memoria locales), `--model` con versión fija |
| **Límites** | `--max-turns`, timeouts del job |
| **Salida procesable** | `--output-format json` + `jq`; `--json-schema` si necesitas estructura |
| **Secretos** | En el gestor de secretos del CI, nunca en el repo |
| **Coste** | Modelos adecuados, prompts acotados, disparadores específicos |

## GitHub Actions

La acción oficial `anthropics/claude-code-action` ejecuta Claude Code dentro de tus workflows.

### Instalación rápida

Desde una sesión en el repo:

```text
/install-github-app
```

Te guía para instalar la GitHub App de Claude y configurar el secreto (`ANTHROPIC_API_KEY`, o un token de suscripción generado con `claude setup-token` en el secreto `CLAUDE_CODE_OAUTH_TOKEN`).

### Modo interactivo: responder a `@claude`

`.github/workflows/claude.yml`:

```yaml
name: Claude (menciones)
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          claude_args: "--model sonnet --max-turns 20"
```

Uso, en cualquier issue o PR:

```text
@claude implementa lo descrito en este issue y abre un PR
@claude ¿por qué falla el job de tests en este PR?
@claude aplica las sugerencias de la revisión de arriba
```

### Modo automatización: un prompt fijo

Con el parámetro `prompt`, Claude actúa sin necesidad de mención. Por ejemplo, revisar cada PR ejecutando una skill del repositorio:

```yaml
name: Revisión automática
on:
  pull_request:
    types: [opened, synchronize, ready_for_review]

jobs:
  revisar:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v6
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "/revisar-pr ${{ github.event.pull_request.number }}"
          claude_args: '--allowedTools "Read,Grep,Glob,Bash(gh pr diff *),Bash(gh pr view *),Bash(gh pr comment *)"'
```

(La skill `/revisar-pr` vive en `.claude/skills/` del repo; por eso se hace `checkout` antes.)

### Programado con cron

```yaml
name: Informe semanal de dependencias
on:
  schedule:
    - cron: "0 8 * * 1"   # lunes 08:00 UTC

jobs:
  informe:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
      id-token: write
    steps:
      - uses: actions/checkout@v6
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Ejecuta /informe-dependencias y publica el resultado como un issue titulado 'Dependencias – semana actual' usando gh."
          claude_args: '--allowedTools "Bash(npm outdated *),Bash(npm audit *),Bash(gh issue create *),Read"'
```

### Parámetros más usados

| Parámetro | Para qué |
|---|---|
| `prompt` | Instrucción fija (texto o `/skill`) |
| `claude_args` | Cualquier flag de la CLI (`--model`, `--max-turns`, `--allowedTools`, `--mcp-config`…) |
| `anthropic_api_key` / `claude_code_oauth_token` | Autenticación |
| `trigger_phrase` | Cambiar `@claude` por otra frase |
| `settings` | Configuración de Claude Code (JSON o ruta) |
| `plugins`, `plugin_marketplaces` | Instalar plugins antes de ejecutar |
| `use_bedrock`, `use_vertex`, `use_foundry` | Usar un proveedor cloud |

Claude sigue el `CLAUDE.md` del repo también en CI: úsalo para definir estándares de revisión y de código.

## GitLab CI/CD

Existe una integración equivalente para GitLab (menciones en *merge requests* e issues, y jobs automáticos). La idea es la misma: un job que ejecuta Claude Code con las variables de CI protegidas. Consulta la guía oficial de GitLab CI/CD.

## `claude -p` en cualquier CI

Para cualquier sistema (Jenkins, CircleCI, Buildkite…):

```bash
#!/usr/bin/env bash
# ci/claude-revision.sh
set -euo pipefail
git fetch origin main --depth=1
git diff origin/main...HEAD > /tmp/cambios.diff

claude --bare -p "Revisa este diff y devuelve bugs reales con archivo:línea. Si no hay, responde 'SIN HALLAZGOS'." \
  --model sonnet --max-turns 5 --output-format json \
  < /tmp/cambios.diff | jq -r '.result' | tee revision.md

grep -q "SIN HALLAZGOS" revision.md || exit 1
```

Con `--bare` necesitas `ANTHROPIC_API_KEY` (o credenciales del proveedor cloud) en el entorno.

## Pre-commit hooks de Git

Claude también puede actuar como una comprobación antes de cada commit. `.git/hooks/pre-commit` (o con herramientas como `husky` o `pre-commit`):

```bash
#!/usr/bin/env bash
# Revisión rápida del staging con Claude antes de confirmar.
diff=$(git diff --cached)
[ -z "$diff" ] && exit 0

resultado=$(printf '%s' "$diff" | claude -p \
  "Revisa este diff buscando SOLO: secretos o credenciales, console.log/print de depuración, y TODOs sin ticket. Si todo está bien responde exactamente OK. Si no, lista los problemas." \
  --model haiku --max-turns 1 2>/dev/null)

if [ "$resultado" != "OK" ]; then
  echo "⚠️  Claude encontró posibles problemas:"
  echo "$resultado"
  echo "Usa 'git commit --no-verify' si quieres continuar igualmente."
  exit 1
fi
```

```bash
chmod +x .git/hooks/pre-commit
```

!!! tip "Rápido y barato"
    En un pre-commit que corre muchas veces al día: modelo pequeño (Haiku), prompt muy acotado, `--max-turns 1` y solo el diff preparado. Y combínalo con herramientas deterministas (detectores de secretos, linters) para lo que se pueda comprobar sin IA.

## Tareas repetidas y programadas en la sesión

### `/loop`

Repite un prompt dentro de una sesión abierta:

```text
/loop 10m comprueba el estado del CI de mi PR y avísame cuando termine
/loop revisa los logs de staging y resume los errores nuevos
```

Sin intervalo, Claude decide el ritmo. Para detenerlo, díselo o interrumpe.

### Recordatorios y tareas de sesión

Puedes pedir a Claude recordatorios puntuales o tareas recurrentes dentro de la sesión (se gestionan como tareas programadas; caducan tras unos días). La app de escritorio también ofrece tareas programadas locales.

## Routines: automatización en la nube

Una **routine** es una configuración guardada (prompt + repositorios + conectores) que se ejecuta en infraestructura de Anthropic, sin tu ordenador encendido. Disparadores:

- **Programado**: cada hora, cada noche, semanalmente o una sola vez.
- **API**: una petición HTTP POST con token.
- **GitHub**: eventos del repositorio (PRs, releases…).

Se crean en claude.ai/code/routines o desde la CLI con:

```text
/schedule revisa cada noche los issues nuevos, etiquétalos y asigna responsable
```

Ideal para mantenimiento de backlog, informes periódicos o revisiones nocturnas.

## Comparativa

| Opción | Dónde corre | Cuándo usarla |
|---|---|---|
| GitHub Actions / GitLab CI | Tus runners de CI | Integrado con PRs/MRs, eventos del repo |
| `claude -p` en scripts | Donde tú lo ejecutes | Cualquier CI, cron propio, herramientas internas |
| Pre-commit | Tu máquina, en cada commit | Comprobaciones rápidas antes de confirmar |
| `/loop` | Tu sesión abierta | Vigilar algo mientras trabajas |
| Routines | Nube de Anthropic | Tareas recurrentes sin depender de tu máquina |

## Buenas prácticas

- **Mínimo privilegio**: permisos del job (`permissions:`) y `--allowedTools` estrictos.
- **Secretos** en el gestor del CI; nunca en el workflow ni en el repo.
- **Limita** turnos (`--max-turns`) y tiempo del job.
- **Disparadores específicos** (no ejecutes en cada push si basta con PRs listos para revisión).
- **`CLAUDE.md`** con los estándares que quieres que aplique en CI.
- **Revisa** lo que Claude sube: en automatizaciones que crean PRs, exige revisión humana antes de fusionar.

## Resumen

- GitHub Actions con `anthropics/claude-code-action`: modo interactivo (`@claude`) y automatización (`prompt`).
- `claude -p --bare` con permisos explícitos en cualquier CI; pre-commit con prompts acotados y modelo pequeño.
- `/loop` en sesión, routines en la nube para lo recurrente.

## Ejercicios

1. Instala la GitHub App con `/install-github-app` en un repo de pruebas y prueba una mención `@claude`.
2. Crea un workflow que ejecute una skill de revisión en cada PR.
3. Implementa el pre-commit con Haiku y pruébalo con un `console.log` olvidado.
4. Crea una routine semanal (o un workflow con cron) que genere un informe útil para tu equipo.

## Referencias

- [GitHub Actions](https://code.claude.com/docs/en/github-actions)
- [GitLab CI/CD](https://code.claude.com/docs/en/gitlab-ci-cd)
- [Modo headless](https://code.claude.com/docs/en/headless)
- [Tareas programadas y /loop](https://code.claude.com/docs/en/scheduled-tasks)
- [Routines](https://code.claude.com/docs/en/routines)
