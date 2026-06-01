## What to build
En lugar de sobreescribir el snapshot actual, crear una nueva versión cada vez que el motor genera sugerencias significativamente distintas.

## Acceptance criteria
- [ ] Definir una estructura para almacenar múltiples versiones de snapshots.
- [ ] Implementar la lógica para comparar si una nueva sugerencia es suficientemente distinta como para ameritar un nuevo registro.

## Blocked by
- .scratch/live-suggestions/001-db-upsert.md
