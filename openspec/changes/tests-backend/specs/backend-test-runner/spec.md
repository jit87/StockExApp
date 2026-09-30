# backend-test-runner Specification

**Change:** `tests-backend`
**Project:** `stockexapp`
**Owning project:** `serverBolsa`
**Type:** New capability (no existing spec in `openspec/specs/`)
**Date:** 2026-09-30
**Phase:** spec
**Input:** `openspec/changes/tests-backend/proposal.md`

## Purpose

`serverBolsa` currently declares one script (`"dev": "nodemon ."`) and no test runner. This
capability specifies the runnable, zero-dependency test command that `serverBolsa` exposes
once this change lands: `npm test` delegating to the Node built-in runner (`node --test`),
discovering test files by convention, with no configuration file, no coverage threshold, and
no additional package.

The requirement that makes the budget real is the dependency constraint: adding a
third-party runner would rewrite `package-lock.json` (Mocha 1,099 lines, Vitest 1,428,
Jest 4,053) and exhaust the 400-line review budget before a single test exists. `node:test`
adds exactly zero lockfile lines, because it is the Node binary already installed.

Scope note: this capability covers the command and its registration. The test files
themselves are specified by `backend-unit-tests`.

## Requirements

### Requirement: Zero-dependency test script in `serverBolsa`

`serverBolsa/package.json` MUST declare `"test": "node --test"` in `scripts`, and MUST
retain the existing `"dev": "nodemon ."` script. `serverBolsa` MUST add no package to
`devDependencies` or `dependencies` to obtain the runner, and `devDependencies` MUST remain
exactly `nodemon`. Because no package is added, `serverBolsa/package-lock.json` MUST remain
byte-identical to its pre-change state.

#### Scenario: The test command runs and passes with no infrastructure

- GIVEN `serverBolsa` is installed and no MongoDB, no network egress, and no `.env` value
  beyond what `dotenv` already reads is available
- WHEN `npm test` is executed from the `serverBolsa` directory
- THEN the process exits with status `0`
- AND the runner reports every discovered test file as passing with zero failures
- AND no connection attempt to a database is logged or attempted

#### Scenario: The manifest declares no new package

- GIVEN the `serverBolsa/package.json` after this change
- WHEN its `devDependencies` object is inspected
- THEN it contains exactly one key, `nodemon`
- AND its `scripts` object contains `dev` mapped to `nodemon .` and `test` mapped to
  `node --test`

#### Scenario: The lockfile is untouched

- GIVEN `serverBolsa/package-lock.json` at the pre-change commit
- WHEN `git diff --stat -- serverBolsa/package-lock.json` is evaluated for the change
- THEN the output is empty, with no additions and no deletions

### Requirement: Convention-based discovery without configuration in `serverBolsa`

`serverBolsa` MUST rely on the runner's built-in discovery of files matching the
`*.test.js` convention under `serverBolsa/test/`. `serverBolsa` MUST NOT add a test-runner
configuration file of any kind (for example a `jest.config.*`, `vitest.config.*`,
`.mocharc*`, or a bespoke runner bootstrap). `serverBolsa` MUST NOT configure or enforce a
coverage threshold, and the test command MUST NOT require the experimental coverage flag in
order to pass.

#### Scenario: A new test file is discovered with no configuration

- GIVEN a new file exists at `serverBolsa/test/models/Empresa.test.js` that contains at
  least one `node:test` test
- WHEN `npm test` is executed from `serverBolsa`
- THEN the runner executes that file's tests without any runner configuration being present
- AND the file is discovered by naming convention rather than by an explicit path list

#### Scenario: No runner configuration file is introduced

- GIVEN the `serverBolsa` directory after this change
- WHEN the repository tree under `serverBolsa` is inspected
- THEN no test-runner configuration file exists at any level
- AND the only test-related entry required is the `test` script in `package.json`

#### Scenario: Coverage is not gated

- GIVEN the `serverBolsa` test command
- WHEN it runs without `--experimental-test-coverage`
- THEN it still exits `0` and reports all tests passing
- AND no coverage threshold is evaluated as a pass/fail condition

### Requirement: Documented Node runtime floor in `serverBolsa`

`serverBolsa/package.json` MUST declare an `engines.node` field whose floor is
`>=20.11.1`, the runtime on which the discovery behaviour and the `node:test` API surface
were verified. The floor is documentation, not enforcement: `serverBolsa` MUST NOT enable
`engine-strict`, so a mismatch MUST NOT block install or test execution, and the recorded
floor MUST be the only mechanism conveying the runtime requirement.

#### Scenario: The floor is declared

- GIVEN the `serverBolsa/package.json` after this change
- WHEN its `engines` object is inspected
- THEN `engines.node` is present and declares a floor of `>=20.11.1`

#### Scenario: The floor does not block execution

- GIVEN a machine whose Node major differs from the recorded floor and where
  `engine-strict` is not set
- WHEN `npm test` is executed in `serverBolsa`
- THEN npm MAY emit an `EBADENGINE` warning
- AND the test run is NOT blocked by the `engines` field

### Requirement: Infrastructure-free, bounded test execution in `serverBolsa`

The `serverBolsa` test command MUST run with no database, no network access, and no
long-lived child process or open handle. It MUST terminate on its own and exit rather than
hang, and a warm run SHOULD complete in roughly 2 seconds or less. No module under test
MUST be imported if importing it opens a listening socket, starts an interval, or initiates a
connection or outbound request.

#### Scenario: No database is required

- GIVEN no MongoDB instance is listening on the configured target
- WHEN `npm test` is executed in `serverBolsa`
- THEN the suite still exits `0`
- AND no in-memory database server, Docker service, or test container is started

#### Scenario: No network access is required

- GIVEN the host has no outbound network connectivity
- WHEN `npm test` is executed in `serverBolsa`
- THEN the suite still exits `0`
- AND no external market-data endpoint is contacted

#### Scenario: The process terminates and stays within the expected time budget

- GIVEN a warm run — the runner, its module cache, and the test files have been loaded at
  least once already
- WHEN `npm test` is executed in `serverBolsa`
- THEN the process exits on its own rather than remaining alive on an open handle
- AND the wall-clock duration is roughly 2 seconds or less

### Requirement: Registered runner commands in `openspec/config.yaml` at archive

When this change is archived, `openspec/config.yaml` MUST record the `serverBolsa` test
command in the two per-project command fields that this change makes stale: the
`serverBolsa` entry under `rules.apply.project_test_commands` and the
`serverBolsa.test` entry under `rules.verify.project_commands`. Both MUST be refreshed from
empty to the `serverBolsa` test command. The same archive step SHOULD refresh the
`serverBolsa` detection entries in the `testing.projects` block — the test command, test
framework, test-file count, test layers, and coverage availability — which this change also
invalidates. `strict_tdd` MUST remain `false`; flipping it requires a single repository-root
command covering both `clientBolsa` and `serverBolsa`, and no such command exists.

#### Scenario: The stale empty command fields are refreshed

- GIVEN `openspec/config.yaml` at archive time
- WHEN the `serverBolsa` entries under `rules.apply.project_test_commands` and
  `rules.verify.project_commands` are inspected
- THEN both carry the `serverBolsa` test command instead of an empty value

#### Scenario: The testing detection block is no longer stale

- GIVEN `openspec/config.yaml` at archive time
- WHEN the `serverBolsa` entry in the `testing.projects` block is inspected
- THEN its test command, test framework, test-file count, unit-test-layer availability, and
  coverage availability reflect the runner and suite this change introduces

#### Scenario: Strict TDD is deliberately re-confirmed as false

- GIVEN `openspec/config.yaml` at archive time
- WHEN `strict_tdd` is inspected
- THEN it remains `false`
- AND it is consciously retained rather than left stale, because `clientBolsa` still has no
  headless, non-watching test command and no repository-root `package.json` exists
