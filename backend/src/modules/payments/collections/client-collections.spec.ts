import { summarise } from './client-collections.service';

describe('client collections summary', () => {
  it('splits token and project payments and caps the percentage', () => {
    const s = summarise(1000, [
      { type: 'TOKEN', amount: 100 },
      { type: 'PROJECT_PAYMENT', amount: 250 },
    ]);
    expect(s).toEqual({ total: 1000, token: 100, payments: 250, collected: 350, balance: 650, pct: 35 });
    expect(summarise(100, [{ type: 'PROJECT_PAYMENT', amount: 150 }]).pct).toBe(100);
    expect(summarise(0, []).pct).toBe(0);
  });
});
