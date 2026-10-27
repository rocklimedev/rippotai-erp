import { PassThrough, Readable, Writable } from 'stream';
import { streamSftpFile } from './sftp-stream';

describe('SFTP download stream lifecycle', () => {
  const clientFor = (source: Readable) => ({ createReadStream: jest.fn(() => source) }) as any;

  it('streams the complete file', async () => {
    const chunks: Buffer[] = [];
    const destination = new Writable({ write(chunk, _encoding, callback) { chunks.push(chunk); callback(); } });
    await streamSftpFile(clientFor(Readable.from([Buffer.from('drawing')])), '/drawing.pdf', destination);
    expect(Buffer.concat(chunks).toString()).toBe('drawing');
  });

  it('rejects an SFTP read error instead of swallowing it', async () => {
    const source = new PassThrough();
    const result = streamSftpFile(clientFor(source), '/drawing.pdf', new PassThrough());
    const rejected = expect(result).rejects.toThrow('No response from server');
    source.destroy(new Error('No response from server'));
    await rejected;
  });

  it('does not open an SFTP file for an already disconnected destination', async () => {
    const source = new PassThrough();
    const destination = new PassThrough();
    destination.destroy();
    const client = clientFor(source);
    await expect(streamSftpFile(client, '/drawing.pdf', destination)).resolves.toBeUndefined();
    expect(client.createReadStream).not.toHaveBeenCalled();
  });

  it('treats a destination disconnect during transfer as cancellation and handles late errors', async () => {
    const source = new PassThrough();
    const destination = new PassThrough();
    const result = streamSftpFile(clientFor(source), '/drawing.pdf', destination);
    destination.destroy();
    await expect(result).resolves.toBeUndefined();
    expect(() => source.emit('error', new Error('No response from server'))).not.toThrow();
  });

  it('handles late connection cleanup errors after a successful transfer', async () => {
    const source = Readable.from([Buffer.from('drawing')]);
    await streamSftpFile(clientFor(source), '/drawing.pdf', new Writable({ write(_chunk, _encoding, callback) { callback(); } }));
    expect(() => source.emit('error', new Error('No response from server'))).not.toThrow();
  });
});
