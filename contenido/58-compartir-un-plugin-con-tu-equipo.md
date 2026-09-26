---
titulo: Compartir un plugin con tu equipo
resumen: Distribuir plugins - crear un marketplace propio con marketplace.json, tipos de origen (ruta relativa, github, git-subdir, url…), validar y probar, publicar en Git, que el repo los active para todo el equipo con extraKnownMarketplaces y enabledPlugins, despliegue gestionado por la organización, versiones y actualizaciones.
---

## Objetivos de la lección

- Crear un **marketplace** propio para tu equipo u organización.
- Hacer que un repositorio active plugins automáticamente para quien lo clone.
- Conocer el despliegue gestionado a nivel de organización.
- Gestionar versiones y actualizaciones.

## Opciones para compartir

| Audiencia | Cómo |
|---|---|
| Un par de personas, de forma puntual | Enviar la carpeta o un `.zip` (se carga con `--plugin-dir`) |
| Tu equipo o tu empresa | **Marketplace propio** en un repositorio Git |
| Todos los repos del equipo sin pasos manuales | Marketplace + `extraKnownMarketplaces` y `enabledPlugins` en `.claude/settings.json` |
| Toda la organización, de forma obligatoria | Los mismos ajustes en *managed settings* |
| La comunidad | Publicar en un marketplace público o enviarlo al directorio de Anthropic |

## Paso 1: crear el marketplace

Un marketplace es un directorio (normalmente un repo) con `.claude-plugin/marketplace.json`:

```text
acme-claude-plugins/            ← raíz del marketplace
├── .claude-plugin/
│   └── marketplace.json
├── plugins/
│   ├── acme-dev-tools/         ← el plugin de la lección 57
│   └── acme-data-tools/
└── README.md
```

`.claude-plugin/marketplace.json`:

```json
{
  "name": "acme",
  "description": "Plugins de Claude Code del equipo de ingeniería de Acme",
  "owner": { "name": "Equipo de Plataforma", "email": "plataforma@acme.dev" },
  "plugins": [
    {
      "name": "acme-dev-tools",
      "source": "./plugins/acme-dev-tools",
      "description": "Revisión, endpoints, dependencias, formato y protección de archivos"
    },
    {
      "name": "acme-data-tools",
      "source": "./plugins/acme-data-tools",
      "description": "Consultas a la BD de analítica y agentes de informes"
    },
    {
      "name": "acme-ui-kit",
      "source": { "source": "github", "repo": "acme/claude-ui-kit" },
      "description": "Skills del sistema de diseño (repositorio propio)"
    }
  ]
}
```

Campos obligatorios: `name`, `owner` y `plugins` (cada entrada con `name` y `source`).

### Tipos de `source`

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| Ruta relativa | El plugin está dentro del marketplace | `"./plugins/acme-dev-tools"` |
| `github` | El plugin tiene su propio repo en GitHub | `{ "source": "github", "repo": "acme/claude-ui-kit" }` |
| `git-subdir` | Es una subcarpeta de otro repo (monorepo) | `{ "source": "git-subdir", "url": "acme/monorepo", "path": "tools/claude-plugin" }` |
| `url` | Repo git en cualquier host | URL de clonado |
| `archive`, `npm`, `command` | Casos avanzados | Ver referencia |

### Reglas que evitan errores

- Rutas relativas **desde la raíz del marketplace** (la carpeta que contiene `.claude-plugin/`), empezando por `./` y sin `..`.
- El `name` de la entrada debe coincidir con el `name` del `plugin.json` del plugin.
- Nombres sin espacios; no imites nombres de marketplaces oficiales.

## Paso 2: validar y probar en local

```bash
claude plugin validate ./acme-claude-plugins
claude plugin marketplace add ./acme-claude-plugins
claude plugin install acme-dev-tools@acme
```

Abre una sesión y comprueba que todo funciona antes de publicarlo.

## Paso 3: publicar

```bash
cd acme-claude-plugins
git init && git add . && git commit -m "feat: marketplace inicial con acme-dev-tools"
git remote add origin git@github.com:acme/claude-plugins.git
git push -u origin main
```

Tus compañeros ya pueden:

```text
/plugin marketplace add acme/claude-plugins
/plugin install acme-dev-tools@acme
```

Si el repo es privado, cada persona necesita acceso de lectura con sus credenciales de git.

## Paso 4: que el repositorio lo active para todos

En el `.claude/settings.json` de cada proyecto del equipo:

```json
{
  "extraKnownMarketplaces": {
    "acme": {
      "source": { "source": "github", "repo": "acme/claude-plugins" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": {
    "acme-dev-tools@acme": true
  }
}
```

- `extraKnownMarketplaces` registra el marketplace para quien abra el repo (tras aceptar la confianza de la carpeta).
- `enabledPlugins` activa los plugins indicados en ese proyecto.
- `autoUpdate: true` mantiene el catálogo y los plugins actualizados en segundo plano.

Así, un compañero clona el repo, abre `claude`, acepta la confianza y tiene las herramientas del equipo sin pasos manuales.

## Paso 5 (opcional): despliegue gestionado

Para toda la organización, los administradores ponen esas mismas claves en *managed settings* (consola de administración de claude.ai, MDM o `managed-settings.json`):

- Los plugins se instalan al inicio de la siguiente sesión de cada persona.
- Un plugin puesto a `false` en el `enabledPlugins` gestionado queda **bloqueado** en todos los niveles.
- También se puede restringir qué marketplaces están permitidos.

## Versiones y actualizaciones

- Sube `version` en `plugin.json` en cada publicación y mantén un `CHANGELOG.md`.
- Versionado semántico: renombrar o eliminar una skill es un cambio **mayor** (rompe `/plugin:skill` de la gente).
- Con auto-actualización, las nuevas versiones se descargan en segundo plano; la sesión en curso sigue con la cargada hasta `/reload-plugins` o la siguiente sesión.
- Manualmente: `claude plugin update acme-dev-tools@acme`.
- Para fijar una versión estable, los orígenes git admiten fijar `ref` o `sha`.

## Gobernanza recomendada

| Práctica | Por qué |
|---|---|
| Revisión por PR de cualquier cambio en el marketplace | Los plugins ejecutan código en las máquinas de todos |
| CI que ejecute `claude plugin validate` | Evita publicar plugins rotos |
| Evaluaciones (`claude plugin eval`) para skills y agentes clave | Detecta regresiones en cómo Claude los usa |
| README por plugin con requisitos y cómo desactivarlo | Menos fricción y soporte |
| Canal de feedback y propietarios claros | Mejora continua |

## Resumen

- Marketplace = repo con `.claude-plugin/marketplace.json` (`name`, `owner`, `plugins`).
- Valida, prueba en local, publica en Git; los demás lo añaden con `/plugin marketplace add`.
- `extraKnownMarketplaces` + `enabledPlugins` en `.claude/settings.json` lo activan para todo el equipo; en *managed settings*, para toda la organización.
- Versiona con semver, CHANGELOG y auto-actualización.

## Ejercicios

1. Crea un marketplace local con tu plugin de la lección 57, valídalo e instálalo desde él.
2. Publícalo en un repositorio (privado si quieres) e instálalo desde otra máquina o carpeta.
3. Añade `extraKnownMarketplaces` y `enabledPlugins` a un repo y comprueba que un clon nuevo recibe el plugin.
4. Añade un workflow de CI que ejecute `claude plugin validate` en cada PR del marketplace.

## Referencias

- [Crear un marketplace](https://code.claude.com/docs/en/plugins/create-marketplace)
- [Referencia de marketplace.json](https://code.claude.com/docs/en/plugins/marketplace-reference)
- [Plugins para organizaciones](https://code.claude.com/docs/en/plugins/org)
- [Publicar plugins](https://code.claude.com/docs/en/plugins/publish)
