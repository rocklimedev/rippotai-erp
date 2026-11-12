import { CalendarService } from './calendar.service';

describe('calendar events owned by visit assignments', () => {
  it('requires editing and cancelling through Site Operations', async () => {
    const event = { visit_assignment_id: 1, update: jest.fn(), destroy: jest.fn() };
    const model: any = { findByPk: jest.fn().mockResolvedValue(event) };
    const service = new CalendarService(model, {} as any, {} as any);
    await expect(service.update('event', { title: 'Changed' })).rejects.toThrow('visit assignment');
    await expect(service.remove('event')).rejects.toThrow('visit assignment');
    expect(event.update).not.toHaveBeenCalled();
    expect(event.destroy).not.toHaveBeenCalled();
  });
});
