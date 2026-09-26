---
titulo: "Proyecto de portafolio: configura Claude en un proyecto real"
resumen: Proyecto práctico de la sección 2 - llevar un repositorio real a un estado en el que cualquier persona del equipo pueda abrir Claude Code y trabajar bien desde el primer minuto.
---

## El reto

Vas a tomar un repositorio **real** (tuyo, de tu empresa o un proyecto open source que conozcas) y dejarlo "listo para Claude Code". Al terminar, cualquier compañero que clone el repo y ejecute `claude` debería:

- Encontrar instrucciones claras y breves en `CLAUDE.md`.
- Tener permisos razonables: los comandos habituales no preguntan y lo peligroso está bloqueado.
- Tener reglas específicas solo donde aplican.
- No filtrar secretos por accidente.

Tu entregable será un **pull request** (o una rama) con esos archivos y una breve descripción de tus decisiones.

!!! tip "¿No tienes un proyecto a mano?"
    Clona una aplicación de ejemplo de tu stack (por ejemplo, un *starter* de Express, Django, Next.js o Spring Boot) y añádele algo de lógica propia: un par de endpoints y tests.

## Criterios de éxito

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | `CLAUDE.md` < 150 líneas con comandos, arquitectura y convenciones | Revisión + `/context` lo muestra en *Memory files* |
| 2 | Cómo ejecutar **un solo test** documentado | Claude lo usa en una tarea sin que se lo digas |
| 3 | `.claude/settings.json` con `allow` para build/test/lint y `deny` para secretos | Pedir leer `.env` → bloqueado |
| 4 | Al menos una regla con `paths` en `.claude/rules/` | Aparece solo al tocar esos archivos |
| 5 | `CLAUDE.local.md` y `settings.local.json` fuera de Git | `git check-ignore` los reconoce |
| 6 | Tarea de prueba completada sin correcciones de convenciones | Ver fase 5 |

## Fase 1: diagnóstico (15 min)

Abre Claude en **modo plan** para que no toque nada:

```bash
cd mi-proyecto
git checkout -b chore/claude-code-setup
claude --permission-mode plan
```

```text
> Analiza este repositorio y dime: 1) stack y versiones, 2) cómo se instala,
  ejecuta, testea y lintea, 3) estructura de carpetas y responsabilidades,
  4) convenciones que detectes en el código, 5) cualquier cosa que te haya
  resultado confusa o ambigua. No edites nada.
```

Guarda la respuesta: la sección 5 ("confuso o ambiguo") es oro para el `CLAUDE.md`.

## Fase 2: `CLAUDE.md` (30 min)

1. Genera el borrador:

    ```text
    /init
    ```

2. Edítalo aplicando las lecciones 11–14:
    - Comandos **exactos**, incluido un solo test y el comando de cierre.
    - Mapa de arquitectura de 5–10 líneas.
    - Solo las convenciones **no obvias**, verificables y con motivo cuando haga falta.
    - Normas de Git/PR.
    - Nada de procedimientos largos ni de información volátil.

3. Plantilla de referencia:

    ```markdown
    # <Nombre del proyecto>

    <Una frase: qué hace y para quién.>

    ## Comandos
    - Instalar: `…`
    - Desarrollo: `…`
    - Tests: `…` · Un test: `…`
    - Lint/format: `…` · Tipos: `…`
    - Antes de terminar una tarea: `… && … && …`

    ## Arquitectura
    - `carpeta/` – responsabilidad
    - Flujo principal: A → B → C

    ## Convenciones
    - …(solo lo que difiere de lo estándar)…

    ## Git
    - Ramas `feat/…`, `fix/…`; Conventional Commits; nunca commit directo a main.

    ## Trampas conocidas
    - …
    ```

## Fase 3: permisos (20 min)

Crea `.claude/settings.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(<tu comando de test> *)",
      "Bash(<tu comando de lint> *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ],
    "ask": [
      "Bash(git push *)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./**/*.pem)",
      "Bash(git push --force *)"
    ]
  }
}
```

Adáptalo: ¿hay carpetas de credenciales?, ¿scripts de despliegue que nunca deberían ejecutarse desde Claude?, ¿migraciones de producción?

## Fase 4: reglas específicas (15 min)

Identifica una zona del código con normas propias (tests, componentes de UI, migraciones, API…) y crea una regla:

```markdown
<!-- .claude/rules/migraciones.md -->
---
paths:
  - "db/migrations/**"
---
# Migraciones
- Nunca edites una migración ya aplicada; crea una nueva.
- Toda migración debe ser reversible (implementa `down`).
- Genera el archivo con `<comando del proyecto>`; no lo crees a mano.
```

Y protege lo personal:

```bash
printf "CLAUDE.local.md\n.claude/settings.local.json\n" >> .gitignore
git check-ignore -v CLAUDE.local.md .claude/settings.local.json
```

## Fase 5: prueba de fuego (20 min)

Cierra Claude y abre una sesión **nueva** (contexto limpio). Pide una tarea pequeña pero realista, **sin** dar pistas de convenciones:

```text
> Añade un endpoint/función/componente que <algo pequeño y útil>, con sus tests.
```

Observa:

- ¿Usó los comandos correctos para testear?
- ¿Respetó estructura y convenciones?
- ¿Pidió permiso para cosas que deberían estar permitidas (o al revés)?
- ¿Intentó algo que debería estar bloqueado?

Cada fallo es una mejora para `CLAUDE.md`, una regla o un permiso. Itera hasta que la tarea salga bien a la primera.

## Fase 6: entrega

```bash
git add CLAUDE.md .claude/ .gitignore
git commit -m "chore: configure Claude Code for the project"
git push -u origin chore/claude-code-setup
```

En la descripción del PR incluye:

- Qué pusiste en `CLAUDE.md` y qué **dejaste fuera a propósito**.
- Tu razonamiento sobre `allow` / `ask` / `deny`.
- El resultado de la prueba de fuego y qué ajustaste tras ella.

## Rúbrica de autoevaluación

| Aspecto | Básico | Bueno | Excelente |
|---|---|---|---|
| CLAUDE.md | Generado con `/init` sin editar | Editado, conciso | Conciso, con motivos, probado y sin reglas redundantes |
| Permisos | Ninguno | allow/deny básicos | allow/ask/deny pensados para el flujo del equipo |
| Reglas | — | Una regla con `paths` | Varias, bien delimitadas, sin solaparse con CLAUDE.md |
| Verificación | Sin prueba | Una tarea de prueba | Iteración documentada hasta que la tarea sale a la primera |

## Extra (opcional)

- Añade un estilo de salida de equipo en `.claude/output-styles/` (lección 16).
- Mide `/context` antes y después y anota cuántos tokens ocupa tu configuración.
- Pide a un compañero que clone el repo y haga la prueba de fuego.

## Referencias

- [Buenas prácticas](https://code.claude.com/docs/en/best-practices)
- [Memoria](https://code.claude.com/docs/en/memory) · [Permisos](https://code.claude.com/docs/en/permissions) · [Settings](https://code.claude.com/docs/en/settings)
