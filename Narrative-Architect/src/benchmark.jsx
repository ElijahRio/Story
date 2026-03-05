import { renderHook, act } from '@testing-library/react';
import React, { useState, useMemo } from 'react';

// Mock entities
const entities = Array.from({ length: 50000 }).map((_, i) => ({
  id: `e-${i}`,
  type: i % 4 === 0 ? 'asset' : i % 4 === 1 ? 'personnel' : i % 4 === 2 ? 'technology' : 'anomaly',
  name: `Entity ${i}`,
}));

function useAppBaseline() {
  const [selectedId, setSelectedId] = useState('e-49999');
  const [activeFilter, setActiveFilter] = useState('asset');

  // UNOPTIMIZED
  const startUnoptimized = performance.now();
  const selectedEntity = entities.find(e => e.id === selectedId) || null;
  const filteredEntities = activeFilter === 'all'
    ? entities
    : entities.filter(e => e.type === activeFilter);
  const endUnoptimized = performance.now();

  // OPTIMIZED
  const startOptimized = performance.now();
  const selectedEntityOpt = useMemo(() => entities.find(e => e.id === selectedId) || null, [selectedId]);
  const filteredEntitiesOpt = useMemo(() => activeFilter === 'all'
    ? entities
    : entities.filter(e => e.type === activeFilter), [activeFilter]);
  const endOptimized = performance.now();

  return {
    unoptimizedTime: endUnoptimized - startUnoptimized,
    optimizedTime: endOptimized - startOptimized,
    forceRender: useState(0)[1]
  };
}

export function runBenchmark() {
  const { result } = renderHook(() => useAppBaseline());

  let unoptTotal = 0;
  let optTotal = 0;
  const iterations = 100;

  for (let i = 0; i < iterations; i++) {
    act(() => {
      result.current.forceRender(prev => prev + 1);
    });
    unoptTotal += result.current.unoptimizedTime;
    optTotal += result.current.optimizedTime;
  }

  console.log(`Unoptimized Total Time (${iterations} renders): ${unoptTotal.toFixed(2)}ms`);
  console.log(`Optimized Total Time (${iterations} renders): ${optTotal.toFixed(2)}ms`);
  console.log(`Improvement: ${((unoptTotal - optTotal) / unoptTotal * 100).toFixed(2)}%`);
}
