---
titulo: Dejar que Claude use herramientas CLI
resumen: Aprovechar las CLIs que ya tienes (gh, aws, gcloud, kubectl, docker, jq, sentry-cli…) - instalación y autenticación, enseñar a Claude una CLI desconocida con --help, documentarlas en CLAUDE.md, permisos seguros y scripts propios como herramientas.
---

## Objetivos de la lección

- Entender por qué las CLIs son una forma muy eficiente de conectar Claude con servicios.
- Preparar CLIs habituales para que Claude las use.
- Enseñarle a usar herramientas que no conoce.
- Configurar permisos adecuados para cada CLI.

## Por qué las CLIs funcionan tan bien

Claude ya tiene una herramienta universal: **Bash**. Cualquier programa de línea de comandos instalado en tu máquina es, en la práctica, una herramienta más:

- **No ocupan contexto** hasta que se usan (no hay definiciones de herramientas cargadas).
- Claude **ya conoce** muchas CLIs populares (`git`, `gh`, `docker`, `kubectl`, `aws`, `npm`…) por su entrenamiento.
- Heredan **tu autenticación** existente (`gh auth login`, perfiles de AWS…).
- Se combinan con pipes (`| jq`, `| grep`) para filtrar la salida antes de que llegue al contexto.

## CLIs que conviene tener

| CLI | Para qué la usa Claude |
|---|---|
| `gh` (GitHub) / `glab` (GitLab) | Issues, PRs, comentarios, CI, releases |
| `jq` / `yq` | Filtrar JSON/YAML |
| `rg` (ripgrep) | Búsqueda rápida (Claude Code ya lo incluye) |
| `docker` / `docker compose` | Servicios locales, logs de contenedores |
| `kubectl`, `helm` | Estado de clústeres, logs de pods |
| `aws`, `gcloud`, `az` | Recursos cloud |
| `sentry-cli`, `datadog-ci` | Errores y observabilidad |
| `psql`, `mysql`, `sqlite3` | Consultas a bases de datos |
| `curl` / `httpie` | Probar APIs locales |
| `terraform` | Planes de infraestructura (¡con cuidado!) |

## Preparación: instalar y autenticar

Claude usará las CLIs **con tu sesión y credenciales**, así que primero autentícate tú:

```bash
gh auth login
aws sso login --profile dev
gcloud auth login
kubectl config use-context dev-cluster
```

Después, en la sesión:

```text
> Con gh, lista los issues abiertos con la etiqueta "bug" y prioridad alta,
  y agrúpalos por componente.
```

```bash
gh issue list --label bug --label "prio:high" --json number,title,labels --limit 50
```

## Enseñar una CLI desconocida

Si la herramienta es interna o poco común, Claude puede aprender a usarla leyendo su ayuda:

```text
> Usa `deployctl --help` y `deployctl status --help` para aprender la herramienta,
  y luego dime el estado de los despliegues de hoy del servicio "checkout".
```

Para no repetirlo cada sesión, documenta lo esencial en `CLAUDE.md` (o en una skill, si es largo):

```markdown
## Herramientas
- `deployctl status <servicio>`: estado de despliegues. Nunca uses `deployctl rollout`.
- `featflags get <flag> --env staging`: consultar feature flags (solo lectura).
- Logs de staging: `kubectl -n staging logs deploy/<servicio> --since=1h`.
```

## Tus propios scripts como herramientas

Un script en el repo es una herramienta perfecta: encapsula la complejidad y deja una interfaz simple.

```bash
#!/usr/bin/env bash
# scripts/db-snapshot.sh — resumen del estado de la BD local para depurar
set -euo pipefail
psql "$DATABASE_URL" -At -c "select 'pedidos', count(*) from orders
  union all select 'pendientes', count(*) from orders where status='pending'
  union all select 'usuarios', count(*) from users;"
```

```markdown
## Scripts útiles (CLAUDE.md)
- `scripts/db-snapshot.sh`: conteos rápidos de la BD local.
- `scripts/seed.sh`: datos de ejemplo (borra la BD local).
```

## Filtrar la salida

Las salidas grandes llenan el contexto. Anima a Claude a filtrar:

```text
> Mira los pods con errores en staging. Filtra con jq y dame solo nombre,
  estado y número de reinicios.
```

```bash
kubectl -n staging get pods -o json \
  | jq -r '.items[] | select(.status.containerStatuses[]?.restartCount > 0)
           | [.metadata.name, .status.phase, (.status.containerStatuses[0].restartCount)] | @tsv'
```

## Permisos para CLIs

Aplica el mismo criterio que con MCP: lectura libre, escritura con confirmación, destrucción prohibida.

```json
{
  "permissions": {
    "allow": [
      "Bash(gh issue list *)",
      "Bash(gh issue view *)",
      "Bash(gh pr view *)",
      "Bash(gh pr diff *)",
      "Bash(gh pr checks *)",
      "Bash(gh run view *)",
      "Bash(kubectl get *)",
      "Bash(kubectl describe *)",
      "Bash(kubectl logs *)",
      "Bash(docker compose ps)",
      "Bash(docker compose logs *)",
      "Bash(jq *)"
    ],
    "ask": [
      "Bash(gh pr create *)",
      "Bash(gh issue create *)",
      "Bash(docker compose up *)"
    ],
    "deny": [
      "Bash(kubectl delete *)",
      "Bash(kubectl apply *)",
      "Bash(terraform apply *)",
      "Bash(terraform destroy *)",
      "Bash(aws * delete-*)",
      "Bash(gh repo delete *)"
    ]
  }
}
```

!!! warning "Contexto de la credencial"
    Si tu terminal tiene activas credenciales de **producción** (un perfil de AWS, un contexto de kubectl), Claude las usará. Trabaja con perfiles de desarrollo por defecto, o arranca Claude con variables que apunten a entornos seguros:

    ```bash
    AWS_PROFILE=dev KUBECONFIG=~/.kube/dev claude
    ```

    También puedes fijarlas en el `env` de `.claude/settings.local.json`.

## En Windows

Sin Git for Windows, Claude usa **PowerShell** como shell; con Git for Windows, usa Git Bash. Asegúrate de que las CLIs estén en el `PATH` del shell que usa Claude.

## Resumen

- Toda CLI instalada es una herramienta para Claude vía Bash, sin coste de contexto previo.
- Autentícate tú primero; Claude usa tus credenciales.
- Para CLIs desconocidas: `--help` + documentar en `CLAUDE.md`/skill.
- Filtra salidas con `jq`/`grep`; permisos por subcomando; cuidado con credenciales de producción.

## Ejercicios

1. Instala y autentica `gh`. Pide a Claude un resumen de los PRs abiertos del repo con su estado de CI.
2. Elige una CLI interna o poco común y haz que Claude aprenda a usarla con `--help`. Documenta 3 comandos en `CLAUDE.md`.
3. Escribe reglas allow/ask/deny para una CLI que uses a diario.
4. Crea un script en `scripts/` que resuma algo útil y documenta su uso.

## Referencias

- [Buenas prácticas: usar herramientas CLI](https://code.claude.com/docs/en/best-practices)
- [Permisos de Bash](https://code.claude.com/docs/en/permissions)
- [GitHub CLI](https://cli.github.com/manual/)
