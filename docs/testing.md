---
last_modified: 2026-05-07
---

# Testing Guide — Terramar Brands Scraper

Five-level testing workflow based on [ApifyForge's best practices](https://apifyforge.com/blog/how-to-test-apify-actor-before-publishing).

## Level 1: Local Runs with Default Inputs

```bash
npm run start:dev
```

Uses `storage/key_value_stores/default/INPUT.json` with defaults matching `.actor/input_schema.json`. Apify's health checker uses these same defaults — if this fails, the Actor will get a maintenance flag.

**Check after every run:**

- Exit code is 0 (clean exit)
- `storage/datasets/default/` contains ~225 JSON items
- All expected fields present in output items
- Memory log shows no leaks (RSS stabilizes, doesn't grow indefinitely)

## Level 2: Schema Validation

```bash
npm run validate
```

Runs `scripts/pre-push-check.js` which validates:

- `.actor/actor.json` exists and has name/version
- `.actor/input_schema.json` parses and all required fields have defaults
- Default value types match declared types (integer = number, string = string)
- `.actor/dataset_schema.json` and `.actor/output_schema.json` exist
- `Dockerfile` and `src/main.ts` exist

## Level 3: Automated Test Suites

```bash
npm test
```

Uses Vitest. Test files:

| File | What it tests |
|---|---|
| `test/conftest.ts` | Shared fixtures and test-only defaults |
| `test/api.test.ts` | `buildDepartmentLookup`, `resolveDepartmentName`, `resolveSubDepartmentName` |
| `test/transform.test.ts` | `stripHtml`, `transformProduct`, image URL construction |
| `test/output-validation.test.ts` | All `ProductItem` fields present, correct types, valid URLs, edge cases |
| `test/input-validation.test.ts` | Input schema defaults, type consistency, fallback logic |
| `test/main.test.ts` | Smoke test |

Business logic (`transformProduct`, `buildDepartmentLookup`, `stripHtml`) is separated from `Actor.init()`/`Actor.exit()` so it can be unit tested without the Apify environment.

## Level 4: Cloud Staging

```bash
apify push
```

Then trigger a run with default inputs on the Apify platform. Verify:

1. **Build succeeds** — native modules compile in Linux container
2. **Memory within tier** — check run stats RSS stays under selected memory limit
3. **Execution time reasonable** — should complete in under 60 seconds for default inputs
4. **Proxy works** — in our case we don't use proxy (public API), but verify no proxy errors
5. **Output is complete** — dataset has ~225 items, all fields populated

## Level 5: Pre-Push Hook

```bash
npm run predeploy
```

Runs `validate` + `test` + `lint`. Blocks deploy if any check fails.

Add to your workflow:

```bash
npm run predeploy && apify push
```

## Debugging Common Failures

| Exit Code | Meaning | Fix |
|---|---|---|
| 137 | OOM kill (out of memory) | Increase memory tier or fix memory leak |
| 1 | Uncaught exception | Check stack trace, add try/catch |
| 0 + empty output | Logic error or input mismatch | Verify field names match schema and code |
| Build failure | Dependency issue | Pin exact versions, check native modules |

## Memory Monitoring

The Actor logs RSS and heap memory at startup and after the crawl:

```
Memory [startup]: RSS=45MB, Heap=20MB/30MB
Memory [after-crawl]: RSS=62MB, Heap=35MB/45MB
```

If RSS grows continuously without stabilizing, there's a memory leak. Fix before publishing.