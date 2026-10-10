import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// Review this list whenever a new independently authenticated endpoint is added.
const APPROVED_PUBLIC_ROUTES = [
  'POST auth/login',
  'POST auth/signup',
  'POST auth/forgot-password',
  'POST auth/reset-password',
  'GET auth/google/callback',
  'GET auth/microsoft/callback',
  'GET auth/zoho/callback',
  'GET health/live',
  'GET health/ready',
  'GET public/client/:token',
  'GET public/client/:token/boq/:boqId',
  'POST public/client/:token/boq/:boqId/approve',
  'GET public/client/:token/quotations/compare/:cid',
  'POST public/client/:token/quotations/select',
  'GET public/client/:token/handover',
  'POST public/client/:token/handover/accept',
  'POST public/client/:token/handover/snag',
];

function controllerFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory()
      ? controllerFiles(file)
      : entry.name.endsWith('.controller.ts')
        ? [file]
        : [];
  });
}

function decorators(node: ts.Node) {
  return (
    ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : []
  ).flatMap((decorator) => {
    const expr = decorator.expression;
    return ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)
      ? [{ name: expr.expression.text, args: expr.arguments }]
      : [];
  });
}

it('only explicitly approved production endpoints are marked Public', () => {
  const routes: string[] = [];
  for (const file of controllerFiles(path.resolve(__dirname, '../..'))) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    for (const node of source.statements) {
      if (!ts.isClassDeclaration(node)) continue;
      const annotations = decorators(node);
      // Controller-wide exceptions would silently allow future routes.
      expect(
        annotations.some((annotation) => annotation.name === 'Public'),
      ).toBe(false);
      const controller = annotations.find(
        (annotation) => annotation.name === 'Controller',
      );
      if (!controller) continue;
      const prefix =
        controller.args[0] && ts.isStringLiteral(controller.args[0])
          ? controller.args[0].text
          : '';
      for (const member of node.members) {
        const methodAnnotations = decorators(member);
        if (
          !methodAnnotations.some((annotation) => annotation.name === 'Public')
        )
          continue;
        const route = methodAnnotations.find((annotation) =>
          [
            'Get',
            'Post',
            'Patch',
            'Put',
            'Delete',
            'All',
            'Options',
            'Head',
          ].includes(annotation.name),
        );
        expect(route).toBeDefined();
        const suffix =
          route!.args[0] && ts.isStringLiteral(route!.args[0])
            ? route!.args[0].text
            : '';
        routes.push(
          `${route!.name.toUpperCase()} ${[prefix, suffix].filter(Boolean).join('/')}`,
        );
      }
    }
  }
  expect(routes.sort()).toEqual([...APPROVED_PUBLIC_ROUTES].sort());
});
