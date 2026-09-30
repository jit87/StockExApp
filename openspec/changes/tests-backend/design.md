# Design: `tests-backend`

**Change:** `tests-backend` · **Project:** `stockexapp` · **Affected project:** `serverBolsa` only
**Date:** 2026-09-30 · **Phase:** design
**Inputs:** `proposal.md`, `specs/backend-test-runner/spec.md`, `specs/backend-unit-tests/spec.md`
**Delivery:** `single-pr`, 400-line review budget, zero production source changes, zero dependencies.

---

## Technical Approach

Introduce the Node built-in test runner as the backend's test surface and land the first
three unit-test files against the only modules in `serverBolsa` that take their collaborators
as **arguments** rather than as imports: the JWT middleware and the two Mongoose models.

Everything else in this design follows from that single fact:

| Constraint | Consequence |
|---|---|
| `node:test` adds 0 lockfile lines | The 400-line budget survives; any third-party runner does not (measured: Mocha 1,099 / Vitest 1,428 / Jest 4,053). |
| No `mock.module()` on Node 20.11.1 | Only argument-taking modules are testable. This is the **scope boundary**, and it is a consequence, not a preference. |
| No DB, no network | Both models construct and validate at `readyState = 0`. No fixture, no cleanup helper, no container. |
| No production edits | The suite must be built entirely from `test/` plus a `package.json` script. |

**How this maps to the specs.** `backend-test-runner` covers the `package.json` wiring and
the zero-dependency guarantees. `backend-unit-tests` covers the three test files and the
helper contract. This document designs both, and additionally records three findings from
running the real code that the design must accommodate — two of which correct the proposal's
stated rationale without changing its decisions.

---

## Architecture Decisions

### D1 — Introduce `node:test` as the backend runner (wiring, not re-selection)

**Choice.** `"test": "node --test"` plus `"engines": { "node": ">=20.11.1" }` in
`serverBolsa/package.json`. No runner package, no runner config file, no coverage gate.

**Alternatives.** Mocha + Chai + supertest (1,099 lockfile lines), Vitest (1,428), Jest (4,053).

**Rationale.** `openspec/config.yaml:119` requires this to be a first-class design decision, so
it is recorded as one. The selection is already settled by measured evidence and is **not
reopened here**; what this design settles is the *wiring*. Dependency churn is not a style
preference here — it **is** the review budget. Under a fixed `single-pr` policy every
third-party runner exhausts or destroys the 400-line budget in `package-lock.json` alone,
before one line of test exists. `node:test` is the Node binary already installed, so it adds
no `node_modules` surface and no config file, and the narrowed scope (controllers excluded)
removes the exact factor — ESM module mocking — that made the alternatives look comparable.
`engines` is **documentation, not enforcement**: npm only warns `EBADENGINE` without
`engine-strict`, which this change must not enable.

**Accepted cost.** No enforced coverage threshold, `node:assert/strict` instead of Chai
ergonomics, and `mock.module()` stays unavailable — which is precisely why controllers are
deferred rather than covered.

---

### D2 — Helpers are discovered and executed as test files

**Choice.** Keep helpers at `serverBolsa/test/helpers/` and make them **strictly side-effect
free**, so that their accidental execution as a test file is harmless.

**Why this is a real constraint.** Verified empirically on Node 20.11.1: `node --test` does
**not** restrict discovery to `*.test.js`. It treats **every `.js` file under a `test/`
directory** as a test file. A scratch tree with `test/helpers/request.js` containing a bare
`export` produced:

```
# HELPER-EXECUTED-AS-TEST
# Subtest: ...\test\helpers\request.js
ok 2 - ...\test\helpers\request.js
# tests 3      # 2 real tests + 1 no-op file entry
# pass 3
```

Two scoping escapes were tested and both fail on this runtime:

| Attempt | Result |
|---|---|
| `node --test test/**/*.test.js` | `Could not find '...test\**\*.test.js'`, **exit 1** — Node 20.11.1 has no glob support for `--test` (landed in Node 21). |
| `node --test test/models` | Works, but would silently exclude the spec-mandated `test/authenticate.test.js`. |

**Rationale.** The spec fixes both the script (`"test": "node --test"`) and the helper path
(`serverBolsa/test/helpers/`), so neither escape is available to us. Rather than fight the
runner, the design makes the consequence a **design constraint on helper shape**: helpers
export pure factory functions and perform no work at import. This is why the helper module
imports only `jsonwebtoken` and touches no filesystem, network, or connection.

**Residual.** The summary line over-counts by one per helper file, and a future helper with
import-time side effects would execute twice. Both are documented below rather than papered over.

---

### D3 — Negative-token cases await a settled outcome (with a corrected rationale)

**Choice.** Every `authenticate` test goes through a driver that returns a promise resolving
on **whichever happens first**: `res.json()` (rejection path) or `next()` (success path). No
test asserts in the same tick as the invocation.

**Corrected rationale — read this before writing the tests.** The proposal states that
`jwt.verify` "fires **synchronously** on the success path and **asynchronously** on the error
path," and calls this "the single most likely source of a flaky first draft." **That is not
what the installed library does.** Measured against `jsonwebtoken@9.0.2` on Node 20.11.1:

```
valid     -> callback | after-call:true | nextTick:true | immediate:true
malformed -> callback | after-call:true | nextTick:true | immediate:true
expired   -> callback | after-call:true | nextTick:true | immediate:true
```

Against the **real middleware**, immediate and post-tick state are identical on all paths:

```
valid      IMMEDIATE: {"status":null,"body":null,"nextCalls":1,"usuarioId":"u1"}   MATCH: true
malformed  IMMEDIATE: {"status":401,"body":{"message":"Invalid token"},"nextCalls":0} MATCH: true
expired    IMMEDIATE: {"status":401,"body":{"message":"Invalid token"},"nextCalls":0}  MATCH: true
```

The source explains why. Every one of the 34 `done(...)` call sites in
`node_modules/jsonwebtoken/verify.js` is a direct synchronous `return` on the current statement
path; the file contains no `setImmediate`, `nextTick`, `Promise`, `async`, or `await`. The
**only** asynchronous path is when the *secret itself* is a callback function
(`verify.js:90-103`) — and here the secret is the string `process.env.TOKEN_SECRET`.

**So why await anyway?** Three reasons, in order of weight:

1. The spec already mandates it (`backend-unit-tests`, *"Asynchronous observation of the
   middleware's rejection path"*). The design must satisfy a MUST, not relitigate it.
2. It is free when the callback is synchronous, and it is the only construct that survives the
   secret-as-callback path or any future library change. The callback form is **not
   contractually synchronous** — `verify.js:90` proves the same parameter position can be async.
3. A synchronous assert encodes an accident of an implementation detail into a regression test.
   The await encodes the actual contract: *the middleware settles eventually*.

**Net effect on flakiness.** On this runtime the await costs nothing and removes the whole
class of timing dependence. What it does **not** do is fix a flake that does not currently
exist. A future maintainer must not be told a race was fixed when it was guarded against.

---

### D4 — The token factory sets `TOKEN_SECRET` at call time

**Choice.** `signToken()` assigns `process.env.TOKEN_SECRET` inside the factory call, not at
module top level.

**Why.** `serverBolsa/.env` exists and **defines a real `TOKEN_SECRET`**, which
`middlewares/authenticate.js:4` loads via `dotenv.config()` at import time. The middleware reads
the secret at **call** time (`authenticate.js:15`), so a call-time assignment wins
deterministically:

```
BEFORE dotenv, TOKEN_SECRET = undefined
AFTER dotenv,  TOKEN_SECRET = "dnp1*hwk82e...      <- real .env value present
signToken() + authenticate() -> usuarioId = u42 | nextCalls = 1 | status = null
```

Call-time assignment is therefore **order-independent**: it does not depend on whether the
helper or the middleware is imported first, nor on `dotenv`'s non-override behaviour. A
module-top-level assignment would make the suite's correctness depend on ESM import ordering —
a silent, order-sensitive failure mode. Tests are self-contained: they need no `.env`
configuration beyond what `dotenv` already reads.

---

### D5 — The ghost dependency fails loudly by construction (not fixed here)

**Choice.** Record the `bcrypt` / `express-session` situation, assert the native implementation
is what is exercised, and **do not fix the dependency**. Out of scope per the proposal.

**The declared reality.** Neither package is declared; both resolve *only* through
`moongose@1.0.0`, and `bcryptjs` is declared but imported by nothing.

```
packages declaring bcrypt as a dependency:            ["node_modules/moongose"]
packages declaring express-session as a dependency:   ["node_modules/moongose"]
root declares bcrypt? false | express-session? false | moongose? true
```

**Correction — the failure mode is not what the proposal describes.** The proposal's acceptance
criterion says the loud failure is "verified by temporarily renaming it [`moongose`] and
observing the failure." **That does not reproduce.** npm hoists transitive dependencies, so
both packages already sit at the top level:

```
bcrypt           top-level: True
express-session  top-level: True
moongose         top-level: True
```

Deleting only `node_modules/moongose` leaves `bcrypt` resolvable by Node's resolution algorithm
and the suite **still passes**. The spec is already correctly hedged — *"while `bcrypt` is not
otherwise resolvable"* — and the design keeps that hedge.

**The two distinct scenarios, both designed for:**

| Scenario | Mechanism | Expected outcome |
|---|---|---|
| Remove `node_modules/moongose` **only** | `bcrypt` still hoisted and resolvable | Suite **passes**. Correct behaviour; proves hoisting, not soundness. |
| `moongose` leaves `package.json`, then `npm install` / `npm ci` / prune | `node_modules/bcrypt` is no longer reachable in the graph and is deleted | `ERR_MODULE_NOT_FOUND` naming `bcrypt` at import of `models/Usuario.js`; `npm test` exits non-zero. **Loud.** |

The loud failure is **by construction, not by assertion**: the failure is an ESM resolution
error during module import, so the suite cannot skip, pass, or mask it. No test is written to
"detect" this — there is nothing to assert; the process simply refuses to start. The
verification procedure for the second scenario is the one the spec's scenario describes, and it
must be performed by regenerating the install, not by renaming one directory.

---

### D6 — `index.js` stays unimportable; the seam is named, not designed

**Choice.** No production file is modified. `index.js` and `websockets/websocketServer.js`
are excluded from the suite.

**Why.** `index.js:74` calls `main()` at module scope, which calls `mongoose.connect(...)`
(`:53`) and `server.listen(...)` (`:66`) and imports `express-session` (`:8`) and
`configureWebSocket` (`:10`). Importing it in a test would open a socket, initiate a
connection, and start the un-cleared `setInterval` in `websocketServer.js:78` — leaving the
test process alive after the suite finishes, violating the bounded-execution requirement.
`mock.module()` is unavailable to substitute those imports, and refactoring them out is a
production change this change forbids.

**The named follow-up.** Extracting an `app.js` that exports the configured `app` without
connecting or listening, leaving `index.js` to own `connect()` and `listen()`. That single seam
would make `supertest`-shaped integration coverage possible and would unblock the controller
tests. It is estimated at +50–80 lines of production source, exceeds the remaining budget, and
is **deliberately not designed here**. It is recorded as an obligation so it is not silently
dropped.

---

## Data Flow

### Runner wiring

```
  npm test
      │  (sh, literal script — no interpolation, no untrusted input)
      ▼
  node --test                         Node 20.11.1 built-in runner
      │  discovers **/*.js under test/
      ▼
  ┌───────────────────────────────────────────────────────────┐
  │ test/authenticate.test.js      │ test/models/Usuario.test.js │
  │ test/models/Empresa.test.js    │ test/helpers/request.js ⚠   │
  └───────────────────────────────────────────────────────────┘
      │  ⚠ discovered and executed as a test file (D2) —
      │    harmless only because helpers are side-effect free
      ▼
  each test file → fresh module graph, no shared state
      │
      ├─→ middlewares/authenticate.js  (pure (req,res,next); fakes passed as arguments)
      ├─→ models/Usuario.js            (imports native `bcrypt` — see D5)
      └─→ models/Empresa.js            (imports `mongoose` only)
      │
      ▼
  process exits on its own        no socket, no interval, no DB connection
```

### Header segmentation — the two distinct rejection messages

`authenticate.js:7` derives the token as `req.headers['authorization']?.split(' ')[1]`. Every
row below is measured, not inferred:

| `authorization` header | `split(' ')[1]` | Status | Message | `next()` | `usuarioId` |
|---|---|---|---|---|---|
| absent (`undefined`) | — | 401 | `No token provided` | 0 | — |
| `""` | `undefined` | 401 | `No token provided` | 0 | — |
| `"   "` | `""` | 401 | `No token provided` | 0 | — |
| `"Bearer"` | `undefined` | 401 | `No token provided` | 0 | — |
| `"BearerXYZ"` | `undefined` | 401 | `No token provided` | 0 | — |
| `"Bearer  <valid>"` (2 spaces) | `""` | 401 | `No token provided` | 0 | — |
| `"Bearer <valid>"` | token | — | — | 1 | `_id` |
| `"BearerXYZ <valid>"` | token | — | — | 1 | `_id` |
| `"Token <valid>"` | token | — | — | 1 | `_id` |

**Design consequence.** Two rules the suite must keep distinct, because they are different
failures with different meanings: **absent second segment → `No token provided`** (client sent
no credentials), **present but unverifiable → `Invalid token`** (credentials were sent and
failed). The last three rows also record that **the scheme is not validated** — `BearerXYZ` and
`Token` authorize successfully. Per the spec, that is asserted as *current observed behaviour*,
so a future scheme check is a deliberate, visible change rather than a silent regression.

### Sequence diagram — negative-token flow

The flow whose timing the whole design turns on. `T0` is the tick that calls `authenticate`.

```
Test                driver            authenticate        jwt.verify      fake res
 │                    │                    │                  │               │
 │ await run(...)     │                    │                  │               │
 │───────────────────>│                    │                  │               │
 │                    │ new Promise(...)  │                  │               │
 │                    │───────────────────>│                  │               │
 │                    │                    │ split(' ')[1] ──>│ (non-empty)   │
 │                    │                    │ jwt.verify ────>│               │
 │                    │                    │                  │               │
 │                    │                    │        ┌─────────┴──────────┐    │
 │                    │                    │        │ ASYNC-ONLY PATH    │    │
 │                    │                    │        │ secret is function  │    │
 │                    │                    │        │ NOT taken here:    │    │
 │                    │                    │        │ process.env value  │    │
 │                    │                    │        │ is a string        │    │
 │                    │                    │        │ (verify.js:90-103) │    │
 │                    │                    │        └─────────┬──────────┘    │
 │                    │                    │                  │               │
 │                    │                    │      ┌───────────┴───────────┐   │
 │                    │                    │      │ measured on 20.11.1: │   │
 │                    │                    │      │ done() fires SYNC on │   │
 │                    │                    │      │ all 34 sites — before │   │
 │                    │                    │      │ verify() returns      │   │
 │                    │                    │      └───────────┬───────────┘   │
 │                    │                    │                  │               │
 │                    │                    │            err = TokenExpired  │
 │                    │                    │                  │               │
 │                    │                    │  res.status(401).json({...}) ──>│
 │                    │                    │                  │        statusCode=401
 │                    │                    │                  │        body={...}
 │                    │<─────────────────── settle() ──────────────────────  │
 │<─────────────────── resolve {req,res,calls}                             │
 │                    │                  │                   │
 │ assert status 401  │   next() NOT called (calls.next === 0)             │
 │ assert body       │
 ▼
```

**What the diagram is for.** It pins down *why* awaiting is required and *where* it settles.
`next()` is never called on the rejection path, so a driver that waits only on `next()` would
hang forever; a driver that waits only on `res.settled` would hang on the success path. The
driver therefore resolves on **whichever occurs first**, and neither path can deadlock.

---

## File / Module Layout

```
serverBolsa/
├── package.json                          MODIFY   + "test" script, + "engines"      ~+4
├── package-lock.json                     UNTOUCHED  zero new packages                0
├── middlewares/authenticate.js           UNTOUCHED  pure function under test         0
├── models/Usuario.js                     UNTOUCHED  native bcrypt via moongose       0
├── models/Empresa.js                     UNTOUCHED  3rd-arg collection 'empresas'   0
├── index.js                              UNTOUCHED  unimportable (D6)                0
└── test/
    ├── helpers/
    │   └── request.js                    CREATE   fake req/res + token factory    35-45
    ├── authenticate.test.js              CREATE   5 cases + driver usage         85-110
    └── models/
        ├── Usuario.test.js               CREATE   4 cases                          50-65
        └── Empresa.test.js               CREATE   5 cases                          55-70
                                                          total              ~229-294
```

`test/helpers/request.js` is the **only** shared module. No `db.js`, no `fixtures/`, no
cleanup routine — the suite requires none, and the spec forbids them.

---

## Interfaces / Contracts

### Helper module contract — `serverBolsa/test/helpers/request.js`

Four exports. Side-effect free at import (required by D2).

```js
// serverBolsa/test/helpers/request.js
// Pure factory helpers for the serverBolsa suite. No side effects at import time:
// `node --test` executes every .js file under test/ as a test file (see design D2).
import jwt from 'jsonwebtoken';

/** Secret used by the suite. Assigned to process.env on every call (design D4). */
export const TEST_SECRET = 'test-secret';

/**
 * Signs a payload with the real `jsonwebtoken` the middleware uses.
 * Sets process.env.TOKEN_SECRET first so the middleware reads the same secret.
 * @param {object} payload  JWT claims, e.g. { _id: 'u42' }
 * @param {object} [options] jsonwebtoken sign options, e.g. { expiresIn: -10 }
 * @returns {string} an encoded JWT
 */
export function signToken(payload, options) {
  process.env.TOKEN_SECRET = TEST_SECRET;
  return jwt.sign(payload, TEST_SECRET, options);
}

/**
 * Minimal `req` fake. Pass `undefined` to omit the header entirely, which is a
 * distinct case from an empty string.
 * @param {string} [authorization]
 * @returns {{ headers: object, usuarioId?: string }}
 */
export function makeReq(authorization) {
  const req = { headers: {} };
  if (authorization !== undefined) req.headers.authorization = authorization;
  return req;
}

/**
 * Chainable `res` fake. `res.status(401).json(body)` returns the same fake and
 * records both values.
 * @param {() => void} [onSettled] invoked after json() records its payload
 */
export function makeRes(onSettled = () => {}) {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; onSettled(); return this; },
  };
}

/**
 * Drives `authenticate` and resolves once the middleware has settled — on
 * res.json() for a rejection, or on next() for a success. Resolving on whichever
 * happens first is required: waiting only on next() deadlocks the rejection path
 * and waiting only on json() deadlocks the success path.
 * @returns {Promise<{ req: object, res: object, calls: { next: number } }>}
 */
export function runAuthenticate(authenticate, req) {
  const calls = { next: 0 };
  let settle;
  const settled = new Promise((resolve) => { settle = resolve; });
  const res = makeRes(() => settle());
  authenticate(req, res, () => { calls.next += 1; settle(); });
  return settled.then(() => ({ req, res, calls }));
}
```

### How a test consumes it

```js
// serverBolsa/test/authenticate.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import authenticate from '../middlewares/authenticate.js';
import { signToken, makeReq, runAuthenticate } from './helpers/request.js';

describe('middlewares/authenticate', () => {
  // Rejection path — awaits settlement before asserting (design D3).
  test('rejects an absent authorization header as an absent token', async () => {
    const { res, calls } = await runAuthenticate(authenticate, makeReq(undefined));
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'No token provided' });
    assert.equal(calls.next, 0);
  });

  test('rejects a token signed with a different secret as an invalid token', async () => {
    signToken({ _id: 'u1' });                       // sets TOKEN_SECRET
    const foreign = jwt.sign({ _id: 'u1' }, 'a-different-secret');
    const { res, calls } = await runAuthenticate(authenticate, makeReq(`Bearer ${foreign}`));
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'Invalid token' });
    assert.equal(calls.next, 0);
  });

  test('rejects an expired token as an invalid token', async () => {
    const expired = signToken({ _id: 'u1' }, { expiresIn: -10 });
    const { res, calls } = await runAuthenticate(authenticate, makeReq(`Bearer ${expired}`));
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'Invalid token' });
    assert.equal(calls.next, 0);
  });

  // Success path — the SAME driver shape; no branch on outcome.
  test('authorizes a valid token and forwards _id as usuarioId', async () => {
    const { req, res, calls } = await runAuthenticate(
      authenticate, makeReq(`Bearer ${signToken({ _id: 'u42' })}`)
    );
    assert.equal(req.usuarioId, 'u42');             // decoded._id
    assert.equal(calls.next, 1);
    assert.equal(res.statusCode, null);            // nothing rejected
  });
});
```

Every case uses one identical call shape. A test cannot accidentally take the timing-dependent
path, because there is no timing-dependent path to take.

---

## Testing Strategy

| Layer | What to test | Approach |
|---|---|---|
| **Unit — middleware** | absent header · empty/whitespace/`Bearer`/`BearerXYZ` → `No token provided`; malformed · wrong-secret · expired → `Invalid token`; valid → `usuarioId === decoded._id` + `next()` once; non-`Bearer` scheme authorizes | `node:test` + `node:assert/strict`; plain `req`/`res`/`next` fakes passed as arguments; **no mocking, no DB, no network** |
| **Unit — models** | `Usuario`: collection `usuarios`, 3 required paths, unique index on `email`, `comparePassword` accept/reject. `Empresa`: collection `empresas`, 3 required paths, `usuarioId` ObjectId + `ref: 'Usuario'`, all other paths optional, no indexes | construct + `validateSync()` at `readyState = 0`; schema introspection for indexes and path options; **no mocking** |
| **Integration** | — | **Not in this change.** Requires the `app.js` seam (D6). |
| **E2E** | — | **Not in this change.** No runner support without a seam. |
| **Coverage** | — | Not gated. `--experimental-test-coverage` is experimental and reports rather than enforces. |

### Model test design

Both models are tested by **constructing documents and validating them synchronously** while
`mongoose.connection.readyState === 0`. Nothing is persisted, no cursor is opened, and no
connection is initiated — verified: `readyState = 0`, `mongoose.connection.client === undefined`.

**`Usuario`** — `models/Usuario.js` registers via `mongoose.model('Usuario', userSchema)`, so
the collection name is derived from the model name:

| Assertion | Mechanism | Measured value |
|---|---|---|
| collection is `usuarios` | `Usuario.collection.name` | `usuarios` |
| exactly one index, unique on `email` | `Usuario.schema.indexes()` | `[[{"email":1},{"unique":true,"background":true}]]` |
| complete document valid | `new Usuario({...}).validateSync()` | no error |
| each of `nombre`/`email`/`password` required | one omitted per case | `required` error on exactly that path |
| `comparePassword` accepts | hash pre-image | `true` |
| `comparePassword` rejects | different password | `false` |

**`Empresa`** — `models/Empresa.js:35` passes an **explicit third argument**
(`model('Empresa', EmpresaSchema, 'empresas')`), with a Spanish comment explaining it exists to
stop Mongoose pluralising to `accions`. The collection name is therefore a property of the
*registration*, not of the schema, and must be asserted through `Empresa.collection.name` —
asserting a schema option would be asserting the wrong thing.

| Assertion | Mechanism | Measured value |
|---|---|---|
| collection is `empresas` | `Empresa.collection.name` | `empresas` |
| no schema indexes | `Empresa.schema.indexes()` | `[]` |
| complete document valid | `new Empresa({...}).validateSync()` | no error |
| `nombre`/`cantidad`/`usuarioId` required | one omitted per case | `required` on exactly that path |
| `usuarioId` is `ObjectId` | `Empresa.schema.path('usuarioId').instance` | `ObjectId` |
| `usuarioId` refs `Usuario` | `Empresa.schema.path('usuarioId').options.ref` | `Usuario` |
| 24-hex string casts | pass `"507f1f77bcf86cd799439011"` | `usuarioId.constructor.name === 'ObjectId'` |
| `ticker`/`precio`/`capitalInvertido`/`industria`/`valoracion` optional | minimal document | no error |

**Ordering constraint on the suite.** `test/models/Empresa.test.js` references `ref: 'Usuario'`
by model name. `models/Usuario.js` must therefore be imported in the same module graph before
the `usuarioId` path is introspected, or Mongoose resolves an unregistered model name. Keep the
`Usuario` import inside the `Empresa` test file (or import `models/Usuario.js` for its side
effect) rather than relying on test-file execution order across files.

---

## Threat Matrix

**Not applicable**, with reasons per row rather than a blanket claim.

| Boundary | Applicability | Reason |
|---|---|---|
| Documentation-like paths | **N/A** | No `requirements.txt`, `CMakeLists.txt`, executable Markdown, or path-classification logic is added. The change adds one `.json` script entry and `.js` test files. |
| Git repository selection | **N/A** | No `git -C`, no relative-vs-absolute repo selection, no VCS invocation. |
| Commit state | **N/A** | No staging, no `commit -a`, no index manipulation. |
| Push state | **N/A** | No push, no tracking-branch or refspec resolution. |
| PR commands | **N/A** | No PR creation or `--head` composition. |

**Two near-miss boundaries, addressed in the design rather than dismissed:**

- **Shell command.** `"test": "node --test"` is executed by npm through a shell. It is a **fixed
  literal with no interpolation and no untrusted input**, and it neither reads nor selects paths
  from user-supplied data. Discovery is constrained to the package root. No adversarial case
  applies, so no test is planned.
- **Native binary loading.** The suite loads the `bcrypt` native addon. This is a real binary
  boundary, but the change neither classifies nor executes a path based on untrusted input — the
  resolution failure mode is fully specified in D5, and it is loud by construction.

---

## Migration / Rollout

No migration required. No data migration, no feature flag, no phased rollout, no configuration
change outside `package.json`.

**Rollback.** Delete `serverBolsa/test/` and remove the `test` script and `engines` block.
`package-lock.json` needs no revert because it was never changed. `npm run dev` is unaffected
throughout.

---

## Budget Impact

| Item | Lines |
|---|---|
| `package.json` — `test` script + `engines` | ~+4 |
| `test/helpers/request.js` | 35–45 |
| `test/authenticate.test.js` | 85–110 |
| `test/models/Usuario.test.js` | 50–65 |
| `test/models/Empresa.test.js` | 55–70 |
| `package-lock.json` | **0** |
| **Total** | **~229–294 / 400** |

The design adds nothing to that forecast. The only line-count risk is D2's residual: if a
helper later gains import-time side effects it must move out of `test/`, and if the suite ever
outgrows bare discovery the script becomes `node --test test test/models`. Neither is in scope.

---

## Open Questions

No blocking questions. Two items are recorded as constraints rather than decisions, and both
require no new authority:

- **`bcrypt` vs `bcryptjs`, and `express-session` vs `moongose`.** Explicitly out of scope. This
  change makes the mismatch **detectable**, not fixed. It should be carried as a tracked issue
  so it is not lost.
- **`engines.node` as documentation only.** The README claims Node 14 while the machine runs
  20.11.1. Because `engine-strict` is deliberately not enabled, a developer on Node 18 may see
  different discovery behaviour and a green-looking run may not mean what it means here.
  Unpinned runtimes remain the largest soft risk in this design.

`strict_tdd` stays `false`, re-confirmed by the spec: flipping it needs one repository-root
command covering both projects, and `clientBolsa` has no headless `ng test`. Revisited at
archive per `openspec/config.yaml:151`.

---

## Key Learnings

1. `jsonwebtoken@9.0.2`'s callback-form `verify` invokes its callback **synchronously on every path**, including errors — all 34 `done()` sites in `verify.js` are direct synchronous returns, and the only async path requires the secret itself to be a callback.
2. On Node 20.11.1, `node --test` discovers **every `.js` file under a `test/` directory**, not only `*.test.js`, so helper modules are executed as test files unless they are side-effect free.
3. Node 20.11.1 has **no glob support** for `node --test` — a pattern argument is treated as a literal path, producing `Could not find ...` and exit code 1.
4. npm hoisting means `bcrypt` and `express-session` sit at the top level of `node_modules`, so deleting only `moongose` leaves them resolvable; the loud failure requires regenerating the install.
5. A module that reads configuration at *call* time (`authenticate.js:15`) makes call-time test-fixture assignment order-independent, avoiding a silent ESM import-order dependency.

---

## Parent decisions (recorded after the design phase, 2026-09-30)

**Planning artifacts are excluded from the 400-line review budget.** The budget measures the
implementation diff only; `openspec/` planning ships in its own commit. This confirms the
proposal's stated assumption 1, on which its ~229–294 line size forecast was built.

**Acceptance criterion #10 was reworded in `proposal.md`.** The original wording — "verified by
temporarily renaming [`moongose`] and observing the failure" — cannot be reproduced, because npm
hoisting keeps `bcrypt` and `express-session` resolvable at the top level of `node_modules`. The
criterion now specifies removing `moongose` from `package.json` **and** regenerating the install.
The matching spec scenario (`backend-unit-tests`, "Pruning the transitively-provided package
fails the suite loudly") already carried the correct hedge — "while `bcrypt` is not otherwise
resolvable" — and was deliberately **not** modified.

**Prerequisite for apply:** an extensionless, zero-byte file at `C:\WINDOWS\system32\git` shadows
the real `git.exe` on `PATH` in this environment. Plain `git` returns **empty output without
erroring**. Any apply-phase check that asserts repository state MUST invoke
`C:\Program Files\Git\cmd\git.exe` by full path. A silently-empty result is not a passing check.
