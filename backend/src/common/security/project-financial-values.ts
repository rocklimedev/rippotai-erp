export const PROJECT_FINANCIAL_VALUES_PERMISSION =
  'project-financial-values:read';
export const PROJECT_FINANCIAL_VALUES_PART = 'projects.financial-values';

const documentResources = new Set([
  'boq',
  'boq-templates',
  'payment-schedules',
  'vendor-rate-comparisons',
]);

// Keys are normalized so model attributes, SQL aliases, and nested DTOs
// follow the same policy.
const projectFields = new Set([
  'approvedvalue',
  'clientbudget',
  'initialclientbudget',
  'projectvalue',
  'approvedboqestimate',
  'committedcost',
  'projectedfinalcost',
  'costvariationpct',
]);

const monetaryFields = new Set([
  'amount',
  'amountlabel',
  'budget',
  'budgetvalue',
  'proposalamount',
  'contractvalue',
  'totalcontractvalue',
  'committed',
  'grandtotal',
  'totalvalue',
  'subtotal',
  'price',
  'unitprice',
  'rate',
  'unitrate',
  'totalpayable',
  'payable',
  'paid',
  'outstanding',
  'collectionrate',
  'stockvalue',
  'openvalue',
  'wonvalue',
  'lostvalue',
  'totalcost',
  'estimatedcost',
  'unitcost',
  'estimatesubtotal',
  'amountlow',
  'amounthigh',
  'ratelow',
  'ratehigh',
  'totallow',
  'totalhigh',
  'itemstotallow',
  'itemstotalhigh',
  'vendorrates',
  'vendortotals',
]);
const collectionFields = new Set([
  'total',
  'totals',
  'totalsource',
  'token',
  'payments',
  'collected',
  'balance',
  'pct',
]);

export function isProjectFinancialField(
  key: string,
  routePermission?: string,
  routePath?: string,
  controllerPath?: string,
  dashboardApp?: string,
): boolean {
  const field = key.replaceAll('_', '').toLowerCase();
  if (projectFields.has(field)) return true;
  if (controllerPath === 'client-collections') {
    return field === 'amount' || collectionFields.has(field);
  }
  if (documentResources.has(routePermission?.split(':')[0] ?? '')) return false;
  // A purpose-bound client link authorizes reading the BOQ being approved.
  if (controllerPath === 'public/client/:token' && routePath === 'boq/:boqId')
    return false;

  if (field === 'value') {
    return (
      (controllerPath === 'command-center' && routePath === 'kpis') ||
      controllerPath === 'command-center/authority' ||
      (controllerPath === 'dashboards' &&
        routePath === 'data/:app' &&
        ['materials', 'procurement'].includes(dashboardApp ?? '')) ||
      routePermission?.startsWith('budget-estimates:') === true
    );
  }
  if (controllerPath === 'command-center/authority' && field === 'money')
    return true;
  if (controllerPath === 'leads' && routePath === 'board' && field === 'total')
    return true;
  if (controllerPath === 'leads' && routePath === 'review' && field === 'sub')
    return true;
  if (routePermission?.startsWith('client-portal:') && field === 'total')
    return true;
  // Some feeds use "paid" for a count.
  if (field === 'paid' && controllerPath !== 'dashboards') return false;
  return monetaryFields.has(field) || field.endsWith('amount');
}
