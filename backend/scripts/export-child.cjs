const path = require('node:path');
// A dead coordinator must not leave generators running unattended. Container
// deployments should additionally use a process-group/cgroup supervisor.
process.once('disconnect', () => {
  if (process.platform === 'win32') {
    require('node:child_process')
      .spawn('taskkill', ['/PID', String(process.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      })
      .once('error', () => process.exit(1));
  } else {
    try {
      process.kill(-process.pid, 'SIGKILL');
    } catch {
      process.exit(1);
    }
  }
});
require('tsconfig-paths').register({
  baseUrl: path.resolve(__dirname, '../dist/src'),
  paths: { '@/*': ['*'] },
});
require('../dist/src/modules/exports/export-child.js');
