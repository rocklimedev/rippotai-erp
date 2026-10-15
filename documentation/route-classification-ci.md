# NestJS route classification in CI

Run from `backend`:

```sh
npm run routes:test
npm run routes:check
```

The inventory is generated from production TypeScript source on every run;
there is no manually maintained route list. It does not start NestJS or require
database, Redis, OAuth, or deployment credentials. Output includes HTTP method,
controller-relative path, controller/handler, permission, source file, and classification.
Paths are relative to the application's global `/api/v1` prefix.

- **public**: explicit `@Public()` metadata (takes precedence, like the guards).
- **protected**: explicit, valid `@RequirePermission('resource:action')` metadata.
  Controller metadata applies unless overridden on a handler.
- **unclassified**: neither of the above. A global JWT guard or `@UseGuards`
  alone does not constitute explicit classification. CI fails with exit code 1.

Every discovered route is printed to the CI log. The generated
`backend/artifacts/route-inventory.json` is uploaded as `backend-route-inventory`,
including when classification fails. These local generated files are gitignored.
An unresolved route expression or unsupported declaration also fails the check,
rather than silently excluding the route. Static strings, path arrays, controller
path options, and aliased or namespace decorator imports are supported.
Inherited controllers and generic `@RequestMapping` must receive scanner support
before use; unresolved route constants must be made explicit or supported first.

The shared scanner also powers the existing permission catalogue generator.
CI checks that generated catalogue artifacts are current and runs the complete
backend suite with `npm test`, including the approved-public-endpoint audit.
That allow-list is a security review policy,
not the source of the inventory, and is intentionally not auto-approved.

The workflow runs on backend/workflow pull requests and is a required dependency
of the main-branch backend deployment job. Unclassified routes therefore block
deployment. To also block merges, configure the repository's branch rules to
require the `route-classification` check.
