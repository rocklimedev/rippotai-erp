import { NotFoundException } from '@nestjs/common';
import { AdminDprDocumentService } from './admin-dpr-document.service';

describe('Admin DPR document deletion', () => {
  it('deletes the saved document without changing source entries', async () => {
    const row = { destroy: jest.fn().mockResolvedValue(undefined) };
    const model = { findByPk: jest.fn().mockResolvedValue(row) };
    const exporter = { capture: jest.fn(), buildWorkbook: jest.fn() };
    const service = new AdminDprDocumentService(model as any, exporter as any);
    await expect(service.remove('document')).resolves.toEqual({ id: 'document', deleted: true });
    expect(row.destroy).toHaveBeenCalledTimes(1);
    expect(exporter.capture).not.toHaveBeenCalled();
  });

  it('returns not found for a missing document', async () => {
    const service = new AdminDprDocumentService({ findByPk: jest.fn().mockResolvedValue(null) } as any, {} as any);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates a failed deletion', async () => {
    const service = new AdminDprDocumentService({ findByPk: jest.fn().mockResolvedValue({ destroy: jest.fn().mockRejectedValue(new Error('Delete failed')) }) } as any, {} as any);
    await expect(service.remove('document')).rejects.toThrow('Delete failed');
  });
});
