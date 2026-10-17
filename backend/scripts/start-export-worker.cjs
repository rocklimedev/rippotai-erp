const path = require('node:path');
require('tsconfig-paths').register({
  baseUrl: path.resolve(__dirname, '../dist/src'),
  paths: { '@/*': ['*'] },
});
require('../dist/src/modules/exports/export-worker.js')
  .startExportWorker()
  .catch((error) => {
    console.error('Export worker could not start:', error.name);
    process.exit(1);
  });
