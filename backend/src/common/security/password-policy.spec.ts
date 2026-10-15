import { createHash } from 'crypto';
import { assertNewPassword } from './password-policy';

describe('New password policy', () => {
  const password = 'a long uncommon passphrase';
  const digest = createHash('sha1')
    .update(password)
    .digest('hex')
    .toUpperCase();
  let fetchMock: jest.SpyInstance;
  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => fetchMock.mockRestore());
  const reply = (body: string, status = 200) =>
    fetchMock.mockResolvedValue({ status, text: async () => body } as Response);

  it.each(['short', '12345678901', '界'.repeat(25)])(
    'rejects length or bcrypt byte-limit violations without a network call',
    async (value) => {
      await expect(assertNewPassword(value)).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it('sends only the first five SHA-1 characters and requests padding', async () => {
    reply(`${'0'.repeat(35)}:1\r\n${digest.slice(5)}:0`);
    await assertNewPassword(password);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.pwnedpasswords.com/range/${digest.slice(0, 5)}`,
      expect.objectContaining({
        headers: expect.objectContaining({ 'Add-Padding': 'true' }),
        signal: expect.any(AbortSignal),
        redirect: 'error',
      }),
    );
    const request = JSON.stringify(fetchMock.mock.calls);
    expect(request).not.toContain(password);
    expect(request).not.toContain(digest);
  });
  it('rejects a breached password but ignores zero-count padded matches', async () => {
    reply(`${digest.slice(5)}:42`);
    await expect(assertNewPassword(password)).rejects.toThrow('data breach');
    reply(`${digest.slice(5)}:0`);
    await expect(assertNewPassword(password)).resolves.toBeUndefined();
  });
  it.each([
    ['', 200],
    ['invalid body', 200],
    ['unavailable', 503],
    ['not found', 404],
  ])(
    'defers new passwords on a malformed or unavailable screening result',
    async (body, status) => {
      reply(body as string, status as number);
      await expect(assertNewPassword(password)).rejects.toThrow(
        'safety check is unavailable',
      );
    },
  );
  it('handles timeouts without exposing the password or remote error', async () => {
    fetchMock.mockRejectedValue(new Error(`sensitive error ${password}`));
    await expect(assertNewPassword(password)).rejects.toThrow(
      'Password safety check is unavailable. Please try again shortly.',
    );
  });
});
