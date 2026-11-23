import {
  buildBudgetModel,
  inr,
  qty2,
  renderBudgetFlow,
  renderBudgetHtml,
  rupees,
  termsItems,
} from './boq-budget-layout';

const boq = {
  title: 'Extension Works',
  date: '2026-11-02',
  project: {
    name: 'Jain Residence',
    site_location: '102 Tagore park, DELHI-110009',
  },
  categories: [
    {
      name: 'Civil Work — Extension',
      sort_order: 0,
      items: [
        {
          name: 'Demolition & Dismantling',
          notes: '<p>Demolition works at Ground &amp; First Floor.</p>',
          location: 'GF & FF',
          unit: 'sqft',
          quantity: '4060.00',
          rate: '35.00',
          amount: '142100.00',
          calc_type: 'M',
          detail: { brand: 'Chhabra Marble' },
          sort_order: 0,
        },
        {
          name: 'Floor Levelling',
          notes: 'Kachi rori bed.',
          unit: 'SQFT',
          quantity: 3500,
          rate: 0,
          amount: 85000,
          calc_type: 'L',
          sort_order: 1,
        },
        {
          name: 'Internal row',
          unit: 'NOS',
          quantity: 1,
          rate: 500,
          amount: 500,
          hidden: true,
          sort_order: 2,
        },
      ],
    },
  ],
  miscellaneous: [{ name: 'Contingency', value: 1000, notes: null }],
  design_amount: 0,
  execution_amount: 0,
  supervisor_amount: 0,
  additional_total: 0,
  project_total: 227600,
  final_total: 228600,
};

describe('BOQ Budget Breakdown layout (user template)', () => {
  it('formats money, quantities and the estimate total like the template', () => {
    expect(inr(775560)).toBe('7,75,560');
    expect(rupees(142100)).toBe('₹1,42,100');
    expect(rupees(12.5)).toBe('₹12.50');
    expect(qty2('4060')).toBe('4060.00');
  });

  it('builds the client copy: hidden rows dropped, L.S rate, "name — description", remarks', () => {
    const m = buildBudgetModel(boq, { variant: 'client', monogramSrc: '' });
    expect(m.title).toBe('Budget Breakdown');
    expect(m.subtitle).toBe('Extension Works · 02 Nov 2026');
    expect(m.projectName).toBe('Jain Residence');
    expect(m.address).toBe('102 Tagore park, DELHI-110009');
    expect(m.estimateTotal).toBe('2,28,600');
    const rows = m.groups[0].rows;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      sno: 1,
      description:
        'Demolition & Dismantling — Demolition works at Ground & First Floor.',
      remarks: 'Chhabra Marble',
      unit: 'SQFT',
      qty: '4060.00',
      rate: '₹35',
      amount: '₹1,42,100',
    });
    expect(rows[1].rate).toBe('L.S');
    expect(m.summary).toEqual([
      ['Project Total', '₹2,27,600'],
      ['Contingency', '₹1,000'],
    ]);
    expect(m.finalTotal).toBe('₹2,28,600');
  });

  it('renders the template structure: no cover, grey header, green subtotal, cost summary', () => {
    const html = renderBudgetHtml(
      buildBudgetModel(boq, { variant: 'internal', monogramSrc: 'x.png' }),
    );
    expect(html).not.toContain('cover');
    expect(html).toContain('aria-level="1">Budget Breakdown</div>');
    expect(html).toContain('Extension Works · Internal copy · 02 Nov 2026');
    expect(html).toContain('Estimate Total');
    expect(html).toContain('<th>S.No</th><th>Description</th><th>Location</th>');
    expect(html).toContain('Subtotal — Civil Work (Extension)');
    expect(html).toContain('Cost Summary');
    expect(html).toContain('Final Total');
    expect(html).toContain('Internal row'); // internal copy keeps hidden rows
    expect(html).toContain('@page{size:A4;margin:0;}');
  });

  it('quantity-only copy has no prices; vendor enquiry gets blank rate/amount columns', () => {
    const q = renderBudgetFlow(
      buildBudgetModel(boq, { variant: 'quantity_only', monogramSrc: '' }),
    );
    expect(q).not.toContain('Rate</th>');
    expect(q).not.toContain('₹');
    expect(q).not.toContain('Estimate Total');
    const v = renderBudgetFlow(
      buildBudgetModel(boq, { variant: 'vendor_enquiry', monogramSrc: '' }),
    );
    expect(v).toContain('<th class="r">Rate</th>');
    expect(v).not.toContain('₹');
  });

  it('numbers terms and bolds "Label:" lead words', () => {
    expect(
      termsItems(
        '<ol><li>Debris shifted under Item 4.</li><li>Exclusions: Any additional work.</li></ol>',
      ),
    ).toEqual([
      { label: '', body: 'Debris shifted under Item 4.' },
      { label: 'Exclusions', body: 'Any additional work.' },
    ]);
    const html = renderBudgetFlow(
      buildBudgetModel(boq, {
        variant: 'client',
        monogramSrc: '',
        terms: '<p>1. Exclusions: Extra work.</p>',
      }),
    );
    expect(html).toContain('Terms &amp; Conditions');
    expect(html).toContain('<li><b>Exclusions</b>: Extra work.</li>');
  });
});
