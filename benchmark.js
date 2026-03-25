const { performance } = require('perf_hooks');

const entities = [];
for (let i = 0; i < 2000; i++) {
  entities.push({
    id: `e-${i}`, name: `Entity ${i}`,
    description: `This is entity ${i}`,
    systemic_inputs: `inputs for ${i}`,
    systemic_outputs: `outputs for ${i}`,
    biological_alterations: null,
    attributes: `attr ${i}`,
    liabilities: null,
    involved_records: null,
    systemic_impact: `impact ${i}`,
    unresolved_threads: null,
    ai_analysis: null
  });
}

function runOriginal() {
    entities.forEach(entity => {
      let parts = [];
      if(entity.description) parts.push(entity.description);
      if(entity.systemic_inputs) parts.push(entity.systemic_inputs);
      if(entity.systemic_outputs) parts.push(entity.systemic_outputs);
      if(entity.biological_alterations) parts.push(entity.biological_alterations);
      if(entity.attributes) parts.push(entity.attributes);
      if(entity.liabilities) parts.push(entity.liabilities);
      if(entity.involved_records) parts.push(entity.involved_records);
      if(entity.systemic_impact) parts.push(entity.systemic_impact);
      if(entity.unresolved_threads) parts.push(entity.unresolved_threads);
      if(entity.ai_analysis) parts.push(entity.ai_analysis);
      const allText = parts.join(' ');
      let a = allText.length;
    });
}

function runOptimized() {
    for(let i=0; i<entities.length; i++) {
      const entity = entities[i];
      let allText = '';
      if(entity.description) allText += entity.description + ' ';
      if(entity.systemic_inputs) allText += entity.systemic_inputs + ' ';
      if(entity.systemic_outputs) allText += entity.systemic_outputs + ' ';
      if(entity.biological_alterations) allText += entity.biological_alterations + ' ';
      if(entity.attributes) allText += entity.attributes + ' ';
      if(entity.liabilities) allText += entity.liabilities + ' ';
      if(entity.involved_records) allText += entity.involved_records + ' ';
      if(entity.systemic_impact) allText += entity.systemic_impact + ' ';
      if(entity.unresolved_threads) allText += entity.unresolved_threads + ' ';
      if(entity.ai_analysis) allText += entity.ai_analysis + ' ';
      if (allText.length > 0) allText = allText.slice(0, -1);
      let a = allText.length;
    }
}

const t0 = performance.now();
for(let i=0;i<100;i++) runOriginal();
const t1 = performance.now();
console.log(`Original: ${t1 - t0} ms`);

const t2 = performance.now();
for(let i=0;i<100;i++) runOptimized();
const t3 = performance.now();
console.log(`Optimized: ${t3 - t2} ms`);