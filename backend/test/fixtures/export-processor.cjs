// Test-only renderer: real Excel work and CPU load in the same child-process
// boundary as production. It never connects to an application database.
const { Workbook } = require('exceljs');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
process.once('message', async (data) => {
  const opts = data.args.find((arg) => arg.source === 'literal')?.value || {};
  try {
    if (opts.permanent) throw new Error('Fixture invalid export request');
    if (opts.hang)
      while (true) {
        /* Parent must enforce the timeout. */
      }
    const marker = path.join(
      process.env.PRIVATE_FILE_PATH,
      data.operationId + '.attempts',
    );
    let attempt = 1;
    try {
      attempt += Number(await fs.readFile(marker, 'utf8'));
    } catch {}
    await fs.writeFile(marker, String(attempt));
    if (attempt <= (opts.failTimes || 0))
      throw new Error('Fixture rendering failure');
    const until = Date.now() + (opts.busyMs || 0);
    while (Date.now() < until) Math.sqrt(Math.random());
    const book = new Workbook();
    const sheet = book.addWorksheet('Export');
    for (let i = 0; i < 5000; i++) sheet.addRow([i, 'Worker generated row']);
    const bytes = Buffer.from(await book.xlsx.writeBuffer());
    if (opts.result === 'json') {
      process.send(
        {
          result: {
            type: 'json',
            value: {
              id: data.operationId,
              pid: process.pid,
              magic: bytes.subarray(0, 2).toString(),
              password_hash: 'must-be-stripped',
            },
          },
        },
        () => process.exit(0),
      );
      return;
    }
    const key = `private-documents-${randomUUID()}.xlsx`;
    await fs.writeFile(path.join(process.env.PRIVATE_FILE_PATH, key), bytes);
    process.send(
      {
        result: {
          type: 'file',
          key,
          filename: 'fixture.xlsx',
          mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: bytes.length,
        },
      },
      () => process.exit(0),
    );
  } catch (error) {
    process.send({ error: error.message, retryable: !opts.permanent }, () =>
      process.exit(1),
    );
  }
});
