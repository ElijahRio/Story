const { performance } = require('perf_hooks');

function runBenchmark(numEntities, iterations) {
  const entities = Array.from({ length: numEntities }, (_, i) => ({
    name: `Entity Name ${i} with some extra text`
  }));

  function oldApproach() {
    let currentNamesHash = '';
    for (let i = 0; i < entities.length; i++) {
      currentNamesHash += entities[i].name + '|';
    }
    return currentNamesHash;
  }

  function mapJoinApproach() {
    return entities.map(e => e.name).join('|') + '|';
  }

  function reduceApproach() {
    return entities.reduce((acc, e) => acc + e.name + '|', '');
  }

  // Warmup
  for (let i = 0; i < 1000; i++) {
    oldApproach();
    mapJoinApproach();
    reduceApproach();
  }

  const startOld = performance.now();
  for (let i = 0; i < iterations; i++) {
    oldApproach();
  }
  const endOld = performance.now();

  const startMapJoin = performance.now();
  for (let i = 0; i < iterations; i++) {
    mapJoinApproach();
  }
  const endMapJoin = performance.now();

  const startReduce = performance.now();
  for (let i = 0; i < iterations; i++) {
    reduceApproach();
  }
  const endReduce = performance.now();

  console.log(`Entities: ${numEntities}, Iterations: ${iterations}`);
  console.log(`  Old approach time: ${(endOld - startOld).toFixed(2)} ms`);
  console.log(`  MapJoin approach time: ${(endMapJoin - startMapJoin).toFixed(2)} ms`);
  console.log(`  Reduce approach time: ${(endReduce - startReduce).toFixed(2)} ms`);
}

runBenchmark(10, 100000);
runBenchmark(100, 10000);
runBenchmark(1000, 1000);
runBenchmark(10000, 100);
