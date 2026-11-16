import {
  linesFromComparison,
  quotationTotals,
} from './procurement-quotations.service';

const snapshot = {
  boq: {
    categories: [
      {
        id: 'c1',
        name: 'Civil Work',
        items: [
          {
            id: 'i1',
            description: 'Demolition',
            specification: 'Spec A',
            unit: 'sqft',
            quantity: 100,
          },
          {
            id: 'i2',
            description: 'Debris removal',
            specification: '-',
            unit: '-',
            quantity: 0,
          },
          { id: 'i3', description: 'Not quoted', quantity: 5 },
        ],
      },
      {
        id: 'c2',
        name: 'Electrical',
        items: [{ id: 'i4', description: 'Wiring', quantity: 10 }],
      },
    ],
  },
  finalised_vendors: { c1: 'v1', c2: 'v2' },
  vendor_rates: { i1__v1: '12.5', i2__v1: 900, i4__v2: '30' },
  rows: [{ item_id: 'i3', quotes: [{ vendor_id: 'v1', rate: 0 }] }],
};

describe('procurement quotation lines', () => {
  it('takes only the categories finalised for the vendor, with its quoted rates', () => {
    const lines = linesFromComparison(snapshot, 'v1', 18);
    expect(lines.map((l) => l.item_name)).toEqual([
      'Demolition',
      'Debris removal',
    ]);
    expect(lines[0]).toMatchObject({
      category_name: 'Civil Work',
      description: 'Spec A',
      unit: 'sqft',
      quantity: 100,
      rate: 12.5,
      tax_percent: 18,
      source_item_id: 'i1',
    });
    expect(lines[1].unit).toBeUndefined();
    expect(linesFromComparison(snapshot, 'v2').map((l) => l.item_name)).toEqual(
      ['Wiring'],
    );
    expect(linesFromComparison(snapshot, 'v3')).toEqual([]);
  });

  it('totals amount (qty × rate, or the rate for lump sums) and tax', () => {
    const t = quotationTotals([
      { item_name: 'a', quantity: 100, rate: 12.5, tax_percent: 18 },
      { item_name: 'b', quantity: 0, rate: 900 },
    ]);
    expect(t.rows).toEqual([
      { amount: 1250, tax: 225 },
      { amount: 900, tax: 0 },
    ]);
    expect(t).toMatchObject({ subtotal: 2150, tax: 225, total: 2375 });
  });
});

// The new trade snapshot is consumed directly when creating a quotation.
describe('vendor-only comparison quotation lines', () => {
  it('preserves independent scope, lump sums, discounts and zero amounts', () => {
    const lines = linesFromComparison(
      {
        schema_version: 2,
        trades: [
          {
            name: 'Civil',
            finalised_vendor_id: 'v1',
            vendors: [
              {
                id: 'v1',
                items: [
                  {
                    id: 'i1',
                    description: 'Work',
                    quantity: null,
                    rate: 130000,
                  },
                  {
                    id: 'i2',
                    description: 'Discount',
                    quantity: null,
                    rate: -1000,
                  },
                  {
                    id: 'i3',
                    description: 'Unused option',
                    quantity: 0,
                    rate: 100,
                  },
                ],
              },
            ],
          },
          { name: 'Other', finalised_vendor_id: 'v2', vendors: [] },
        ],
      },
      'v1',
    );
    expect(lines.map((l) => l.item_name)).toEqual([
      'Work',
      'Discount',
      'Unused option',
    ]);
    expect(quotationTotals(lines).total).toBe(129000);
    expect(lines[0].category_name).toBe('Civil');
  });
});
