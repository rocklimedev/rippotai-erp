import { canReceiveSharedData, missingSharedFields } from './shared-project-data';

describe('shared document fields', () => {
  const mapping = { address: 'siteAddress', lift: 'liftAvailable', floors: 'numberOfFloors' };
  it('fills missing values including false and zero', () => {
    expect(missingSharedFields({ address: ' ' }, mapping, { siteAddress: 'Site A', liftAvailable: false, numberOfFloors: 0 }))
      .toEqual({ address: 'Site A', lift: false, floors: 0 });
  });
  it('preserves explicit values and ignores missing source values', () => {
    expect(missingSharedFields({ address: 'Custom', lift: false, floors: 0 }, mapping, { siteAddress: 'Other', liftAvailable: true, numberOfFloors: 2 }))
      .toEqual({});
    expect(missingSharedFields({}, mapping, { siteAddress: '' })).toEqual({});
  });
  it('protects approved, published and locked records', () => {
    for (const values of [{ status: 'APPROVED' }, { status: 'published' }, { status: 'draft', locked: true }]) {
      expect(canReceiveSharedData(values)).toBe(false);
    }
    expect(canReceiveSharedData({ status: 'DRAFT' })).toBe(true);
  });
});
