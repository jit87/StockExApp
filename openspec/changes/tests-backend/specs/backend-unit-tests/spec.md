# backend-unit-tests Specification

**Change:** `tests-backend`
**Project:** `stockexapp`
**Owning project:** `serverBolsa`
**Type:** New capability (no existing spec in `openspec/specs/`)
**Date:** 2026-09-30
**Phase:** spec
**Input:** `openspec/changes/tests-backend/proposal.md`

## Purpose

This capability specifies the automated unit coverage `serverBolsa` gains over its JWT auth
middleware and its `Usuario` and `Empresa` schema definitions, including
`comparePassword`. It is the capability that **grows**: controller, route, and integration
coverage land here in follow-up changes without altering the runner or adding a dependency.

Every in-scope target is testable only because it takes its collaborators as **arguments**
rather than as imports. `middlewares/authenticate.js` is a pure `(req, res, next)` function
that receives fakes directly; both Mongoose models construct and validate in isolation with
the connection in state `0` (disconnected). That is what makes the suite free of a database,
free of network, and free of any mocking library — and it is why the runner needs none.

Scope note: the runnable command that executes this suite is specified by
`backend-test-runner`.

## Requirements

### Requirement: JWT auth middleware unit coverage in `serverBolsa`

`serverBolsa` MUST provide unit tests for `middlewares/authenticate.js` that require no
mocking library, no database, and no network, by passing plain fakes for `req`, `res`, and
`next` as arguments. The coverage MUST include an absent authorization header, a header
carrying no token segment, an unverifiable token, an expired token, and a valid token.

The middleware derives its token as the second whitespace-separated segment of the
`authorization` header. Consequently a header with no second segment — an empty value, a
bare `Bearer`, a whitespace-only value, or a value containing no space at all — is rejected
as an absent token, while a second segment that is present but unverifiable is rejected as an
invalid token. `serverBolsa` tests MUST assert these two rejection messages as distinct.

#### Scenario: An absent authorization header is rejected as an absent token

- GIVEN a `req` fake whose `headers` object has no `authorization` key
- WHEN `authenticate` is invoked with that `req`, a recording `res` fake, and a `next` spy
- THEN `res` receives status `401` with body `{ "message": "No token provided" }`
- AND `next` is not called

#### Scenario: A malformed header with no token segment is rejected as an absent token

- GIVEN a `req` fake whose `authorization` header yields no second whitespace-separated
  segment, for example `""`, `"   "`, `"Bearer"`, or `"BearerXYZ"`
- WHEN `authenticate` is invoked
- THEN `res` receives status `401` with body `{ "message": "No token provided" }`
- AND `next` is not called

#### Scenario: A token signed with a different secret is rejected as an invalid token

- GIVEN a `req` fake whose `authorization` header is `"Bearer "` followed by a token signed
  with a secret other than `process.env.TOKEN_SECRET`
- WHEN `authenticate` is invoked
- THEN `res` receives status `401` with body `{ "message": "Invalid token" }`
- AND `next` is not called

#### Scenario: A structurally invalid token is rejected as an invalid token

- GIVEN a `req` fake whose `authorization` header is `"Bearer "` followed by a string that is
  not a JWT
- WHEN `authenticate` is invoked
- THEN `res` receives status `401` with body `{ "message": "Invalid token" }`
- AND `next` is not called

#### Scenario: An expired token is rejected as an invalid token

- GIVEN a `req` fake whose `authorization` header is `"Bearer "` followed by a correctly
  signed token whose expiry is in the past
- WHEN `authenticate` is invoked
- THEN `res` receives status `401` with body `{ "message": "Invalid token" }`
- AND `next` is not called

#### Scenario: A valid token authorizes the request

- GIVEN a `req` fake whose `authorization` header is `"Bearer "` followed by a token signed
  with `process.env.TOKEN_SECRET` whose payload carries a `_id` claim
- WHEN `authenticate` is invoked
- THEN `req.usuarioId` is set to exactly the `decoded._id` value
- AND `next` is called exactly once
- AND no `401` status is written to `res`

#### Scenario: The scheme prefix is not part of the accepted-token contract

- GIVEN a `req` fake whose `authorization` header uses a scheme other than `Bearer` — for
  example `"Token "` — followed by a correctly signed token carrying a `_id` claim
- WHEN `authenticate` is invoked
- THEN the request is authorized: `req.usuarioId` is set to `decoded._id` and `next` is called
- AND this is recorded as current observed behaviour, not as an endorsed contract, so that
  any future change introducing scheme validation is a deliberate, visible behaviour change

### Requirement: Asynchronous observation of the middleware's rejection path in `serverBolsa`

`jsonwebtoken`'s callback-form verification is contractually asynchronous on its error
path, so `serverBolsa` tests MUST NOT assert the middleware's rejection outcomes in the same
tick as the invocation. Every rejection scenario MUST first await the fake response — by
resolving a promise from the fake, or by polling the recording — and only then assert. The
`serverBolsa` suite MUST be free of assertions whose correctness depends on `jsonwebtoken`
completing within a fixed number of synchronous ticks.

#### Scenario: Rejection scenarios await before asserting

- GIVEN a rejection scenario for an invalid-signature, structurally invalid, or expired token
- WHEN the scenario is written
- THEN it awaits the fake `res` recording before asserting the `401` status and the rejection
  message
- AND it does not read the recording synchronously immediately after the invocation

#### Scenario: Repeating the suite does not change the outcome

- GIVEN the `serverBolsa` suite executed repeatedly on the same Node runtime
- WHEN the rejection scenarios are observed across runs
- THEN every run reports the same pass/fail result
- AND no scenario fails intermittently as a consequence of callback timing

### Requirement: `Usuario` schema and `comparePassword` unit coverage in `serverBolsa`

`serverBolsa` MUST provide unit tests for `models/Usuario.js` that run with no database.
The tests MUST cover the model's registered collection name, the three required fields, the
schema-declared unique index on `email`, and the `comparePassword` instance method for both
a correct and an incorrect password.

#### Scenario: The model is registered against the `usuarios` collection

- GIVEN `models/Usuario.js` is imported with no database running
- WHEN the model's registered collection name is inspected
- THEN it is `usuarios`

#### Scenario: A complete document validates

- GIVEN a `Usuario` document providing `nombre`, `email`, and `password`
- WHEN synchronous validation is executed
- THEN no validation error is reported

#### Scenario: Each of the three fields is individually required

- GIVEN a `Usuario` document that omits `nombre`, and separately one that omits `email`, and
  separately one that omits `password`
- WHEN synchronous validation is executed for each
- THEN each case reports a `required` validation error for exactly the omitted path
- AND an empty document reports `required` errors for all three paths

#### Scenario: The email path carries a unique index

- GIVEN `models/Usuario.js` is imported
- WHEN the schema-declared indexes are inspected
- THEN exactly one index is declared
- AND it is keyed on `email` and marked `unique: true`

#### Scenario: `comparePassword` accepts the correct password

- GIVEN a `Usuario` instance whose `password` is a real hash produced by the same
  implementation the model uses
- WHEN `comparePassword` is called with the pre-image of that hash
- THEN it returns `true`

#### Scenario: `comparePassword` rejects an incorrect password

- GIVEN a `Usuario` instance whose `password` is a real hash
- WHEN `comparePassword` is called with any different password
- THEN it returns `false`
- AND no database is contacted at any point in either comparison case

### Requirement: `Empresa` schema unit coverage in `serverBolsa`

`serverBolsa` MUST provide unit tests for `models/Empresa.js` that run with no database.
The tests MUST cover the model's registered collection name, the three required fields, the
declared type and reference of `usuarioId`, and the absence of any required status on the
remaining paths.

#### Scenario: The model is registered against the `empresas` collection

- GIVEN `models/Empresa.js` is imported with no database running
- WHEN the model's registered collection name is inspected
- THEN it is `empresas`
- AND the collection name is supplied when the model is registered, so it is asserted through
  the model's collection rather than through a schema option

#### Scenario: A complete document validates

- GIVEN an `Empresa` document providing `nombre`, `cantidad`, and `usuarioId`
- WHEN synchronous validation is executed
- THEN no validation error is reported

#### Scenario: Each of the three required fields is individually required

- GIVEN an `Empresa` document that omits `nombre`, and separately one that omits `cantidad`,
  and separately one that omits `usuarioId`
- WHEN synchronous validation is executed for each
- THEN each case reports a `required` validation error for exactly the omitted path

#### Scenario: `usuarioId` is an ObjectId referencing `Usuario`

- GIVEN `models/Empresa.js` is imported
- WHEN the `usuarioId` path is inspected
- THEN its declared type is `ObjectId`
- AND its declared reference is `Usuario`
- AND a 24-character hexadecimal string supplied for `usuarioId` is accepted and cast to an
  `ObjectId`

#### Scenario: Every other path is optional

- GIVEN an `Empresa` document providing only `nombre`, `cantidad`, and `usuarioId`
- WHEN the remaining declared paths — `ticker`, `precio`, `capitalInvertido`, `industria`,
  and `valoracion` — are inspected
- THEN none of them is required
- AND no schema-declared index exists on the `Empresa` schema

### Requirement: No database connection is required to test the `serverBolsa` models

The `serverBolsa` model tests MUST construct and validate documents while the Mongoose
connection is disconnected, and MUST NOT initiate a connection. `serverBolsa` MUST NOT
require an in-memory database server, a Docker service, or a running MongoDB instance for
this suite. The `serverBolsa` suite MUST NOT import `index.js` or
`websockets/websocketServer.js`, because importing either opens a listening socket, starts
an un-cleared interval, or initiates an outbound request, which would leave the test process
alive after the suite finishes.

#### Scenario: Validation happens with the connection disconnected

- GIVEN the Mongoose default connection used by both models
- WHEN the connection state is inspected from within the `serverBolsa` model tests
- THEN it is `0` (disconnected)
- AND the schema-validation and `comparePassword` tests still pass

#### Scenario: No connection is initiated by the suite

- GIVEN the `serverBolsa` suite running with no database available
- WHEN the suite completes
- THEN no connection was opened and no connection error was raised
- AND the process exited on its own

#### Scenario: Side-effectful modules are never imported

- GIVEN the set of modules imported by the `serverBolsa` test files
- WHEN that set is inspected
- THEN it contains neither the application entry point nor the websocket server module
- AND therefore no listening socket, un-cleared interval, or outbound request is triggered

### Requirement: The real native hash implementation is observable in `serverBolsa`

`serverBolsa` tests MUST exercise the same `bcrypt` implementation that
`models/Usuario.js` imports, and MUST NOT substitute, shim, alias, or mock it. `bcrypt` is a
native addon that `serverBolsa/package.json` does not declare; it resolves in the current
tree only transitively through `moongose@1.0.0`, while the declared `bcryptjs` is imported
by no source file. The `serverBolsa` suite MUST make the loss of that resolution loud rather
than silent: when the native module cannot be resolved, the test command MUST exit non-zero
reporting a module-resolution failure naming `bcrypt`, and MUST NOT skip or pass. The
`serverBolsa` suite MUST NOT use the declared `bcryptjs` package to stand in for it.

#### Scenario: Pruning the transitively-provided package fails the suite loudly

- GIVEN the `moongose` package — the only dependent of `bcrypt` in the tree — is removed from
  `serverBolsa/node_modules` while `bcrypt` is not otherwise resolvable
- WHEN `npm test` is executed in `serverBolsa`
- THEN the command exits non-zero
- AND the reported failure names `bcrypt` as an unresolvable module
- AND no test is reported as skipped in place of the failure

#### Scenario: Restoring the package restores the passing run

- GIVEN `moongose` has been restored to `serverBolsa/node_modules`
- WHEN `npm test` is executed in `serverBolsa`
- THEN the command exits `0` with all tests passing
- AND `serverBolsa/package.json` was never modified to compensate for the failure

#### Scenario: The comparison tests run against the native implementation

- GIVEN a `Usuario` document whose `password` is a real native `bcrypt` hash
- WHEN the `comparePassword` tests execute
- THEN the implementation under test is the native addon the model imports
- AND neither the declared `bcryptjs` package nor any substitute is used

### Requirement: Shared test helpers are minimal and sufficient in `serverBolsa`

`serverBolsa/test/helpers/` MUST contain only the helpers the in-scope tests strictly
require: a fake `req` exposing a configurable `headers.authorization`, a fake `res` whose
`status` call is chainable and which records the status code and JSON body written to it, and
a token factory that sets `TOKEN_SECRET` and signs a payload with real `jsonwebtoken`. The
helpers MUST NOT provide a module-mocking facility, a database fixture, or a database
cleanup routine, because the suite requires none.

#### Scenario: The fake response is chainable and records what was written

- GIVEN the fake `res` helper
- WHEN a test chains `res.status(401).json(body)` against it
- THEN the chained call returns the same fake so the chain does not throw
- AND the recorded status is `401` and the recorded body deep-equals `body`

#### Scenario: The token factory produces verifiable tokens

- GIVEN the token factory helper
- WHEN a payload is signed through it
- THEN the returned token verifies successfully against `process.env.TOKEN_SECRET` using the
  same JWT implementation the middleware uses
- AND the factory sets `TOKEN_SECRET` itself, so a test does not depend on ambient
  environment configuration

#### Scenario: No mocking or database facility is provided or required

- GIVEN the `serverBolsa/test/helpers/` directory
- WHEN the helpers it provides are listed
- THEN they are limited to the fake request, the fake response, and the token factory
- AND no helper opens a connection, and no helper substitutes a module binding

### Requirement: The `serverBolsa` suite does not depend on ESM module mocking

`serverBolsa` tests MUST NOT rely on substituting an ESM module binding, because the
built-in runner exposes no such facility on the verified Node runtime. This is acceptable
only for the in-scope targets, which take their collaborators as arguments; any target that
would require substituting an import is out of scope for this change and is deferred.

#### Scenario: No test substitutes a module binding

- GIVEN the `serverBolsa` test files
- WHEN their use of the runner's mocking facilities is inspected
- THEN none attempts to replace an ESM import in-process
- AND every collaborator the tested unit needs is supplied as an argument or reached through
  the model registration itself

#### Scenario: Targets needing a substituted import are excluded

- GIVEN a backend module that would require replacing an import in order to be unit tested
- WHEN the `serverBolsa` suite is inspected
- THEN that module has no test in this change
- AND it is left to a follow-up change that supplies the collaborator differently

### Requirement: Production source remains unmodified by this change in `serverBolsa`

This change MUST NOT modify any file under `serverBolsa/` other than `package.json`, and
MUST NOT delete or rewrite any production file. Specifically, `middlewares/authenticate.js`,
`models/Usuario.js`, `models/Empresa.js`, `index.js`, and the `controllers/`, `routes/`, and
`websockets/` directories MUST remain byte-identical to their pre-change state. This change
MUST also leave the modules it does not cover untested rather than refactoring them to make
them testable.

#### Scenario: No production file is modified

- GIVEN the change as committed
- WHEN the change set restricted to `serverBolsa` is inspected
- THEN the only modified file is `package.json`
- AND every added file lives under `serverBolsa/test/`

#### Scenario: The suite passes without any production change

- GIVEN the suite executing against unmodified production source
- WHEN `npm test` is run in `serverBolsa`
- THEN the command exits `0` with all tests passing
- AND the application start command is unaffected

### Requirement: The `serverBolsa` suite is extensible without changing the runner

Additional `serverBolsa` test files MUST be addable under `serverBolsa/test/` without
changing the test command, adding a dependency, or modifying production source. This is the
extension point through which follow-up changes land controller, route, and integration
coverage.

#### Scenario: A follow-up test file is picked up by the existing command

- GIVEN a new test file is added anywhere under `serverBolsa/test/` following the naming
  convention
- WHEN `npm test` is executed without any change to `package.json` or the test command
- THEN the new file's tests are discovered and executed alongside the existing ones

#### Scenario: Growth does not require a new dependency

- GIVEN `serverBolsa/package.json` after any number of follow-up test files have been added
- WHEN its `devDependencies` object is inspected
- THEN it still contains exactly `nodemon`
- AND `serverBolsa/package-lock.json` is still unchanged
