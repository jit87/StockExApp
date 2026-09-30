# Exploration: tests-backend

**Change:** `tests-backend`
**Project:** `stockexapp`
**Date:** 2026-09-29
**Phase:** explore (read-only — no source, config, or dependency was modified)

## Current State

`serverBolsa` is a 9-file, 562-line ESM Node backend with no test runner, no `test`
script, and zero test files. Verified environment: **Node v20.11.1, npm 10.9.1,
win32 x64, N-API ABI 115**. `package.json` declares only one script:

```json
"scripts": { "dev": "nodemon ." },
"type": "module",
"devDependencies": { "nodemon": "^3.1.4" }
```

There is **no root `package.json`**, no npm workspaces, no lockfile at the root, and
no CI (no `.github/` anywhere). `mongodb-memory-server`, `supertest`, `mocha`, `chai`,
`vitest`, and `jest` are all **absent** from `serverBolsa/node_modules`.

### Module map and testability

| File | Lines | Import-time side effects | Directly testable? |
|---|---|---|---|
| `middlewares/authenticate.js` | 27 | `dotenv.config()` (L4) | **Yes — pure.** Best first target |
| `models/Usuario.js` | 14 | `dotenv.config()` via `bcrypt` import; `mongoose.model()` registration | **Yes — no DB needed** (verified) |
| `models/Empresa.js` | 35 | `mongoose.model()` registration | **Yes — no DB needed** (verified) |
| `routes/authRoutes.js` | 28 | `dotenv.config()` (L5) | **Yes — route table only** |
| `routes/empresaRoutes.js` | 26 | none; `router.use(authenticate)` (L8) | **Yes — route table + auth wiring** |
| `controllers/authController.js` | 159 | none | **Only with model mocking or a live DB** |
| `controllers/empresaController.js` | 122 | none | **Only with model mocking or a live DB** |
| `websockets/websocketServer.js` | 79 | `dotenv.config()` (L7) + **module-scope env destructure** (L8) | **No** — `setInterval` + live API calls |
| `index.js` | 74 | **severe — see below** | **No — not importable** |

### Finding 1 — `index.js` cannot be imported by any test (blocking)

This is the single largest constraint. Three independent top-level side effects fire
merely on `import`:

1. **`index.js:74`** — `main().catch(console.error)` runs on import. `main()` awaits
   `mongoose.connect(uri, ...)` (L53) and then calls `server.listen(...)` (L66). A test
   that imports this file attempts a real DB connection and **binds a real port**.
2. **`index.js:45`** — `configureWebSocket(server, sessionMiddleware)` runs on import.
   Inside, `websocketServer.js:78` executes `setInterval(actualizarPrecios, 30000)`.
   That interval calls `Empresa.aggregate(...)` (L27) and then a **live HTTPS request to
   `https://finnhub.io/api/v1/quote`** (L48). It also **never gets cleared**, so it keeps
   the Node event loop alive and the test process would hang after the suite finishes.
3. **`index.js:8`** imports `express-session`, which is **not declared** in
   `package.json` (already recorded as pre-existing and out of scope; confirmed again here).

The testable seam does not currently exist: the Express `app` and the HTTP server are
constructed in the same module that connects and listens. Extracting an `app.js` that
exports `app` (import-safe) and leaving `index.js` to do only connect + listen is the
structural change that unblocks route/handler integration tests. That is a **source
refactor, not just test setup** — a real scope decision for the user.

### Finding 2 — a second undeclared dependency the init pass did not record

`authController.js:1` and `models/Usuario.js:2` both do `import bcrypt from 'bcrypt'`,
but `package.json:17` declares **`bcryptjs`**, a different package. Verified against
`package-lock.json`: the only dependent of `bcrypt` (v5.1.1) *and* of
`express-session` (v1.18.0) is **`moongose@1.0.0`** — the typo'd `mongoose` mirror that
no source file imports. So `bcrypt` and `express-session` both resolve **only by
accident**, through a dependency that should not exist.

This matters directly for this change: any test that imports `authController.js` or
`models/Usuario.js` loads the **native** `bcrypt@5.1.1` addon
(`node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node`). It is N-API v3, so it is
ABI-stable, but it is still a native binary. `bcryptjs` (pure JS) is installed and
declared but **imported by nothing** — the code and the manifest disagree.

### Finding 3 — `process.env` case mismatch makes DB target platform-dependent

`serverBolsa/.env` defines `MONGO_URI` and `PORT` (uppercase). The code reads them
lowercased:

- `index.js:48` — `process.env.mongoUri || "mongodb://localhost:27017/StockExApp"`
- `index.js:66` — `server.listen(process.env.port || 4000, ...)`

On Windows, environment lookups are case-insensitive, so this works by accident. On
Linux/macOS it is `undefined` and the code silently falls back to the hardcoded
`localhost:27017` default and port 4000. Any CI or container-based test run on Linux
would not honour the configured database. Note also that the root `README.md:81-85`
documents an `.env` template containing **only** the three API keys — it omits
`TOKEN_SECRET`, `MONGO_URI`, and `PORT`, all of which the code actually requires.

There is **no `docker-compose.yml` / `compose.yaml` anywhere** in the repo and no
`mongodb-memory-server`. A live MongoDB is assumed to be running on
`localhost:27017` on the developer's machine; nothing provisions or isolates it.

### Finding 4 — Mongoose models are cleanly separable from the connection (good news)

Verified empirically by importing both models with no DB running:

```
Usuario model imported WITHOUT db connection: Usuario
Usuario collection: usuarios
Usuario indexes:    [[{"email":1},{"unique":true,"background":true}]]   <- auto from unique:true
Empresa collection: empresas      (explicit 3rd arg, L35)
Empresa indexes:    []                                              <- none
Empresa methods:    (none)
validateSync ok: true
readyState (0=disconnected): 0
```

Neither model defines custom query middleware, schema `pre`/`post` hooks, or extra
indexes. The only registered index is the auto-generated unique one on `Usuario.email`.
`Usuario.prototype.comparePassword` (`Usuario.js:10-12`) is a pure method wrapping
`bcrypt.compareSync` — unit-testable with no DB and no server.

**Consequence:** schema-validation and instance-method tests for both models can run
with **zero infrastructure**. Only controller/route tests need either a real or in-memory
database.

### Finding 5 — the `clientBolsa` side of a workspace-level test command

`clientBolsa` has no `"type"` field (CommonJS) and one test script: `"test": "ng test"`.
Stack: Karma 6.4 + Jasmine 5.1, `karma-chrome-launcher` 3.2, `karma-coverage` 2.2.
Exactly one spec exists: `clientBolsa/src/app/guards/auth.guard.spec.ts`. There is **no
`karma.conf.js`**, and `angular.json`'s `architect.test.configurations` is `{}` — so
`ng test` runs with **builder defaults: watch mode ON, interactive Chrome**. A root-level
`npm test` cannot use `npm test --workspaces` as-is, because the frontend command would
hang waiting for a browser. Making a workspace command CI-safe requires either adding
`--watch=false --browsers=ChromeHeadless` to that project, or a root script that shells
out with those flags. (Chrome **is** installed at
`C:\Program Files\Google\Chrome\Application\chrome.exe`, and `CHROME_BIN` is unset, so
`karma-chrome-launcher` would auto-detect it in this environment.)

### Finding 6 — `node:test` on this Node version cannot mock ESM modules

The runner decision is constrained by the installed Node version, not by preference.
Probing Node 20.11.1 directly:

```
node:test exports: after afterEach before beforeEach describe it mock only run skip test todo
mock members:      fn getter method reset restoreAll setter timers
mock.module():     undefined
--test-module-mocks flag:  absent from --help
--experimental-test-coverage: present
```

`mock.module()` — the only built-in way to substitute an ESM import — **does not exist**
in Node 20.11.1. So with `node:test`, `import Usuario from '../models/Usuario.js'` cannot
be replaced in-process. Avoiding a database would require either a refactor to inject the
model as a parameter, or a real/in-memory Mongo. This single fact largely decides the
runner comparison below.

## Affected Areas

- `serverBolsa/index.js` — side effects at L45, L53, L66, L74; env case mismatch L48/L66; blocks all app-level tests
- `serverBolsa/package.json` — needs a `test` script and a runner devDependency; `bcryptjs` declared but unused
- `serverBolsa/controllers/authController.js` — 6 handlers, needs model mocking or DB
- `serverBolsa/controllers/empresaController.js` — 5 handlers, needs model mocking or DB
- `serverBolsa/middlewares/authenticate.js` — pure, no infrastructure needed
- `serverBolsa/models/Usuario.js`, `serverBolsa/models/Empresa.js` — testable without DB
- `serverBolsa/websockets/websocketServer.js` — L8 module-scope env destructure and L78 un-cleared `setInterval`; needs a refactor to become testable
- `clientBolsa/angular.json` — `test.configurations` is `{}`; must add headless/no-watch for any workspace command
- `openspec/config.yaml` — `strict_tdd: false` (L24) and `project_test_commands.serverBolsa: ""` (L135) become stale once a runner lands; L151 already flags this for archive

## Approaches

Four runner options were assessed. **No winner is declared here** — that is a proposal
decision. Effort is rated for *adopting the runner*, not for writing the suite.

| Option | Zero-dep | ESM | Mocks ESM | Watch | Coverage | Effort |
|---|---|---|---|---|---|---|
| A. `node:test` | **Yes** | Native | **No** (`mock.module` absent) | `--watch` | experimental, no thresholds | Low |
| B. Vitest | No | Native | **Yes** (`vi.mock`) | Excellent | v8, thresholds | Medium |
| C. Jest | No | Experimental/slow | Awkward for ESM | Yes | Yes | Medium-High |
| D. Mocha + Chai + supertest | No (3 pkgs) | Native | Needs sinon/manual | Yes | via c8/nyc | Medium |

**A. `node:test` (built-in, `node --test`)**
- Pros: **zero new dependencies and zero `package-lock.json` churn** — a real advantage
  for a repo with no tooling conventions; native ESM with no config; already installed;
  `--watch` exists; coverage available behind a flag.
- Cons: **cannot mock ESM bindings** on Node 20.11.1 (Finding 6), which forces either a
  DI refactor of the controllers or a real/in-memory Mongo for all controller tests;
  `node:assert` only, no assertion ergonomics; `--experimental-test-coverage` is
  experimental and has no threshold enforcement.
- Effort: Low. Best fit **only if** the user accepts either a DI refactor or a database
  dependency for controller coverage.

**B. Vitest**
- Pros: first-class ESM; `vi.mock` genuinely replaces ESM imports, so controllers can be
  unit-tested against fake `Usuario`/`Empresa` with **no database at all**; excellent
  watch DX; `@vitest/coverage-v8` supports real thresholds; native addons like `bcrypt`
  are externalized by default and work.
- Cons: a large devDependency tree and heavy `package-lock.json` churn for a repo that
  currently has exactly one devDependency; introduces a second, different test runner
  alongside Karma (that duplication is not *worse* than today, but it is not solved); no
  zero-config path to also run Angular's Jasmine specs, so `clientBolsa` would need a
  separate future migration.
- Effort: Medium. **The strongest option if the goal is meaningful controller coverage
  without infrastructure.**

**C. Jest**
- Pros: the most mature ecosystem and the default mental model; `jest.mock` is powerful.
- Cons: native ESM support is still experimental and noticeably slow; mixing a native
  addon (`bcrypt`) with a pure-JS declared twin (`bcryptjs`) is a well-known Jest pain
  point; likely needs `babel-jest` plus `transformIgnorePatterns` tuning; would be a third
  distinct runner alongside Karma and whatever the backend picks.
- Effort: Medium-High, with the most configuration risk of the four for this stack.

**D. Mocha + Chai + supertest**
- Pros: the conventional Express pairing; `supertest` drives the app over HTTP without
  binding a fixed port, which is the natural fit once an `app.js` seam exists; Mocha
  handles ESM natively.
- Cons: three new devDependencies plus a `chai` major-version decision (`chai@5` is
  ESM-only, `chai@4` is CJS); no module mocking, so the same DI-or-database problem as
  option A resurfaces; watch and coverage require extra tooling.
- Effort: Medium. Appropriate **if** HTTP-level integration tests are the goal and
  controller-level mocking is not.

### The decision that dominates all four options

All four are workable. What actually decides the outcome is **how controller tests get a
fake `Usuario`/`Empresa`**, because there is currently no seam for it:

- **(i) Refactor to inject the model** — e.g. export factories that accept the model, or
  an importable `app.js`. Cleanest, testable with `node:test` and zero infra, but it is a
  production-code change and enlarges the PR.
- **(ii) Add `mongodb-memory-server`** — no refactor; tests hit a real wire-protocol Mongo.
  Costs a devDependency and a ~70 MB binary download, but the models are already proven
  DB-independent at import time, so it composes with every runner including `node:test`.
- **(iii) Pick a runner with ESM module mocking (Vitest)** — no backend refactor, no
  database, fastest path to real controller coverage; costs the largest dependency delta.

## Scope Estimate (estimate, not a plan)

Backend source is 562 lines total, of which ~460 are non-blank/non-comment. A suite that
covers the auth middleware, both models, and both controllers at a reasonable level is
estimated as follows. **These are estimates for orchestrator budgeting, not commitments.**

| Work unit | Estimate |
|---|---|
| Runner install + `test` script + config | 40–80 |
| Shared helpers (fake `req`/`res`, fixtures, or DB setup) | 60–120 |
| `authenticate.test.js` (~8–10 cases) | 90–130 |
| `authController.test.js` (~10–14 cases) | 150–220 |
| `empresaController.test.js` (~12–16 cases) | 200–280 |
| Model validation / `comparePassword` tests (~8 cases) | 80–120 |
| **Subtotal (tests only)** | **~620–950** |
| Optional `app.js` seam refactor (needed for route/app integration tests) | +50–80 (production) |
| Optional `websocketServer.js` refactor (injectable timer + client) | +60–120 (production) |

A deliberately minimal smoke suite (`authenticate` + model validation only, no
controllers) lands around **250–350 lines** and is the only shape likely to fit the
400-line review budget.

## Risks

- **The 400-line review policy is very likely to be exceeded.** A real backend suite is
  estimated at 620–950 authored lines, i.e. **1.5x–2.4x** the budget, before any
  refactor. Under `single-pr` delivery this is a genuine tension the user must resolve:
  either accept a small PR, accept chained PRs, or explicitly grant a size exception.
- **`index.js` is untestable as written.** Any test suite that stops at controllers leaves
  the module that actually wires the app untested, and a future `app.js` extraction is
  still owed. This change may create the *need* for a refactor without paying for it.
- **`websockets/websocketServer.js:78` will hang a test process.** Its un-cleared
  `setInterval` is a real hazard for any runner; without a refactor, suites must avoid
  importing that module entirely.
- **Adding devDependencies to a zero-coverage backend is itself a risk.** `openspec/config.yaml:109`
  already flags this; there is no safety net if a dependency upgrade breaks resolution.
- **`bcrypt` (native) vs `bcryptjs` (declared) mismatch** must be resolved before tests
  can be trusted. Testing today's code means testing code that loads an undeclared
  transitive native addon. If `moongose` is ever removed, `authController.js` and
  `Usuario.js` break at import — and a test suite is exactly what would catch that, which
  is a genuine argument **for** doing this change now.
- **Node version is unpinned.** Nothing declares an `engines` field, and the README claims
  Node 14 while the machine runs 20.11.1. `node:test` behaves differently across majors
  (notably `mock.module`), so a runner choice is partly a Node-version choice.
- **Adjacent pre-existing issues (adjacent, NOT in scope):** `index.js:8` imports
  undeclared `express-session`; `README.md:92` documents `npm start` but only `dev`
  exists; `README.md:31` claims Node 14; `README.md:81-85` omits `TOKEN_SECRET`,
  `MONGO_URI`, `PORT`; `index.js:11` imports `SocketIOServer` in `index.js` and never
  uses it; `index.js:45` passes `sessionMiddleware` as a second argument to
  `configureWebSocket(server)` whose signature (L13) accepts only one, and
  `websocketServer.js:5` imports `sharedsession` without ever using it.

## Open Decisions for the User

1. **Coverage depth.** A minimal suite (~250–350 lines, middleware + models) fits the
   review budget. A real suite (~620–950 lines, includes both controllers) does not.
   Which matters more here?
2. **How controllers get a fake `Usuario`/`Empresa`.** Refactor for dependency injection,
   add `mongodb-memory-server`, or choose a runner with ESM module mocking? This single
   answer effectively picks the runner.
3. **Is a production refactor in scope?** Extracting an `app.js` seam and making
   `websocketServer.js` testable are the only way to cover the app wiring. In scope, or
   strictly test-infrastructure-only?
4. **Is a live MongoDB assumed for tests?** No compose file and no in-memory server exist
   today. Should tests require a running local Mongo, or be self-contained?
5. **Should the undeclared `bcrypt` vs declared `bcryptjs` mismatch be fixed here?** It is
   adjacent to testing but directly determines what the tests exercise.
6. **Workspace-level command and `strict_tdd`.** Flipping `strict_tdd` to `true` also
   requires `clientBolsa`'s `ng test` to become headless and non-watching, plus a root
   `package.json` or script. Should this change pursue that, or only the backend runner
   and leave `strict_tdd: false` for a follow-up?

## Ready for Proposal

**Yes, with decisions deferred to the proposal phase.** The ground truth is now
established: the module map, the exact import-time side effects with line evidence, the
models' DB-independence, the absence of any database provisioning, the `node:test`
ESM-mocking limitation on Node 20.11.1, and an honest size estimate that puts a real
suite at 1.5x–2.4x the 400-line review budget.

The orchestrator should tell the user that **the runner cannot be chosen in isolation** —
it is coupled to the mocking strategy, which is coupled to whether a production refactor
is in scope. The proposal phase should resolve those three as one decision, and the
review-budget conflict needs an explicit answer before tasks are planned.
