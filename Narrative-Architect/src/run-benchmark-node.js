import { performance } from 'perf_hooks';

// Simulate the React render cycle without rendering hooks
const entities = Array.from({ length: 50000 }).map((_, i) => ({
  id: `e-${i}`,
  type: i % 4 === 0 ? 'asset' : i % 4 === 1 ? 'personnel' : i % 4 === 2 ? 'technology' : 'anomaly',
  name: `Entity ${i}`,
}));

let selectedId = 'e-49999';
let activeFilter = 'asset';

// Variables to simulate memoized state
let memoizedSelectedEntity = null;
let lastSelectedId = null;

let memoizedFilteredEntities = null;
let lastActiveFilter = null;

let unoptTotal = 0;
let optTotal = 0;
const iterations = 1000;

for (let i = 0; i < iterations; i++) {
  // Simulate unrelated state change (re-render triggered by typing in chat)

  // UNOPTIMIZED
  const startUnoptimized = performance.now();
  const selectedEntity = entities.find(e => e.id === selectedId) || null;
  const filteredEntities = activeFilter === 'all'
    ? entities
    : entities.filter(e => e.type === activeFilter);
  const endUnoptimized = performance.now();

  // OPTIMIZED (simulating useMemo)
  const startOptimized = performance.now();

  if (selectedId !== lastSelectedId) {
    memoizedSelectedEntity = entities.find(e => e.id === selectedId) || null;
    lastSelectedId = selectedId;
  }
  const selectedEntityOpt = memoizedSelectedEntity;

  if (activeFilter !== lastActiveFilter) {
    memoizedFilteredEntities = activeFilter === 'all'
      ? entities
      : entities.filter(e => e.type === activeFilter);
    lastActiveFilter = activeFilter;
  }
  const filteredEntitiesOpt = memoizedFilteredEntities;

  const endOptimized = performance.now();

  unoptTotal += (endUnoptimized - startUnoptimized);
  optTotal += (endOptimized - startOptimized);
}

console.log(`Unoptimized Total Time (${iterations} renders): ${unoptTotal.toFixed(2)}ms`);
console.log(`Optimized Total Time (${iterations} renders): ${optTotal.toFixed(2)}ms`);
console.log(`Improvement: ${((unoptTotal - optTotal) / unoptTotal * 100).toFixed(2)}%`);
