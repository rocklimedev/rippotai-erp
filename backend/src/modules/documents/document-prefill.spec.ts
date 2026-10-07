import { boqCategoriesFromPrefill, previousDocumentSteps } from './document-prefill';

describe('document predecessor sequence', () => {
  it('looks backward only, starting with the nearest preceding step', () => {
    const steps = previousDocumentSteps('scope-of-work')!;
    expect(steps.map(step => step.id)).toEqual(['site-recce', 'client-brief']);
    expect(previousDocumentSteps('client-brief')).toEqual([]);
    expect(previousDocumentSteps('unknown')).toBeNull();
  });
  it('prepares independent BOQ rows from the nearest available commercial document', () => {
    const groups = boqCategoriesFromPrefill({
      'material-procurement-sheet': { items: [{ id: 'source-item', materialMaster: { name: 'Tiles' }, quantity: '20', price: '50' }] },
      'estimates-quotations': { items: [{ particular: 'Older', quantity: 1, rate: 1 }] },
    });
    expect(groups[0].items[0]).toEqual(expect.objectContaining({ name: 'Tiles', quantity: 20, rate: 50 }));
    expect(groups[0].items[0]).not.toHaveProperty('id');
    expect(groups[0].items[0].amount).toBe(1000);
  });
  it('preserves lump sum amounts instead of replacing them with zero', () => {
    const groups = boqCategoriesFromPrefill({ 'business-proposal': { categories: [{ name: 'Works', items: [{ name: 'Design', calc_type: 'L', amount: 15000, quantity: 0, rate: 0 }] }] } });
    expect(groups[0].items[0]).toEqual(expect.objectContaining({ calc_type: 'L', amount: 15000 }));
  });
  it('excludes hidden or excluded source lines', () => {
    expect(boqCategoriesFromPrefill({ 'business-proposal': { categories: [{ name: 'Works', items: [{ name: 'Hidden', hidden: true }] }] } })).toEqual([]);
  });
});
