import { BoqService } from './boq.service';
import { LibraryService } from './library.service';

describe('BOQ reusable category items', () => {
  function setup() {
    const service: any = Object.create(BoqService.prototype);
    const transaction = {};
    const row = { id: 'row', name: 'New item', update: jest.fn() };
    Object.assign(service, {
      getOrThrow: jest.fn().mockResolvedValue({}), assertEditable: jest.fn(),
      getCategoryOrThrow: jest.fn().mockResolvedValue({ id: 'cat', name: 'Civil' }),
      itemModel: { max: jest.fn().mockResolvedValue(4), create: jest.fn().mockResolvedValue(row) },
      categoryModel: { create: jest.fn().mockResolvedValue({ id: 'cat', name: 'Civil' }) },
      sequelize: { transaction: jest.fn((fn) => fn(transaction)) },
      library: { saveBoqItem: jest.fn(), categoryItems: jest.fn().mockResolvedValue({ category: { name: 'Civil' }, items: [{ id: 'lib', name: 'Brickwork', default_rate: '125.00', notes: '<b>Spec</b><br><br>Next' }] }) },
      recomputeTotal: jest.fn(), activity: { log: jest.fn() }, findOne: jest.fn().mockResolvedValue({ id: 'boq' }),
    });
    return { service, transaction, row };
  }
  it('saves new rows and shared defaults in the same transaction, after existing rows', async () => {
    const { service, transaction, row } = setup();
    await service.addItem('boq', { boq_category_id: 'cat', name: 'New item', quantity: 2, rate: 10 });
    expect(service.itemModel.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'New item', amount: 20, sort_order: 5 }), { transaction });
    expect(service.library.saveBoqItem).toHaveBeenCalledWith(row, 'Civil', transaction);
    expect(service.recomputeTotal).toHaveBeenCalledWith('boq', transaction);
  });
  it('rejects unnamed rows rather than saving an invisible description', async () => {
    const { service } = setup();
    await expect(service.addItem('boq', { boq_category_id: 'cat', description: 'Wrong field' })).rejects.toThrow('Item name is required');
    expect(service.itemModel.create).not.toHaveBeenCalled();
  });
  it('autofills a library category in a different BOQ with numeric rates and intact notes', async () => {
    const { service, transaction } = setup();
    await service.addCategory('another-boq', { name: 'Civil', library_category_id: 'global-category', include_items: true });
    expect(service.library.categoryItems).toHaveBeenCalledWith('Civil', 'global-category');
    expect(service.itemModel.create).toHaveBeenCalledWith(expect.objectContaining({ library_item_id: 'lib', quantity: 1, rate: 125, amount: 125, notes: '<b>Spec</b><br><br>Next' }), { transaction });
  });
  it('honours an explicitly empty category', async () => {
    const { service } = setup();
    await service.addCategory('boq', { name: 'Civil', include_items: false });
    expect(service.itemModel.create).not.toHaveBeenCalled();
  });
  it('does not silently succeed when the shared library save fails', async () => {
    const { service } = setup();
    service.library.saveBoqItem.mockRejectedValue(new Error('storage unavailable'));
    await expect(service.addItem('boq', { boq_category_id: 'cat', name: 'New item' })).rejects.toThrow('storage unavailable');
    expect(service.findOne).not.toHaveBeenCalled();
  });
});

describe('Library defaults from BOQ edits', () => {
  it('updates reusable fields and links the row without changing any other BOQ snapshot', async () => {
    const library = { id: 'lib', category_name: 'Civil', update: jest.fn() };
    const model = { findByPk: jest.fn().mockResolvedValue(library) };
    const service: any = new LibraryService(model as any, {} as any, {} as any, {} as any);
    service.resolveCategory = jest.fn().mockResolvedValue({ id: 'global-cat', name: 'Civil' });
    const row = { name: 'Brickwork', library_item_id: 'lib', quantity: 99, rate: '25.00', unit: 'sqft', notes: '<b>Keep</b><br><br>Spacing', update: jest.fn() };
    const transaction = {};
    await service.saveBoqItem(row, 'Civil', transaction);
    expect(library.update).toHaveBeenCalledWith(expect.objectContaining({ default_rate: 25, notes: row.notes, category_id: 'global-cat' }), { transaction });
    expect(library.update.mock.calls[0][0]).not.toHaveProperty('quantity');
    expect(row.update).toHaveBeenCalledWith({ library_item_id: 'lib' }, { transaction });
  });
});
