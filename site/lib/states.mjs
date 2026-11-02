// The 50 states and DC: English and US Spanish names, URL slugs and land neighbours (for the
// "neighbouring states" links on every state page). Alaska and Hawaii have none; the generator
// pads every page with the alphabetically nearest published states instead.
const ROWS = [
  ['AL', 'Alabama', 'Alabama', 'FL GA MS TN'], ['AK', 'Alaska', 'Alaska', ''], ['AZ', 'Arizona', 'Arizona', 'CA CO NM NV UT'],
  ['AR', 'Arkansas', 'Arkansas', 'LA MO MS OK TN TX'], ['CA', 'California', 'California', 'AZ NV OR'], ['CO', 'Colorado', 'Colorado', 'AZ KS NE NM OK UT WY'],
  ['CT', 'Connecticut', 'Connecticut', 'MA NY RI'], ['DE', 'Delaware', 'Delaware', 'MD NJ PA'], ['DC', 'District of Columbia', 'Distrito de Columbia', 'MD VA'],
  ['FL', 'Florida', 'Florida', 'AL GA'], ['GA', 'Georgia', 'Georgia', 'AL FL NC SC TN'], ['HI', 'Hawaii', 'Hawái', ''],
  ['ID', 'Idaho', 'Idaho', 'MT NV OR UT WA WY'], ['IL', 'Illinois', 'Illinois', 'IN IA KY MO WI'], ['IN', 'Indiana', 'Indiana', 'IL KY MI OH'],
  ['IA', 'Iowa', 'Iowa', 'IL MN MO NE SD WI'], ['KS', 'Kansas', 'Kansas', 'CO MO NE OK'], ['KY', 'Kentucky', 'Kentucky', 'IL IN MO OH TN VA WV'],
  ['LA', 'Louisiana', 'Luisiana', 'AR MS TX'], ['ME', 'Maine', 'Maine', 'NH'], ['MD', 'Maryland', 'Maryland', 'DE PA VA WV DC'],
  ['MA', 'Massachusetts', 'Massachusetts', 'CT NH NY RI VT'], ['MI', 'Michigan', 'Míchigan', 'IN OH WI'], ['MN', 'Minnesota', 'Minnesota', 'IA ND SD WI'],
  ['MS', 'Mississippi', 'Misisipi', 'AL AR LA TN'], ['MO', 'Missouri', 'Misuri', 'AR IL IA KS KY NE OK TN'], ['MT', 'Montana', 'Montana', 'ID ND SD WY'],
  ['NE', 'Nebraska', 'Nebraska', 'CO IA KS MO SD WY'], ['NV', 'Nevada', 'Nevada', 'AZ CA ID OR UT'], ['NH', 'New Hampshire', 'Nuevo Hampshire', 'ME MA VT'],
  ['NJ', 'New Jersey', 'Nueva Jersey', 'DE NY PA'], ['NM', 'New Mexico', 'Nuevo México', 'AZ CO OK TX'], ['NY', 'New York', 'Nueva York', 'CT MA NJ PA VT'],
  ['NC', 'North Carolina', 'Carolina del Norte', 'GA SC TN VA'], ['ND', 'North Dakota', 'Dakota del Norte', 'MN MT SD'], ['OH', 'Ohio', 'Ohio', 'IN KY MI PA WV'],
  ['OK', 'Oklahoma', 'Oklahoma', 'AR CO KS MO NM TX'], ['OR', 'Oregon', 'Oregón', 'CA ID NV WA'], ['PA', 'Pennsylvania', 'Pensilvania', 'DE MD NJ NY OH WV'],
  ['RI', 'Rhode Island', 'Rhode Island', 'CT MA'], ['SC', 'South Carolina', 'Carolina del Sur', 'GA NC'], ['SD', 'South Dakota', 'Dakota del Sur', 'IA MN MT NE ND WY'],
  ['TN', 'Tennessee', 'Tennessee', 'AL AR GA KY MS MO NC VA'], ['TX', 'Texas', 'Texas', 'AR LA NM OK'], ['UT', 'Utah', 'Utah', 'AZ CO ID NV WY'],
  ['VT', 'Vermont', 'Vermont', 'MA NH NY'], ['VA', 'Virginia', 'Virginia', 'KY MD NC TN WV DC'], ['WA', 'Washington', 'Washington', 'ID OR'],
  ['WV', 'West Virginia', 'Virginia Occidental', 'KY MD OH PA VA'], ['WI', 'Wisconsin', 'Wisconsin', 'IL IA MI MN'], ['WY', 'Wyoming', 'Wyoming', 'CO ID MT NE SD UT'],
];

export const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const STATES = Object.fromEntries(ROWS.map(([code, en, es, n]) => [code, { code, en, es, slug: { en: slugify(en), es: slugify(es) }, neighbours: n ? n.split(' ') : [] }]));
export const STATE_CODES = ROWS.map((r) => r[0]);
