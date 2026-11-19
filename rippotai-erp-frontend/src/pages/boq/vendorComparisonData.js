export const quoteAmount = (item) =>
  item.rate === null || item.rate === ""
    ? null
    : (item.quantity ?? 1) * Number(item.rate);
export const quoteTotal = (vendor) =>
  vendor.items.reduce((sum, item) => sum + (quoteAmount(item) ?? 0), 0);
export const completeQuote = (vendor) =>
  Boolean(vendor?.items.length) &&
  vendor.items.every(
    (item) =>
      item.description.trim() &&
      item.rate !== null &&
      item.rate !== "" &&
      Number.isFinite(quoteAmount(item)),
  );

// Convert historical saved quotes without fetching a BOQ or changing their values.
export function comparisonTrades(snapshot) {
  if (snapshot?.schema_version === 2)
    return snapshot.trades.map(sharedComparisonTrade);
  return (snapshot?.boq?.categories || [])
    .map((category) => ({
      id: category.id,
      name: category.name,
      finalised_vendor_id: snapshot.finalised_vendors?.[category.id] || "",
      vendors: (snapshot.selected_vendor_ids || []).map((id) => ({
        id,
        name:
          snapshot.vendor_names?.[id] ||
          snapshot.vendors?.find((v) => v.id === id)?.name ||
          "Vendor",
        items: category.items.flatMap((item) => {
          const rate = snapshot.vendor_rates?.[`${item.id}__${id}`];
          return rate === undefined || rate === "" || rate === null
            ? []
            : [
                {
                  id: item.id,
                  description: item.description,
                  quantity: item.quantity ?? null,
                  ...(item.unit ? { unit: item.unit } : {}),
                  rate: Number(rate),
                },
              ];
        }),
      })),
    }))
    .map(sharedComparisonTrade);
}

// Align historical independent scopes by description, quantity and occurrence.
// Different scopes remain separate rows; quoted rates and totals are preserved.
export function sharedComparisonTrade(trade) {
  if (Array.isArray(trade.items))
    return withComparisonItems(trade, trade.items);
  const items = [];
  const indices = new Map();
  const vendors = trade.vendors.map((vendor) => {
    const occurrences = new Map();
    const aligned = [];
    vendor.items.forEach((item) => {
      const base = JSON.stringify([
        item.description.trim().replace(/\s+/g, " ").toLowerCase(),
        item.quantity,
        item.unit || "",
      ]);
      const occurrence = occurrences.get(base) || 0;
      occurrences.set(base, occurrence + 1);
      const key = `${base}:${occurrence}`;
      if (!indices.has(key)) {
        const id = items.some((row) => row.id === item.id)
          ? `shared-${trade.id}-${items.length}`
          : item.id;
        indices.set(key, items.length);
        items.push({
          id,
          description: item.description,
          quantity: item.quantity,
          ...(item.unit ? { unit: item.unit } : {}),
        });
      }
      aligned.push({ ...item, id: items[indices.get(key)].id });
    });
    return { ...vendor, items: aligned };
  });
  return withComparisonItems({ ...trade, vendors }, items);
}

export function withComparisonItems(trade, items) {
  return {
    ...trade,
    items,
    vendors: trade.vendors.map((vendor, index) => ({
      ...vendor,
      slot: vendor.slot ?? index,
      items: items.map((item) => ({
        ...item,
        rate: vendor.items.find((quote) => quote.id === item.id)?.rate ?? null,
      })),
    })),
  };
}
export const tradeNameKey = (name) =>
  String(name)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*\(\d+\)$/, "")
    .toLowerCase();
export const createDefaultTrades = (catalogue) =>
  catalogue.map(({ id, name }) => ({
    id,
    name,
    vendors: [],
    items: [],
    finalised_vendor_id: "",
  }));
