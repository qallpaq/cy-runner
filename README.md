# cy-runner

The `cy-runner` package is intended for debugging tests that pass in `cypress open` but fail in `cypress run`.

## Quick start

1. run frontend `pnpm turbo dev --filter=web` (3000)
2. run cy-runner `pnpm turbo dev --filter=cy-runner` (3001)