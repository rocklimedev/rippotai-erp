import type SftpClient from 'ssh2-sftp-client';
import type { Writable } from 'stream';
import { pipeline } from 'stream/promises';

export async function streamSftpFile(
  client: SftpClient,
  remotePath: string,
  destination: Writable,
): Promise<void> {
  if (destination.destroyed || destination.writableEnded) return;
  const source = client.createReadStream(remotePath);
  // ssh2 may emit an outstanding OPEN request error even after the stream has
  // closed (for example when an aborted HTTP request causes client.end()).
  // Keep this listener for the stream's lifetime, including connection teardown.
  // pipeline independently observes active errors and rejects the download.
  source.on('error', () => undefined);
  try {
    await pipeline(source, destination);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (
      (destination.destroyed || destination.writableEnded) &&
      ['ERR_STREAM_UNABLE_TO_PIPE', 'ERR_STREAM_PREMATURE_CLOSE', 'ABORT_ERR'].includes(code || '')
    ) return;
    throw error;
  }
}
