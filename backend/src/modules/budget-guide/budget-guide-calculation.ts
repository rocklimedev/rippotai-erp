import { BadRequestException } from '@nestjs/common';
import { CreateBudgetGuideDto } from './dto/budget-guide.dto';

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
function range(low: number, high: number, label: string) {
  if (!Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high < low)
    throw new BadRequestException(
      `${label}: upper rate must be at least the lower rate.`,
    );
}
export function calculateGuide(guide: CreateBudgetGuideDto) {
  if (
    !Array.isArray(guide.plans) ||
    guide.plans.length !== 3 ||
    new Set(guide.plans.map((p) => p.key)).size !== 3 ||
    guide.plans.some(
      (p) => !['essential', 'signature', 'bespoke'].includes(p.key),
    )
  )
    throw new BadRequestException(
      'A budget guide requires exactly three distinct plans.',
    );
  if (!guide.title?.trim() || guide.plans.some((p) => !p.name?.trim()))
    throw new BadRequestException('Guide and plan names cannot be blank.');
  const warnings: string[] = [];
  const area = guide.built_up_area == null ? null : Number(guide.built_up_area);
  const plans = guide.plans.map((plan) => {
    range(plan.rate_low, plan.rate_high, plan.name);
    const share_total = round(
      plan.cost_heads.reduce((sum, head) => sum + head.share_percent, 0),
    );
    if (plan.costing_mode === 'distribution' && share_total !== 100)
      warnings.push(
        `${plan.name}: cost shares total ${share_total}%; they must total 100% before publishing.`,
      );
    let item_low = 0,
      item_high = 0;
    const cost_heads = plan.cost_heads.map((head) => {
      if (!head.name?.trim())
        throw new BadRequestException('Cost head name cannot be blank.');
      const items = head.items.map((item) => {
        range(item.rate_low, item.rate_high, item.name);
        const amount_low = round(item.quantity * item.rate_low),
          amount_high = round(item.quantity * item.rate_high);
        return { ...item, amount_low, amount_high };
      });
      const items_total_low = round(
        items.reduce((sum, item) => sum + item.amount_low, 0),
      );
      const items_total_high = round(
        items.reduce((sum, item) => sum + item.amount_high, 0),
      );
      item_low += items_total_low;
      item_high += items_total_high;
      const rate_low = round((plan.rate_low * head.share_percent) / 100);
      const rate_high = round((plan.rate_high * head.share_percent) / 100);
      return {
        ...head,
        items,
        rate_low,
        rate_high,
        items_total_low,
        items_total_high,
        amount_low:
          plan.costing_mode === 'itemized'
            ? items_total_low
            : area == null
              ? null
              : round(rate_low * area),
        amount_high:
          plan.costing_mode === 'itemized'
            ? items_total_high
            : area == null
              ? null
              : round(rate_high * area),
      };
    });
    for (const material of plan.materials)
      range(material.rate_low, material.rate_high, material.category);
    if (
      guide.status === 'published' &&
      (!plan.cost_heads.length ||
        !plan.materials.length ||
        (plan.costing_mode === 'distribution' &&
          (share_total !== 100 || plan.rate_low <= 0)) ||
        (plan.costing_mode === 'itemized' && item_high <= 0))
    )
      throw new BadRequestException(
        `${plan.name}: complete the cost breakdown and material schedule before publishing; distribution shares must total 100%.`,
      );
    const total_low =
      plan.costing_mode === 'itemized'
        ? round(item_low)
        : area == null
          ? null
          : round(plan.rate_low * area);
    const total_high =
      plan.costing_mode === 'itemized'
        ? round(item_high)
        : area == null
          ? null
          : round(plan.rate_high * area);
    if ((total_high ?? 0) > 999999999999.99 || item_high > 999999999999.99)
      throw new BadRequestException(
        `${plan.name}: total exceeds supported budget size.`,
      );
    return {
      ...plan,
      cost_heads,
      share_total,
      items_total_low: round(item_low),
      items_total_high: round(item_high),
      total_low,
      total_high,
    };
  });
  const issued = new Date(`${guide.issue_date}T00:00:00Z`);
  const validity = new Date(issued);
  // Clamp to the target month's last day (e.g. August 31 + six months).
  validity.setUTCDate(1);
  validity.setUTCMonth(validity.getUTCMonth() + guide.validity_months);
  const last = new Date(
    Date.UTC(validity.getUTCFullYear(), validity.getUTCMonth() + 1, 0),
  ).getUTCDate();
  validity.setUTCDate(Math.min(issued.getUTCDate(), last));
  const rates = new Date(issued);
  rates.setUTCDate(rates.getUTCDate() + guide.rate_validity_days);
  return {
    plans,
    warnings,
    valid_until: validity.toISOString().slice(0, 10),
    rates_valid_until: rates.toISOString().slice(0, 10),
  };
}
