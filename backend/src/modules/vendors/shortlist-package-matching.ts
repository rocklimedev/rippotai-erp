import { Trade } from '@/common/enums/shortlist.enums';

// Exact normalized aliases avoid accidental substring matches (e.g. AC in facade).
const aliases: Record<Trade, string[]> = {
  [Trade.PLUMBER]: ['plumber', 'plumbing', 'sanitary', 'cp fittings'],
  [Trade.ELECTRICIAN]: ['electrician', 'electrical', 'electrical work'],
  [Trade.AC]: ['ac', 'hvac', 'air conditioning', 'ac piping drainage'],
  [Trade.POP]: ['pop', 'false ceiling', 'gypsum', 'ceiling'],
  [Trade.FLOORING]: ['flooring', 'tiles', 'tile work'],
  [Trade.CARPENTER]: [
    'carpentar',
    'carpenter',
    'carpentry',
    'woodwork',
    'wood work',
  ],
  [Trade.MS]: ['ms', 'metal work', 'ms work', 'mild steel'],
  [Trade.SOLAR]: ['solar', 'solar work'],
  [Trade.GLASS]: ['glass', 'glass work'],
  [Trade.PAINT]: ['paint', 'painting', 'paint work'],
  [Trade.CIVIL]: ['civil', 'civil work', 'civil building material'],
  [Trade.FACADE]: ['facade', 'facade work'],
};

export function matchesProjectTrade(trade: Trade, names: string[]): boolean {
  const normalized = new Set(
    names.map((name) =>
      name.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim(),
    ),
  );
  return aliases[trade].some((name) => normalized.has(name));
}
