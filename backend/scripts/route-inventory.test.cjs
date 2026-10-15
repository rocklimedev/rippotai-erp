const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { scanSource, inventory } = require('./route-inventory.cjs');
const scan = (source) => inventory(scanSource(source, path.join(__dirname, '../src/example.ts')));

test('reports public, protected and unclassified handlers without relying on JWT defaults', () => {
  const routes = scan(`@Controller('example') class Example {
    @Public() @Get('open') open() {}
    @RequirePermission('example:read') @Get('closed') closed() {}
    @UseGuards(JwtAuthGuard) @Post() missing() {}
    @RequirePermission('invalid') @Delete() invalid() {}
  }`);
  assert.deepEqual(routes.map((route) => route.classification), ['public', 'protected', 'unclassified', 'unclassified']);
  assert.deepEqual(routes.map((route) => route.path), ['/example/open', '/example/closed', '/example', '/example']);
});

test('handles import aliases, namespaces, controller options and path arrays', () => {
  const routes = scan(`import { Controller as C, Get as Read } from '@nestjs/common';
    import * as nest from '@nestjs/common';
    import { RequirePermission as Permission } from './require-permission.decorator';
    @C({path: ['one', 'two']}) @Permission('example:read') class Example {
      @Read(['a', 'b']) list() {}
      @nest.Head() head() {}
    }`);
  assert.equal(routes.length, 6);
  assert.ok(routes.every((route) => route.classification === 'protected'));
  assert.deepEqual(routes.map((route) => route.path), ['/one/a', '/one/b', '/two/a', '/two/b', '/one', '/two']);
});

test('method permission overrides class metadata and Public takes precedence as in the guards', () => {
  const routes = scan(`@Controller() @RequirePermission('example:read') class Example {
    @RequirePermission('invalid') @Get() invalid() {}
    @Public() @RequirePermission('example:write') @Post() public() {}
  }`);
  assert.deepEqual(routes.map((route) => route.classification), ['unclassified', 'public']);
});

test('fails closed for unresolved paths and unsupported route declarations', () => {
  for (const source of [
    `@Controller(dynamic) class Example { @Get() route() {} }`,
    `@Controller() class Example { @Get(dynamic) route() {} }`,
    `@Controller() class Example extends Base { @Get() route() {} }`,
    `@Controller() class Example { @RequestMapping() route() {} }`,
    `@Controller() class Example { @Get() @Post() route() {} }`,
  ]) assert.throws(() => scan(source));
});

test('CLI reports all routes, writes inventory even on failure and returns a failing status', (context) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nest-route-inventory-'));
  context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'routes.ts'); // No .controller.ts naming convention.
  const output = path.join(dir, 'inventory.json');
  const script = `const {run} = require(${JSON.stringify(path.join(__dirname, 'route-inventory.cjs'))}); process.exitCode = run(['--output', ${JSON.stringify(output)}], ${JSON.stringify(dir)});`;
  fs.writeFileSync(file, `@Controller('test') class Test {
    @Public() @Get('public') open() {}
    @RequirePermission('test:read') @Get('protected') closed() {}
    @Get('missing') missing() {}
  }`);
  const failure = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  assert.equal(failure.status, 1);
  assert.match(failure.stdout, /unclassified\s+GET\s+\/test\/missing/);
  assert.match(failure.stderr, /Unclassified routes/);
  assert.equal(JSON.parse(fs.readFileSync(output, 'utf8')).length, 3);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace("@Get('missing')", "@RequirePermission('test:read') @Get('missing')"));
  const success = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  assert.equal(success.status, 0, success.stderr);
  assert.match(success.stdout, /1 public, 2 protected, 0 unclassified/);
});
