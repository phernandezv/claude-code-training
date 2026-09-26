---
titulo: Resolver conflictos de merge
resumen: Cómo usar a Claude para entender y resolver conflictos de merge y rebase - leer la intención de ambos lados con el historial, resolver archivo a archivo, verificar con tests, casos especiales (lockfiles, generados, renombrados) y cuándo decidir tú.
---

## Objetivos de la lección

- Entender qué información necesita Claude para resolver bien un conflicto.
- Resolver conflictos de `merge` y de `rebase` con ayuda de Claude.
- Tratar casos especiales: lockfiles, archivos generados, renombrados, borrados.
- Verificar la resolución y saber cuándo intervenir tú.

## Por qué los conflictos son buen trabajo para Claude

Resolver un conflicto no es elegir "lo mío" o "lo suyo": es **combinar dos intenciones**. Claude puede:

- Leer ambos lados del conflicto y el ancestro común.
- Consultar el historial para entender **qué pretendía cada cambio**.
- Proponer una combinación que respete ambas intenciones.
- Ejecutar tests para comprobarlo.

## Anatomía de un conflicto

```text
<<<<<<< HEAD
const IVA = 0.21;
export function total(lineas) { return redondear(suma(lineas) * (1 + IVA)); }
=======
export function total(lineas, iva = 0.21) {
  return redondear(suma(lineas) * (1 + iva));
}
>>>>>>> feat/iva-configurable
```

- Entre `<<<<<<< HEAD` y `=======`: tu versión (la rama actual).
- Entre `=======` y `>>>>>>>`: la versión entrante.

!!! tip "Activa el estilo diff3"
    Con `git config --global merge.conflictStyle zdiff3` los marcadores también muestran el **ancestro común** (`|||||||`). Eso ayuda muchísimo (a ti y a Claude) a entender qué cambió cada lado.

## Flujo básico con Claude

```bash
git switch feat/export-csv
git merge main          # o: git rebase main
# CONFLICT (content): Merge conflict in src/cart/total.ts
```

```text
> Tengo conflictos tras hacer merge de main. Para cada archivo en conflicto:
  1) explica qué intentaba cada lado (usa git log de ambas ramas),
  2) propón la resolución que conserve ambas intenciones,
  3) no marques nada como resuelto hasta que yo lo apruebe.
```

Claude usará:

```bash
git status                          # archivos en conflicto
git diff --name-only --diff-filter=U
git log --oneline main...HEAD -- src/cart/total.ts
git show :1:src/cart/total.ts       # ancestro común
git show :2:src/cart/total.ts       # "ours"
git show :3:src/cart/total.ts       # "theirs"
```

Tras tu aprobación:

```text
> Aplica las resoluciones, ejecuta los tests afectados y, si pasan,
  marca los archivos como resueltos y continúa el merge.
```

```bash
git add src/cart/total.ts
git commit            # en un merge
# o
git rebase --continue # en un rebase
```

## Rebase: conflictos commit a commit

En un `rebase`, los conflictos aparecen **por cada commit** que se reaplica. Además, `ours` y `theirs` se **invierten** respecto al merge (en rebase, "ours" es la rama base). Pídele a Claude que lo tenga en cuenta:

```text
> Estoy en un rebase sobre main. Resuelve el conflicto del commit actual
  respetando que en rebase "ours" es main. Luego continúa y repite hasta
  terminar, parándote si algún conflicto requiere una decisión de producto.
```

## Casos especiales

| Caso | Estrategia |
|---|---|
| **Lockfiles** (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`) | No resolver a mano: aceptar una versión y **regenerar** con el gestor (`npm install`, `pnpm install`, `poetry lock --no-update`) |
| **Archivos generados** (clientes de API, migraciones compiladas) | Regenerar con el comando del proyecto tras resolver las fuentes |
| **Renombrado vs. edición** | Aplicar la edición sobre el archivo con el nuevo nombre |
| **Borrado vs. edición** | Decisión humana: ¿el código se eliminó a propósito? |
| **Migraciones de BD** con el mismo número | Renumerar la tuya y verificar el orden |
| **Formato masivo** (un lado reformateó todo) | Aceptar el formato, reaplicar el cambio lógico y volver a formatear |

Documenta esto en `CLAUDE.md` para que Claude lo haga siempre igual:

```markdown
## Conflictos
- Lockfiles: nunca editar a mano; acepta la versión de main y ejecuta `pnpm install`.
- Cliente API generado: resuelve `openapi.yaml` y ejecuta `pnpm gen:api`.
```

## Verificar la resolución

- Busca marcadores olvidados:

    ```bash
    git diff --check
    grep -rn '^<<<<<<<\|^>>>>>>>' src/
    ```

- Compila, ejecuta lint y tests.
- Revisa el resultado final con `/diff` o `git diff HEAD`.

## Cuándo decides tú

Claude debe **pararse y preguntar** cuando:

- Ambos lados cambian el **comportamiento** de forma incompatible (p. ej. uno cambia el cálculo del IVA y el otro lo elimina).
- Se trata de borrado frente a modificación.
- La resolución implica una decisión de producto o de negocio.

Inclúyelo en el prompt: *"si hay un conflicto que cambie comportamiento visible para el usuario, detente y pregúntame"*.

## Abortar sin miedo

```bash
git merge --abort
git rebase --abort
```

Vuelves al estado anterior. Útil si la resolución se complica y prefieres replantear (por ejemplo, rebase en vez de merge o al revés).

## Resumen

- Resolver = combinar intenciones; Claude usa historial y ancestro común para entenderlas.
- `zdiff3` mejora los marcadores; en rebase, `ours`/`theirs` se invierten.
- Lockfiles y generados se regeneran, no se editan a mano.
- Verifica con tests y busca marcadores olvidados; las decisiones de comportamiento son tuyas.

## Ejercicios

1. Crea dos ramas que modifiquen la misma función de forma distinta y fusiónalas. Pide a Claude la resolución con explicación de ambos lados.
2. Provoca un conflicto en `package-lock.json` y comprueba que Claude lo regenera en vez de editarlo.
3. Repite el ejercicio 1 con `git rebase` y observa la diferencia entre `ours` y `theirs`.

## Referencias

- [Flujos comunes](https://code.claude.com/docs/en/common-workflows)
- [Git: resolución de conflictos (git-merge)](https://git-scm.com/docs/git-merge#_how_conflicts_are_presented)
