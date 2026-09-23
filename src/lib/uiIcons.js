// Bosh sahifa dizaynidagi ikonkalar (SVG). Rang `currentColor` orqali CSS'dan olinadi.
const s = (w, h, body, sw = 2) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`

export const icons = {
  search: s(22, 22, '<circle cx="9.5" cy="9.5" r="7"/><path d="M15 15l5 5"/>'),
  camera: s(22, 20, '<path d="M3 5h3.5l1.6-2.5h5.8L15.5 5H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><circle cx="11" cy="11.5" r="3.6"/>', 1.8),
  pin: s(24, 30, '<path d="M12 28s10-9.3 10-16.5A10 10 0 0 0 2 11.5C2 18.7 12 28 12 28z"/><circle cx="12" cy="11.5" r="3.8"/>', 2.4),
  chevronUp: s(18, 12, '<path d="M2 10l7-7 7 7"/>', 2.4),
  chevronRight: s(10, 16, '<path d="M2 2l6 6-6 6"/>'),
  home: s(26, 26, '<path d="M3 11.5L13 3l10 8.5V22a1.5 1.5 0 0 1-1.5 1.5H16v-7h-6v7H4.5A1.5 1.5 0 0 1 3 22z"/>', 2.2),
  grid: s(26, 26, '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="15" y="3" width="8" height="8" rx="2"/><rect x="3" y="15" width="8" height="8" rx="2"/><rect x="15" y="15" width="8" height="8" rx="2"/>'),
  cart: s(28, 26, '<path d="M2 3h3.5l3 13h13l3-9H7"/><circle cx="10.5" cy="21.5" r="1.6"/><circle cx="20" cy="21.5" r="1.6"/>'),
  user: s(26, 26, '<circle cx="13" cy="8.5" r="5"/><path d="M3.5 24c1-5 4.8-7.5 9.5-7.5s8.5 2.5 9.5 7.5"/>'),
  qr: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.6"><rect x="3" y="3" width="10" height="10" rx="2.5"/><rect x="19" y="3" width="10" height="10" rx="2.5"/><rect x="3" y="19" width="10" height="10" rx="2.5"/></g><g fill="currentColor"><rect x="6.5" y="6.5" width="3" height="3" rx=".8"/><rect x="22.5" y="6.5" width="3" height="3" rx=".8"/><rect x="6.5" y="22.5" width="3" height="3" rx=".8"/><rect x="19" y="19" width="4" height="4" rx="1"/><rect x="25" y="19" width="4" height="4" rx="1"/><rect x="19" y="25" width="4" height="4" rx="1"/><rect x="25" y="25" width="4" height="4" rx="1"/></g></svg>`,
}

// "Saralangan bo'limlar" uchun toifa ikonkalari
export const categoryIcons = {
  pot: s(26, 26, '<path d="M4 11h18v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 11h22M10 7h6M13 4v3"/>'),
  chef: s(26, 26, '<path d="M8 20h10v3H8z"/><path d="M8 20v-5a5 5 0 1 1 2-9 4.5 4.5 0 0 1 8 2 4 4 0 0 1-2 7v5"/>'),
  cutlery: s(26, 26, '<path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v12M18 3c-2 2-2.5 5-2 9h2v11"/>'),
  bowl: s(26, 26, '<path d="M3 13h20a10 10 0 0 1-20 0z"/><path d="M9 4c1 1.5-1 2.5 0 4M13 3c1 1.5-1 2.5 0 4M17 4c1 1.5-1 2.5 0 4"/>'),
  apple: s(26, 26, '<path d="M13 8c-3-2-8-1-8 5 0 5 3 10 6 10 1 0 1.5-.5 2-.5s1 .5 2 .5c3 0 6-5 6-10 0-6-5-7-8-5z"/><path d="M13 8c0-2 1-4 3-5"/>'),
  plate: s(26, 26, '<circle cx="13" cy="13" r="10"/><circle cx="13" cy="13" r="4"/>'),
  box: s(26, 26, '<rect x="3" y="4" width="20" height="6" rx="1.5"/><path d="M5 10v11a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 21 21V10M10 14h6"/>'),
  mug: s(26, 26, '<path d="M4 9h14v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M18 11h1.5a3 3 0 0 1 0 6H18M8 3v3M12 3v3"/>'),
  glass: s(26, 26, '<path d="M7 3h12l-1.5 10a4.5 4.5 0 0 1-9 0z"/><path d="M13 17.5V23M9 23h8"/>'),
  knife: s(26, 26, '<path d="M4 22L20 6c2-2 3-1 2 1l-8 9-3-1-5 7z"/>'),
  textile: s(26, 26, '<path d="M4 7c3-3 6 3 9 0s6 3 9 0v12c-3 3-6-3-9 0s-6-3-9 0z"/>'),
  lamp: s(26, 26, '<path d="M9 18h8M10 22h6M13 3a6 6 0 0 1 3.5 10.9c-.6.4-1 1.1-1 1.9V18h-5v-2.2c0-.8-.4-1.5-1-1.9A6 6 0 0 1 13 3z"/>'),
  tag: s(26, 26, '<path d="M3 13V4a1 1 0 0 1 1-1h9l10 10-10 10z"/><circle cx="8.5" cy="8.5" r="1.8"/>'),
}

// Toifa nomidan mos ikonka (1C'dagi ruscha/o'zbekcha nomlar bo'yicha)
const RULES = [
  // Aniqroq qoidalar birinchi ("Миски и наборы" → kosa, "Сервизы и наборы" → servis)
  [/кастрюл|казан|qozon|kastryul/i, 'pot'],
  [/миск|пиал|салатник|kosa|piyola/i, 'bowl'],
  [/сковород|tova|вилк|ложк|прибор/i, 'cutlery'],
  [/блюд|фрукт|meva/i, 'apple'],
  [/тарел|likop|plate/i, 'plate'],
  [/емкост|хранен|банк|контейнер|сыпуч|idish|saqla/i, 'box'],
  [/кружк|чашк|чай|кофе|krujka|chashka|choy/i, 'mug'],
  [/стакан|бокал|рюмк|графин|stakan|qadah/i, 'glass'],
  [/нож|pichoq/i, 'knife'],
  [/текстил|полотен|плед|постел|to'qima|sochiq/i, 'textile'],
  [/освещ|ламп|svetil|chiroq/i, 'lamp'],
  [/распрод|скидк|aksiya|chegirma/i, 'tag'],
  [/сервиз|набор|servis|to'plam/i, 'chef'],
]
export function categoryIcon(name) {
  const hit = RULES.find(([re]) => re.test(String(name || '')))
  return categoryIcons[hit ? hit[1] : 'box']
}
