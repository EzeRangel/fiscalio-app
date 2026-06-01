## What to build
Implementar un sistema de "stale-while-revalidate" para las sugerencias. El motor solo debería re-ejecutarse si la tabla de `classification_rules` ha cambiado desde que se generó el último snapshot.

## Acceptance criteria
- [ ] El sistema debe detectar si ha habido cambios en las reglas globales.
- [ ] Evitar ejecuciones innecesarias del motor de IA si las reglas no han cambiado.

## Blocked by
- .scratch/live-suggestions/001-db-upsert.md
