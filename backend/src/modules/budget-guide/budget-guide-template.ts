import { CreateBudgetGuideDto, GuidePlanDto } from './dto/budget-guide.dto';

// Reference prices are transcribed from the supplied PDF, not live market rates.
const heads = [
  [
    ['Excavation & Foundation', 7],
    ['RCC Frame & Slabs', 35],
    ['Masonry & Plaster', 13],
    ['Flooring & Tiling', 10],
    ['Doors & Windows', 9],
    ['Electricals', 8],
    ['Plumbing & Sanitary', 9],
    ['Painting', 6],
    ['Waterproofing', 3],
  ],
  [
    ['Foundation & Earthwork', 5],
    ['RCC Frame & Slabs', 28],
    ['Masonry & Plaster', 10],
    ['Flooring & Tiling', 11],
    ['Doors & Windows', 10],
    ['Electricals', 7],
    ['Plumbing & Sanitary', 9],
    ['Woodwork - Kitchen & Wardrobes', 9],
    ['Painting', 5],
    ['Waterproofing', 2],
    ['Common Area - Stairs, Lift, Lobby', 4],
  ],
  [
    ['Basement, Raft & Earthwork', 13],
    ['RCC Frame & Slabs', 19],
    ['Masonry & Plaster', 6],
    ['Flooring & Stone', 13],
    ['Doors & Windows', 9],
    ['Electricals & Automation', 8],
    ['Plumbing & Sanitary', 8],
    ['HVAC', 7],
    ['Woodwork & Modular', 10],
    ['Painting', 4],
    ['Waterproofing & Structural Treatment', 3],
  ],
];
type MaterialRow = [string, string, number, number, string, boolean?];
const materials: MaterialRow[][] = [
  [
    ['Cement', 'UltraTech / ACC / Ambuja - OPC 43 & 53 grade', 380, 430, 'bag'],
    [
      'Steel (TMT)',
      'Tata Tiscon / SAIL / Kamdhenu - Fe 500D',
      58000,
      68000,
      'MT',
    ],
    ['Blockwork', 'Fly ash blocks or local red brick', 9, 14, 'brick / block'],
    [
      'Floor Tiles',
      'Kajaria / Somany vitrified, 600 x 600 mm',
      45,
      60,
      'sq.ft.',
    ],
    [
      'Wall Tiles',
      'Kajaria / Somany ceramic - bath & kitchen',
      35,
      50,
      'sq.ft.',
    ],
    [
      'Sanitaryware',
      'Hindware / Cera; Jaquar Continental CP fittings',
      35000,
      50000,
      'toilet',
      true,
    ],
    [
      'Doors',
      'Pressed wood frame, flush shutter (Century / Greenply)',
      4500,
      7000,
      'door set',
    ],
    ['Windows', 'Local aluminium, 2-track glazed', 350, 450, 'sq.ft.'],
    [
      'Electricals',
      'Finolex / Polycab FR wiring; Havells / Anchor non-modular switches',
      130,
      170,
      'sq.ft. built-up',
    ],
    ['Interior Paint', 'OBD - Asian Tractor / Berger Bison', 18, 25, 'sq.ft.'],
    [
      'Exterior Paint',
      'Acrylic weather coat - Asian / Berger',
      28,
      38,
      'sq.ft.',
    ],
  ],
  [
    ['Cement', 'UltraTech / ACC / Shree - OPC 53 & PPC', 380, 440, 'bag'],
    ['Steel (TMT)', 'Tata Tiscon / JSW Neosteel - Fe 500D', 60000, 70000, 'MT'],
    [
      'Blockwork',
      'Fly ash / AAC hollow blocks (Biltech / Magicrete)',
      45,
      65,
      'sq.ft. of wall',
    ],
    ['Flooring - Stone', 'Indian marble, Morwad / Agaria', 90, 150, 'sq.ft.'],
    [
      'Flooring - Tile',
      'Large-format vitrified (Kajaria Eternity / Simpolo)',
      85,
      130,
      'sq.ft.',
    ],
    ['Bathroom Tiles', 'Kajaria / Nitco premium range', 70, 110, 'sq.ft.'],
    [
      'Sanitaryware',
      'Kohler / Jaquar Artize; concealed cisterns (Geberit / Jaquar)',
      90000,
      150000,
      'toilet',
      true,
    ],
    [
      'Main Door',
      'Teak frame with veneered flush shutter',
      35000,
      60000,
      'set',
    ],
    [
      'Internal Doors',
      'Hardwood frame with laminated flush shutter',
      9000,
      15000,
      'set',
    ],
    [
      'Windows',
      'uPVC - Fenesta / Deceuninck, with mosquito mesh',
      650,
      850,
      'sq.ft.',
    ],
    [
      'Electricals',
      'RR Kabel / Polycab FR-LSH; Schneider Livia / Legrand Myrius modular',
      230,
      300,
      'sq.ft. built-up',
    ],
    [
      'Modular Kitchen',
      'Laminate finish, Hettich / Ebco hardware',
      1400,
      1900,
      'sq.ft.',
    ],
    [
      'Wardrobes',
      'Commercial ply carcass, laminate shutters',
      1300,
      1700,
      'sq.ft.',
    ],
    [
      'Interior Paint',
      'Plastic emulsion - Asian Apcolite / Berger Silk',
      35,
      55,
      'sq.ft.',
    ],
    [
      'Exterior Finish',
      'Texture / silicone - Asian Apex Ultima',
      65,
      95,
      'sq.ft.',
    ],
    ['Staircase', 'Granite, 18-20 mm', 120, 180, 'sq.ft.'],
    ['Elevator', 'KONE / Otis - 4-6 passengers', 1200000, 1800000, 'lump sum'],
  ],
  [
    [
      'Cement',
      'UltraTech / ACC - OPC 53 with microsilica admixtures',
      400,
      470,
      'bag',
    ],
    ['Steel (TMT)', 'Tata Tiscon / JSW Neosteel - Fe 550D', 65000, 75000, 'MT'],
    [
      'Basement Walls',
      'M30-M35 RCC, crystalline waterproofing (Fosroc / Sika)',
      2200,
      3200,
      'sq.ft. of basement',
    ],
    [
      'Flooring - Marble',
      'Imported Italian - Botticino / Statuario / Dyna',
      350,
      900,
      'sq.ft.',
    ],
    [
      'Flooring - Wood',
      'Engineered - Pergo / Kährs / Quick-Step',
      300,
      550,
      'sq.ft.',
    ],
    [
      'Bathroom Cladding',
      'Imported marble or large-slab porcelain',
      400,
      850,
      'sq.ft.',
    ],
    [
      'Sanitaryware',
      'Toto / Grohe / Hansgrohe / Duravit; wall-hung automated closets',
      250000,
      500000,
      'toilet',
      true,
    ],
    [
      'Shower Cubicles',
      '12 mm toughened glass, Ozone / Dorma hardware',
      1100,
      1800,
      'sq.ft.',
    ],
    [
      'Main Door',
      'Solid teak wood frame with veneered / PU flush shutter',
      65000,
      120000,
      'set',
    ],
    [
      'Windows',
      'Thermally broken aluminium - Schüco / Alumil / Technal, DGU',
      1200,
      1800,
      'sq.ft.',
    ],
    [
      'Electricals',
      'Polycab / Havells LSZH; Lutron / Crestron / Schneider Wiser automation',
      450,
      800,
      'sq.ft. built-up',
    ],
    [
      'Modular Kitchen',
      'PU-lacquered, Häfele / Blum hardware',
      3500,
      6000,
      'sq.ft.',
    ],
    [
      'Countertops',
      'Quartz - Caesarstone / Silestone / Kalinga',
      450,
      900,
      'sq.ft.',
    ],
    [
      'Interior Paint',
      'Asian Royale / Berger Silk luxury emulsion',
      70,
      110,
      'sq.ft.',
    ],
    [
      'Exterior Finish',
      'Stone-grit / anti-fungal texture - Asian Ultima Protek',
      120,
      190,
      'sq.ft.',
    ],
    [
      'HVAC',
      'Daikin / Mitsubishi VRV-VRF, concealed ducted',
      280,
      400,
      'sq.ft. built-up',
    ],
  ],
];
export function budgetGuideTemplate(reference = false): CreateBudgetGuideDto {
  const keys = ['essential', 'signature', 'bespoke'] as const;
  const specifications = [
    'Standard Quality Construction',
    'Mid-Premium Builder Floor - Stilt + 4 Floors',
    'Full Luxury Specification - With Basement',
  ];
  const rates = [
    [2300, 3500],
    [3500, 4800],
    [5000, 6500],
  ];
  const plans: GuidePlanDto[] = keys.map((key, index) => ({
    key,
    name: key[0].toUpperCase() + key.slice(1),
    specification: reference ? specifications[index] : '',
    costing_mode: 'distribution',
    rate_low: reference ? rates[index][0] : 0,
    rate_high: reference ? rates[index][1] : 0,
    upper_open: reference && key === 'bespoke',
    cost_heads: reference
      ? heads[index].map(([name, share]) => ({
          name: String(name),
          share_percent: Number(share),
          items: [],
        }))
      : [],
    materials: reference
      ? materials[index].map(
          ([category, brand_make, rate_low, rate_high, unit, fitted]) => ({
            category,
            brand_make,
            rate_low,
            rate_high,
            unit,
            fitted: !!fitted,
            specification: '',
            notes: '',
          }),
        )
      : [],
  }));
  return {
    title: 'Specification & Budget Guide',
    project_id: null,
    project_type: reference ? 'Construction' : '',
    location: reference ? 'Delhi NCR' : '',
    prepared_by: '',
    currency: 'INR',
    area_unit: 'sq.ft.',
    built_up_area: null,
    issue_date: new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
    }).format(new Date()),
    validity_months: 6,
    rate_validity_days: 30,
    status: 'draft',
    introduction:
      'Three specification plans with indicative budgets, dedicated cost breakdowns and material rate schedules. Select a direction before drawings are costed. Rates are subject to revision.',
    plans,
    pricing_notes: [
      {
        heading: 'What this guide is',
        text: 'A planning document with indicative rates. It is not a quotation or an offer. The issued proposal and bill of quantities govern the final price.',
      },
      {
        heading: 'Two rate types',
        text: 'Cost distribution is per unit of built-up area. Material schedules are per material unit and are not added to the build cost. Itemized costing uses quantity multiplied by item rates instead of the percentage distribution.',
      },
      {
        heading: 'Area basis',
        text: 'Budgets use built-up area. Confirm the same measurement basis before comparing proposals.',
      },
      {
        heading: 'Rate confirmation',
        text: reference
          ? 'Reference rates from the supplied template are indicative for Delhi NCR. Re-confirm rates with vendors at ordering; these are not live market prices.'
          : 'Confirm prices, region, specifications and availability before ordering.',
      },
      {
        heading: 'Brands and equivalents',
        text: 'Named brands set the specification standard. Equivalent makes meeting the same grade and performance may be proposed with prior written intimation.',
      },
      {
        heading: 'Fitted rates',
        text: 'Fitted rates include supply, installation and associated labour. Other rates are supply-only unless stated otherwise.',
      },
      {
        heading: 'Exclusions',
        text: 'Statutory fees, authority charges, boring, external development charges and taxes are excluded unless expressly included in the proposal.',
      },
    ],
    next_steps: [
      {
        heading: 'Choose a plan',
        text: 'Select a specification tier or describe the intended use.',
      },
      {
        heading: 'Site visit',
        text: 'Measure the site, services and access, and identify cost implications.',
      },
      {
        heading: 'Bill of quantities',
        text: 'Prepare cost heads from drawings and confirm material and labour rates.',
      },
      {
        heading: 'Fixed proposal',
        text: 'Convert ranges into a priced proposal, payment schedule and programme.',
      },
    ],
  };
}
