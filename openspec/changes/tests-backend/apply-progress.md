# Apply Progress: tests-backend

**Change:** `tests-backend` · **Project:** `stockexapp` · **Affected project:** `serverBolsa` only
**Phase:** apply · **Mode:** Standard (`strict_tdd: false`, not flipped) · **Date:** 2026-09-30
**Delivery:** `single-pr` · 400-line budget · **Node** v20.11.1 · **npm** 10.9.1 · win32
**Executor:** `sdd-apply` (paths-injected) · **Phases executed:** 1–6 · **Phase 7 NOT executed** (archive scope)

---

## Status

**34 / 34 tasks complete** across Phases 1–6. Phase 7 (4 tasks) deliberately untouched and
still `- [ ]` in `tasks.md`, per `backend-test-runner` → *Registered runner commands in
`openspec/config.yaml` at archive*.

**One work unit could NOT be closed: the commits.** All five work units are implemented,
verified, and staged, but **zero commits exist** because the repository's `pre-commit` hook
cannot be satisfied in this environment. See *Blocker* below. This is reported, not worked
around.

---

## Completed Tasks

| Phase | Tasks | State |
|-------|-------|-------|
| 1 · Runner wiring | 1.1, 1.2, 1.3 | `[x]` |
| 2 · Shared helpers | 2.1, 2.2, 2.3, 2.4 | `[x]` |
| 3 · Middleware tests | 3.1, 3.2, 3.3, 3.4, 3.5, 3.6 | `[x]` |
| 4 · Model tests | 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7 | `[x]` |
| 5 · Suite verification | 5.1, 5.2, 5.3, 5.4, 5.5, 5.6 | `[x]` |
| 6 · Ghost-dependency proof | 6.1 – 6.8 | `[x]` (destructive, fully reverted) |
| 7 · Planning metadata | 7.1 – 7.4 | `[ ]` **archive scope — not executed** |

---

## Files Changed

| File | Action | What was done |
|------|--------|---------------|
| `serverBolsa/package.json` | Modified (+5 / −1) | `"test": "node --test"` after `"dev"`; top-level `"engines": { "node": ">=20.11.1" }`. Nothing else touched. |
| `serverBolsa/test/helpers/request.js` | Created (67) | `TEST_SECRET`, `signToken`, `makeReq`, `makeRes`, `runAuthenticate`. Side-effect free at import. |
| `serverBolsa/test/authenticate.test.js` | Created (113) | 13 tests: 6 absent-token, 3 invalid-token, 3 valid/scheme-not-validated, 1 message-distinctness. |
| `serverBolsa/test/models/Usuario.test.js` | Created (64) | 7 tests: collection, complete doc, 3 required paths, empty doc, unique index, `comparePassword` both ways, `readyState 0`. |
| `serverBolsa/test/models/Empresa.test.js` | Created (67) | 8 tests: collection via 3rd-arg registration, complete doc, 3 required paths, `usuarioId` ObjectId + `ref`, hex cast, optional paths, no indexes, `readyState 0`. |
| `serverBolsa/package-lock.json` | **Untouched** | SHA256 `792879FB…` identical to the pre-session state. |
| `openspec/changes/tests-backend/tasks.md` | Modified | 34 checkboxes flipped to `[x]`. |

**Zero production source edits.** `middlewares/`, `models/`, `controllers/`, `routes/`,
`websockets/`, `index.js` are byte-identical. `clientBolsa/` untouched.

---

## Work Unit Evidence

| # | Work unit | Focused test command → result | Runtime harness → result | Rollback boundary |
|---|-----------|-------------------------------|--------------------------|-------------------|
| 1 | Runner wiring | `node -e "import('./package.json',{with:{type:'json'}})…"` → `scripts: {"dev":"nodemon .","test":"node --test"}`, `engines: {"node":">=20.11.1"}`, `devDependencies keys: ["nodemon"]` (count 1), `type: module`, `main: index.js`, 12 dependencies. No runner config file anywhere under `serverBolsa`; no `.npmrc` at either level. | `npm test` from `serverBolsa` → **exit 0**, empty-suite discovery baseline: `1..0`, `# tests 0`, `# pass 0`, `# fail 0`, `# skipped 0`, `duration_ms 6.6644`. | Revert the `scripts`/`engines` addition in `package.json`. No lockfile revert — none was written. |
| 2 | Shared helpers | `node --test test/helpers/request.js` → **exit 0**, `# tests 1`, `# pass 1`, `# fail 0`. Exactly **one** `process.env.TOKEN_SECRET =` assignment, at line 19, inside `signToken`. `test/helpers/` contains **only** `request.js` (no `db.js`, no `fixtures/`, no cleanup, no mocking facility). | `npm test` → `ok 2 - …\test\helpers\request.js`, a **passing no-op entry**; never a failure, never an executed assertion. D2 confirmed empirically. | Delete `test/helpers/request.js`; the two test files that import it then break and revert with units 3–5. |
| 3 | Middleware coverage | `npm test` after adding the file → **exit 0**, `# tests 14`, `# pass 14`, `# fail 0`. | Real `middlewares/authenticate.js` invoked with real `jsonwebtoken@9.0.2` and plain `req`/`res`/`next` fakes. No DB, no network, no mocking. | Delete `test/authenticate.test.js`. `middlewares/authenticate.js` untouched; `npm run dev` unaffected. |
| 4 | `Usuario` model | `node --test test/models/Usuario.test.js` (isolated) → **exit 0**, `# tests 7`, `# pass 7`, `# fail 0`. | Real native `bcrypt@5.1.1` addon loaded and hashed (`comparePassword` test, 176 ms) at `mongoose.connection.readyState === 0`, `client === undefined`. | Delete `test/models/Usuario.test.js`. `models/Usuario.js` untouched. `test/models/Empresa.test.js` keeps its own `Usuario` import and does not depend on this file existing. |
| 5 | `Empresa` model | `node --test test/models/Empresa.test.js` (isolated, task 4.6) → **exit 0**, `# tests 8`, `# pass 8`, `# fail 0`. | Real `mongoose@8` schema introspection at `readyState 0`. Passes standalone, proving the in-file `Usuario` import satisfies `ref: 'Usuario'` without relying on cross-file order. | Delete `test/models/Empresa.test.js`. `models/Empresa.js` untouched. |
| — | Suite verification (5.1–5.6) | `npm test` → **exit 0** (evidence below). | Evidence only — no code, no commit. | N/A. |
| — | Ghost-dependency proof (6.1–6.8) | Destructive scenario itself → **exit 1** with `ERR_MODULE_NOT_FOUND` naming `bcrypt`. | The experiment: remove `moongose`, `npm install`, observe loud failure, restore, observe green again. | Every step inverted by 6.6–6.8. Net diff verified zero. |

---

## Phase 5 — Suite Verification Evidence

**5.1 Full run, verbatim summary** (from `serverBolsa`):

```
> serverbolsa@1.0.0 test
> node --test

TAP version 13
ok 1 - middlewares/authenticate
ok 2 - …\test\helpers\request.js
ok 3 - models/Empresa
ok 4 - models/Usuario
1..4
# tests 29
# suites 6
# pass 29
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 776.729
```

Exit code **0**. No database connection attempt logged or made. No in-memory server,
Docker service, or container started. No external market-data endpoint contacted. No
import of `index.js` or `websockets/websocketServer.js` anywhere in `test/` (task 4.7
verified by inspection — the only textual matches for those names are inside Spanish
comments stating they are deliberately not imported).

**5.2 Bounded execution.** The process exits on its own in every run; no open handle is
left behind. Measured wall-clock, npm included:

| Run | Wall-clock | Runner-reported | Outcome |
|-----|-----------:|-----------------|---------|
| 1 (warm) | 1.598 s | 739.96 ms | exit 0, 29/29 pass |
| 2 (warm) | 1.534 s | 767.27 ms | exit 0, 29/29 pass |
| final | — | 776.73 ms | exit 0, 29/29 pass |

Both warm runs are ≈1.5 s, inside the "roughly 2 seconds or less" budget, and the
pass/fail outcome is identical across runs — satisfying *Repeating the suite does not
change the outcome*.

**5.3 Lockfile.** Three independent checks, all empty:
`git diff --stat -- package-lock.json` → empty · `git status --porcelain -- package-lock.json`
→ empty · `git diff --quiet -- package-lock.json` → **exit 0** (content identical).
Content proof: `git hash-object --path=package-lock.json package-lock.json` =
`f9e84df306b35477d70b13fb88dcd5adee6ebfdf` = `git rev-parse HEAD:serverBolsa/package-lock.json`.

*Deviation from task wording:* task 5.3 asks for `git diff --porcelain` as the
unambiguous second check. **`git diff --porcelain` is not a valid git option** — it
errors with `error: invalid option: --porcelain` (that flag exists on `git status` and
`git log`, not `git diff`). The intent was satisfied with `git status --porcelain` and
`git diff --numstat` instead. This is a task-text error, not an implementation deviation.

**5.4 Production source.** `git status --porcelain -- .` from `serverBolsa`:

```
M  serverBolsa/package.json
A  serverBolsa/test/authenticate.test.js
A  serverBolsa/test/helpers/request.js
A  serverBolsa/test/models/Empresa.test.js
A  serverBolsa/test/models/Usuario.test.js
```

Only `package.json` is modified; every added file lives under `test/`. Filtered check for
any entry outside `package.json` / `test/`: **none**.

**5.5 Extensibility / zero manifest churn.** `devDependencies` = `{"nodemon":"^3.1.4"}`,
exactly one key. A further `*.test.js` under `test/` needs no `package.json` change, no
dependency, and no production edit — demonstrated by the fact that all three new test
files were picked up by the unchanged `node --test` script.

**5.6 Zero ESM module mocking.** `typeof mock.module` on this runtime is `undefined`
and `Object.keys(mock)` is empty. No test substitutes an import; every collaborator is
passed as an argument or reached through model registration. Controllers and routes are
**deliberately excluded**, not overlooked — they would each need a substituted import,
which this runtime cannot provide.

---

## Phase 6 — Ghost-Dependency Negative Proof (destructive, reverted)

**6.1 Baseline captured before any mutation.** Phase 5 green (exit 0, 29/29, 0 skipped).
`git status --porcelain -- package.json package-lock.json` → `M  serverBolsa/package.json`
only. `git diff HEAD --stat` → `package.json | 6 +++++-` / `1 file changed, 5 insertions(+), 1 deletion(-)`.
`node_modules/moongose` → present. `node_modules/bcrypt` → present.
SHA256 baseline: `package.json` = `DA0E53E9A2BB5BAAF0AC45A6056A147611C245B4CF39E4E3749A9CAD6C38580C`,
`package-lock.json` = `792879FBA5AA63EF1E72FB433CE2AC428C7897DDF6A7F04E7BDF3433DCE5439C`.

**6.2–6.3** `"moongose": "^1.0.0"` removed from `dependencies`; `npm install` regenerated the
install → `removed 243 packages, and audited 268 packages in 12s`, exit 0.

**6.4 Loud failure observed.** `npm test` → **exit code 1**:

```
# Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'bcrypt' imported from
#   C:\Users\jigna\ProyectosPrueba\StockExApp\serverBolsa\models\Usuario.js
#   at packageResolve (node:internal/modules/esm/resolve:853:9)
#   code: 'ERR_MODULE_NOT_FOUND'
# }
not ok 3 - …\test\models\Empresa.test.js
not ok 4 - …\test\models\Usuario.test.js
# tests 16
# pass 14
# fail 2
# skipped 0
```

The failure **names `bcrypt`** and is raised at import of `models/Usuario.js`.
**`# skipped 0`** — no test was skipped in place of the failure.

*Precision correction to the design:* the design predicted the process "refuses to start".
What actually happens is that Node's runner isolates the failure per file: the two
model test files report `not ok` with a per-file `exitCode: 1`, while the middleware
suite and the helper no-op still pass (14 pass). The observable contract the spec requires
is unchanged — non-zero exit, names `bcrypt`, nothing skipped — but the failure is
per-file, not process-wide.

**6.5 Hoisting evidence.** `node_modules/moongose` → absent. `node_modules/bcrypt` →
**absent**. This is the proof that npm hoisting is what makes the failure reproducible:
`npm install` after removing `moongose` from the manifest deletes `bcrypt`, whereas
deleting only `node_modules/moongose` would have left it resolvable at the top level.

**6.6 Restore.** `"moongose": "^1.0.0"` reinserted at its original position, `npm install`
→ exit 0, `moongose` and `bcrypt` both present again. `package.json` SHA256 matched the
6.1 baseline exactly at this point.

**6.7 Green run restored.** `npm test` → **exit 0**, `# tests 29`, `# pass 29`,
`# fail 0`, `# skipped 0`.

**6.8 Restore is clean — with one finding that had to be worked through.** As task 6.8
anticipated, **npm rewrote `package-lock.json`** during 6.3/6.6
(`package-lock.json | 678 +++---`, 402 insertions / 282 deletions). Per 6.8 the lockfile
was restored from the pre-change commit, **not** hand-edited:

- `git checkout HEAD -- package-lock.json` → git reported the file **clean**, but
  `core.autocrlf = true` had rewritten it with **CRLF** (6,343 CRLF vs the baseline's
  6,343 bare LF), so the on-disk bytes were *not* byte-identical even though the content
  was.
- The exact pre-experiment bytes were then restored from the 6.1 baseline copy.
  Final: `package-lock.json` SHA256 = `792879FBA5AA63EF1E72FB433CE2AC428C7897DDF6A7F04E7BDF3433DCE5439C`
  — **byte-identical**, and `git diff HEAD --stat` again shows only
  `package.json | 6 +++++-`.

**Zero net diff attributable to the experiment is confirmed.** This phase produced **no
commit and left no trace** in either manifest.

---

## Blocker — the work-unit commits could not be created

**Status: unresolved. Reported, not worked around.**

`.git/hooks/pre-commit` is:

```bash
# ======== GGA START ========
# Gentleman Guardian Angel - Code Review
gga run || exit 1
# ======== GGA END ========
```

`git commit -F <msg>` fails, exit 1:

```
 Gentleman Guardian Angel v2.10.1
 Provider-agnostic code review using AI
❌ Claude CLI not found
Install Claude Code CLI:
  https://claude.ai/code
```

Two independent environment faults, neither of which this change may fix:

1. **`claude` is not installed** (`Get-Command claude` → not found; `npx --no-install claude` → `npm error could not determine executable to run`). Installing it is a network install plus an authenticated subscription — a user decision, not an executor decision.
2. **`C:\WINDOWS\system32\git` shadows the real `git.exe`.** The `gga` PowerShell shim resolves git via `Get-Command git`, picks up the zero-byte shadow, and fails with `Git Bash not found under 'C:\WINDOWS'`. This is the environment warning already recorded in `design.md`; it breaks the shim, not just direct git invocations.

I did **not** use `--no-verify`, did not modify the hook, and did not touch git config.
**No commit was created for any work unit.** All five units are implemented, verified, and
**staged**, so they are one `git commit` away each once the hook is satisfiable:

```powershell
git -C C:\Users\jigna\ProyectosPrueba\StockExApp commit -m "chore(server): wire node --test as the backend test runner" -- serverBolsa/package.json
git -C … commit -m "test(server): add side-effect-free request and token test helpers" -- serverBolsa/test/helpers/request.js
git -C … commit -m "test(server): cover jwt authenticate middleware branches"    -- serverBolsa/test/authenticate.test.js
git -C … commit -m "test(server): cover Usuario schema and comparePassword"       -- serverBolsa/test/models/Usuario.test.js
git -C … commit -m "test(server): cover Empresa schema registration and required paths" -- serverBolsa/test/models/Empresa.test.js
```

`openspec/` is **untracked and uncommitted** (`?? openspec/`, along with pre-existing
`?? .atl/` and `?? .gga`). Committing the whole untracked tree would sweep in artifacts
belonging to other changes, so that call was left to the maintainer.

---

## Deviations from Design

1. **Authored line count: 317, forecast 229–294.** Over the forecast by 23 lines, well
   inside the 400 budget (83 lines of headroom). Breakdown vs forecast: `package.json`
   6 (forecast 4 — the trailing comma on `"dev"` counts as +1/−1), `authenticate.test.js`
   113 (forecast 85–110), `request.js` 67 (forecast 35–45), `Empresa.test.js` 67
   (in range), `Usuario.test.js` 64 (in range). The overage is Spanish comment and JSDoc
   prose, which the `work-unit-commits` skill forbids deleting to fit a budget. **No
   `size:exception` is required** and none was requested.
2. **Task 5.3's `--porcelain` flag is invalid for `git diff`** (see Phase 5 evidence).
   Substituted `git status --porcelain` and `git diff --numstat`.
3. **Phase 6 failure is per-file, not process-wide** (see 6.4). The spec contract holds.
4. **npm rewrote the lockfile** during the destructive experiment; 6.8's documented
   recovery path was used (restore from the pre-change commit). Also recorded: on this
   machine **any** `npm install` in `serverBolsa` dirties `package-lock.json`, so future
   work must re-check the lockfile after any install.
5. **The spec scenario for a chainable fake `res`** ("a test chains `res.status(401).json(body)`")
   is satisfied through the real middleware, which performs exactly that chain against the
   fake; no separate test was written, because the middleware's own chain is the stronger proof.
6. **The five commit messages in `tasks.md` are authored but unapplied**, pending the hook.

## Issues Found

1. **The `pre-commit` hook makes this repository uncommittable on this machine** (missing `claude` CLI). This blocks *any* commit, not just this change's.
2. **`C:\WINDOWS\system32\git` shadows `git.exe`**, breaking both plain `git` and the `gga` shim. Confirmed real git is 2.45.2 at `C:\Program Files\Git\cmd\git.exe`. Every assertion in this document used the full path.
3. **`npm install` dirties `package-lock.json`** in `serverBolsa` (npm normalises the lockfile). This is what forced the 6.8 restore.
4. **`core.autocrlf = true` with no `.gitattributes`** makes git flag LF working-tree copies as `needs update`. This initially made a byte-identical lockfile look modified in `git status`; `git update-index --refresh` reconciled the stat cache and the file now reads clean.
5. **`bcrypt` / `express-session` remain undeclared** ghost dependencies resolving only through `moongose@1.0.0`, while the declared `bcryptjs` is imported by nothing. **Out of scope, not fixed** — this change makes it *detectable*, which Phase 6 now demonstrates concretely.
6. **Node remains unpinned.** `engines.node` is documentation only, so a developer on Node 18 may see different `node --test` discovery behaviour and a green-looking run would not mean what it means here.

## Remaining Tasks

- [ ] **7.1** `rules.apply.project_test_commands.serverBolsa` → `"npm test"` (archive)
- [ ] 7.2 `rules.verify.project_commands.serverBolsa.test` → `"npm test"` (archive)
- [ ] 7.3 refresh the stale `testing.projects.serverBolsa` detection block (archive)
- [ ] 7.4 consciously re-confirm `strict_tdd: false` (archive)
- [ ] **Create the five work-unit commits** once the pre-commit hook is satisfiable.

## Workload / PR Boundary

- Mode: `single-pr` · Chain strategy: `pending` (not needed) · `size:exception`: **not required**
- Authored changed lines: **317** of 400 (planning artifacts in `openspec/` excluded per the recorded parent decision)
- Boundary: starts from a clean `serverBolsa` with no test script; ends with `npm test` green, 29 tests, 4 test files, zero new dependencies, zero production-source edits
- Committed: **0 of 5** — blocked by the pre-commit hook. Staged: **5 of 5**.

## Notes on Enforced Design Constraints

- **D2 (helpers executed as test files)** — verified: `ok 2 - …\test\helpers\request.js` appears as a passing no-op entry.
- **D3 (await the negative cases)** — every one of the 13 middleware tests goes through `await runAuthenticate(...)`; the 26 `assert.*` calls (lines 33–111) are all preceded by their await in the same test. Recorded **as a contract guard, never as a race fix**, in both the test file and the helper JSDoc. The proposal's "sync on success, async on error" claim is false for `jsonwebtoken@9.0.2` and is not repeated anywhere in the code.
- **D4 (`TOKEN_SECRET` at call time)** — exactly one `process.env.TOKEN_SECRET =` assignment, inside `signToken`, on every call. Ordering is independent of `dotenv` and of import order.
- **Constraint 4 (`Usuario` in the same module graph)** — `test/models/Empresa.test.js` imports `../../models/Usuario.js` itself and passes in isolation.
