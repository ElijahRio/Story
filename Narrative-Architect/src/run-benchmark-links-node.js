import { performance } from 'perf_hooks';

// Mock 5000 entities
const entities = Array.from({ length: 5000 }).map((_, i) => ({
  id: `e-${i}`,
  name: `The Asset ${i} (Clone)`,
  description: `This is a test description for entity ${i} that might mention The Asset 10 or Asset 20.`,
}));

const currentId = 'e-0';
const textFields = [
  "This is field 1 mentioning The Asset 100",
  "Field 2 with Asset 200",
  "Field 3 with nothing",
  "Field 4 mentioning The Asset 3000"
];

const safeString = (val) => val ? String(val) : '';

// --- UNOPTIMIZED ---
function unoptimizedGetDetectedLinks(text, currentId, entities) {
  const safeText = safeString(text);
  if (!safeText) return [];
  const lowerText = safeText.toLowerCase();

  return entities.filter(e => {
    if (e.id === currentId) return false;

    const fullName = safeString(e.name).toLowerCase();
    const baseName = fullName.split(' (')[0].trim();
    const strippedName = baseName.replace(/^(the|a|an)\s+/, '');

    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const matchFullName = new RegExp(`\\b${escapeRegExp(fullName)}\\b`, 'i').test(lowerText);
    const matchBaseName = baseName.length > 2 && new RegExp(`\\b${escapeRegExp(baseName)}\\b`, 'i').test(lowerText);
    const matchStrippedName = strippedName.length > 2 && new RegExp(`\\b${escapeRegExp(strippedName)}\\b`, 'i').test(lowerText);

    return matchFullName || matchBaseName || matchStrippedName;
  });
}

// --- OPTIMIZED ---
function buildDictionary(entities) {
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return entities.map(e => {
    const fullName = safeString(e.name).toLowerCase();
    const baseName = fullName.split(' (')[0].trim();
    const strippedName = baseName.replace(/^(the|a|an)\s+/, '');

    return {
      id: e.id,
      name: e.name,
      matchFullName: new RegExp(`\\b${escapeRegExp(fullName)}\\b`, 'i'),
      matchBaseName: baseName.length > 2 ? new RegExp(`\\b${escapeRegExp(baseName)}\\b`, 'i') : null,
      matchStrippedName: strippedName.length > 2 ? new RegExp(`\\b${escapeRegExp(strippedName)}\\b`, 'i') : null,
    };
  });
}

const entityLinkDictionary = buildDictionary(entities);

function optimizedGetDetectedLinks(text, currentId, dictionary) {
  const safeText = safeString(text);
  if (!safeText) return [];
  const lowerText = safeText.toLowerCase();

  return dictionary.filter(e => {
    if (e.id === currentId) return false;
    return e.matchFullName.test(lowerText) ||
           (e.matchBaseName && e.matchBaseName.test(lowerText)) ||
           (e.matchStrippedName && e.matchStrippedName.test(lowerText));
  });
}

// --- RUN BENCHMARK ---
const iterations = 50; // Simulate 50 renders
let unoptTotal = 0;
let optTotal = 0;

for (let i = 0; i < iterations; i++) {
  // Unoptimized
  const startUnopt = performance.now();
  for (const text of textFields) {
    unoptimizedGetDetectedLinks(text, currentId, entities);
  }
  unoptTotal += (performance.now() - startUnopt);

  // Optimized
  const startOpt = performance.now();
  // Simulate rebuilding dictionary ONLY when name changes, which is 0 times here,
  // but we'll include the search time. If name changed, we'd rebuild once.
  for (const text of textFields) {
    optimizedGetDetectedLinks(text, currentId, entityLinkDictionary);
  }
  optTotal += (performance.now() - startOpt);
}

console.log(`Unoptimized Total Time (${iterations} renders): ${unoptTotal.toFixed(2)}ms`);
console.log(`Optimized Total Time (${iterations} renders): ${optTotal.toFixed(2)}ms`);
console.log(`Improvement: ${((unoptTotal - optTotal) / unoptTotal * 100).toFixed(2)}%`);
