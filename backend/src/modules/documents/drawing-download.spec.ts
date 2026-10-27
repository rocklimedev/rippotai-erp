import { DrawingsController } from './drawing.controller';

describe('drawing download responses', () => {
  function setup() {
    const service = {
      listRevisions: jest.fn().mockResolvedValue([{ id: 'revision', storageFilename: 'private-file.pdf', filename: 'plan.pdf', mime: 'application/pdf' }]),
      streamFile: jest.fn().mockResolvedValue(undefined),
    };
    const response: any = {
      destroyed: false, writableEnded: false, headersSent: false,
      setHeader: jest.fn(), removeHeader: jest.fn(), destroy: jest.fn(),
      status: jest.fn().mockReturnThis(), json: jest.fn(),
    };
    return { service, response, controller: new DrawingsController(service as any) };
  }

  it('does not stream a request that disconnected during revision lookup', async () => {
    const { service, response, controller } = setup();
    response.destroyed = true;
    await controller.downloadRevision('drawing', 'revision', response);
    expect(service.streamFile).not.toHaveBeenCalled();
  });

  it('does not send an exception response after cancellation', async () => {
    const { service, response, controller } = setup();
    service.streamFile.mockImplementation(async () => { response.destroyed = true; throw new Error('Cannot pipe'); });
    await expect(controller.downloadRevision('drawing', 'revision', response)).resolves.toBeUndefined();
    expect(response.json).not.toHaveBeenCalled();
  });

  it('removes binary headers before propagating a pre-stream failure', async () => {
    const { service, response, controller } = setup();
    service.streamFile.mockRejectedValue(new Error('SFTP unavailable'));
    await expect(controller.downloadRevision('drawing', 'revision', response)).rejects.toThrow('SFTP unavailable');
    expect(response.removeHeader).toHaveBeenCalledWith('Content-Type');
    expect(response.removeHeader).toHaveBeenCalledWith('Content-Disposition');
  });

  it('returns JSON 404 for a missing remote file', async () => {
    const { service, response, controller } = setup();
    service.streamFile.mockRejectedValue(Object.assign(new Error('Not found'), { code: 2 }));
    await controller.downloadRevision('drawing', 'revision', response);
    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ message: 'Revision file not found' });
  });

  it('closes a partial file response without sending JSON into it', async () => {
    const { service, response, controller } = setup();
    service.streamFile.mockImplementation(async () => { response.headersSent = true; throw new Error('SFTP lost'); });
    await controller.downloadRevision('drawing', 'revision', response);
    expect(response.destroy).toHaveBeenCalled();
    expect(response.json).not.toHaveBeenCalled();
  });
});
