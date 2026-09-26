---
titulo: Ramas y pull requests
resumen: Crear ramas con buenos nombres, trabajar en paralelo con git worktrees (claude --worktree), abrir pull requests con gh, redactar descripciones útiles, seguir el estado del PR y retomar la sesión desde el PR.
---

## Objetivos de la lección

- Pedir a Claude ramas con nombres coherentes.
- Trabajar en **varias tareas en paralelo** con *worktrees*.
- Crear pull requests con la CLI `gh` y descripciones útiles.
- Seguir el estado del PR y volver a la sesión que lo creó.

## Ramas

```text
> Crea una rama para añadir exportación a CSV siguiendo nuestra convención.
```

Si tu `CLAUDE.md` dice "ramas `feat/…`, `fix/…`", Claude creará algo como `feat/export-orders-csv`. Buenas prácticas que puedes documentar:

```markdown
## Ramas
- Nombre: `<tipo>/<ticket>-<descripcion-corta>` (p. ej. `fix/SHOP-512-redondeo-iva`).
- Parte siempre de `main` actualizado: `git switch main && git pull && git switch -c …`.
- Nunca commits directos a `main`.
```

## Trabajo en paralelo con worktrees

Un **worktree** de Git es una segunda (o tercera…) copia de trabajo del mismo repositorio, en otra carpeta y en otra rama, que comparte el historial. Permite tener **varias sesiones de Claude trabajando a la vez sin pisarse**.

### Arrancar Claude en un worktree

```bash
claude --worktree export-csv
# o abreviado
claude -w export-csv
```

Esto crea `.claude/worktrees/export-csv/` en una rama nueva `worktree-export-csv` y abre Claude ahí. En otra terminal:

```bash
claude -w fix-redondeo
```

Ahora tienes dos sesiones aisladas, cada una con su rama y sus archivos.

!!! tip "Ignora la carpeta de worktrees"
    Añade `.claude/worktrees/` a tu `.gitignore` para que no aparezca como archivos sin seguimiento en tu copia principal.

### Preparar el entorno

Un worktree es un *checkout* limpio: hay que instalar dependencias (`npm ci`, `uv sync`…). Los archivos ignorados como `.env` no se copian solos; Claude Code permite configurar qué archivos ignorados copiar a cada worktree nuevo.

### Pedírselo a Claude a mitad de sesión

```text
> Trabaja en un worktree aparte para este experimento.
```

### Limpieza

Al salir de una sesión en un worktree:

- Si no hay cambios, se elimina automáticamente (en sesiones sin nombre).
- Si hay trabajo, Claude te pregunta si conservarlo o borrarlo. Para volver más tarde, usa el comando que imprime al salir (`claude --worktree <nombre> --resume`).

### Worktrees a mano

```bash
git worktree add ../tienda-export -b feat/export-csv
cd ../tienda-export && claude
git worktree list
git worktree remove ../tienda-export
```

## Pull requests

Claude usa la CLI de GitHub, **`gh`**, para crear y gestionar PRs. Instálala y autentícate una vez:

```bash
# macOS
brew install gh
# Debian/Ubuntu
sudo apt install gh

gh auth login
```

Después:

```text
> Sube la rama y crea un pull request hacia main.
```

Claude hará algo como:

```bash
git push -u origin feat/export-csv
gh pr create --base main --title "feat(orders): export orders to CSV" --body-file -
```

Para GitLab existe `glab`, con un flujo equivalente (`glab mr create`).

### Una buena descripción de PR

Pide una estructura concreta (o documéntala en `CLAUDE.md`):

```markdown
## Qué
Exportación de pedidos a CSV desde el panel, respetando filtros activos.

## Por qué
Los managers la piden para conciliar pedidos con contabilidad (SHOP-480).

## Cómo
- Endpoint `GET /orders/export` con streaming (máx. 10.000 filas).
- Botón en `OrdersToolbar`.

## Cómo probarlo
1. `pnpm dev`, entrar como manager, filtrar por fecha, pulsar "Exportar CSV".
2. `pnpm test orders`

## Riesgos
- Consultas pesadas: limitado a 10.000 filas y con índice por fecha.

## Capturas
(si aplica)
```

Si tu repo tiene una plantilla (`.github/pull_request_template.md`), dile a Claude que la siga.

```text
> Mejora la descripción del PR con más contexto sobre el impacto en rendimiento
  y enlaza el ticket SHOP-480.
```

### PRs en borrador

```text
> Crea el PR como borrador; aún faltan los tests e2e.
```

(`gh pr create --draft`)

## Seguir el estado del PR

Cuando estás en una rama con un PR abierto, Claude Code muestra en el pie un enlace **"PR #123"** subrayado con un color según su estado:

| Color | Estado |
|---|---|
| Verde | Aprobado |
| Amarillo | Pendiente de revisión |
| Rojo | Cambios solicitados |
| Gris | Borrador |

`Cmd+clic` / `Ctrl+clic` lo abre en el navegador.

También puedes preguntar:

```text
> ¿Qué dicen los comentarios de revisión del PR? Resúmelos y propón cambios.
> ¿Por qué falla el CI de este PR? Revisa los logs con gh.
```

```bash
gh pr view --comments
gh pr checks
gh run view --log-failed
```

## Volver a la sesión que creó un PR

Las sesiones quedan vinculadas a los PR que crean:

```bash
claude --from-pr 123
```

O pega la URL del PR en el buscador de `/resume`.

## Flujo completo

```text
$ claude -w export-csv
> /plan Exportar pedidos a CSV…            (planificar)
> [aprobar]                                (implementar + tests)
> Haz commits atómicos con Conventional Commits.
> Sube la rama y abre un PR hacia main con nuestra plantilla.
  … (revisión) …
> Atiende los comentarios del PR y sube los cambios.
```

## Resumen

- Ramas con convención documentada; nunca commits directos a `main`.
- `claude -w <nombre>` para sesiones paralelas aisladas.
- `gh` para PRs; pide descripciones con qué, por qué, cómo probar y riesgos.
- El pie muestra el estado del PR; `claude --from-pr` te devuelve a la sesión.

## Ejercicios

1. Abre dos sesiones con `claude -w a` y `claude -w b` y pide tareas distintas. Comprueba con `git worktree list`.
2. Crea un PR de prueba con `gh` a través de Claude usando la plantilla de descripción.
3. Deja un comentario de revisión en el PR y pide a Claude que lo atienda.

## Referencias

- [Sesiones paralelas con worktrees](https://code.claude.com/docs/en/worktrees)
- [Flujos comunes: crear pull requests](https://code.claude.com/docs/en/common-workflows)
- [GitHub CLI](https://cli.github.com/)
