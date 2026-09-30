# Proposal: tests-backend

**Change:** `tests-backend`
**Project:** `stockexapp`
**Affected project:** `serverBolsa` only (there is no root-level package to build or test)
**Date:** 2026-09-29
**Phase:** propose
**Input:** `openspec/changes/tests-backend/exploration.md`
**Delivery strategy:** `single-pr` (400-line review budget, fixed)

## Why

`serverBolsa` is 562 lines of production ESM with **zero tests, no test runner, and no
`test` script** (`package.json:6-8` declares only `"dev": "nodemon ."`). `openspec/config.yaml:69-70`
records this as `test_command: null` / `test_framework: null`.

That zero coverage is not merely incomplete — it is **actively dangerous**, because the
backend depends on two packages it never declares:

- `models/Usuario.js:2` and `controllers/authController.js:1` do `import bcrypt from 'bcrypt'`
- `index.js:8` does `import express-session`

Neither `bcrypt` nor `express-session` appears in `package.json` (`package.json:15-28`
declares `bcryptjs`, a different package). Verified against `package-lock.json`: the
**only** package in the tree that depends on `bcrypt@5.1.1` or `express-session@1.18.0`
is **`moongose@1.0.0`** — the typo'd mirror of `mongoose` that no source file imports.
Both resolve *by accident*, through a dependency that should not exist.

If `moongose` is ever pruned (a routine `npm prune`, a lockfile regen, a security sweep),
the backend breaks **at import time** with `ERR_MODULE_NOT_FOUND` and no test would catch
it. Today, nothing catches it at all. This is a concrete, verifiable argument for
establishing a backend suite **now** rather than after a wider refactor.

The exploration also established that the highest-value targets need **no database and no
module mocking**: `middlewares/authenticate.js` is a pure `(req, res, next)` function, and
both models are `readyState=0` with no `pre`/`post` hooks and no query middleware
(`exploration.md` Finding 4). The suite that is worth writing is also the suite that is
cheap to write.

## What changes

### In scope

| # | Deliverable | Path |
|---|---|---|
| 1 | `test` script wired to the Node built-in runner | `serverBolsa/package.json` |
| 2 | `engines.node` floor documenting the verified runtime | `serverBolsa/package.json` |
| 3 | Unit tests for the JWT auth middleware (pure, faked `req`/`res`) | `serverBolsa/test/authenticate.test.js` |
| 4 | Schema-validation and `comparePassword` tests for `Usuario` | `serverBolsa/test/models/Usuario.test.js` |
| 5 | Schema-validation tests for `Empresa` | `serverBolsa/test/models/Empresa.test.js` |
| 6 | Shared helpers strictly required by 3–5 (fake `req`/`res`, token factory) | `serverBolsa/test/helpers/` |

**Zero production source files are modified. Zero dependencies are added.**

### Out of scope — deferred to follow-up changes

| Deferred item | Why not now |
|---|---|
| `controllers/authController.js`, `controllers/empresaController.js` tests | Need model mocking or a live database; each is estimated at 150–280 lines (`exploration.md` 239-244) and neither fits the review budget. |
| Import-safe `app.js` seam | A **production refactor** (new file, rewired `index.js`), estimated +50–80 lines of source. |
| `websockets/websocketServer.js` timer refactor | A **production refactor** to make the un-cleared `setInterval` (L78) injectable/clearable; estimated +60–120 lines of source. |
| Any route or app-wiring integration test | Impossible without the `app.js` seam: `index.js:74` connects and listens on import. |
| `clientBolsa` — headless/non-watching `ng test`, root workspace command | Would unblock `strict_tdd: true`, but requires touching Angular config and creating a root `package.json`. |
| `bcrypt` vs `bcryptjs`, and the `express-session` / `moongose` ghost dependency | Pre-existing and adjacent. **Recorded here as a constraint and a risk — NOT fixed by this change.** |
| Flipping `strict_tdd` in `openspec/config.yaml` | Still fails: it needs one root-level command covering *both* projects, and `clientBolsa` is out of scope. Stays `false`. |

## Capabilities

> This is the contract with the spec phase. `openspec/specs/` is currently **empty**,
> so there are no existing capabilities to modify.

### New Capabilities

- `backend-test-runner`: `serverBolsa` exposes a runnable, zero-dependency test command
  (`npm test` → `node --test`) that discovers test files by convention and requires no
  configuration file, no coverage thresholds, and no additional packages.
- `backend-unit-tests`: `serverBolsa` has automated unit coverage for its JWT auth
  middleware and for the `Usuario` and `Empresa` schema definitions, including
  `comparePassword`. This is the capability that **grows** with each follow-up change,
  which is where controller, route, and integration coverage will land.

### Modified Capabilities

None. `openspec/specs/` contains no existing spec files, so no existing requirement changes.

## Runner decision

### Recommendation: the Node built-in runner, `node:test`

**Exact devDependencies added: none.** **Exact script:**

```json
"scripts": {
  "dev": "nodemon .",
  "test": "node --test"
}
```

Verified empirically on this machine (Node **v20.11.1**, npm 10.9.1, win32 x64):

| Check | Result |
|---|---|
| Bare `node --test` discovers `test/**/*.test.js` | ✅ confirmed |
| `mock.module()` on `node:test` | `undefined` — confirms `exploration.md` Finding 6 |
| Native `bcrypt@5.1.1` addon loads and hashes | ✅ confirmed |
| `Usuario` / `Empresa` validate with `readyState=0` | ✅ confirmed |
| `authenticate` runs against plain fake `req`/`res` | ✅ confirmed — **no mocking of any kind** |
| Warm suite wall-clock | **~0.7 s** |

### The decisive reason: dependency churn IS the review budget

The exploration rated dependency footprint qualitatively. Measured, it is the whole
decision. Each candidate runner was resolved against the real lockfile (6,343 lines today)
and the resulting diff counted:

| Runner | `package-lock.json` lines changed | Share of the 400-line budget, before one test is written |
|---|---|---|
| **`node:test`** | **0** | **0 %** |
| Mocha + Chai 5 + supertest | 1,099 | 275 % |
| Vitest | 1,428 | 357 % |
| Jest | 4,053 | 1,013 % |

**Any third-party runner exhausts or destroys the 400-line budget in the lockfile alone**,
before a single line of test exists. Under the fixed `single-pr` policy, `node:test` is not
merely the tidiest option — it is the only one that leaves any budget for actual tests.

### Tradeoffs rejected, and what the narrowing did to them

The exploration's core finding was that the runner is coupled to the mocking strategy,
which is coupled to whether a production refactor is in scope. **With controllers out of
scope, that coupling collapses.** Both remaining targets take their collaborators as
*arguments*, not as imports: `authenticate(req, res, next)` receives fakes directly, and the
models construct and validate in isolation. Neither needs `mock.module()`, `vi.mock`, or a
database. That removes the exact factor that made all four options look similar.

- **Vitest — rejected.** Its decisive advantage, `vi.mock` for ESM, is **now dead weight**:
  nothing in scope needs it. It costs 1,428 lockfile lines to buy capability this change
  does not use. It remains the correct choice for a *future* change that covers the
  controllers, and it is recorded as such.
- **Mocha + Chai + supertest — rejected.** `supertest` exists to drive the Express `app`,
  which is not importable until the `app.js` seam exists — both are out of scope. It also
  carries a live `chai@5` (ESM-only) vs `chai@4` (CJS) version decision, for 1,099 lockfile
  lines.
- **Jest — rejected.** 4,053 lockfile lines (10× the budget), experimental ESM support,
  and a well-known friction between the native `bcrypt` addon and the pure-JS `bcryptjs`.
- **`node:test` costs accepted.** No coverage thresholds (`--experimental-test-coverage` is
  experimental and prints to stdout rather than enforcing a gate); `node:assert/strict`
  instead of Chai's ergonomics; and `mock.module()` stays unavailable on Node 20, which
  **constrains the controller follow-up** — that follow-up should either adopt Vitest or
  inject models explicitly. `node --test` still gives first-class `describe`/`it`,
  `node:assert`, `--watch`, `--test-reporter`, and `--test-concurrency`.

### On the two-runner duplication concern

The repo would run Karma for `clientBolsa` and `node:test` for `serverBolsa`. This is true
today for Karma and is **not worsened** by this change: `node:test` adds no new toolchain,
no `node_modules` surface, and no config file — it is the Node binary already installed.
Vitest, Jest, or Mocha would each introduce a genuinely *third* toolchain concept.

## Approach

Six small work units, each independently reviewable and independently revertible. No unit
touches production source.

| # | Work unit | Notes |
|---|---|---|
| 1 | Add `"test": "node --test"` and `"engines": { "node": ">=20.11.1" }` to `package.json` | `engines` is **documentation, not enforcement** — npm only emits `EBADENGINE` unless `engine-strict` is set. It records the runtime the discovery behaviour was verified on. |
| 2 | `test/helpers/` — fake `req`/`res` and a signed-token factory | The only shared code. `res` needs a chainable `status().json()` stub; `req` needs `headers.authorization`. The token factory sets `TOKEN_SECRET` and signs with real `jsonwebtoken`. |
| 3 | `test/authenticate.test.js` | Covers: no header → 401 `No token provided`; malformed header; invalid signature → 401 `Invalid token`; valid token → `req.usuarioId` set from `decoded._id` and `next()` called; expired token. |
| 4 | `test/models/Usuario.test.js` | Collection name is `usuarios`; `nombre`/`email`/`password` required; `email` carries a unique index; `comparePassword` accepts the correct hash and rejects a wrong one. |
| 5 | `test/models/Empresa.test.js` | Collection name is `empresas` (explicit 3rd arg, `Empresa.js:35`); `nombre`, `cantidad`, `usuarioId` required; `usuarioId` is an `ObjectId` with `ref: 'Usuario'`; optional fields absent. |
| 6 | Verify `npm test` from `serverBolsa` and refresh stale `openspec/config.yaml` test-command fields | `config.yaml:135` and `:146` hold `""` for `serverBolsa` and become stale the moment the script exists. |

### A test-authoring detail that matters

`jwt.verify` with a callback fires **synchronously** on the success path and
**asynchronously** on the error path. Verified during this proposal. A test that asserts
straight after calling `authenticate` is correct for a valid token but will race for an
invalid one — the negative cases must await the callback (or poll once). This is the single
most likely source of a flaky first draft and should be handled deliberately in unit 3.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `serverBolsa/package.json` | Modified | Adds `test` script and `engines.node`. **No dependency added.** |
| `serverBolsa/test/helpers/` | New | Fake `req`/`res`, signed-token factory. |
| `serverBolsa/test/authenticate.test.js` | New | Middleware unit tests. |
| `serverBolsa/test/models/Usuario.test.js` | New | Schema + `comparePassword` tests. |
| `serverBolsa/test/models/Empresa.test.js` | New | Schema tests. |
| `serverBolsa/package-lock.json` | **Unchanged** | Zero new packages ⇒ zero lockfile churn. |
| `serverBolsa/{controllers,routes,index.js,websockets}` | **Unchanged** | Production source is untouched by design. |
| `openspec/config.yaml` | Modified at archive | `project_test_commands.serverBolsa` (L135) and `verify.project_commands.serverBolsa.test` (L146) become stale. `strict_tdd: false` (L24) is **deliberately left in place**. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Native `bcrypt@5.1.1` resolves only through `moongose@1.0.0`** — the tests therefore exercise a binary that is not declared in `package.json`. Pruning `moongose` would break `models/Usuario.js` at import and **fail the new suite loudly** rather than silently. | High (that is today's state) | Accept and **record it**. The suite turning this into a visible red test is an argument for the change, not against it. `bcryptjs@^2.4.3` is declared and imported by nothing — the code and manifest disagree. Fixing that is follow-up work. |
| **`comparePassword` tests therefore validate a native addon, not `bcryptjs`.** If a later change switches `Usuario.js` to the declared `bcryptjs`, these tests should keep passing — that is precisely the regression they guard. | Medium | State it explicitly in the test file so no future reader assumes a pure-JS dependency. |
| **Node version is unpinned.** No `engines` field existed; the README claims Node 14 while the machine runs 20.11.1. Bare `node --test` discovery behaviour and `node:test` API surface differ across majors. | Medium | Add `engines.node >= 20.11.1` in unit 1. **Documented, not enforced** — a developer on Node 18 may still see different discovery. |
| **The app wiring and both controllers remain completely untested.** This suite covers ~3 of 9 backend modules. `index.js` — the file that actually wires routes, connects, and listens — remains unimportable and untested. | High (by design) | Stated as an accepted, deliberate gap. The follow-up controller change is where this debt gets paid; this change does not pretend to close it. |
| **Adding a suite that cannot import `index.js` may create the *need* for a refactor without paying for it.** | Medium | The follow-up list names the `app.js` seam explicitly, so the obligation is recorded rather than forgotten. |
| **Zero-dependency tooling has no upstream maintenance.** `node:test` API stability is tied to Node majors, not to a package version. | Low | Acceptable: the alternative is a 1,428-line lockfile per change. `--test` and `node:assert` are stable and long-lived. |
| **`openspec/config.yaml:109` flags dependency additions to a zero-coverage backend as risky.** | None (mitigated) | This change adds **zero** dependencies, so the risk the rule anticipates does not apply. Recorded explicitly per the project proposal rule. |
| **Flipping `strict_tdd` is out of reach.** `clientBolsa` still has no headless command and there is still no root-level `package.json`. | High | `strict_tdd` stays `false`. Re-evaluated at archive per `config.yaml:151`, together with the `clientBolsa` follow-up. |

## Acceptance criteria

- [ ] `cd serverBolsa && npm test` exits `0` and reports all tests passing, with no
      database, no network, and no `.env` requirement beyond what `dotenv` already reads.
- [ ] `serverBolsa/package.json` declares `"test": "node --test"` and
      `"engines": { "node": ">=20.11.1" }`.
- [ ] `serverBolsa/package.json` `devDependencies` is **still exactly `nodemon`** — the
      suite adds no package.
- [ ] `git diff --stat` on `serverBolsa/package-lock.json` is **empty**.
- [ ] `middlewares/authenticate.js` is covered for: missing header, malformed header,
      invalid signature, expired token, and valid token (asserting `req.usuarioId` equals
      `decoded._id` and that `next()` is called).
- [ ] `Usuario` is covered for: collection name `usuarios`, the three required fields, the
      unique index on `email`, and `comparePassword` for both a correct and an incorrect
      password.
- [ ] `Empresa` is covered for: collection name `empresas`, the three required fields,
      and the `usuarioId` ObjectId/`ref: 'Usuario'` shape.
- [ ] No file under `serverBolsa/` outside `package.json` and `test/` is modified.
- [ ] A warm `npm test` completes in roughly 2 seconds or less.
- [ ] The suite fails loudly when `bcrypt` is no longer resolvable — verified by removing
      `moongose` from `package.json` **and** regenerating the install (`npm install` / `npm ci` /
      prune), then observing the non-zero exit and the module-resolution failure naming `bcrypt`,
      then restoring both and confirming the suite passes again. Removing only
      `node_modules/moongose` does **not** reproduce this: npm hoists `bcrypt` and
      `express-session` to the top level, so they stay resolvable and the suite passes.
      Corrected in `design.md`; the matching spec scenario already carries the right hedge
      ("while `bcrypt` is not otherwise resolvable").

## Size forecast

Authored changed lines. Deletions are counted alongside additions.

| Work unit | File | Est. lines |
|---|---|---|
| 1 | `serverBolsa/package.json` — `test` script + `engines` | +4 |
| 2 | `test/helpers/request.js` — fake `req`/`res` + token factory | 35–45 |
| 3 | `test/authenticate.test.js` — 5–6 cases | 85–110 |
| 4 | `test/models/Usuario.test.js` — 4 cases | 50–65 |
| 5 | `test/models/Empresa.test.js` — 5 cases | 55–70 |
| — | `serverBolsa/package-lock.json` | **0** (no new dependency) |
| | **Total** | **~229–294** |

**Forecast: ~229–294 authored changed lines, against a 400-line budget — roughly 106–171
lines of headroom. `single-pr` holds without a `size:exception`.**

This forecast is credible only because the lockfile delta is zero. Had Vitest been chosen,
the lockfile alone would be 1,428 lines and the change would be **~1,550 lines — 3.9× the
budget** — forcing chained PRs and a `package-lock.json` that reviewers cannot meaningfully
audit. The narrowing and the runner choice reinforce each other: the narrowed scope makes
`node:test` sufficient, and `node:test` is what makes the narrowed scope affordable.

Two assumptions, stated plainly rather than buried:

1. SDD planning artifacts under `openspec/` are counted separately from the implementation
   PR. If they are counted, `proposal.md` + spec + design + tasks must be committed in a
   separate planning commit for the 400-line figure to hold.
2. The estimate assumes the controllers, `app.js`, and `websocketServer.js` stay out. Any
   one of those adds 50–280 lines and pushes this change over budget on its own.

## Rollback plan

Low-risk by construction: no production source is modified and no dependency is added.

- **Full revert.** Delete `serverBolsa/test/` and remove the `test` script and `engines`
  block from `package.json`. `package-lock.json` needs no revert, because it was never
  changed. `npm run dev` is unaffected throughout.
- **Partial revert.** The `test` script and the test files are independent — the suite can
  be removed while keeping the script, or a single test file can be dropped without
  touching the others.
- **Blast radius on `node --test`.** The runner discovers `**/*.test.js` by convention. If a
  future file matching that pattern is added outside `test/`, scope the script to
  `node --test test/` at that point.
- **If `node:test` behaves unexpectedly on a future Node major,** the rollback is a runner
  swap at a known cost: budget ~1,100–4,050 lockfile lines and move to chained PRs.

## Dependencies

- **No new packages.** `serverBolsa` continues to declare exactly one devDependency,
  `nodemon@^3.1.4`.
- **No running services.** No MongoDB, no in-memory server, no network. Unlike the
  frontend (`clientBolsa`, Karma + Chrome), `node:test` needs no browser or binary.
- **Node >= 20.11.1** (the verified runtime) is a de-facto prerequisite; recorded in
  `engines` as documentation.

## Success criteria

- [ ] Every item in **Acceptance criteria** above is satisfied.
- [ ] `openspec/config.yaml` `project_test_commands.serverBolsa` and
      `verify.project_commands.serverBolsa.test` are refreshed at archive; `strict_tdd`
      is consciously re-confirmed as `false`.
- [ ] The follow-up list in **Out of scope** is carried into a follow-up change so the
      controller coverage and the `app.js` seam are not silently dropped.
- [ ] The `bcrypt`/`bcryptjs` and `express-session`/`moongose` mismatches are recorded as
      an open, tracked issue — this change makes them *detectable*, not *fixed*.