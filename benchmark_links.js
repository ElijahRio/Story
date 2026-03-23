const { performance } = require('perf_hooks');

const numEntities = 2000;
const entityLinkDictionary = Array.from({ length: numEntities }, (_, i) => {
  const name = `The Entity Number ${i} (Alpha)`;
  const nameLower = name.toLowerCase();
  const baseName = nameLower.split(' (')[0].trim();
  const strippedName = baseName.replace(/^(the|a|an)\s+/, '');

  return {
    id: `e-${i}`,
    nameLower,
    searchFragment: strippedName.length > 2 ? strippedName : (baseName.length > 2 ? baseName : nameLower),
    matchFullName: new RegExp(`\\b${nameLower}\\b`, 'i'),
    matchBaseName: new RegExp(`\\b${baseName}\\b`, 'i'),
    matchStrippedName: new RegExp(`\\b${strippedName}\\b`, 'i'),
  };
});

const lowerText = "this is some text that mentions entity number 50 and maybe entity number 1000 but mostly just filler text to make the regex work harder.";
const currentId = "e-9999";

function withoutIncludes() {
  return entityLinkDictionary.filter(e => {
    if (e.id === currentId) return false;

    return e.matchFullName.test(lowerText) ||
           (e.matchBaseName && e.matchBaseName.test(lowerText)) ||
           (e.matchStrippedName && e.matchStrippedName.test(lowerText));
  });
}

function withIncludes() {
  return entityLinkDictionary.filter(e => {
    if (e.id === currentId) return false;

    if (!lowerText.includes(e.searchFragment)) return false;

    return e.matchFullName.test(lowerText) ||
           (e.matchBaseName && e.matchBaseName.test(lowerText)) ||
           (e.matchStrippedName && e.matchStrippedName.test(lowerText));
  });
}

const iterations = 1000;

// Warmup
for (let i = 0; i < 100; i++) {
  withoutIncludes();
  withIncludes();
}

const start1 = performance.now();
for (let i = 0; i < iterations; i++) {
  withoutIncludes();
}
const end1 = performance.now();

const start2 = performance.now();
for (let i = 0; i < iterations; i++) {
  withIncludes();
}
const end2 = performance.now();

console.log(`Without includes: ${(end1 - start1).toFixed(2)} ms`);
console.log(`With includes: ${(end2 - start2).toFixed(2)} ms`);
