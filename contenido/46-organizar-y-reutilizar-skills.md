---
titulo: Organizar y reutilizar skills
resumen: Estrategias para mantener una colección de skills sana - convenciones de nombres, niveles (personal, proyecto, anidado, organización), skills en monorepos, compartir con Git, enlaces simbólicos y plugins, controlar visibilidad con permisos y skillOverrides, detectar skills sin uso y evaluarlas.
---

## Objetivos de la lección

- Organizar tus skills por nivel y por dominio.
- Reutilizar skills entre proyectos y equipos.
- Controlar qué skills ve y puede usar Claude.
- Mantener la colección limpia: detectar skills sin uso y mejorar las que fallan.

## Una biblioteca que crece

Tras unas semanas usando skills es fácil acabar con 30 skills solapadas, con descripciones parecidas que confunden a Claude. Un poco de orden evita que:

- Claude elija la skill equivocada.
- El listado de descripciones ocupe demasiado contexto (se recortan cuando superan su presupuesto).
- Nadie sepa cuál es la versión buena de "la skill de releases".

## Convenciones de nombres

- **Verbo o sustantivo claro**, en minúsculas con guiones: `release`, `nuevo-endpoint`, `informe-dependencias`.
- **Prefijos por dominio** si tienes muchas: `db-consultas`, `db-migracion`, `ui-componente`, `ui-accesibilidad`.
- Evita nombres genéricos (`helper`, `utils`) y nombres que choquen con comandos integrados.

## ¿En qué nivel va cada skill?

| Nivel | Qué poner | Ejemplos |
|---|---|---|
| **Personal** (`~/.claude/skills/`) | Tus flujos, útiles en cualquier repo | `explicar-diff`, `mi-standup`, `resumen-pr` |
| **Proyecto** (`.claude/skills/`) | Conocimiento y procedimientos de ese repo | `nuevo-endpoint`, `release`, `db-consultas` |
| **Anidado** (`<subdir>/.claude/skills/`) | Específico de un paquete de un monorepo | `apps/web/.claude/skills/ui-componente` |
| **Plugin** | Lo que quieres reutilizar en varios repos o equipos | `acme-tools:security-check` |
| **Organización** | Estándares obligatorios de la empresa | `politica-datos-personales` |

### Monorepos

Las skills anidadas se cargan cuando trabajas en (o por debajo de) esa subcarpeta. Si arrancas en la raíz, Claude las descubre al leer archivos de esa zona. Si dos skills anidadas tienen el mismo nombre, el comando incluye la ruta para distinguirlas.

## Estructura interna recomendada

```text
.claude/skills/
├── release/
│   ├── SKILL.md              # pasos esenciales (< 150 líneas)
│   ├── changelog-formato.md  # referencia detallada
│   └── scripts/
│       └── verificar-tag.sh
├── db-consultas/
│   ├── SKILL.md
│   └── esquema.md            # generado periódicamente
└── nuevo-endpoint/
    ├── SKILL.md
    └── ejemplos.md
```

Mantén `SKILL.md` como índice y guía; mueve el detalle a archivos que Claude lea solo si los necesita.

## Compartir y reutilizar

### Con Git (proyecto)

`.claude/skills/` se sube al repo como cualquier otro código, con revisión en PR. Es la forma más simple de compartir con el equipo.

### Con enlaces simbólicos

Mantén un repositorio de skills comunes y enlázalas:

```bash
git clone git@github.com:acme/claude-skills.git ~/acme-skills
ln -s ~/acme-skills/release ~/.claude/skills/release
ln -s ~/acme-skills/db-consultas .claude/skills/db-consultas
```

### Con plugins (recomendado para varios repos)

Un plugin empaqueta skills (y comandos, subagentes, hooks, MCP) en una unidad instalable y versionada. Sus skills se invocan con espacio de nombres: `/acme-tools:release`. Lo verás en las lecciones 61–64.

### Con tu cuenta de claude.ai

Las skills activadas en tu cuenta de claude.ai están disponibles en sesiones en la nube, Cowork y en la terminal con esa cuenta. Para subirlas, usa solo los campos del estándar (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`).

## Controlar qué skills usa Claude

### Con permisos

```json
{
  "permissions": {
    "allow": ["Skill(informe-dependencias)", "Skill(nuevo-endpoint *)"],
    "deny": ["Skill(release *)", "Skill(deploy *)"]
  }
}
```

Denegar la herramienta `Skill` entera desactiva todas las skills para Claude.

### Con `skillOverrides`

Para cambiar la visibilidad de skills que no quieres editar (de un plugin, compartidas):

```json
{
  "skillOverrides": {
    "contexto-legado": "name-only",
    "experimento-viejo": "off",
    "release": "user-invocable-only"
  }
}
```

| Valor | Claude la ve | En el menú `/` |
|---|---|---|
| `on` | Nombre y descripción | Sí |
| `name-only` | Solo el nombre | Sí |
| `user-invocable-only` | No | Sí |
| `off` | No | No |

También puedes cambiarla desde `/skills` pulsando `Espacio` sobre una skill.

## Mantener la colección sana

### Detectar skills sin uso y su coste

```text
/skills        ← pulsa "t" para ordenarlas por tamaño en tokens
/doctor        ← detecta skills, MCP y plugins sin uso frente a su coste de contexto
```

### Revisar solapamientos

Si dos skills tienen descripciones parecidas, fusiónalas o diferencia claramente sus descripciones ("X para la API pública; Y para la API interna").

### Evaluar e iterar

Para skills importantes, comprueba con varias peticiones realistas si se activan cuando deben y no cuando no deben. La skill incluida de creación de skills (*skill-creator*) y las evaluaciones de plugins ayudan a medirlo de forma sistemática.

### Versionar y documentar

- Añade un `README.md` en el repositorio de skills con qué hace cada una.
- Revisa las skills en los PRs igual que el código.
- Borra las que ya no se usan.

## Resumen

- Nombres claros y con prefijos por dominio; cada skill en el nivel adecuado.
- Comparte con Git, enlaces simbólicos, plugins o tu cuenta de claude.ai.
- Controla el uso con reglas `Skill(...)` y `skillOverrides`.
- Mide tamaño y uso con `/skills` y `/doctor`; fusiona, mejora o elimina.

## Ejercicios

1. Haz inventario de tus skills (personales y de proyecto) y ordénalas por tamaño con `/skills`.
2. Mueve una skill personal que uses en varios repos a un repositorio común y enlázala.
3. Usa `skillOverrides` para dejar una skill en `name-only` y observa el efecto en el contexto.
4. Prueba una skill con 5 peticiones que deberían activarla y 5 que no. Ajusta la descripción.

## Referencias

- [Skills: compartir, restringir y visibilidad](https://code.claude.com/docs/en/skills)
- [Plugins](https://code.claude.com/docs/en/plugins/overview)
