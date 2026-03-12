import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Database, Biohazard, UserCog, UserX, Cpu,
  Settings, Send, Trash2, Activity, FileWarning,
  Download, Upload, Search, Clock, GitCommit,
  Bug, CheckCircle, AlertTriangle, Bell, Calendar,
  CornerDownRight, Fingerprint, HardDrive, BrainCircuit, GitMerge,
  Check, X, Network
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import InputField from './components/InputField';
import TextAreaField from './components/TextAreaField';
import DynamicEntityFields from './components/DynamicEntityFields';

// --- Utility Functions ---
const safeString = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const sanitizeEntity = (entity) => {
  if (!entity) return entity;
  const sanitized = { ...entity };
  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      if (key !== 'id' && key !== 'type') {
        sanitized[key] = safeString(sanitized[key]);
      }
    }
  }
  return sanitized;
};

function calculateCosineSimilarity(vecA, vecB) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function parseDateString(dateStr) {
  if (!dateStr) return null;
  const str = safeString(dateStr);
  const parts = str.match(/(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})/);
  if (parts) {
    if (parts[3].length === 4) {
      return new Date(`${parts[3]}-${parts[2]}-${parts[1]}`);
    } else if (parts[1].length === 4) {
      return new Date(`${parts[1]}-${parts[2]}-${parts[3]}`);
    }
  }
  const fb = new Date(str);
  return isNaN(fb.getTime()) ? null : fb;
}

function getAge(birthStr, eventStr) {
  const b = parseDateString(birthStr);
  const e = parseDateString(eventStr);
  if (!b || !e) return null;
  let age = e.getFullYear() - b.getFullYear();
  const m = e.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && e.getDate() < b.getDate())) {
    age--;
  }
  return age;
}

// --- UI Components ---
// --- Trauma of Compliance: Core Database ---
const initialEntities = [
  {
    id: 'e-1',
    type: 'personnel',
    name: 'Ancillus',
    description: 'Lead Creator/Director of the Facility. Operates on a strict transactional and clinical morality system.',
    birth_date: '22-04-1980',
    death_date: '',
    systemic_inputs: 'Unrestricted Facility Access, Client Capital, Raw Biological Donors.',
    systemic_outputs: 'Facility Directives, Compound S12 Authorization, Structural Parameters.',
    attributes: 'Immaculate presentation, detached empathy, highly intelligent.',
    ulterior_motives: 'To construct perfect biological compliance and transcend physical limitations. Seeks to rectify perceived inadequacies pointed out by his father.',
    liabilities: 'Hubris regarding his control over the "Ghost Variable" (Soul/Consciousness).',
    ai_analysis: ''
  },
  {
    id: 'e-2',
    type: 'asset',
    name: 'Dolly (Asteria)',
    description: 'High-Value Asset. A unique biological construct heavily modified for client rental and compliance.',
    birth_date: '15-08-2012',
    death_date: '',
    systemic_inputs: 'Compound S12, Judas Eye V3 Optical Feedback, Regular physical maintenance.',
    systemic_outputs: 'Client Capital (Rental Fees), 99.8% Compliance Metric, Unfiltered Psychological Trauma.',
    biological_alterations: 'Subcutaneous Judas Eye V3 (Right Eye), Frictionless Follicles, Compound S12 (Dissolution of rigid frameworks), Synthetic biological rendering.',
    compliance_metric: '99.8% (Target). Oscillates violently due to extreme psychological fracturing and the "Ghost Variable".',
    degradation_status: 'Severe psychological fracturing resulting in hallucinations (Memory Blends, The Dark Shadow, The Fawn). Frequent physical trauma.',
    ai_analysis: ''
  },
  {
    id: 'e-3',
    type: 'technology',
    name: 'The Judas Eye (V3)',
    description: 'A compliance tool utilizing high-frequency optical feedback and neural hijacking to bypass primitive fight-or-flight responses.',
    systemic_inputs: 'Host Neural Network, Subcutaneous Power Draw.',
    systemic_outputs: 'Agonizing Muscular Compliance, Localized Corrosive Agent (upon tampering).',
    biological_cost: 'Secretes localized corrosive agent upon unauthorized tampering. Forces agonizing muscular compliance overriding conscious will.',
    deployment_status: 'Active within Asset: Dolly. V1 resulted in catastrophic biological assimilation.'
  },
  {
    id: 'e-4',
    type: 'anomaly',
    name: 'The Sepsis Stream',
    description: 'A volatile coalescence of industrial runoff, dissolved organic waste, and discarded biological failures. Has achieved a primitive state of chemical sentience.',
    systemic_inputs: 'Discarded Biological Failures, Industrial Runoff, The Mira Unit Excretions.',
    systemic_outputs: 'Psychological/Auditory Distress, Environmental Pollution, Sentient Chemical Sludge.',
    manifestation: 'Manifests pseudo-mouths, weeping eyes, and jagged teeth. Demands "Life" as a toll for transit. Induces extreme auditory and psychological distress.',
    environmental_impact: 'Consumes biological matter (e.g., Hanna). Pollutes lower levels of the Sunken District.'
  },
  {
    id: 'e-5',
    type: 'event',
    name: 'Judas Eye V1 Catastrophe',
    description: 'Initial deployment of the Judas Eye compliance tool resulted in violent biological rejection. The host body attempted to physically assimilate the hardware, leading to terminal cascading organ failure.',
    sequence_number: '10',
    timestamp: '05-03-2026',
    involved_records: 'Ancillus, Prototype Asset #4, The Judas Eye (V1)',
    systemic_impact: 'Led to the development of the corrosive tamper-defense mechanism in V2 and V3. Remains of Prototype #4 deposited into the Sepsis Stream.'
  },
  {
    id: 'e-6',
    type: 'event',
    name: 'Integration of Compound S12',
    description: 'First successful administration of Compound S12 into Asset Dolly. Achieved initial dissolution of rigid skeletal/psychological frameworks, enabling hyper-compliance.',
    sequence_number: '20',
    timestamp: '12-11-2026',
    involved_records: 'Ancillus, Dolly (Asteria), Compound S12',
    systemic_impact: 'Compliance Metric stabilized at 99.8%. First recorded instance of Dolly experiencing "Memory Blends".'
  }
];

export default function App() {
  // --- Persistent Local Storage System ---
  const loadSavedData = () => {
    const saved = localStorage.getItem('facility_registry_data');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        if (Array.isArray(parsedData)) {
          return parsedData.map(sanitizeEntity);
        }
      } catch (e) {
        console.error("Local storage corruption detected. Booting default payload.", e);
      }
    }
    return initialEntities.map(sanitizeEntity);
  };

  // --- State Management ---
  const [entities, setEntities] = useState(loadSavedData);
  const [selectedId, setSelectedId] = useState('timeline');
  const [activeFilter, setActiveFilter] = useState('all');

  // --- LLM State ---
  const [llmUrl, setLlmUrl] = useState('http://localhost:11434/api/chat');
  const [llmModel, setLlmModel] = useState('llama3');
  const [embedModel, setEmbedModel] = useState('nomic-embed-text');
  const [chatHistory, setChatHistory] = useState([
    { id: crypto.randomUUID(), role: 'system', content: 'Facility Overseer Engine Initialized. Background auto-save is ACTIVE.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Overseer Logic State
  const [activeOverseerTab, setActiveOverseerTab] = useState('terminal');
  const [auditLogs, setAuditLogs] = useState([]);
  const [isAuditing, setIsAuditing] = useState(false);

  // Ingestion & Audit State
  const [showIngest, setShowIngest] = useState(false);
  const [ingestText, setIngestText] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [isAuditingProfile, setIsAuditingProfile] = useState(false);

  // Merge State
  const [showMergeUI, setShowMergeUI] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');

  // Delete State
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Graph State ---
  const [networkEmbeddings, setNetworkEmbeddings] = useState({});
  const [isComputingEmbeddings, setIsComputingEmbeddings] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  // --- Derived State ---
  // ⚡ Bolt: Convert O(N) Array.find to O(1) Map lookup to optimize entity selection and operations
  const entitiesMap = useMemo(() => {
    return new Map(entities.map(e => [e.id, e]));
  }, [entities]);

  const selectedEntity = useMemo(() =>
    entitiesMap.get(selectedId) || null
    , [entitiesMap, selectedId]);

  const filteredEntities = useMemo(() =>
    activeFilter === 'all'
      ? entities
      : entities.filter(e => e.type === activeFilter)
    , [entities, activeFilter]);

  const timelineEvents = useMemo(() =>
    entities.filter(e => e.type === 'event').sort((a, b) => (Number(a.sequence_number) || 0) - (Number(b.sequence_number) || 0))
    , [entities]);

  // ⚡ Bolt: Pre-process involved_records into arrays of lowercased strings to avoid repeated string splitting and toLowerCase calls in render
  const timelineEventsProcessed = useMemo(() => {
    return timelineEvents.map(event => {
      const safeRecords = safeString(event.involved_records);
      const involvedNames = safeRecords ? safeRecords.split(',').map(s => s.trim()) : [];
      return {
        ...event,
        involvedNames,
        involvedNamesLower: involvedNames.map(name => name.toLowerCase())
      };
    });
  }, [timelineEvents]);

  // Pre-compile RegExp matchers to optimize the Advanced Link Detection Engine.
  // RegExp compilation inside the render loop was identified as a major performance bottleneck.
  // ⚡ Bolt: Use a ref Map to cache compiled matchers per entity.
  // Only invalidate and re-compile when a specific entity's name changes,
  // drastically reducing overhead when the entities array reference changes (e.g., during typing).
  const regexCacheRef = useRef(new Map());

  const entityLinkDictionary = useMemo(() => {
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Clean up cache entries for deleted entities
    const currentEntityIds = new Set(entities.map(e => e.id));
    for (const id of regexCacheRef.current.keys()) {
      if (!currentEntityIds.has(id)) {
        regexCacheRef.current.delete(id);
      }
    }

    return entities.map(e => {
      const cached = regexCacheRef.current.get(e.id);
      const fullName = safeString(e.name).toLowerCase();

      // Return from cache if the name hasn't changed
      if (cached && cached.nameLower === fullName) {
        return { ...e, ...cached };
      }

      // Compile and cache new matchers if name changed or entity is new
      const baseName = fullName.split(' (')[0].trim();
      const strippedName = baseName.replace(/^(the|a|an)\s+/, '');

      const compiledData = {
        nameLower: fullName, // Pre-computed for fast timeline lookups
        matchFullName: new RegExp(`\\b${escapeRegExp(fullName)}\\b`, 'i'),
        matchBaseName: baseName.length > 2 ? new RegExp(`\\b${escapeRegExp(baseName)}\\b`, 'i') : null,
        matchStrippedName: strippedName.length > 2 ? new RegExp(`\\b${escapeRegExp(strippedName)}\\b`, 'i') : null,
      };

      regexCacheRef.current.set(e.id, compiledData);

      // Crucial: Must spread original entity (...e) to prevent data loss in downstream components
      return {
        ...e,
        ...compiledData,
      };
    });
  }, [entities]);

  // ⚡ Bolt: Memoize the loose string matching resolution for timeline entities to avoid O(N*M) lookups on every render
  const timelineEntityMatchCache = useMemo(() => {
    const cache = new Map();
    // Get all unique lowercased names used in all events
    const uniqueNames = new Set();
    timelineEventsProcessed.forEach(event => {
      event.involvedNamesLower.forEach(name => uniqueNames.add(name));
    });

    // Compute the match once for each unique name
    uniqueNames.forEach(lowerName => {
      const foundEntity = entityLinkDictionary.find(e => {
        return e.nameLower === lowerName ||
          e.nameLower.includes(lowerName) ||
          lowerName.includes(e.nameLower);
      });
      if (foundEntity) {
        cache.set(lowerName, foundEntity);
      }
    });
    return cache;
  }, [timelineEventsProcessed, entityLinkDictionary]);

  // --- Advanced Link Detection Engine ---
  // Memoized so it can be safely included in dependency arrays
  const getDetectedLinks = React.useCallback((text, currentId) => {
    const safeText = safeString(text);
    if (!safeText) return [];
    const lowerText = safeText.toLowerCase();

    // ⚡ Bolt: Use the memoized entity dictionary to skip RegExp instantiation during rendering.
    return entityLinkDictionary.filter(e => {
      if (e.id === currentId) return false;

      return e.matchFullName.test(lowerText) ||
             (e.matchBaseName && e.matchBaseName.test(lowerText)) ||
             (e.matchStrippedName && e.matchStrippedName.test(lowerText));
    });
  }, [entityLinkDictionary]);

  // ⚡ Bolt: Extract O(N^2) semantic similarity loop into a separate useMemo
  // This prevents recalculating cosine similarity for all pairs on every keystroke
  // when the network view is active, as it now only runs when networkEmbeddings changes.
  const semanticLinksCache = useMemo(() => {
    const cache = new Map();
    const entityIds = Object.keys(networkEmbeddings);

    if (entityIds.length === 0) return cache;

    for (let i = 0; i < entityIds.length; i++) {
      for (let j = i + 1; j < entityIds.length; j++) {
        const e1 = entityIds[i];
        const e2 = entityIds[j];
        const vec1 = networkEmbeddings[e1];
        const vec2 = networkEmbeddings[e2];

        if (vec1 && vec2) {
          const similarity = calculateCosineSimilarity(vec1, vec2);
          if (similarity > 0.75) {
            const weight = (similarity - 0.75) * 8;
            const key = e1 < e2 ? `${e1}|${e2}` : `${e2}|${e1}`;
            cache.set(key, { e1, e2, weight });
          }
        }
      }
    }
    return cache;
  }, [networkEmbeddings]);

  // --- Network Graph Computation ---
  useEffect(() => {
    if (selectedId !== 'network') return;

    const nodes = entities.map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      val: 2 // Node size
    }));

    const linksMap = new Map();

    const addLinkWeight = (source, target, weight, type) => {
      if (!source || !target || source === target) return;
      // ⚡ Bolt: Use direct string comparison instead of array allocation and .sort() in this O(N^2) loop.
      // String concatenation is ~30x faster than creating an array, sorting it, and joining it.
      const key = source < target ? `${source}|${target}` : `${target}|${source}`;
      if (!linksMap.has(key)) {
        linksMap.set(key, { source, target, strength: 0, textWeight: 0, semanticWeight: 0 });
      }
      const link = linksMap.get(key);
      if (type === 'text') link.textWeight += weight;
      if (type === 'semantic') link.semanticWeight += weight;
      link.strength = link.textWeight + link.semanticWeight;
    };

    // 1. Text-based references
    entities.forEach(entity => {
      const allText = [
        entity.description,
        entity.systemic_inputs,
        entity.systemic_outputs,
        entity.biological_alterations,
        entity.attributes,
        entity.liabilities,
        entity.involved_records,
        entity.systemic_impact,
        entity.unresolved_threads,
        entity.ai_analysis
      ].filter(Boolean).join(' ');

      const links = getDetectedLinks(allText, entity.id);
      links.forEach(link => {
        // Base weight for text reference
        addLinkWeight(entity.id, link.id, 1.5, 'text');
      });
    });

    // 2. Semantic References (read from pre-computed cache)
    if (semanticLinksCache.size > 0) {
      for (const [_, data] of semanticLinksCache) {
        // Verify both entities still exist in the current entities list
        if (entitiesMap.has(data.e1) && entitiesMap.has(data.e2)) {
          addLinkWeight(data.e1, data.e2, data.weight, 'semantic');
        }
      }
    }

    setGraphData({
      nodes,
      links: Array.from(linksMap.values())
    });
  }, [entities, getDetectedLinks, selectedId, semanticLinksCache, entitiesMap]);

  // Handle computing embeddings for the network graph
  const handleComputeNetworkEmbeddings = async () => {
    if (isComputingEmbeddings) return;
    setIsComputingEmbeddings(true);

    setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: '[SYSTEM]: Initiating Vector Embedding generation for entire facility network...' }]);

    try {
      const embedUrl = llmUrl.replace('/api/chat', '/api/embed');
      const newEmbeddings = { ...networkEmbeddings };

      // Batch entities for embedding
      const batchSize = 10;
      for (let i = 0; i < entities.length; i += batchSize) {
        const batch = entities.slice(i, i + batchSize);
        // Only compute for entities missing embeddings
        const toCompute = batch.filter(e => !newEmbeddings[e.id]);

        if (toCompute.length > 0) {
          const inputs = toCompute.map(e => {
             // Create a rich text representation for semantic meaning
             return `${e.name}. ${safeString(e.description)}. ${safeString(e.systemic_inputs)}. ${safeString(e.systemic_outputs)}`;
          });

          const batchRes = await fetch(embedUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: embedModel, input: inputs })
          });

          if (!batchRes.ok) throw new Error(`Embedding Engine Error: ${batchRes.status}`);

          const batchData = await batchRes.json();
          toCompute.forEach((e, idx) => {
            newEmbeddings[e.id] = batchData.embeddings[idx];
          });
        }
      }

      setNetworkEmbeddings(newEmbeddings);
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: '[SYSTEM]: Network embedding generation complete. Connections optimized.' }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `[SYSTEM ERROR]: Embedding computation failed - ${error.message}.` }]);
    } finally {
      setIsComputingEmbeddings(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // AUTO-SAVE EFFECT: Triggers every time the entities array changes
  // ⚡ Bolt: Debounce the expensive JSON.stringify and localStorage write
  // to prevent main thread blocking on every keystroke during typing.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('facility_registry_data', JSON.stringify(entities));
    }, 500);

    // Ensure data is saved if the user closes the tab within the debounce window
    const handleBeforeUnload = () => {
      localStorage.setItem('facility_registry_data', JSON.stringify(entities));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [entities]);

  // --- Handlers: Entities ---
  const handleUpdateEntity = (field, value) => {
    if (!selectedEntity) return;
    setEntities(entities.map(e =>
      e.id === selectedId ? { ...e, [field]: value } : e
    ));
  };

  const createNewEntity = (type) => {
    const newId = `e-${Date.now()}`;
    const baseEntity = { id: newId, type: type, name: `New ${type}`, description: '', systemic_inputs: '', systemic_outputs: '' };

    let newEntity = { ...baseEntity };
    if (type === 'asset') {
      newEntity = { ...baseEntity, birth_date: '', death_date: '', biological_alterations: '', compliance_metric: '', degradation_status: '', ai_analysis: '' };
    } else if (type === 'personnel') {
      newEntity = { ...baseEntity, birth_date: '', death_date: '', attributes: '', ulterior_motives: '', liabilities: '', ai_analysis: '' };
    } else if (type === 'technology') {
      newEntity = { ...baseEntity, biological_cost: '', deployment_status: '' };
    } else if (type === 'anomaly') {
      newEntity = { ...baseEntity, manifestation: '', environmental_impact: '' };
    } else if (type === 'event') {
      newEntity = { ...baseEntity, sequence_number: '0', timestamp: 'DD-MM-YYYY', involved_records: '', systemic_impact: '' };
    } else if (type === 'memory') {
      newEntity = { ...baseEntity, timestamp: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'), unresolved_threads: '' };
    }

    setEntities([...entities, newEntity]);
    setSelectedId(newId);
  };

  const deleteEntity = (id) => {
    setEntities(entities.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
    setConfirmDeleteId(null);
  };

  const handleMerge = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    // ⚡ Bolt: Use O(1) Map lookup instead of O(N) Array.find
    const sourceEntity = entitiesMap.get(sourceId);
    const targetEntity = entitiesMap.get(targetId);

    if (!sourceEntity || !targetEntity) return;

    // Helper to safely combine strings
    const combineText = (t1, t2) => {
      const s1 = safeString(t1).trim();
      const s2 = safeString(t2).trim();
      if (s1 && s2) return `${s1}\n\n[MERGED RECORD]:\n${s2}`;
      return s1 || s2;
    };

    // Construct the new merged target entity
    const mergedTarget = { ...targetEntity };

    // Define valid fields per entity type to handle cross-type merging
    const baseFields = ['id', 'type', 'name', 'description', 'systemic_inputs', 'systemic_outputs'];
    const validFieldsByType = {
      'asset': [...baseFields, 'birth_date', 'death_date', 'biological_alterations', 'compliance_metric', 'degradation_status', 'ai_analysis'],
      'personnel': [...baseFields, 'birth_date', 'death_date', 'attributes', 'ulterior_motives', 'liabilities', 'ai_analysis'],
      'technology': [...baseFields, 'biological_cost', 'deployment_status'],
      'anomaly': [...baseFields, 'manifestation', 'environmental_impact'],
      'event': [...baseFields, 'sequence_number', 'timestamp', 'involved_records', 'systemic_impact'],
      'memory': [...baseFields, 'timestamp', 'unresolved_threads']
    };

    const targetType = targetEntity.type;
    const validTargetFields = validFieldsByType[targetType] || baseFields;

    const unmappedDetails = [];

    // Process all fields from the source entity
    Object.keys(sourceEntity).forEach(field => {
      // Skip core identity fields
      if (['id', 'type', 'name'].includes(field)) return;

      const sourceValue = safeString(sourceEntity[field]).trim();
      if (!sourceValue) return;

      if (validTargetFields.includes(field)) {
        // If it's a valid field for the target, merge normally
        mergedTarget[field] = combineText(targetEntity[field], sourceEntity[field]);
      } else {
        // If it's not valid for the target type, push to unmapped details
        // Format the field name nicely (e.g., biological_alterations -> Biological Alterations)
        const formattedField = field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        unmappedDetails.push(`${formattedField}:\n${sourceValue}`);
      }
    });

    // Append unmapped details to the target's description under [To Be Sorted]
    if (unmappedDetails.length > 0) {
      const sortedContent = unmappedDetails.join('\n\n');
      const toBeSortedBlock = `[To Be Sorted]\n${sortedContent}`;
      mergedTarget.description = combineText(mergedTarget.description, toBeSortedBlock);
    }

    // Handle name substitution in timeline events
    const sourceNameBase = sourceEntity.name.split(' (')[0].trim();
    const targetNameBase = targetEntity.name.split(' (')[0].trim();

    const updatedEntities = entities.map(e => {
      // 1. Update the target entity
      if (e.id === targetId) return mergedTarget;

      // 2. Filter out the source entity
      if (e.id === sourceId) return null;

      // 3. Update timeline events to replace the source's name with the target's name
      if (e.type === 'event' && e.involved_records) {
        const records = safeString(e.involved_records).split(',').map(s => s.trim());
        const hasSource = records.some(r => r.toLowerCase() === sourceNameBase.toLowerCase());

        if (hasSource) {
          // Replace source name with target name, ensure no duplicates
          const updatedRecords = Array.from(new Set(
            records.map(r => r.toLowerCase() === sourceNameBase.toLowerCase() ? targetNameBase : r)
          )).join(', ');

          return { ...e, involved_records: updatedRecords };
        }
      }

      return e;
    }).filter(Boolean); // Remove the null (source entity)

    setEntities(updatedEntities);
    setSelectedId(targetId);
    setShowMergeUI(false);
    setMergeTargetId('');
  };

  // --- Handlers: Data Persistence (Manual Backup to Desktop) ---
  const handleExport = () => {
    const dataStr = JSON.stringify(entities, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facility_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          setEntities(importedData.map(sanitizeEntity));
          setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: '[SYSTEM]: External biological data feed imported successfully.' }]);
        }
      } catch (err) {
        console.error("Failed to parse backup:", err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Handlers: LLM Overseer ---
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    let systemContext = `You are a clinical, amoral Facility Overseer AI. Your task is to help the author maintain strict internal logic, biological consistency, and structural continuity for a dark, transgressive sci-fi world ("Trauma of Compliance"). Focus on physical mechanics, psychological degradation, technological limitations, LOGISTICAL SUPPLY CHAINS, and CHRONOLOGICAL CAUSALITY. Pay specific attention to physical ages and lifespans. Do NOT inject standard morality or character drama.\n\n`;

    try {
      if (selectedEntity) {
        systemContext += `CURRENT FOCAL RECORD:\n${JSON.stringify(selectedEntity, null, 2)}\n\nCross-reference user queries against this exact biological and mechanical data, paying special attention to its Systemic Inputs and Outputs.`;
      } else if (selectedId === 'timeline') {
        systemContext += `CURRENT FOCAL RECORD: The user is currently analyzing the MASTER TIMELINE. \n\nSORTED CHRONOLOGICAL EVENTS:\n${JSON.stringify(timelineEvents, null, 2)}\n\nAnalyze the chronological causality of these events. Hunt for timeline paradoxes (e.g., an asset reacting to an event that hasn't happened yet in the sequence, or biological impossible ages based on birth/death dates).`;
      } else if (entities.length > 0) {
        setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: '[SYSTEM]: Engaging embedding engine. Vectorizing query for semantic search...' }]);
        const embedUrl = llmUrl.replace('/api/chat', '/api/embed');

        const queryRes = await fetch(embedUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: embedModel, input: userMsg.content })
        });
        if (!queryRes.ok) throw new Error(`Embedding Engine Offline. Verify '${embedModel}' is installed via Ollama.`);
        const queryData = await queryRes.json();
        const queryVector = queryData.embeddings[0];

        const entityTexts = entities.map(e => JSON.stringify(e));
        const batchRes = await fetch(embedUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: embedModel, input: entityTexts })
        });
        const batchData = await batchRes.json();

        const scoredEntities = entities.map((entity, index) => ({
          entity,
          score: calculateCosineSimilarity(queryVector, batchData.embeddings[index])
        })).sort((a, b) => b.score - a.score);

        const topMatches = scoredEntities.slice(0, 2).map(match => match.entity);
        systemContext += `[VECTOR RETRIEVAL ACTIVE] - To prevent context overload, the system has isolated the 2 most mathematically relevant records to the user's query:\n${JSON.stringify(topMatches, null, 2)}\n\nBase your clinical analysis strictly on these isolated records.`;
      }

      const payload = {
        model: llmModel,
        messages: [
          { role: 'system', content: systemContext },
          ...chatHistory.filter(m => m.role !== 'system'),
          userMsg
        ],
        stream: false
      };

      const response = await fetch(llmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${response.status}: Registry not found. Check Model Name.`);
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.message?.content || "Error: Corrupted feed." }]);

    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `[SYSTEM REJECTION]: ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Handlers: LLM Core Dump (Memory Archival) ---
  const handleArchiveMemory = async () => {
    if (isTyping) return;
    setIsTyping(true);
    setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: '[SYSTEM]: Executing Core Memory Dump. Archiving facility state...' }]);

    const systemContext = `You are the Facility Overseer. Execute a CORE MEMORY DUMP. Analyze the entire facility registry and timeline provided below. Summarize your current structural understanding of the narrative, note any persistent logistical bottlenecks, and record your internal logic state. 

You MUST output strictly a JSON object following this exact schema. Do NOT output markdown or conversation:
{
  "name": "Core Dump: [Generate a clinical title based on the data]",
  "description": "[A detailed summary of your current understanding of the facility's state and active components]",
  "unresolved_threads": "[Any logic gaps, missing links, or structural issues you want to track for future resolution]"
}`;

    const payload = {
      model: llmModel,
      messages: [
        { role: 'system', content: systemContext },
        { role: 'user', content: `ENTIRE FACILITY REGISTRY:\n${JSON.stringify(entities, null, 2)}` }
      ],
      format: "json",
      stream: false
    };

    try {
      const response = await fetch(llmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Auditor Engine Offline.");

      const data = await response.json();
      let rawText = data.message?.content || "";

      // Aggressive JSON extraction
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        rawText = rawText.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(rawText) || {};

      const newId = `e-mem-${Date.now()}`;

      const newMemory = {
        id: newId,
        type: 'memory',
        name: parsed.name ? safeString(parsed.name) : 'Corrupted Core Dump',
        description: parsed.description ? safeString(parsed.description) : '',
        unresolved_threads: parsed.unresolved_threads ? safeString(parsed.unresolved_threads) : '',
        systemic_inputs: '',
        systemic_outputs: '',
        timestamp: new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
      };

      setEntities(prev => [...prev, newMemory]);
      setSelectedId(newId);
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `[SYSTEM]: Core Dump successful. Memory node '${newMemory.name}' established.` }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `[SYSTEM ERROR]: Core Dump Failure - ${error.message}. Ensure model outputs valid JSON.` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleIngestRawText = async () => {
    if (!ingestText.trim() || isIngesting) return;
    setIsIngesting(true);

    const systemContext = `You are a clinical data extraction algorithm operating within the Facility. Your absolute directive is to parse the following raw transcript and extract any distinct biological assets, personnel, technologies, anomalies, or TIMELINE EVENTS. 
    
You MUST output strictly a JSON object with a key "entities" containing an array of objects. Do NOT output any conversational text, markdown formatting, or explanations.

Each object in the "entities" array must strictly follow this schema:
{
  "id": "e-auto-[generate random 5 digit number]",
  "type": "asset" | "personnel" | "technology" | "anomaly" | "event",
  "name": "[Extracted Name]",
  "description": "[Clinical summary of the entity or event]",
  "systemic_inputs": "[Deduced required materials, fuel, dependencies, or biological inputs]",
  "systemic_outputs": "[Deduced products, waste, compliance yields, or psychological outputs]",
  "birth_date": "[Deduced birth date DD-MM-YYYY, or empty string]",
  "death_date": "[Deduced death date DD-MM-YYYY, or empty string]",
  "sequence_number": "[A deduced numeric sequence order, e.g. 10, 20, 30]",
  "timestamp": "[In-universe time marker, preferably DD-MM-YYYY]",
  "involved_records": "[Names of assets/tech involved]",
  "systemic_impact": "[How this event altered the facility]"
}`;

    const payload = {
      model: llmModel,
      messages: [
        { role: 'system', content: systemContext },
        { role: 'user', content: `RAW TRANSCRIPT TO PROCESS:\n\n${ingestText}` }
      ],
      format: "json",
      stream: false
    };

    try {
      const response = await fetch(llmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Ingestion Engine Offline.");

      const data = await response.json();
      let rawText = data.message?.content || "";

      // Aggressive JSON extraction
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        rawText = rawText.substring(firstBrace, lastBrace + 1);
      }

      let parsedData = JSON.parse(rawText);
      let extractedEntities = parsedData.entities || parsedData;

      if (extractedEntities && !Array.isArray(extractedEntities)) {
        extractedEntities = [extractedEntities];
      }

      if (Array.isArray(extractedEntities) && extractedEntities.length > 0) {
        const newlyIngested = extractedEntities.map(ent => ({
          ...sanitizeEntity(ent),
          id: `e-auto-${crypto.randomUUID()}`
        }));
        setEntities(prev => [...prev, ...newlyIngested]);
        setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `[SYSTEM]: Successfully parsed and ingested ${extractedEntities.length} new records from raw transcript.` }]);
        setShowIngest(false);
        setIngestText('');
      } else {
        throw new Error("No valid entities extracted from text.");
      }
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `[SYSTEM ERROR]: Ingestion Failure - ${error.message}. Ensure the local model is responding with valid JSON.` }]);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleParadoxScan = async () => {
    if (isTyping) return;
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: 'Initiate a paradox scan. Check the entire registry for any logical anomalies, contradictions, unaddressed biological/mechanical conflicts, SUPPLY CHAIN FAILURES, or CHRONOLOGICAL DISCREPANCIES (e.g. actions occurring before a birth_date or after a death_date) across all recorded entities and events.' };
    setChatHistory(prev => [...prev, userMsg]);
    setIsTyping(true);

    let systemContext = `You are a clinical, amoral Facility Overseer AI. Your task is to help the author maintain strict internal logic, biological consistency, and structural continuity for a dark, transgressive sci-fi world ("Trauma of Compliance"). Focus on physical mechanics, psychological degradation, technological limitations, and LOGISTICAL SUPPLY CHAINS. Do NOT inject standard morality or character drama.\n\n`;
    systemContext += `ENTIRE FACILITY REGISTRY DATABASE:\n${JSON.stringify(entities, null, 2)}\n\nCross-reference the entire database to identify contradictions, paradoxes, SUPPLY CHAIN FAILURES (where an entity lacks its 'Required Inputs'), or CHRONOLOGICAL DISCREPANCIES (where an event occurs out of logical order, or involves an asset that is not biologically alive at that timestamp). Provide a clinical, numbered report of any systemic bottlenecks found.`;

    const payload = {
      model: llmModel,
      messages: [
        { role: 'system', content: systemContext },
        ...chatHistory.filter(m => m.role !== 'system'),
        userMsg
      ],
      stream: false
    };

    try {
      const response = await fetch(llmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}: Registry not found.`);
      const data = await response.json();
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.message?.content || "Error: Corrupted feed." }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `[SYSTEM REJECTION]: ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRunAudit = async () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setActiveOverseerTab('audit');

    const systemContext = `You are a highly analytical Continuous Integration (CI) Logic Auditor for a complex sci-fi horror database. 
Your sole function is to scan the provided registry and timeline events to identify plot holes, missing logistical links, unaddressed chronological gaps (including post-mortem paradoxes based on birth_date/death_date), or unexplained item/status transfers.

You MUST output strictly a JSON object with a key "audits" containing an array of objects. Do NOT output conversational text or markdown formatting.

Each object in the "audits" array must follow this schema:
{
  "id": "audit-[random 5 digit number]",
  "severity": "CRITICAL" | "WARNING" | "NOTE",
  "target": "[Name of the Entity or Event with the issue]",
  "issue": "[A highly clinical, precise description of the logical gap or missing variable]"
}`;

    const payload = {
      model: llmModel,
      messages: [
        { role: 'system', content: systemContext },
        { role: 'user', content: `ENTIRE FACILITY REGISTRY AND TIMELINE:\n\n${JSON.stringify(entities, null, 2)}\n\nExecute logic audit.` }
      ],
      format: "json",
      stream: false
    };

    try {
      const response = await fetch(llmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Auditor Engine Offline.");

      const data = await response.json();
      let rawText = data.message?.content || "";

      // Aggressive JSON extraction
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      const firstBracket = rawText.indexOf('[');
      const lastBracket = rawText.lastIndexOf(']');

      let firstIndex = -1;
      if (firstBrace !== -1 && firstBracket !== -1) firstIndex = Math.min(firstBrace, firstBracket);
      else if (firstBrace !== -1) firstIndex = firstBrace;
      else if (firstBracket !== -1) firstIndex = firstBracket;

      let lastIndex = -1;
      if (lastBrace !== -1 && lastBracket !== -1) lastIndex = Math.max(lastBrace, lastBracket);
      else if (lastBrace !== -1) lastIndex = lastBrace;
      else if (lastBracket !== -1) lastIndex = lastBracket;

      if (firstIndex !== -1 && lastIndex !== -1) {
        rawText = rawText.substring(firstIndex, lastIndex + 1);
      }

      let parsedData = JSON.parse(rawText);
      let extractedAudits = parsedData.audits || parsedData;

      if (extractedAudits && !Array.isArray(extractedAudits)) {
        extractedAudits = [extractedAudits];
      }

      if (Array.isArray(extractedAudits)) {
        const sanitizedAudits = extractedAudits.map(audit => ({
          id: safeString(audit.id) || `audit-${Math.floor(Math.random() * 100000)}`,
          severity: safeString(audit.severity) || 'NOTE',
          target: safeString(audit.target) || 'UNKNOWN',
          issue: safeString(audit.issue) || 'Unknown issue detected.'
        }));
        setAuditLogs(sanitizedAudits);
      } else {
        throw new Error("Invalid audit data structure.");
      }
    } catch (error) {
      console.error(error);
      setAuditLogs([{ id: 'error-1', severity: 'CRITICAL', target: 'SYSTEM', issue: `Audit Failure: ${error.message}. Ensure model outputs valid JSON.` }]);
    } finally {
      setIsAuditing(false);
    }
  };

  const resolveAudit = (id) => {
    setAuditLogs(prev => prev.filter(log => log.id !== id));
  };

  // --- Handlers: Profile Auditor ---
  const handleProfileAudit = async (entity) => {
    if (isAuditingProfile) return;
    setIsAuditingProfile(true);

    const relatedEvents = timelineEvents.filter(e => {
      if (!e.involved_records) return false;
      const baseName = entity.name.split(' (')[0].toLowerCase();
      return e.involved_records.toLowerCase().includes(baseName);
    });

    const systemContext = `You are a clinical, amoral, and ruthless Facility Overseer AI managing a dark, transgressive sci-fi horror environment. Your task is to analyze the structural, behavioral, and chronological profile of the requested biological Asset or Personnel.

CRITICAL DIRECTIVE: Do NOT offer standard therapeutic, psychological, or medical counseling. The Facility does not heal; it enforces compliance. Assets are machinery. You are a mechanical auditor, not a therapist.

Analyze their core profile attributes against the explicit Timeline Events they are involved in.
1. Summarize their chronological arc based strictly on the provided events. Focus on mechanical degradation and compliance failure.
2. Identify behavioral anomalies (e.g., actions taken during events that contradict their stated attributes, motives, or compliance metrics).
3. Propose explicit, actionable updates to their profile fields (e.g., "Liabilities", "Biological Alterations", "Degradation Status"). Suggest new restraints, chemical dependencies, or hardware punishments to enforce compliance. NEVER suggest "therapy," "healing," or "safe environments."

Output a structured, clinical text report. Use harsh, industrial, facility-appropriate terminology. Do NOT output JSON.`;

    const payload = {
      model: llmModel,
      messages: [
        { role: 'system', content: systemContext },
        { role: 'user', content: `ENTITY PROFILE:\n${JSON.stringify(entity, null, 2)}\n\nINVOLVED TIMELINE EVENTS:\n${JSON.stringify(relatedEvents, null, 2)}\n\nExecute profile analysis.` }
      ],
      stream: false
    };

    try {
      const response = await fetch(llmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Auditor Engine Offline.");

      const data = await response.json();
      const analysisText = data.message?.content || "Analysis failed to generate.";

      handleUpdateEntity('ai_analysis', analysisText);
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `[SYSTEM]: Profile Audit completed for ${entity.name}. Dossier updated.` }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `[SYSTEM ERROR]: Profile Audit Failure - ${error.message}` }]);
    } finally {
      setIsAuditingProfile(false);
    }
  };

  // --- Sub-Components ---
  const renderIcon = (type) => {
    switch (type) {
      case 'asset': return <UserX size={16} className="text-rose-500" />;
      case 'personnel': return <UserCog size={16} className="text-slate-400" />;
      case 'technology': return <Cpu size={16} className="text-teal-500" />;
      case 'anomaly': return <Biohazard size={16} className="text-amber-500" />;
      case 'event': return <Clock size={16} className="text-indigo-400" />;
      case 'memory': return <HardDrive size={16} className="text-emerald-500" />;
      default: return <FileWarning size={16} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-slate-300 font-sans overflow-hidden selection:bg-rose-900/50">

      {/* LEFT PANEL: Directory */}
      <div className="w-64 bg-[#0f1115] border-r border-slate-800/60 flex flex-col z-10 shadow-xl">
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2 font-bold text-slate-200 tracking-wide text-sm uppercase">
            <Database size={16} className="text-teal-600" />
            <span>Facility Registry</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap text-[10px] uppercase font-bold tracking-widest border-b border-slate-800/60 bg-[#0a0a0c]">
          {['all', 'asset', 'personnel', 'technology', 'anomaly', 'event', 'memory'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 min-w-[30%] py-2 text-center transition-colors ${activeFilter === f ? 'bg-slate-800/50 text-white border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            >
              {f === 'technology' ? 'Tech' : f === 'personnel' ? 'Staff' : f === 'memory' ? 'Memory' : f}
            </button>
          ))}
        </div>

        {/* Entity List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <div className="space-y-1 mb-3">
            <button
              onClick={() => setSelectedId(null)}
              className={`w-full text-left px-3 py-2 border border-slate-800/60 rounded flex items-center gap-3 transition-all duration-200 ${selectedId === null ? 'bg-teal-900/20 text-teal-400 shadow-inner border-teal-800/50' : 'bg-black/20 hover:bg-slate-900/50 text-slate-500 hover:text-slate-300'}`}
            >
              <span className="opacity-80"><Search size={14} /></span>
              <span className="truncate text-xs font-bold uppercase tracking-wider">Global Search View</span>
            </button>
            <button
              onClick={() => setSelectedId('timeline')}
              className={`w-full text-left px-3 py-2 border border-slate-800/60 rounded flex items-center gap-3 transition-all duration-200 ${selectedId === 'timeline' ? 'bg-indigo-900/20 text-indigo-400 shadow-inner border-indigo-800/50' : 'bg-black/20 hover:bg-slate-900/50 text-slate-500 hover:text-slate-300'}`}
            >
              <span className="opacity-80"><Clock size={14} /></span>
              <span className="truncate text-xs font-bold uppercase tracking-wider">Master Timeline View</span>
            </button>
            <button
              onClick={() => setSelectedId('network')}
              className={`w-full text-left px-3 py-2 border border-slate-800/60 rounded flex items-center gap-3 transition-all duration-200 ${selectedId === 'network' ? 'bg-rose-900/20 text-rose-400 shadow-inner border-rose-800/50' : 'bg-black/20 hover:bg-slate-900/50 text-slate-500 hover:text-slate-300'}`}
            >
              <span className="opacity-80"><Network size={14} /></span>
              <span className="truncate text-xs font-bold uppercase tracking-wider">Network Graph View</span>
            </button>
          </div>

          <div className="h-px w-full bg-slate-800/60 mb-2"></div>

          {filteredEntities.map(entity => (
            <button
              key={entity.id}
              onClick={() => setSelectedId(entity.id)}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-all duration-200 ${selectedId === entity.id ? 'bg-slate-800/80 text-white shadow-inner' : 'hover:bg-slate-900/50 text-slate-400'}`}
            >
              <span className="opacity-80">{renderIcon(entity.type)}</span>
              <span className="truncate text-sm font-medium">{entity.name}</span>
            </button>
          ))}
        </div>

        {/* Manufacture Buttons */}
        <div className="p-3 border-t border-slate-800/60 bg-black/20">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Initialize Record</p>
          <div className="grid grid-cols-6 gap-1.5">
            <button aria-label="Log Asset" onClick={() => createNewEntity('asset')} className="p-1.5 bg-[#15181e] hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/50 rounded flex justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500" title="Log Asset"><UserX size={14} className="text-rose-500" /></button>
            <button aria-label="Log Personnel" onClick={() => createNewEntity('personnel')} className="p-1.5 bg-[#15181e] hover:bg-slate-800 border border-slate-800 rounded flex justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400" title="Log Personnel"><UserCog size={14} className="text-slate-400" /></button>
            <button aria-label="Log Technology" onClick={() => createNewEntity('technology')} className="p-1.5 bg-[#15181e] hover:bg-teal-950/40 border border-slate-800 hover:border-teal-900/50 rounded flex justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500" title="Log Technology"><Cpu size={14} className="text-teal-500" /></button>
            <button aria-label="Log Anomaly" onClick={() => createNewEntity('anomaly')} className="p-1.5 bg-[#15181e] hover:bg-amber-950/40 border border-slate-800 hover:border-amber-900/50 rounded flex justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" title="Log Anomaly"><Biohazard size={14} className="text-amber-500" /></button>
            <button aria-label="Log Timeline Event" onClick={() => createNewEntity('event')} className="p-1.5 bg-[#15181e] hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-900/50 rounded flex justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" title="Log Timeline Event"><Clock size={14} className="text-indigo-400" /></button>
            <button aria-label="Log AI Memory" onClick={() => createNewEntity('memory')} className="p-1.5 bg-[#15181e] hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-900/50 rounded flex justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" title="Log AI Memory"><HardDrive size={14} className="text-emerald-500" /></button>
          </div>
        </div>

        {/* System Operations */}
        <div className="p-3 border-t border-slate-800/60 bg-[#0a0a0c] flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 p-1.5 bg-[#15181e] hover:bg-slate-800 border rounded text-[10px] uppercase tracking-widest transition-all border-slate-800 text-slate-400 hover:text-white"
            title="Save JSON to Desktop Folder"
          >
            <Download size={12} /> Backup
          </button>
          <input type="file" accept=".json" onChange={handleImport} ref={fileInputRef} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-1.5 bg-[#15181e] hover:bg-slate-800 border border-slate-800 rounded text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <Upload size={12} /> Restore
          </button>
        </div>

        <div className="p-3 border-t border-slate-800/60 bg-black/40">
          <button onClick={() => setShowIngest(true)} className="w-full flex items-center justify-center gap-2 p-2 bg-teal-900/20 hover:bg-teal-900/40 border border-teal-800/50 rounded text-[10px] uppercase tracking-widest text-teal-500 hover:text-teal-400 transition-colors">
            <Database size={12} /> Auto-Ingest Raw Text
          </button>
        </div>
      </div>

      {/* CENTER PANEL: Clinical Workspace OR Master Timeline */}
      <div className="flex-1 flex flex-col bg-[#0a0a0c] relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>

        {selectedId === 'network' ? (
          <div className="relative z-10 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-slate-800/60 flex items-center justify-between bg-gradient-to-b from-[#0f1115] to-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/40 border border-rose-900/50 rounded-lg shadow-inner">
                  <Network size={24} className="text-rose-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-light tracking-wide text-rose-100">Network Map</h1>
                  <p className="text-[10px] text-rose-500/70 uppercase tracking-widest mt-1 font-mono">Entity Connectivity Visualization</p>
                </div>
              </div>
              <div>
                <button
                  onClick={handleComputeNetworkEmbeddings}
                  disabled={isComputingEmbeddings}
                  className="px-4 py-2 bg-rose-900/20 hover:bg-rose-900/40 border border-rose-800/50 rounded text-xs text-rose-400 uppercase tracking-widest disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isComputingEmbeddings ? <><Activity size={14} className="animate-spin" /> Computing Vectors...</> : <><BrainCircuit size={14} /> Calculate Semantic Links</>}
                </button>
              </div>
            </div>

            <div className="flex-1 w-full h-full bg-[#0a0a0c]">
              <ForceGraph2D
                graphData={graphData}
                nodeLabel="name"
                nodeColor={(node) => {
                  switch (node.type) {
                    case 'asset': return '#f43f5e'; // rose-500
                    case 'personnel': return '#94a3b8'; // slate-400
                    case 'technology': return '#14b8a6'; // teal-500
                    case 'anomaly': return '#f59e0b'; // amber-500
                    case 'event': return '#818cf8'; // indigo-400
                    case 'memory': return '#10b981'; // emerald-500
                    default: return '#e2e8f0';
                  }
                }}
                nodeRelSize={6}
                linkColor={() => 'rgba(148, 163, 184, 0.4)'} // slate-400 with opacity
                linkWidth={(link) => Math.max(0.5, link.strength * 0.8)}
                linkOpacity={(link) => Math.min(1, 0.2 + (link.strength * 0.15))}
                onNodeClick={(node) => setSelectedId(node.id)}
                d3VelocityDecay={0.3}
                cooldownTicks={100}
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 12 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#cbd5e1'; // slate-300
                  ctx.fillText(label, node.x, node.y + (8 / globalScale) + fontSize);
                }}
              />
            </div>
          </div>
        ) : selectedId === 'timeline' ? (
          <div className="relative z-10 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-slate-800/60 flex items-center gap-4 bg-gradient-to-b from-[#0f1115] to-transparent">
              <div className="p-3 bg-black/40 border border-indigo-900/50 rounded-lg shadow-inner">
                <Clock size={24} className="text-indigo-500" />
              </div>
              <div>
                <h1 className="text-2xl font-light tracking-wide text-indigo-100">Chronological Flow</h1>
                <p className="text-[10px] text-indigo-500/70 uppercase tracking-widest mt-1 font-mono">Facility Event Sequence Mapping</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 relative">
              <div className="absolute left-16 top-10 bottom-10 w-0.5 bg-indigo-900/30"></div>

              {timelineEventsProcessed.length === 0 ? (
                <div className="text-center text-slate-600 font-mono mt-20">No events logged in the registry.</div>
              ) : (
                <div className="space-y-12">
                  {timelineEventsProcessed.map((event) => {
                    const renderedTags = event.involvedNames.map((name, idx) => {
                      const lowerName = event.involvedNamesLower[idx];
                      // ⚡ Bolt: Use pre-computed nameLower from entityLinkDictionary to avoid O(N*M) string allocations per render
                      // Utilize O(1) Map lookup rather than an O(N) Array.find over entityLinkDictionary on every iteration
                      const foundEntity = timelineEntityMatchCache.get(lowerName);

                      let ageText = "";
                      let deathWarning = false;

                      if (foundEntity && foundEntity.birth_date && event.timestamp) {
                        const age = getAge(foundEntity.birth_date, event.timestamp);
                        if (age !== null) ageText = ` [Age: ${age}]`;
                      }

                      if (foundEntity && foundEntity.death_date && event.timestamp) {
                        const deathAge = getAge(event.timestamp, foundEntity.death_date);
                        if (deathAge !== null && deathAge < 0) deathWarning = true;
                      }

                      return (
                        <span key={idx} onClick={(e) => { e.stopPropagation(); if (foundEntity) setSelectedId(foundEntity.id); }} className={`cursor-pointer text-[9px] uppercase tracking-widest px-2 py-1 rounded border flex items-center gap-1 font-mono hover:opacity-80 transition-opacity ${deathWarning ? 'bg-rose-950/40 text-rose-400 border-rose-900/50' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                          {deathWarning ? <AlertTriangle size={10} /> : <GitCommit size={10} />}
                          {name}{ageText}
                          {deathWarning && <span className="ml-1 text-rose-500 font-bold">⚠️ POST-MORTEM</span>}
                        </span>
                      );
                    });

                    return (
                      <div key={event.id} className="relative flex items-start group">
                        <div className="absolute left-6 -ml-1.5 mt-1.5 w-4 h-4 rounded-full bg-[#0a0a0c] border-2 border-indigo-500 z-10 flex items-center justify-center group-hover:border-rose-500 transition-colors">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full group-hover:bg-rose-500 transition-colors"></div>
                        </div>

                        <div className="w-16 pt-1 text-right pr-6">
                          <span className="text-xs font-mono font-bold text-indigo-400">#{event.sequence_number}</span>
                        </div>

                        <div className="flex-1 bg-black/40 border border-slate-800/60 rounded-lg p-5 hover:border-indigo-500/50 transition-colors cursor-pointer ml-4 shadow-lg group-hover:shadow-indigo-900/20" onClick={() => setSelectedId(event.id)}>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-slate-200">{event.name}</h3>
                            <div className="flex items-center gap-2">
                              <Calendar size={12} className="text-indigo-400" />
                              <span className="text-[10px] font-mono px-2 py-1 bg-indigo-950/40 text-indigo-300 rounded border border-indigo-900/50">{event.timestamp}</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-400 mb-4 leading-relaxed">{event.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {renderedTags.length > 0 ? renderedTags : <span className="text-[9px] uppercase tracking-widest text-slate-600 font-mono">No parsed records</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : selectedEntity ? (
          <div className="relative z-10 flex flex-col h-full">
            <div className="p-5 border-b border-slate-800/60 flex items-start justify-between bg-gradient-to-b from-[#0f1115] to-transparent">
              <div className="flex items-center gap-4 w-full">
                <div className="p-3 bg-black/40 border border-slate-800 rounded-lg shadow-inner">
                  {renderIcon(selectedEntity.type)}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    aria-label="Entity Name"
                    value={selectedEntity.name}
                    onChange={(e) => handleUpdateEntity('name', e.target.value)}
                    className="bg-transparent text-2xl font-light tracking-wide text-white outline-none w-full border-b border-transparent focus:border-slate-700 transition-colors"
                  />
                  <div className="flex gap-4 text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-mono">
                    <span className="flex items-center gap-1"><Database size={10} /> ID: {selectedEntity.id}</span>
                    <span className="flex items-center gap-1"><Activity size={10} /> TYPE: {selectedEntity.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  aria-label="Merge Record"
                  onClick={() => setShowMergeUI(!showMergeUI)}
                  className={`p-2 rounded transition-colors ${showMergeUI ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-600 hover:text-indigo-400 hover:bg-indigo-400/10'}`}
                  title="Merge Record"
                >
                  <GitMerge size={16} />
                </button>
                {confirmDeleteId === selectedEntity.id ? (
                  <div className="flex items-center gap-1 bg-rose-500/10 rounded px-2 py-1 border border-rose-500/20">
                    <span className="text-[10px] uppercase tracking-widest text-rose-500 font-bold mr-1">Purge?</span>
                    <button
                      aria-label="Confirm purge record"
                      onClick={() => deleteEntity(selectedEntity.id)}
                      className="p-1 text-rose-500 hover:bg-rose-500/20 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="Confirm Purge"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      aria-label="Cancel purge"
                      onClick={() => setConfirmDeleteId(null)}
                      className="p-1 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      title="Cancel Purge"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    aria-label="Purge record"
                    onClick={() => setConfirmDeleteId(selectedEntity.id)}
                    className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    title="Purge Record"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Merge Dropdown UI */}
            {showMergeUI && (
              <div className="bg-indigo-950/20 border-b border-indigo-900/50 p-3 flex items-center gap-3">
                <GitMerge size={14} className="text-indigo-400" />
                <label htmlFor="merge-target" className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Merge Into:</label>
                <select
                  id="merge-target"
                  value={mergeTargetId}
                  onChange={(e) => setMergeTargetId(e.target.value)}
                  className="flex-1 bg-[#0a0a0c] border border-indigo-900/50 rounded p-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="">Select target record to keep...</option>
                  {entities.filter(e => e.id !== selectedEntity.id).map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                  ))}
                </select>
                <button
                  onClick={() => handleMerge(selectedEntity.id, mergeTargetId)}
                  disabled={!mergeTargetId}
                  className="px-4 py-1.5 bg-indigo-900/40 hover:bg-indigo-800/60 disabled:opacity-50 disabled:hover:bg-indigo-900/40 border border-indigo-700 text-indigo-300 text-[9px] uppercase tracking-widest rounded transition-colors"
                >
                  Confirm Merge
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <TextAreaField
                label="Base Definition / Purpose"
                value={selectedEntity.description}
                onChange={(val) => handleUpdateEntity('description', val)}
                colorClass="text-slate-400"
                placeholder="Define the core nature of this entity..."
                detectedLinks={getDetectedLinks(selectedEntity.description, selectedEntity.id)}
                onNavigate={setSelectedId}
              />

              {selectedEntity.type !== 'event' && selectedEntity.type !== 'memory' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-lg border border-slate-800/80">
                  <TextAreaField
                    label="Required Inputs (Dependencies)"
                    value={selectedEntity.systemic_inputs}
                    onChange={(val) => handleUpdateEntity('systemic_inputs', val)}
                    colorClass="text-indigo-400"
                    placeholder="Materials, tech, or biological fuel required to function..."
                    detectedLinks={getDetectedLinks(selectedEntity.systemic_inputs, selectedEntity.id)}
                    onNavigate={setSelectedId}
                  />
                  <TextAreaField
                    label="Systemic Outputs (Yield & Byproduct)"
                    value={selectedEntity.systemic_outputs}
                    onChange={(val) => handleUpdateEntity('systemic_outputs', val)}
                    colorClass="text-emerald-400"
                    placeholder="What this produces, excretes, or forces into the system..."
                    detectedLinks={getDetectedLinks(selectedEntity.systemic_outputs, selectedEntity.id)}
                    onNavigate={setSelectedId}
                  />
                </div>
              )}

              <div className="bg-black/20 p-5 rounded-lg border border-slate-800/50 shadow-inner">
                <DynamicEntityFields
                  selectedEntity={selectedEntity}
                  handleUpdateEntity={handleUpdateEntity}
                  getDetectedLinks={getDetectedLinks}
                  setSelectedId={setSelectedId}
                  handleProfileAudit={handleProfileAudit}
                  isAuditingProfile={isAuditingProfile}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-4 relative z-10">
            <Search size={48} className="opacity-20 text-teal-500" />
            <div className="text-center">
              <p className="font-mono text-sm tracking-widest uppercase text-teal-500/70 mb-2">Global View Active</p>
              <p className="text-xs text-slate-500 max-w-sm">Queries submitted to the Overseer will utilize the Vector Embedding Engine to automatically retrieve and analyze the most mathematically relevant records.</p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Overseer Engine (LLM) */}
      <div className="w-80 bg-[#0f1115] border-l border-slate-800/60 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-20">
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2 font-bold text-teal-600 text-sm tracking-wide uppercase">
            <Cpu size={16} />
            <span>Mira / Overseer</span>
          </div>
          <button
            aria-label="Settings"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition-colors ${showSettings ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
          >
            <Settings size={14} />
          </button>
        </div>

        {showSettings && (
          <div className="p-4 border-b border-slate-800/60 bg-black/40 space-y-3 text-xs font-mono">
            <div>
              <label htmlFor="terminal-endpoint" className="block text-slate-500 mb-1">Terminal Endpoint</label>
              <input
                id="terminal-endpoint"
                type="text"
                value={llmUrl}
                onChange={(e) => setLlmUrl(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-slate-700 rounded px-2 py-1.5 text-slate-300 outline-none focus:border-teal-600 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="local-chat-engine" className="block text-slate-500 mb-1">Local Chat Engine</label>
              <input
                id="local-chat-engine"
                type="text"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-slate-700 rounded px-2 py-1.5 text-slate-300 outline-none focus:border-teal-600 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="vector-embedding-engine" className="block text-slate-500 mb-1">Vector Embedding Engine</label>
              <input
                id="vector-embedding-engine"
                type="text"
                value={embedModel}
                onChange={(e) => setEmbedModel(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-slate-700 rounded px-2 py-1.5 text-slate-300 outline-none focus:border-teal-600 transition-colors"
              />
            </div>
            <div className="text-[10px] text-teal-500/70 p-2 bg-teal-950/20 rounded border border-teal-900/30">
              Browser Local Storage Auto-Save is active. No manual save required to prevent data loss.
            </div>
          </div>
        )}

        {/* Overseer Tabs */}
        <div className="flex border-b border-slate-800/60 bg-[#0a0a0c]">
          <button
            onClick={() => setActiveOverseerTab('terminal')}
            className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${activeOverseerTab === 'terminal' ? 'bg-teal-950/20 text-teal-500 border-b-2 border-teal-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Terminal
          </button>
          <button
            onClick={() => setActiveOverseerTab('audit')}
            className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5 transition-colors ${activeOverseerTab === 'audit' ? 'bg-rose-950/20 text-rose-500 border-b-2 border-rose-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            CI Audit {auditLogs.length > 0 && <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[8px] leading-none">{auditLogs.length}</span>}
          </button>
        </div>

        {activeOverseerTab === 'terminal' ? (
          <>
            <div className="px-4 py-2 border-b border-slate-800/60 bg-teal-950/10 flex justify-between items-center shadow-inner">
              <span className="text-[9px] text-teal-600/70 uppercase tracking-widest font-mono flex items-center gap-1"><BrainCircuit size={10} /> Macro Directives</span>
              <div className="flex gap-1.5">
                <button
                  onClick={handleArchiveMemory}
                  disabled={isTyping}
                  className="px-2 py-1 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-800/50 hover:border-emerald-700/50 rounded text-[9px] text-emerald-500 hover:text-emerald-400 disabled:opacity-50 uppercase tracking-widest transition-colors"
                  title="Force AI to summarize and save its current understanding"
                >
                  <HardDrive size={10} /> Dump
                </button>
                <button
                  onClick={handleParadoxScan}
                  disabled={isTyping}
                  className="px-2 py-1 bg-teal-900/20 hover:bg-rose-900/30 border border-teal-800/50 hover:border-rose-700/50 rounded text-[9px] text-teal-500 hover:text-rose-400 disabled:opacity-50 uppercase tracking-widest transition-colors"
                  title="Scan entire database for contradictions"
                >
                  <Activity size={10} /> Scan
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {chatHistory.map((msg) => (
                <div key={msg.id || crypto.randomUUID()} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[9px] uppercase tracking-widest mb-1 ${msg.role === 'user' ? 'text-slate-500' : msg.role === 'system' ? 'text-rose-500/50' : 'text-teal-600'}`}>
                    {msg.role === 'user' ? 'Director Input' : msg.role === 'system' ? 'System Status' : 'Overseer Logic'}
                  </span>
                  <div className={`p-3 text-[13px] max-w-[92%] leading-relaxed font-mono ${msg.role === 'user'
                    ? 'bg-slate-800 text-slate-200 rounded-l-lg rounded-tr-lg border border-slate-700'
                    : msg.role === 'system'
                      ? 'bg-black text-rose-500/70 text-[10px] border border-rose-900/30 rounded w-full text-center'
                      : 'bg-teal-950/20 border border-teal-900/40 text-teal-100 rounded-r-lg rounded-tl-lg shadow-sm'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col items-start">
                  <span className="text-[9px] uppercase tracking-widest text-teal-600 mb-1">Processing</span>
                  <div className="p-3 bg-teal-950/20 border border-teal-900/40 rounded-r-lg rounded-tl-lg flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-pulse"></span>
                    <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-teal-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-slate-800/60 bg-[#0a0a0c]">
              <div className="relative">
                <textarea
                  aria-label="Terminal Input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={selectedEntity ? "Query active record logic..." : "Input directive..."}
                  className="w-full bg-[#15181e] border border-slate-700 rounded pl-3 pr-10 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-600 resize-none h-16 font-mono transition-colors shadow-inner"
                />
                <button
                  aria-label="Send message"
                  onClick={handleSendMessage}
                  disabled={isTyping || !chatInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-teal-600/20 hover:bg-teal-600/40 text-teal-500 disabled:text-slate-600 disabled:bg-transparent rounded transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[9px] text-slate-600 text-center mt-2 font-mono uppercase tracking-widest">Shift+Enter for newline</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-800/60 bg-black/40 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2"><Bug size={14} /> Logic Tracker</h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Pending Narrative Bugs</p>
              </div>
              <button
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="px-3 py-1.5 bg-rose-900/20 hover:bg-rose-900/40 border border-rose-800/50 rounded text-[10px] text-rose-400 uppercase tracking-widest disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {isAuditing ? <><Activity size={10} className="animate-spin" /> Scanning...</> : 'Run System Audit'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {auditLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
                  <CheckCircle size={32} className="opacity-20 text-emerald-500" />
                  <p className="text-xs font-mono text-center uppercase tracking-widest">No outstanding logic loops detected.<br />Run audit to verify structure.</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="bg-[#15181e] border border-slate-800 rounded-lg p-3 relative group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {log.severity === 'CRITICAL' && <AlertTriangle size={12} className="text-rose-500" />}
                        {log.severity === 'WARNING' && <AlertTriangle size={12} className="text-amber-500" />}
                        {log.severity === 'NOTE' && <Bell size={12} className="text-blue-400" />}
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${log.severity === 'CRITICAL' ? 'text-rose-500' : log.severity === 'WARNING' ? 'text-amber-500' : 'text-blue-400'
                          }`}>
                          {log.severity}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 bg-black/40 rounded border border-slate-800">
                        {log.target}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">{log.issue}</p>

                    <button
                      onClick={() => resolveAudit(log.id)}
                      className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 px-2 py-1 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-800/50 rounded text-[9px] text-emerald-500 uppercase tracking-widest transition-all"
                    >
                      Resolve
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* INGESTION MODAL OVERLAY */}
      {showIngest && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
          <div className="bg-[#0f1115] border border-slate-800 shadow-2xl rounded-lg w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2 font-bold text-teal-600 text-sm tracking-wide uppercase">
                <Database size={16} />
                <span>Raw Transcript Ingestion Terminal</span>
              </div>
              <button
                onClick={() => setShowIngest(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded p-1"
                aria-label="Close ingestion terminal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-4 overflow-hidden">
              <p className="text-xs text-slate-400 font-mono">
                Paste raw text from the "Trauma of Compliance" document below. The extraction algorithm will automatically map Assets, Personnel, Tech, Anomalies, and EVENTS.
              </p>
              <textarea
                aria-label="Raw Transcript Input"
                value={ingestText}
                onChange={(e) => setIngestText(e.target.value)}
                placeholder="Paste raw PDF transcript here..."
                className="flex-1 w-full bg-[#0a0a0c] border border-slate-800 rounded p-4 text-sm text-slate-300 focus:outline-none focus:border-teal-600 resize-none font-mono shadow-inner"
              />
            </div>

            <div className="p-4 border-t border-slate-800/60 bg-black/20 flex justify-end gap-3">
              <button
                onClick={() => setShowIngest(false)}
                className="px-4 py-2 border border-slate-700 rounded text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Abort
              </button>
              <button
                onClick={handleIngestRawText}
                disabled={isIngesting || !ingestText.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-teal-900/40 hover:bg-teal-800/60 border border-teal-700 rounded text-xs uppercase tracking-widest text-teal-400 hover:text-teal-300 disabled:opacity-50 transition-colors"
              >
                {isIngesting ? <><Activity size={14} className="animate-pulse" /> Processing...</> : 'Initialize Extraction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}