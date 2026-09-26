---
titulo: Cuándo no usar CLAUDE.md
resumen: Los límites de CLAUDE.md y a qué mecanismo llevar cada tipo de instrucción - skills, reglas con paths, permisos, hooks, subagentes, estilos de salida o simplemente el prompt.
---

## Objetivos de la lección

- Reconocer las señales de que un `CLAUDE.md` está sobrecargado.
- Elegir el mecanismo correcto para cada tipo de instrucción.
- Entender el **coste de contexto** de cada opción.

## El coste oculto de CLAUDE.md

Todo lo que pones en `CLAUDE.md` se envía **en cada petición** al modelo, en todas las sesiones, sea relevante o no. Eso tiene tres costes:

1. **Tokens**: pagas (o consumes cuota) por esas líneas una y otra vez.
2. **Atención**: cuanto más texto, menos peso tiene cada regla; las importantes se diluyen.
3. **Mantenimiento**: un archivo enorme acaba lleno de reglas obsoletas y contradictorias.

`CLAUDE.md` es para **hechos que aplican casi siempre**. Para todo lo demás hay herramientas más adecuadas.

## Señales de alarma

- Tiene más de ~200 líneas.
- Contiene procedimientos paso a paso ("para publicar una versión: 1) … 12) …").
- Tiene secciones que solo importan para una carpeta concreta.
- Incluye reglas que **no pueden fallar** (seguridad, secretos).
- Copia documentación de APIs o librerías.
- Contiene cosas que cambian cada semana (el sprint actual, el ticket en curso).

## A dónde llevar cada cosa

| Tipo de instrucción | Mejor lugar | Por qué |
|---|---|---|
| Procedimiento de varios pasos (release, crear un endpoint, migrar) | **Skill** (lección 43) | Solo se carga cuando se usa; al inicio solo ocupa su descripción |
| Reglas de una zona del código | **Regla con `paths`** o `CLAUDE.md` anidado (lección 15) | Se carga solo al tocar esos archivos |
| "Nunca leas `.env`", "nunca hagas `push --force`" | **Permisos `deny`** (lección 17) | Se impone técnicamente, no depende de la memoria |
| "Formatea siempre tras editar", "pasa los tests antes de terminar" | **Hooks** (lección 49) | Se ejecutan siempre, de forma determinista, y no cuestan contexto |
| Investigar mucho código o tareas pesadas | **Subagente** (lección 54) | Trabaja en su propio contexto y solo devuelve el resultado |
| Tono, formato o rol de las respuestas | **Estilo de salida** (lección 19) | Diseñado para eso |
| Un prompt que repites a menudo | **Comando personalizado / skill** (lección 47) | Lo invocas con `/nombre` |
| Datos de un servicio externo (tickets, BD, docs) | **MCP** o una CLI (lecciones 36–42) | Se consulta cuando hace falta, con datos actualizados |
| Contexto de la tarea de hoy | **El prompt** | Es efímero; no pertenece a la memoria permanente |
| Tus preferencias personales | `~/.claude/CLAUDE.md` o `CLAUDE.local.md` | No imponérselas al equipo |

## Comparación de coste de contexto

| Mecanismo | Cuándo entra en contexto | Coste |
|---|---|---|
| `CLAUDE.md` | Al inicio de cada sesión, completo | En **cada** petición |
| Regla con `paths` / anidado | Al leer archivos que coinciden | Solo cuando aplica |
| Skill | Descripción al inicio; contenido al usarse | Bajo hasta que se usa |
| MCP | Nombres de herramientas al inicio; esquemas bajo demanda | Bajo hasta que se usa |
| Subagente | En su propio contexto aislado | Casi nulo para la sesión principal |
| Hook | Se ejecuta fuera del modelo | Cero (salvo que devuelva texto a Claude) |

## Ejemplo: adelgazar un CLAUDE.md

**Antes** (fragmento):

```markdown
## Publicar una versión
1. Asegúrate de estar en main y actualizado.
2. Ejecuta los tests.
3. Actualiza CHANGELOG.md siguiendo Keep a Changelog.
4. Sube la versión en package.json.
5. Crea el tag vX.Y.Z.
6. …
## Reglas de seguridad
- Nunca leas el archivo .env.
- Nunca hagas git push --force.
## Estilo de componentes React (solo en web/)
- …40 líneas…
## Sprint actual
- Estamos migrando el checkout (ticket SHOP-481).
```

**Después**:

- *Publicar una versión* → skill `.claude/skills/release/SKILL.md`, invocable con `/release`.
- *Reglas de seguridad* → `settings.json`:

  ```json
  {
    "permissions": {
      "deny": ["Read(./.env)", "Read(./.env.*)", "Bash(git push --force *)"]
    }
  }
  ```

- *Estilo React* → `.claude/rules/react.md` con `paths: ["web/**/*.tsx"]`.
- *Sprint actual* → fuera. Se menciona en el prompt cuando toca.

El `CLAUDE.md` resultante queda en lo esencial: comandos, arquitectura y convenciones generales.

## ¿Y si es algo que Claude ya hace bien?

Entonces **no lo escribas**. Si Claude ya usa `async/await` sin que se lo digas, esa regla solo añade ruido. Prueba a quitar líneas y observa si el comportamiento empeora.

## Resumen

- `CLAUDE.md` cuesta contexto en cada petición: resérvalo para hechos generales y estables.
- Procedimientos → skills; reglas locales → `paths`; lo que no puede fallar → permisos y hooks.
- Trabajo pesado → subagentes; datos externos → MCP/CLI; tareas del día → el prompt.

## Ejercicios

1. Revisa tu `CLAUDE.md` y clasifica cada sección según la tabla "A dónde llevar cada cosa".
2. Mueve una sección específica de una carpeta a `.claude/rules/` con `paths`.
3. Convierte una regla de seguridad en un permiso `deny`.
4. Compara `/context` antes y después de la limpieza.

## Referencias

- [Extender Claude Code: qué usar y cuándo](https://code.claude.com/docs/en/features-overview)
- [Memoria y CLAUDE.md](https://code.claude.com/docs/en/memory)
- [Skills](https://code.claude.com/docs/en/skills)
