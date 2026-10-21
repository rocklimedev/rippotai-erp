// Static analysis only: never boots Nest or connects to databases/services.
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const HTTP = new Set([
  'Get',
  'Post',
  'Put',
  'Patch',
  'Delete',
  'Head',
  'Options',
  'All',
]);
const PERMISSION = /^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/;

function sourceFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(file);
      return entry.name.endsWith('.ts') &&
        !/\.(spec|test|e2e-spec|d)\.ts$/.test(entry.name)
        ? [file]
        : [];
    })
    .sort();
}

function scanSource(text, file, sourceRoot = path.join(root, 'src')) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  if (source.parseDiagnostics.length) {
    throw new Error(
      `${file}: cannot parse TypeScript source for route inventory`,
    );
  }
  const aliases = new Map();
  const namespaces = new Set();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const item of bindings.elements)
        aliases.set(item.name.text, (item.propertyName || item.name).text);
    } else if (bindings && ts.isNamespaceImport(bindings))
      namespaces.add(bindings.name.text);
  }
  function fail(node, message) {
    const line =
      source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    throw new Error(`${file}:${line}: ${message}`);
  }
  function annotations(node) {
    return (ts.canHaveDecorators(node) ? ts.getDecorators(node) || [] : []).map(
      (decorator) => {
        const expression = decorator.expression;
        const call = ts.isCallExpression(expression) ? expression : undefined;
        const target = call ? call.expression : expression;
        let name = target.getText(source);
        if (ts.isIdentifier(target))
          name = aliases.get(target.text) || target.text;
        else if (
          ts.isPropertyAccessExpression(target) &&
          namespaces.has(target.expression.getText(source))
        )
          name = target.name.text;
        return { name, args: call ? [...call.arguments] : [], node: decorator };
      },
    );
  }
  function paths(expression, node) {
    if (!expression) return [''];
    if (
      ts.isStringLiteral(expression) ||
      ts.isNoSubstitutionTemplateLiteral(expression)
    )
      return [expression.text];
    if (ts.isArrayLiteralExpression(expression) && expression.elements.length)
      return expression.elements.flatMap((item) => paths(item, node));
    fail(
      node,
      'Route paths must be static string literals or nonempty arrays; inventory cannot resolve this route',
    );
  }
  const routes = [];
  function visit(cls) {
    if (!ts.isClassDeclaration(cls)) {
      ts.forEachChild(cls, visit);
      return;
    }
    const classAnnotations = annotations(cls);
    const controller = classAnnotations.find(
      (item) => item.name === 'Controller',
    );
    if (!controller) return;
    if (!cls.name) fail(cls, 'Controller must have a name');
    if (
      cls.heritageClauses?.some(
        (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
      )
    )
      fail(cls, 'Inherited controllers require explicit inventory support');
    let prefix = controller.args[0];
    if (prefix && ts.isObjectLiteralExpression(prefix)) {
      if (
        prefix.properties.some(
          (item) =>
            !ts.isPropertyAssignment(item) ||
            !['path', 'version', 'host', 'scope', 'durable'].includes(
              item.name.getText(source).replace(/['"]/g, ''),
            ),
        )
      )
        fail(prefix, 'Unsupported controller options');
      const property = prefix.properties.find(
        (item) => item.name.getText(source).replace(/['"]/g, '') === 'path',
      );
      prefix = property?.initializer;
    }
    const prefixes = paths(prefix, controller.node);
    for (const member of cls.members) {
      if (!ts.isMethodDeclaration(member)) continue;
      const ds = annotations(member);
      if (ds.some((item) => item.name === 'RequestMapping'))
        fail(
          member,
          'RequestMapping requires explicit inventory support; use an HTTP decorator',
        );
      const methods = ds.filter((item) => HTTP.has(item.name));
      if (!methods.length) continue;
      if (methods.length !== 1)
        fail(member, 'Multiple HTTP decorators on one handler are ambiguous');
      const http = methods[0];
      const permission = (
        ds.find((item) => item.name === 'RequirePermission') ||
        classAnnotations.find((item) => item.name === 'RequirePermission')
      )?.args[0];
      const permissionValue =
        permission && ts.isStringLiteral(permission)
          ? permission.text
          : undefined;
      const isPublic = [...ds, ...classAnnotations].some(
        (item) => item.name === 'Public',
      );
      for (const base of prefixes)
        for (const suffix of paths(http.args[0], http.node)) {
          routes.push({
            module:
              path.basename(file) === 'app.controller.ts'
                ? 'system'
                : path
                    .relative(sourceRoot, file)
                    .replaceAll('\\', '/')
                    .split('/')[1],
            controller: cls.name.text,
            handler: member.name.getText(source),
            method: http.name.toUpperCase(),
            path:
              '/' +
              [base, suffix]
                .filter(Boolean)
                .join('/')
                .replace(/^\/+|\/+$/g, ''),
            permission: permissionValue,
            public: isPublic,
            file: path
              .relative(path.dirname(sourceRoot), file)
              .replaceAll('\\', '/'),
          });
        }
    }
  }
  visit(source);
  return routes;
}

function scan(sourceRoot = path.join(root, 'src')) {
  return sourceFiles(sourceRoot)
    .flatMap((file) =>
      scanSource(fs.readFileSync(file, 'utf8'), file, sourceRoot),
    )
    .sort((a, b) =>
      `${a.module}/${a.controller}/${a.handler}/${a.path}`.localeCompare(
        `${b.module}/${b.controller}/${b.handler}/${b.path}`,
      ),
    );
}

function classify(route) {
  return route.public
    ? 'public'
    : PERMISSION.test(route.permission || '')
      ? 'protected'
      : 'unclassified';
}

function inventory(routes) {
  return routes.map((route) => ({ ...route, classification: classify(route) }));
}

function run(
  args = process.argv.slice(2),
  sourceRoot = path.join(root, 'src'),
) {
  const routes = inventory(scan(sourceRoot));
  if (!routes.length) throw new Error('No NestJS routes discovered');
  const outputIndex = args.indexOf('--output');
  if (outputIndex >= 0) {
    if (!args[outputIndex + 1])
      throw new Error('--output requires a JSON file path');
    const output = path.resolve(args[outputIndex + 1]);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(routes, null, 2) + '\n');
  }
  for (const route of routes)
    console.log(
      `${route.classification.padEnd(12)} ${route.method.padEnd(7)} ${route.path}  ${route.controller}.${route.handler}  ${route.permission || '-'}  (${route.file})`,
    );
  const missing = routes.filter(
    (route) => route.classification === 'unclassified',
  );
  console.log(
    `\n${routes.length} routes: ${routes.filter((route) => route.classification === 'public').length} public, ${routes.filter((route) => route.classification === 'protected').length} protected, ${missing.length} unclassified. Paths are relative to the global API prefix.`,
  );
  if (missing.length) {
    console.error(
      'Unclassified routes: add @Public() or a valid @RequirePermission(resource:action).',
    );
    return 1;
  }
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = run();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { scan, scanSource, classify, inventory, run };
