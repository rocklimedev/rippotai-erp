export const SHEET_COLUMNS = {
  serialNo: '#',
  area: 'Area',
  location: 'Location',
  material: 'Material',
  brand: 'Brand',
  wallArea: 'Wall (Sq.ft)',
  floorArea: 'Floor (Sq.ft)',
  ceilingArea: 'Ceiling (Sq.ft)',
  totalArea: 'Total Area',
  quantity: 'Quantity',
  price: 'Price',
  amount: 'Amount',
};

export const EDIT_COLUMNS = Object.keys(SHEET_COLUMNS);
export const RECORD_COLUMNS = [
  ...EDIT_COLUMNS.slice(0, 5), 'name', 'code', ...EDIT_COLUMNS.slice(5),
];

export const customColumn = (index) => `custom-${index}`;
export const customColumnIndex = (column) => Number(column.slice('custom-'.length));

export function procurementColumnOrder(sheet, record = false) {
  const customColumns = (sheet?.customFields ?? []).map((_, index) => customColumn(index));
  const order = [...new Set([...(sheet?.columnOrder ?? []), ...EDIT_COLUMNS, ...customColumns])]
    .filter((column) => EDIT_COLUMNS.includes(column) || customColumns.includes(column));

  if (record) order.splice(order.indexOf('brand') + 1, 0, 'name', 'code');
  return order;
}

export function placeProcurementColumn(order, column, anchor, side) {
  const next = order.filter((key) => key !== column);
  const index = next.indexOf(anchor);
  next.splice(index < 0 ? next.length : index + (side === 'after' ? 1 : 0), 0, column);
  return next;
}
