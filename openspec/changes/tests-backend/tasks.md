# Tasks: tests-backend

**Change:** `tests-backend` · **Project:** `stockexapp` · **Affected project:** `serverBolsa` only
**Date:** 2026-09-30 · **Phase:** tasks
**Inputs:** `proposal.md`, `specs/backend-test-runner/spec.md`, `specs/backend-unit-tests/spec.md`, `design.md`
**Delivery:** `single-pr` · planning artifacts excluded from the 400-line budget

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | **~229–294 authored** (implementation only, `openspec/` excluded) |
| 400-line budget risk | **Low** |
| Chained PRs recommended | **No** |
| Suggested split | Single PR containing 5 work-unit commits |
| Delivery strategy | `single-pr` |
| Chain strategy | `pending` |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Per-unit line estimate

Deletions are counted alongside additions. Nothing in this change modifies an existing line of
production source, so the authored delta is effectively all additions.

| Unit | Artifact | Add | Del | Range |
|------|----------|----:|----:|-------|
| 1 | `serverBolsa/package.json` — `"test"` script + `"engines"` block | +4 | 0 | 4 |
| 2 | `serverBolsa/test/helpers/request.js` | 35–45 | 0 | 35–45 |
| 3 | `serverBolsa/test/authenticate.test.js` | 85–110 | 0 | 85–110 |
| 4 | `serverBolsa/test/models/Usuario.test.js` | 50–65 | 0 | 50–65 |
| 5 | `serverBolsa/test/models/Empresa.test.js` | 55–70 | 0 | 55–70 |
| — | `serverBolsa/package-lock.json` | 0 | 0 | **0** |
| — | `serverBolsa/**` production source | 0 | 0 | **0** |
| | **Implementation total** | | | **229–294** |

**Total confirmed against the proposal's forecast: 229–294 authored changed lines.** The per-unit
ranges re-derived here sum to exactly the same interval, so the proposal's size forecast holds.
Headroom is **106–171 lines**. Under `single-pr` this holds without a `size:exception`, and
`Decision needed before apply` is **No** — the `single-pr` → `Yes` mapping in the review-budget
guard applies only when the estimate is High or likely to cross 400, which this is not.

**Excluded from the budget (per the parent decision recorded in `design.md`):** the entire
`openspec/` tree, including `openspec/config.yaml`. For information only, Phase 7 touches roughly
**6–10** changed lines of `openspec/config.yaml` (two command-field replacements plus the
`serverBolsa` detection block). Those lines do not count against the 400.

**What would break the forecast** (stated so apply can catch it, not to invite it): any controller
test (+150–280), the `app.js` seam (+50–80 of production source), or the `websocketServer.js`
interval refactor (+60–120). All three are out of scope; if any is started, stop and re-forecast
rather than absorbing it.

### Suggested Work Units

Every unit below is a commit inside the single PR. Each names its focused test command, its
runtime harness (or an explicit reason none exists), and its rollback boundary.

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | `serverBolsa` exposes `npm test` → `node --test` and declares `engines.node >=20.11.1`; zero new packages | PR 1 (commit 1) | `node -e "import('./package.json',{with:{type:'json'}}).then(m=>console.log(Object.keys(m.default.scripts),m.default.engines,m.default.devDependencies))"` | `npm test` from `serverBolsa` — records the discovery baseline with no test file present (see task 1.2) | Revert the `scripts`/`engines` addition in `package.json`; no lockfile revert needed because none was written |
| 2 | Side-effect-free fake `req`/`res`, signed-token factory, and dual-settlement driver | PR 1 (commit 2) | `node --test test/helpers/request.js` | N/A — no runtime boundary exists; the helper is pure factory code with no I/O, so the only observable behaviour is that the runner executes it as a no-op test file (see task 2.2) | Delete `test/helpers/request.js`; nothing else imports it except the two middleware/model test files, which then break and revert with unit 3 |
| 3 | Middleware coverage: two distinct rejection messages, success path, scheme not validated | PR 1 (commit 3) | `node --test test/authenticate.test.js` | `npm test` from `serverBolsa` — real middleware invoked with real `jsonwebtoken@9.0.2`, no DB, no network | Delete `test/authenticate.test.js`; `middlewares/authenticate.js` is untouched and `npm run dev` is unaffected |
| 4 | `Usuario`: collection, required paths, unique index, `comparePassword` accept/reject | PR 1 (commit 4) | `node --test test/models/Usuario.test.js` | `npm test` from `serverBolsa` — real native `bcrypt@5.1.1` addon loads and hashes at `readyState 0` | Delete `test/models/Usuario.test.js`; `models/Usuario.js` untouched. Note: `test/models/Empresa.test.js` keeps its own `Usuario` import (task 4.3) and does not depend on this file existing |
| 5 | `Empresa`: collection via registration, required paths, `usuarioId` ObjectId + `ref`, remaining paths optional | PR 1 (commit 5) | `node --test test/models/Empresa.test.js` | `npm test` from `serverBolsa` — real `mongoose@8` schema introspection at `readyState 0` | Delete `test/models/Empresa.test.js`; `models/Empresa.js` untouched |
| — | Suite verification (Phase 5) | no commit | `npm test` from `serverBolsa` | Evidence only | N/A — nothing to revert |
| — | Ghost-dependency negative proof (Phase 6) | **no commit — must leave no trace** | `npm test` from `serverBolsa` | The destructive scenario itself: remove `moongose` from `package.json`, regenerate the install, observe `ERR_MODULE_NOT_FOUND` naming `bcrypt`, then restore | Every step is inverted by tasks 6.6–6.8; the net diff must be empty (task 6.8) |
| — | `openspec/config.yaml` refresh (Phase 7) | archive commit | `npm test` from `serverBolsa` | N/A — documentation metadata | Revert `openspec/config.yaml` alone; unrelated to the implementation |

---

## Conventions that apply to every task in this change

These come from `design.md` and `openspec/config.yaml`. They are preconditions, not commentary.

1. **Run every command from `serverBolsa/`, never from the repository root.**
   `openspec/config.yaml:124` states this as a `rules.tasks` constraint. `cd serverBolsa && npm test`
   is the only correct form; there is no root `package.json`.
2. **Invoke git by full path.** `C:\WINDOWS\system32\git` is an extensionless zero-byte file that
   shadows the real binary on `PATH` in this environment. Plain `git` returns **empty output
   without erroring**. Every repository-state assertion in this file is written as
   `& "C:\Program Files\Git\cmd\git.exe" ...`. An empty result is **not** a passing check — it
   means git never ran. Verify output files exist on disk instead of trusting `git status`.
3. **Zero production source edits.** Only `serverBolsa/package.json` may be modified, plus new
   files under `serverBolsa/test/`. `middlewares/`, `models/`, `controllers/`, `routes/`,
   `websockets/`, and `index.js` stay byte-identical
   (`backend-unit-tests` → *Production source remains unmodified*).
4. **`serverBolsa/package-lock.json` stays byte-identical.** Zero packages are added.
   The only commands that may legitimately touch it are the destructive ones in Phase 6, which
   must restore it (task 6.8).
5. **`strict_tdd` stays `false`.** No task in this file flips it. Revisited at archive per
   `openspec/config.yaml:151`.
6. **`sdd-apply` marks progress** by changing `- [ ]` to `- [x]` in this file. Never renumber,
   never rewrite the task list.

---

## Phase 1: Runner Wiring

Spec: `backend-test-runner` → *Zero-dependency test script*, *Convention-based discovery without
configuration*, *Documented Node runtime floor*. Design: D1.

- [x] 1.1 Add the runner to `serverBolsa/package.json`: insert `"test": "node --test"` into
  `scripts` after `"dev": "nodemon ."`, and add a top-level `"engines": { "node": ">=20.11.1" }`
  block. Change **nothing** else: `dependencies`, `devDependencies`, `"type": "module"`,
  `"main"`, and the existing `"dev"` script must be untouched. Do **not** add
  `"engine-strict"` or any `.npmrc` — `engines` is documentation only, and enabling
  `engine-strict` would violate *Documented Node runtime floor*.
  **Commit:** `chore(server): wire node --test as the backend test runner`
- [x] 1.2 Verify the manifest invariants for *Zero-dependency test script* and *Convention-based
  discovery without configuration*. From `serverBolsa`: `devDependencies` still contains exactly
  one key (`nodemon`); `scripts` contains exactly `dev` → `nodemon .` and `test` → `node --test`;
  `engines.node` is `>=20.11.1`; and no test-runner configuration file exists anywhere under
  `serverBolsa` (no `jest.config.*`, `vitest.config.*`, `.mocharc*`, or bespoke bootstrap).
  Then run `npm test` from `serverBolsa` and **record the output and exit code verbatim** as the
  empty-suite discovery baseline. `test/` does not exist yet at this point, so the expected result
  is zero discovered files; if Node instead reports no files found and exits non-zero, record that
  fact and do **not** treat it as a task failure — the first green-run gate is task 3.6, and the
  Phase 1 gate is the manifest, not the run.
- [x] 1.3 Confirm the lockfile is untouched per *Zero-dependency test script*:
  `& "C:\Program Files\Git\cmd\git.exe" diff --stat -- serverBolsa/package-lock.json` run from
  `serverBolsa` returns **empty**. If it returns anything at all, stop — the manifest edit
  triggered an install and the change has violated its own constraint. (Reminder: an empty result
  is the pass condition here; if git produced no output because it never ran, re-run it via the
  full path.)

---

## Phase 2: Shared Test Helpers

Spec: `backend-unit-tests` → *Shared test helpers are minimal and sufficient*. Design: D2, D4.

- [x] 2.1 Create `serverBolsa/test/helpers/request.js` exporting the helper contract from
  `design.md` → *Helper module contract*: `TEST_SECRET`, `signToken(payload, options)`,
  `makeReq(authorization)`, `makeRes(onSettled)`, and `runAuthenticate(authenticate, req)`.
  (`design.md` labels this "Four exports" but lists **five** — implement all five.)
  `makeReq(undefined)` omits the `authorization` key entirely, which is a case distinct from an
  empty string. `makeRes().status(code)` must return the same fake so `res.status(401).json(body)`
  chains. `signToken` must sign with the real `jsonwebtoken` the middleware imports — never
  `bcryptjs`, never a stub, never an inlined JWT encoder.
  `runAuthenticate` must resolve on **whichever settles first**: `res.json()` on the rejection
  path or `next()` on the success path. A driver that waits only on `next()` deadlocks the
  rejection cases; one that waits only on `json()` deadlocks the success case. Neither path may
  deadlock.
  **Commit:** `test(server): add side-effect-free request and token test helpers`
- [x] 2.2 Enforce design **D2** as a checkable property, because it is the difference between a
  working suite and a broken one. On Node 20.11.1 `node --test` treats **every `.js` file under a
  `test/` directory** as a test file — it does not restrict discovery to `*.test.js` — so
  `test/helpers/request.js` **will be executed as a test file**. Verify by inspection that the
  module contains **no import-time execution of any kind**: no assertion, no `console.log`, no
  top-level function call, no filesystem access, no network, no database, no environment mutation
  at module scope. Only `import` declarations, `const`/`function` declarations, and JSDoc.
  **Neither scoping escape is available** — `node --test test/**/*.test.js` exits 1 with
  `Could not find ...` because Node 20.11.1 has no glob support for `--test`, and
  `node --test test/models` would silently drop the spec-mandated `test/authenticate.test.js`.
  So side-effect freedom is the only available defence.
  **Verification:** run `npm test` from `serverBolsa` and confirm
  `test/helpers/request.js` appears in the output as a **passing no-op entry**
  (`ok N - ...\test\helpers\request.js`), never as a failure and never as an executed assertion.
- [x] 2.3 Enforce design **D4**: `signToken()` must assign
  `process.env.TOKEN_SECRET = TEST_SECRET` **inside the function body**, on every call — never at
  module top level. `serverBolsa/.env` defines a real `TOKEN_SECRET`, and
  `middlewares/authenticate.js:15` reads the config at **call** time, so a call-time assignment
  is deterministically order-independent. A top-level assignment would make the suite's
  correctness depend on ESM import ordering — a silent, order-sensitive failure mode.
  **Verification:** confirm there is exactly one `process.env.TOKEN_SECRET` assignment in
  `test/helpers/request.js` and that it sits inside `signToken`.
- [x] 2.4 Confirm *Shared test helpers are minimal and sufficient* holds: the
  `serverBolsa/test/helpers/` directory contains **only** `request.js`. There is no `db.js`, no
  `fixtures/`, no cleanup helper, and no module-mocking facility — the suite requires none and the
  requirement forbids providing them.

---

## Phase 3: JWT Auth Middleware Tests

Spec: `backend-unit-tests` → *JWT auth middleware unit coverage*,
*Asynchronous observation of the middleware's rejection path*. Design: D3.

- [x] 3.1 Create `serverBolsa/test/authenticate.test.js` and cover the **absent-token** family:
  header key absent, `""`, `"   "`, `"Bearer"`, and `"BearerXYZ"`. Each must yield status `401`
  with body `{ "message": "No token provided" }` and `next()` not called. These are all
  *absent second segment* cases, not invalid-token cases — `authenticate.js:7` derives the token as
  `req.headers['authorization']?.split(' ')[1]`, so a header with no second whitespace-separated
  segment never reaches `jwt.verify`. The two messages must be asserted as **distinct**.
  **Commit:** `test(server): cover jwt authenticate middleware branches`
- [x] 3.2 Cover the **invalid-token** family in the same file: a token signed with a different
  secret; a structurally invalid token that is not a JWT; and a correctly signed token whose
  expiry is in the past (`signToken({ _id: 'u1' }, { expiresIn: -10 })`). Each must yield status
  `401` with body `{ "message": "Invalid token" }` and `next()` not called.
- [x] 3.3 Cover the **success** case: `"Bearer "` plus a token signed with
  `process.env.TOKEN_SECRET` carrying a `_id` claim. Assert `req.usuarioId` equals exactly
  `decoded._id`, `next()` is called exactly once, and no `401` was written to `res`
  (`res.statusCode` stays `null`).
- [x] 3.4 Cover the **scheme-not-validated** case: `"Token "` plus a correctly signed token still
  authorizes. Assert it as *current observed behaviour*, explicitly **not** as an endorsed
  contract, so that a future scheme-validation change reads as a deliberate, visible behaviour
  change rather than a silent regression. The same applies to `"BearerXYZ "` and to
  `"Bearer  <token>"` with two spaces, which yields `""` and is therefore an **absent-token**
  case.
- [x] 3.5 Enforce design **D3** across every test in the file. Every case — rejection and
  success alike — must go through `await runAuthenticate(...)`; **no test may read the fake `res`
  recording or the `next` counter in the same tick as the invocation**. This satisfies the spec
  MUST and removes the whole class of timing dependence.
  **Correct the rationale in any comment or commit message.** The proposal's claim that
  `jwt.verify` "fires synchronously on the success path and asynchronously on the error path" is
  **false for `jsonwebtoken@9.0.2`** — measured, it fires synchronously on *every* path, because all
  34 `done(...)` call sites in `verify.js` are direct synchronous returns and the file contains no
  `setImmediate`, `nextTick`, `Promise`, `async`, or `await`. The single asynchronous path
  (`verify.js:90-103`) requires the **secret itself to be a callback**, which it is not.
  The await is therefore a **guard, not a flake fix**: it encodes the contract that the middleware
  eventually settles, and it is the only construct that survives a callback-form secret. No
  comment, task note, or commit message may state or imply that a race condition was fixed.
  **Verification:** inspect the file and confirm zero `assert.*` calls that are not preceded by an
  `await runAuthenticate(...)`.
- [x] 3.6 First green-run gate. From `serverBolsa`, run `npm test` and confirm the process exits
  `0` with `test/authenticate.test.js` passing in full and `test/helpers/request.js` reported as a
  passing no-op (task 2.2). This is the gate that proves the wiring in Phase 1 actually executes.

---

## Phase 4: Model Unit Tests

Spec: `backend-unit-tests` → *`Usuario` schema and `comparePassword` unit coverage*, *`Empresa`
schema unit coverage*, *No database connection is required*, *The real native hash implementation
is observable*.

- [x] 4.1 Create `serverBolsa/test/models/Usuario.test.js`. Assert the collection through
  **`Usuario.collection.name` is `usuarios`** (the name is derived from the model registration, not
  a schema option). Assert a complete `{ nombre, email, password }` document produces no
  `validateSync()` error. Assert each of `nombre`, `email`, and `password` is individually
  required — one omitted per case, each yielding a `required` error on exactly that path — and
  that an empty document reports `required` errors for all three.
  **Commit:** `test(server): cover Usuario schema and comparePassword`
- [x] 4.2 In the same file, assert the schema-declared unique index: `Usuario.schema.indexes()`
  returns exactly one entry, keyed on `email` with `unique: true`. Then cover
  `comparePassword` in both directions — `true` for the pre-image of a real native `bcrypt` hash,
  `false` for a different password — with **no database contacted** in either case.
- [x] 4.3 In the same file, state explicitly — as a file comment, per the proposal's risk table —
  that `comparePassword` exercises the **native `bcrypt` addon**, not the declared `bcryptjs`.
  No future reader may assume a pure-JS dependency. The test must import `bcrypt` directly (the
  same module `models/Usuario.js` imports) to build the hash; it MUST NOT substitute, shim, alias,
  or mock it, and MUST NOT use `bcryptjs` to stand in for it.
- [x] 4.4 Create `serverBolsa/test/models/Empresa.test.js`. Assert the collection through
  **`Empresa.collection.name` is `empresas`** — asserted through the model's collection because
  `models/Empresa.js:35` supplies the name as the **third registration argument**, so a schema
  option would be asserting the wrong thing. Assert a complete `{ nombre, cantidad, usuarioId }`
  document validates, and that each of those three paths is individually required.
  **Commit:** `test(server): cover Empresa schema registration and required paths`
- [x] 4.5 In the same file, assert `usuarioId` is an `ObjectId`
  (`Empresa.schema.path('usuarioId').instance`) whose declared reference is `'Usuario'`
  (`Empresa.schema.path('usuarioId').options.ref`), and that a 24-character hexadecimal string
  supplied for `usuarioId` casts to an `ObjectId`. Assert the remaining declared paths —
  `ticker`, `precio`, `capitalInvertido`, `industria`, `valoracion` — are **not** required, and
  that `Empresa.schema.indexes()` is empty.
- [x] 4.6 Enforce the **module-graph constraint** from `design.md` → *Model test design*.
  `models/Empresa.js` references `ref: 'Usuario'` **by model name**, so `models/Usuario.js` must be
  imported **inside `test/models/Empresa.test.js`'s own module graph** before the `usuarioId` path
  is introspected. Do **not** rely on test-file execution order across files — each file runs in a
  fresh module graph, and an unregistered model name would fail to resolve. Verify by running
  `node --test test/models/Empresa.test.js` in isolation from `serverBolsa` and confirming it
  passes on its own.
- [x] 4.7 Satisfy *No database connection is required*. Assert from inside the model tests that
  `mongoose.connection.readyState === 0` (disconnected) and that the validation and
  `comparePassword` assertions still pass at that state. Confirm by inspection that no test file
  under `serverBolsa/test/` imports `index.js` or `websockets/websocketServer.js` — importing
  either opens a listening socket, starts the un-cleared `setInterval`, or initiates an outbound
  request, which would leave the test process alive and violate the bounded-execution requirement.

---

## Phase 5: Suite Verification

Spec: `backend-test-runner` → *Infrastructure-free, bounded test execution*;
`backend-unit-tests` → *Production source remains unmodified*, *The suite is extensible*.

All commands run from `serverBolsa`. This phase produces **evidence, not code** — no commit.

- [x] 5.1 Run `npm test` from `serverBolsa` and record the full output and exit code. Confirm:
  exit `0`; every discovered file passing with zero failures; **no database connection attempt**
  logged or attempted; no in-memory server, Docker service, or container started; no external
  market-data endpoint contacted.
- [x] 5.2 Confirm bounded execution: the process **exits on its own** rather than hanging on an
  open handle, and a warm run completes in roughly **2 seconds or less**. Record the measured
  wall-clock. Run the suite a second time and confirm the pass/fail outcome is identical, which
  satisfies *Repeating the suite does not change the outcome*.
- [x] 5.3 Confirm the lockfile constraint. From `serverBolsa`:
  `& "C:\Program Files\Git\cmd\git.exe" diff --stat -- serverBolsa/package-lock.json` is **empty**.
  Run it a second time with the `--porcelain` flag so a non-empty result is unambiguous.
- [x] 5.4 Confirm the production-source constraint. From `serverBolsa`:
  `& "C:\Program Files\Git\cmd\git.exe" status --porcelain -- .` shows the **only** modified file
  as `package.json`, and every added file lives under `test/`. Any modification to
  `middlewares/`, `models/`, `controllers/`, `routes/`, `websockets/`, or `index.js` is a
  violation.
- [x] 5.5 Confirm extensibility and zero-manifest-churn: adding any further `*.test.js` file under
  `serverBolsa/test/` requires no change to `package.json`, no new dependency, and no production
  edit. Record `devDependencies` as still exactly `nodemon`.
- [x] 5.6 Confirm **zero ESM module mocking**: no test file attempts to substitute an import
  in-process (`mock.module` is `undefined` on this runtime). Every collaborator is supplied as an
  argument or reached through model registration. This also records that controllers and routes
  are deliberately excluded rather than overlooked.

---

## Phase 6: Ghost-Dependency Negative Proof (DESTRUCTIVE — reversible)

Spec: `backend-unit-tests` → *The real native hash implementation is observable*, scenarios
*Pruning the transitively-provided package fails the suite loudly* and *Restoring the package
restores the passing run*. Design: D5. Acceptance criterion #10.

**This phase modifies `package.json` and `node_modules`. It is destructive by design and it must
leave no trace. It runs only after Phase 5 is green, and it is isolated here on purpose so it can
never be confused with the implementation or folded into general verification. It produces no
commit.**

- [x] 6.1 **Preconditions.** Confirm Phase 5 is green (`npm test` exit `0`). From `serverBolsa`,
  capture the baseline with
  `& "C:\Program Files\Git\cmd\git.exe" status --porcelain -- package.json package-lock.json` and
  `& "C:\Program Files\Git\cmd\git.exe" diff --stat -- package.json package-lock.json`, and
  confirm `node_modules/moongose` and `node_modules/bcrypt` both currently exist. Do not proceed if
  the tree is already dirty for these two files.
- [x] 6.2 **Remove** the `"moongose": "^1.0.0"` entry from the `dependencies` block of
  `serverBolsa/package.json`. Change nothing else.
- [x] 6.3 **Regenerate the install** from `serverBolsa` (`npm install`). This step is mandatory and
  is the whole point: npm hoists transitive dependencies, so `bcrypt` and `express-session` sit at
  the **top level** of `node_modules`. Deleting only `node_modules/moongose` leaves both resolvable
  and the suite **still passes** — that is why the earlier wording of this criterion could not be
  reproduced. Regenerating the install is what makes `bcrypt` unreachable in the dependency graph
  and therefore deleted.
- [x] 6.4 **Observe the loud failure.** Run `npm test` from `serverBolsa`. Expected: a
  **non-zero exit** and a module-resolution failure — `ERR_MODULE_NOT_FOUND` — **naming
  `bcrypt`**, raised at import of `models/Usuario.js`. Record the exact error text and exit code.
  Confirm no test was reported as **skipped** in place of the failure: the process refuses to
  start, so the suite cannot mask it.
- [x] 6.5 **Record why it failed.** Confirm `node_modules/moongose` and `node_modules/bcrypt` are
  both now absent. This is the hoisting evidence and it belongs in the verify report alongside the
  failure output.
- [x] 6.6 **Restore** `"moongose": "^1.0.0"` to the `dependencies` block of
  `serverBolsa/package.json` at its original position, then regenerate the install from
  `serverBolsa` (`npm install`). Never edit the manifest to compensate for the failure.
- [x] 6.7 **Confirm the green run is restored.** From `serverBolsa`, `npm test` exits `0` with all
  tests passing and both `node_modules/moongose` and `node_modules/bcrypt` present again.
- [x] 6.8 **Confirm the restore is clean and the change is not permanent.** From `serverBolsa`,
  `& "C:\Program Files\Git\cmd\git.exe" diff --stat -- package.json package-lock.json` matches the
  baseline captured in 6.1 exactly — `package.json` shows only the intended script/engines delta
  and `package-lock.json` is **byte-identical**. If npm rewrote the lockfile during 6.3/6.6,
  restore it from the pre-change commit rather than hand-editing it. This phase must leave **zero
  net diff** attributable to the experiment; record it in the verify report as a destructive,
  reverted experiment, not as a code change.

---

## Phase 7: Planning Metadata Refresh (ARCHIVE SCOPE — do not execute during sdd-apply)

Spec: `backend-test-runner` → *Registered runner commands in `openspec/config.yaml` at archive*.
Design: *Parent decisions*.

**These tasks are owned by `sdd-archive`, not `sdd-apply`.** The spec scopes them explicitly to
archive time. They are listed here so the work is planned, not lost — `sdd-apply` must **skip** this
phase, and `sdd-archive` must execute it. They also fall under the parent decision that
`openspec/` artifacts ship in their own commit, outside the 400-line implementation budget.

- [ ] 7.1 In `openspec/config.yaml`, replace the empty `serverBolsa` value at
  `rules.apply.project_test_commands.serverBolsa` (currently L135, `""` with the comment
  `# no runner yet`) with `"npm test"`.
- [ ] 7.2 In `openspec/config.yaml`, replace the empty `serverBolsa.test` value at
  `rules.verify.project_commands.serverBolsa` (currently L146, `""` with the comment
  `# no runner yet`) with `"npm test"`.
- [ ] 7.3 In `openspec/config.yaml`, refresh the now-stale `testing.projects` entry for
  `serverBolsa`: `test_command` from `null` to `"npm test"`, `test_framework` from `null` to
  `node:test` (Node built-in runner), `test_files_present` from `0` to the real count, the
  `test_layers.unit.available` flag to `true`, and `coverage.available` to reflect that
  `--experimental-test-coverage` exists but is experimental and ungated. Keep the derived
  `testing.test_layers` and `testing.coverage` lists consistent with it. Remove the stale
  `# no runner yet` / `# no test script exists` comments.
- [ ] 7.4 **Do NOT flip `strict_tdd`.** It remains `false` at `openspec/config.yaml:24`, and
  `rules.apply.tdd` remains `false`. Flipping it requires a single repository-root command
  covering **both** `clientBolsa` and `serverBolsa`, and no such command exists — `clientBolsa`
  still has no headless, non-watching `ng test` and there is no root `package.json`. Record this
  as a **conscious re-confirmation** at archive per `openspec/config.yaml:151`, not as an
  oversight. No task in this change flips it.