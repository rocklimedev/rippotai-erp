import { NotFoundException } from '@nestjs/common';
import { DailySiteReportService } from './daily-site-report.service';

describe('daily site report deletion', () => {
  function setup(status = 'DRAFT') {
    const transaction = {};
    const report = { status, destroy: jest.fn().mockResolvedValue(undefined) };
    const reports = { findByPk: jest.fn().mockResolvedValue(report) };
    const manpower = { destroy: jest.fn().mockResolvedValue(1) };
    const sequelize = { transaction: jest.fn((callback) => callback(transaction)) };
    const service = new DailySiteReportService(reports as any, manpower as any, {} as any, sequelize as any);
    return { service, reports, report, manpower, transaction };
  }

  it.each(['DRAFT', 'SUBMITTED'])('deletes a %s report and manpower in one transaction', async (status) => {
    const { service, report, manpower, transaction } = setup(status);
    await expect(service.deleteReport('report')).resolves.toEqual({ id: 'report', deleted: true });
    expect(manpower.destroy).toHaveBeenCalledWith({ where: { dailySiteReportId: 'report' }, transaction });
    expect(report.destroy).toHaveBeenCalledWith({ transaction });
  });

  it('does not delete manpower for a missing report', async () => {
    const { service, reports, manpower } = setup();
    reports.findByPk.mockResolvedValue(null as any);
    await expect(service.deleteReport('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(manpower.destroy).not.toHaveBeenCalled();
  });

  it('propagates failures to roll back the transaction', async () => {
    const { service, report } = setup();
    report.destroy.mockRejectedValue(new Error('Delete failed'));
    await expect(service.deleteReport('report')).rejects.toThrow('Delete failed');
  });
});
