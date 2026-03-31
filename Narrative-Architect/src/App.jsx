import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import {
  Database, Biohazard, UserCog, UserX, Cpu,
  Settings, Send, Trash2, Activity, FileWarning,
  Download, Upload, Search, Clock, GitCommit,
  Bug, CheckCircle, AlertTriangle, Bell, Calendar,
  CornerDownRight, Fingerprint, HardDrive, BrainCircuit, GitMerge,
  Check, X, Network, Route, Plus
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

const handleAccessibleKeyDown = (callback) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    callback(e);
  }
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

// ⚡ Bolt: Pre-calculate vector magnitudes to avoid O(N^2) redundant multiplications
function calculateMagnitude(vec) {
  if (!vec) return 0;
  let norm = 0;
  for (let i = 0; i < vec.length; i++) {
    norm += vec[i] * vec[i];
  }
  return norm;
}

function calculateCosineSimilarity(vecA, vecB, normA = 0, normB = 0) {
  if (!vecA || !vecB) return 0;
  let dotProduct = 0;

  // Fast path if magnitudes are pre-computed
  if (normA > 0 && normB > 0) {
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Fallback if magnitudes aren't provided
  let calcNormA = 0, calcNormB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    calcNormA += vecA[i] * vecA[i];
    calcNormB += vecB[i] * vecB[i];
  }
  if (calcNormA === 0 || calcNormB === 0) return 0;
  return dotProduct / (Math.sqrt(calcNormA) * Math.sqrt(calcNormB));
}

// ⚡ Bolt: Hoist Regex to prevent recreation on every call
const DATE_PATTERN = /(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})/;

function parseDateString(dateStr) {
  if (!dateStr) return null;
  const str = safeString(dateStr);
  const parts = str.match(DATE_PATTERN);
  if (parts) {
    // ⚡ Bolt: Use Date.UTC to skip string allocation and datetime parsing overhead
    if (parts[3].length === 4) {
      return new Date(Date.UTC(parts[3], parts[2] - 1, parts[1]));
    } else if (parts[1].length === 4) {
      return new Date(Date.UTC(parts[1], parts[2] - 1, parts[3]));
    }
  }
  const fb = new Date(str);
  return isNaN(fb.getTime()) ? null : fb;
}

function getAge(birthStr, eventStr) {
  const b = parseDateString(birthStr);
  const e = parseDateString(eventStr);
  if (!b || !e) return null;
  // ⚡ Bolt: Use UTC methods for deterministic behavior matching Date.UTC
  let age = e.getUTCFullYear() - b.getUTCFullYear();
  const m = e.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && e.getUTCDate() < b.getUTCDate())) {
    age--;
  }
  return age;
}

async function fetchOllama(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP Error ${response.status} at ${url}`);
  }

  return response;
}

function extractJsonFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') return "";

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
    return rawText.substring(firstIndex, lastIndex + 1);
  }

  return rawText;
}

// --- UI Components ---

// ⚡ Bolt: Memoize the SidebarItem component to prevent O(N) re-renders
// of the entire list (often 2000+ items) when the user types in text inputs.
// The icon logic is contained within to avoid passing new JSX elements via props,
// which would break React.memo's shallow comparison.
const SidebarItem = memo(({ entity, isSelected, onClick }) => {
  let icon;
  switch (entity.type) {
    case 'asset': icon = <UserX size={16} className="text-rose-500" />; break;
    case 'personnel': icon = <UserCog size={16} className="text-slate-400" />; break;
    case 'technology': icon = <Cpu size={16} className="text-teal-500" />; break;
    case 'anomaly': icon = <Biohazard size={16} className="text-amber-500" />; break;
    case 'event': icon = <Clock size={16} className="text-indigo-400" />; break;
    case 'memory': icon = <HardDrive size={16} className="text-emerald-500" />; break;
    default: icon = <FileWarning size={16} />;
  }

  return (
    <button
      onClick={() => onClick(entity.id)}
      aria-current={isSelected ? "true" : undefined}
      className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 ${
        entity.type === 'asset' ? 'focus-visible:ring-rose-500' :
        entity.type === 'personnel' ? 'focus-visible:ring-slate-400' :
        entity.type === 'technology' ? 'focus-visible:ring-teal-500' :
        entity.type === 'anomaly' ? 'focus-visible:ring-amber-500' :
        entity.type === 'event' ? 'focus-visible:ring-indigo-400' :
        entity.type === 'memory' ? 'focus-visible:ring-emerald-500' :
        'focus-visible:ring-slate-400'
      } ${isSelected ? 'bg-slate-800/80 text-white shadow-inner' : 'hover:bg-slate-900/50 text-slate-400'}`}
    >
      <span className="opacity-80">{icon}</span>
      <span className="truncate text-sm font-medium">{entity.name}</span>
    </button>
  );
});

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
  const [isArchiving, setIsArchiving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
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
  const fgRef = useRef(null);

  // --- Graph State ---
  const [networkEmbeddings, setNetworkEmbeddings] = useState({});
  const [isComputingEmbeddings, setIsComputingEmbeddings] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  // Configure the force engine to space out nodes
  useEffect(() => {
    if (fgRef.current && selectedId === 'network') {
      const charge = fgRef.current.d3Force('charge');
      if (charge) {
        charge.strength(-400);
      }

      const linkForce = fgRef.current.d3Force('link');
      if (linkForce) {
        linkForce.distance(60);
      }

      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData, selectedId]);

  // Metro State
  const [selectedMetroIds, setSelectedMetroIds] = useState([]);
  const [metroAddTargetId, setMetroAddTargetId] = useState('');

  // Metro Timeline Drag Scrolling State
  const metroScrollRef = useRef(null);
  const [isMetroDragging, setIsMetroDragging] = useState(false);
  const [metroDragStart, setMetroDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // --- Derived State ---
  // ⚡ Bolt: Use a single O(N) pass to build both an O(1) ID Map and a type index.
  // This avoids multiple redundant array traversals for `entitiesMap`, `filteredEntities`, and `timelineEvents`.
  const { entitiesMap, entitiesByType } = useMemo(() => {
    const map = new Map();
    const byType = {
      asset: [], personnel: [], technology: [], anomaly: [], event: [], memory: []
    };

    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      map.set(e.id, e);
      if (byType[e.type]) {
        byType[e.type].push(e);
      } else {
        byType[e.type] = [e];
      }
    }

    return { entitiesMap: map, entitiesByType: byType };
  }, [entities]);

  const selectedEntity = useMemo(() =>
    entitiesMap.get(selectedId) || null
    , [entitiesMap, selectedId]);

  const filteredEntities = useMemo(() =>
    activeFilter === 'all'
      ? entities
      : entitiesByType[activeFilter] || []
    , [entities, activeFilter, entitiesByType]);

  const timelineEvents = useMemo(() =>
    [...(entitiesByType['event'] || [])].sort((a, b) => (Number(a.sequence_number) || 0) - (Number(b.sequence_number) || 0))
    , [entitiesByType]);

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

  // ⚡ Bolt: Memoize the list of entities available for the Metro Timeline dropdown
  // to prevent O(N) array filtering and concatenation on every render.
  const metroAddableEntities = useMemo(() => [
    ...(entitiesByType['asset'] || []),
    ...(entitiesByType['personnel'] || []),
    ...(entitiesByType['technology'] || []),
    ...(entitiesByType['anomaly'] || [])
  ], [entitiesByType]);

  // Pre-compile RegExp matchers to optimize the Advanced Link Detection Engine.
  // RegExp compilation inside the render loop was identified as a major performance bottleneck.
  // ⚡ Bolt: Use a ref Map to cache compiled matchers per entity.
  // Only invalidate and re-compile when a specific entity's name changes,
  // drastically reducing overhead when the entities array reference changes (e.g., during typing).
  const regexCacheRef = useRef(new Map());

  const entityLinkDictionary = useMemo(() => {
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // ⚡ Bolt: Use existing O(1) Map instead of O(N) Array allocation + O(N) Set insertion
    // Clean up cache entries for deleted entities
    for (const id of regexCacheRef.current.keys()) {
      if (!entitiesMap.has(id)) {
        regexCacheRef.current.delete(id);
      }
    }

    return entities.map(e => {
      const cached = regexCacheRef.current.get(e.id);
      const fullName = safeString(e.name).toLowerCase();

      // ⚡ Bolt: Return the EXACT cached object if the original entity object hasn't changed.
      // Returning `{ ...e, ...cached }` on every render causes O(N) new object allocations (often 2000+)
      // on every keystroke when typing in a single entity, causing massive GC pauses.
      if (cached && cached.nameLower === fullName && cached._entity === e) {
        return cached._dictEntry;
      }

      // Compile and cache new matchers if name changed or entity is new
      const baseName = fullName.split(' (')[0].trim();
      const strippedName = baseName.replace(/^(the|a|an)\s+/, '');

      const compiledData = {
        nameLower: fullName, // Pre-computed for fast timeline lookups
        baseNameLower: baseName, // Pre-computed for fast substring checks
        strippedNameLower: strippedName.length > 2 ? strippedName : null, // Pre-computed for fast substring checks
        matchFullName: new RegExp(`\\b${escapeRegExp(fullName)}\\b`, 'i'),
        matchBaseName: baseName.length > 2 ? new RegExp(`\\b${escapeRegExp(baseName)}\\b`, 'i') : null,
        matchStrippedName: strippedName.length > 2 ? new RegExp(`\\b${escapeRegExp(strippedName)}\\b`, 'i') : null,
      };

      // Crucial: Must spread original entity (...e) to prevent data loss in downstream components
      const dictEntry = {
        ...e,
        ...compiledData,
      };

      // Cache the original entity reference and the final merged object
      compiledData._entity = e;
      compiledData._dictEntry = dictEntry;

      regexCacheRef.current.set(e.id, compiledData);

      return dictEntry;
    });
  }, [entities, entitiesMap]);

  // ⚡ Bolt: Memoize the loose string matching resolution for timeline entities to avoid O(N*M) lookups on every render
  const timelineEntityMatchCache = useMemo(() => {
    const cache = new Map();
    // Get all unique lowercased names used in all events
    const uniqueNames = new Set();
    timelineEventsProcessed.forEach(event => {
      event.involvedNamesLower.forEach(name => uniqueNames.add(name));
    });

    // Create an O(1) lookup map for exact matches
    const exactMatchMap = new Map();
    for (let i = 0; i < entityLinkDictionary.length; i++) {
      const entity = entityLinkDictionary[i];
      if (!exactMatchMap.has(entity.nameLower)) {
        exactMatchMap.set(entity.nameLower, entity);
      }
    }

    // Compute the match once for each unique name
    uniqueNames.forEach(lowerName => {
      // Fast path: O(1) exact match lookup
      let foundEntity = exactMatchMap.get(lowerName);

      // Slow path: O(N) partial match fallback
      // ⚡ Bolt: Only perform expensive O(N) partial matches if the fragment is reasonably long (>3 chars)
      // This prevents massive CPU bottlenecks when users type short strings like "the", "a", or "an"
      if (!foundEntity && lowerName.length > 3) {
        foundEntity = entityLinkDictionary.find(e => {
          return e.nameLower.includes(lowerName) || lowerName.includes(e.nameLower);
        });
      }

      if (foundEntity) {
        cache.set(lowerName, foundEntity);
      }
    });
    return cache;
  }, [timelineEventsProcessed, entityLinkDictionary]);

  // --- Advanced Link Detection Engine ---
  // ⚡ Bolt: Compute global validation hash once per render.
  // This string joining is O(N) and prevents doing it inside `getDetectedLinks` which would be O(N^2).
  const globalNamesHash = useMemo(() => {
    let hash = '';
    for (let i = 0; i < entityLinkDictionary.length; i++) {
        hash += entityLinkDictionary[i].name + '|';
    }
    return hash;
  }, [entityLinkDictionary]);

  // ⚡ Bolt: Added a useRef cache.
  // Caches the resulting array iteration per entity ID based on their current text.
  // Prevents memory leak by only storing the *current* state of the text for that entity.
  const detectedLinksCacheRef = useRef({ hash: '', cache: new Map() });

  // Memoized so it can be safely included in dependency arrays
  const getDetectedLinks = React.useCallback((text, currentId) => {
    const safeText = safeString(text);
    if (!safeText) return [];

    if (detectedLinksCacheRef.current.hash !== globalNamesHash) {
        detectedLinksCacheRef.current.cache.clear();
        detectedLinksCacheRef.current.hash = globalNamesHash;
    }

    // ⚡ Bolt: Store a nested Map per entity ID to cache multiple text fields simultaneously.
    // getDetectedLinks is called multiple times per entity (e.g. description, systemic_inputs),
    // and caching by ID alone caused cache thrashing and constant O(N) regex re-evaluations.
    let entityCache = detectedLinksCacheRef.current.cache.get(currentId);
    if (!entityCache) {
      entityCache = new Map();
      detectedLinksCacheRef.current.cache.set(currentId, entityCache);
    }

    const cachedResult = entityCache.get(safeText);
    if (cachedResult) {
        return cachedResult;
    }

    const lowerText = safeText.toLowerCase();

    // ⚡ Bolt: Use the memoized entity dictionary to skip RegExp instantiation during rendering.
    // Also use primitive string `.includes()` checks as a fast path to skip expensive RegExp
    // evaluations for entities whose names don't even appear as substrings.
    const result = entityLinkDictionary.filter(e => {
      if (e.id === currentId) return false;

      // Fast path string check: skip expensive regex if the name doesn't even exist in the text
      if (!lowerText.includes(e.baseNameLower) &&
          (!e.strippedNameLower || !lowerText.includes(e.strippedNameLower))) {
        return false;
      }

      return e.matchFullName.test(lowerText) ||
             (e.matchBaseName && e.matchBaseName.test(lowerText)) ||
             (e.matchStrippedName && e.matchStrippedName.test(lowerText));
    });

    entityCache.set(safeText, result);
    return result;
  }, [entityLinkDictionary, globalNamesHash]);

  // ⚡ Bolt: Extract O(N^2) semantic similarity loop into a separate useMemo
  // This prevents recalculating cosine similarity for all pairs on every keystroke
  // when the network view is active, as it now only runs when networkEmbeddings changes.
  const semanticLinksCache = useMemo(() => {
    const cache = new Map();
    const entityIds = Object.keys(networkEmbeddings);

    if (entityIds.length === 0) return cache;

    // ⚡ Bolt: Pre-compute vector magnitudes in an O(N) pass to prevent recalculating
    // them inside the O(N^2) similarity loop, drastically reducing math operations.
    const magnitudes = new Map();
    for (let i = 0; i < entityIds.length; i++) {
      const id = entityIds[i];
      const vec = networkEmbeddings[id];
      if (vec) magnitudes.set(id, calculateMagnitude(vec));
    }

    for (let i = 0; i < entityIds.length; i++) {
      const e1 = entityIds[i];
      const vec1 = networkEmbeddings[e1];
      if (!vec1) continue;
      const mag1 = magnitudes.get(e1);

      for (let j = i + 1; j < entityIds.length; j++) {
        const e2 = entityIds[j];
        const vec2 = networkEmbeddings[e2];
        if (!vec2) continue;
        const mag2 = magnitudes.get(e2);

        const similarity = calculateCosineSimilarity(vec1, vec2, mag1, mag2);
        if (similarity > 0.75) {
          const weight = (similarity - 0.75) * 8;
          const key = e1 < e2 ? `${e1}|${e2}` : `${e2}|${e1}`;
          cache.set(key, { e1, e2, weight });
        }
      }
    }
    return cache;
  }, [networkEmbeddings]);

  // ⚡ Bolt: Cache text-based links per entity to prevent O(N^2) string matching on every network render
  const textLinksCacheRef = useRef({ namesHash: '', cache: new Map() });

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
    // ⚡ Bolt: Replaced `.map().join()` with a `for` loop for string concatenation.
    // V8 optimizes `+=` via cons-strings. Creating an intermediate array and joining is 3-5x slower.
    let currentNamesHash = '';
    for (let i = 0; i < entities.length; i++) {
      currentNamesHash += entities[i].name + '|';
    }

    const cacheData = textLinksCacheRef.current;
    if (cacheData.namesHash !== currentNamesHash) {
      cacheData.cache.clear();
      cacheData.namesHash = currentNamesHash;
    }

    entities.forEach(entity => {
      // ⚡ Bolt: Replaced expensive array allocation and .filter(Boolean).join(' ')
      // with primitive string concatenation to improve performance and reduce GC overhead
      // during network graph rendering.
      let allText = '';
      if (entity.description) allText += entity.description + ' ';
      if (entity.systemic_inputs) allText += entity.systemic_inputs + ' ';
      if (entity.systemic_outputs) allText += entity.systemic_outputs + ' ';
      if (entity.biological_alterations) allText += entity.biological_alterations + ' ';
      if (entity.attributes) allText += entity.attributes + ' ';
      if (entity.liabilities) allText += entity.liabilities + ' ';
      if (entity.involved_records) allText += entity.involved_records + ' ';
      if (entity.systemic_impact) allText += entity.systemic_impact + ' ';
      if (entity.unresolved_threads) allText += entity.unresolved_threads + ' ';
      if (entity.ai_analysis) allText += entity.ai_analysis + ' ';
      if (allText.length > 0) allText = allText.slice(0, -1);

      let cachedEntry = cacheData.cache.get(entity.id);
      if (cachedEntry && cachedEntry.text === allText) {
        cachedEntry.linkIds.forEach(targetId => {
          addLinkWeight(entity.id, targetId, 1.5, 'text');
        });
      } else {
        const links = getDetectedLinks(allText, entity.id);
        const linkIds = links.map(l => l.id);
        cacheData.cache.set(entity.id, { text: allText, linkIds });
        linkIds.forEach(targetId => {
          addLinkWeight(entity.id, targetId, 1.5, 'text');
        });
      }
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

  // --- Metro Timeline Computation ---
  const metroLayout = useMemo(() => {
    if (selectedId !== 'metro' || selectedMetroIds.length === 0) return { events: [], lines: [], width: 0, height: 0 };

    // 1. Filter and sort events that involve at least one selected entity
    const relevantEvents = [];

    // ⚡ Bolt: We need to efficiently check if an event involves any selected entity.
    // Replaced nested O(N*M) array allocations and redundant `.some()` methods with
    // a pre-computed map and optimized `for` loops to drastically reduce computation
    // time and GC overhead during metro timeline rendering.
    const selectedEntitiesMap = new Map();
    for (let i = 0; i < selectedMetroIds.length; i++) {
        const id = selectedMetroIds[i];
        const e = entitiesMap.get(id);
        if (e) {
            const parsedName = e.name.split(' (')[0].trim().toLowerCase();
            if (parsedName) {
                selectedEntitiesMap.set(id, parsedName);
            }
        }
    }

    // Convert to array of entries for fast iteration
    const selectedEntries = Array.from(selectedEntitiesMap.entries());
    const selectedEntriesLen = selectedEntries.length;

    for (let i = 0; i < timelineEventsProcessed.length; i++) {
        const event = timelineEventsProcessed[i];
        const involvedNamesLower = event.involvedNamesLower;
        const involvedNamesLen = involvedNamesLower.length;

        const involvedIds = [];

        // For each relevant event, figure out specifically WHICH selected IDs are involved
        for (let j = 0; j < selectedEntriesLen; j++) {
            const entry = selectedEntries[j];
            const id = entry[0];
            const selectedName = entry[1];

            for (let k = 0; k < involvedNamesLen; k++) {
                const involvedName = involvedNamesLower[k];
                if (involvedName.includes(selectedName) || selectedName.includes(involvedName)) {
                    involvedIds.push(id);
                    break;
                }
            }
        }

        if (involvedIds.length > 0) {
            relevantEvents.push({
                ...event,
                involvedMetroIds: involvedIds
            });
        }
    }

    // 2. Constants for layout
    const laneSpacing = 60;
    const eventSpacingX = 250;
    const startXOffset = 100;
    const topMargin = 50;

    // Total dimensions
    const width = startXOffset + (relevantEvents.length * eventSpacingX) + 200; // Extra space at end
    const height = topMargin + (selectedMetroIds.length * laneSpacing) + 50;

    // 3. Assign base Y coordinates (lanes) to each selected entity
    const laneMap = new Map();
    selectedMetroIds.forEach((id, index) => {
      laneMap.set(id, topMargin + (index * laneSpacing));
    });

    // 4. Calculate Event Node coordinates
    const layoutEvents = relevantEvents.map((event, index) => {
      const x = startXOffset + (index * eventSpacingX);

      // Calculate Y coordinate based on involved entities
      let y = 0;
      if (event.involvedMetroIds.length > 0) {
        const sumY = event.involvedMetroIds.reduce((sum, id) => sum + laneMap.get(id), 0);
        y = sumY / event.involvedMetroIds.length;
      } else {
        y = topMargin; // Fallback
      }

      return {
        ...event,
        x,
        y
      };
    });

    // 5. Generate Paths for each selected entity
    const colors = [
      '#f43f5e', // rose
      '#14b8a6', // teal
      '#f59e0b', // amber
      '#818cf8', // indigo
      '#10b981', // emerald
      '#a855f7', // purple
      '#ec4899', // pink
      '#3b82f6', // blue
    ];

    const lines = selectedMetroIds.map((id, index) => {
      const color = colors[index % colors.length];
      const baseY = laneMap.get(id);
      let pathData = '';

      if (layoutEvents.length === 0) {
        // Draw a straight line if no events
        pathData = `M 0 ${baseY} L ${width} ${baseY}`;
        return { id, color, pathData };
      }

      let currentX = 0;
      let currentY = baseY;

      pathData = `M ${currentX} ${currentY}`;

      layoutEvents.forEach((event) => {
        const isInvolved = event.involvedMetroIds.includes(id);
        const targetX = event.x;
        const targetY = isInvolved ? event.y : baseY;

        // Curve control points
        const controlOffset = 80;

        pathData += ` C ${currentX + controlOffset} ${currentY}, ${targetX - controlOffset} ${targetY}, ${targetX} ${targetY}`;

        currentX = targetX;
        currentY = targetY;
      });

      // Finish line offscreen
      pathData += ` C ${currentX + 80} ${currentY}, ${width - 80} ${baseY}, ${width} ${baseY}`;

      return { id, color, pathData };
    });

    return { events: layoutEvents, lines, width, height, laneMap, colors };

  }, [selectedId, selectedMetroIds, timelineEventsProcessed, entitiesMap]);

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

          const batchRes = await fetchOllama(embedUrl, { model: embedModel, input: inputs });

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
    const newId = `e-${crypto.randomUUID()}`;
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
    const baseFieldsArray = ['id', 'type', 'name', 'description', 'systemic_inputs', 'systemic_outputs'];
    const validFieldsByType = {
      'asset': new Set([...baseFieldsArray, 'birth_date', 'death_date', 'biological_alterations', 'compliance_metric', 'degradation_status', 'ai_analysis']),
      'personnel': new Set([...baseFieldsArray, 'birth_date', 'death_date', 'attributes', 'ulterior_motives', 'liabilities', 'ai_analysis']),
      'technology': new Set([...baseFieldsArray, 'biological_cost', 'deployment_status']),
      'anomaly': new Set([...baseFieldsArray, 'manifestation', 'environmental_impact']),
      'event': new Set([...baseFieldsArray, 'sequence_number', 'timestamp', 'involved_records', 'systemic_impact']),
      'memory': new Set([...baseFieldsArray, 'timestamp', 'unresolved_threads'])
    };

    const baseFields = new Set(baseFieldsArray);

    const targetType = targetEntity.type;
    const validTargetFields = validFieldsByType[targetType] || baseFields;

    const unmappedDetails = [];

    const coreIdentityFields = new Set(['id', 'type', 'name']);

    // Process all fields from the source entity
    Object.keys(sourceEntity).forEach(field => {
      // Skip core identity fields
      if (coreIdentityFields.has(field)) return;

      const sourceValue = safeString(sourceEntity[field]).trim();
      if (!sourceValue) return;

      if (validTargetFields.has(field)) {
        // If it's a valid field for the target, merge normally
        mergedTarget[field] = combineText(targetEntity[field], sourceEntity[field]);
      } else {
        // If it's not valid for the target type, push to unmapped details
        // Format the field name nicely (e.g., biological_alterations -> Biological Alterations)
        const formattedField = field.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
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
        if (!Array.isArray(importedData)) {
          throw new Error("Import data must be an array of entities.");
        }

        const validEntities = importedData.filter(ent =>
          ent !== null &&
          typeof ent === 'object' &&
          typeof ent.id === 'string' &&
          typeof ent.type === 'string'
        );

        if (validEntities.length === 0 && importedData.length > 0) {
           throw new Error("No valid entities found in import data. Required fields: 'id' (string), 'type' (string).");
        }

        setEntities(validEntities.map(sanitizeEntity));

        const successMsg = `[SYSTEM]: External biological data feed imported successfully. ${validEntities.length} entities loaded.` +
                           (validEntities.length < importedData.length ? ` (${importedData.length - validEntities.length} invalid entities skipped).` : '');
        setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: successMsg }]);
      } catch (err) {
        console.error("Failed to parse or validate backup:", err);
        setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `[ERROR]: Import failed. ${err.message}` }]);
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

        const queryRes = await fetchOllama(embedUrl, { model: embedModel, input: userMsg.content });
        const queryData = await queryRes.json();
        const queryVector = queryData.embeddings[0];

        // ⚡ Bolt: Optimize O(N) API calls by reusing the existing networkEmbeddings cache.
        // Only fetch embeddings for entities missing from the cache, similar to network view.
        const newEmbeddings = { ...networkEmbeddings };
        const missingEntities = entities.filter(e => !newEmbeddings[e.id]);

        if (missingEntities.length > 0) {
          const batchSize = 10;
          for (let i = 0; i < missingEntities.length; i += batchSize) {
            const batch = missingEntities.slice(i, i + batchSize);
            const inputs = batch.map(e => {
               return `${e.name}. ${safeString(e.description)}. ${safeString(e.systemic_inputs)}. ${safeString(e.systemic_outputs)}`;
            });

            const batchRes = await fetchOllama(embedUrl, { model: embedModel, input: inputs });
            const batchData = await batchRes.json();

            batch.forEach((e, idx) => {
              newEmbeddings[e.id] = batchData.embeddings[idx];
            });
          }

          // Persist the newly fetched embeddings back to state to benefit subsequent queries
          // and the network view.
          setNetworkEmbeddings(newEmbeddings);
        }

        const queryMag = calculateMagnitude(queryVector);
        const scoredEntities = entities.map((entity) => {
          const vec = newEmbeddings[entity.id];
          const mag = vec ? calculateMagnitude(vec) : 0;
          return {
            entity,
            score: calculateCosineSimilarity(queryVector, vec, queryMag, mag)
          };
        }).sort((a, b) => b.score - a.score);

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

      const response = await fetchOllama(llmUrl, payload);

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
    if (isTyping || isArchiving) return;
    setIsArchiving(true);
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
      const response = await fetchOllama(llmUrl, payload);
      const data = await response.json();
      let rawText = data.message?.content || "";

      // Aggressive JSON extraction
      rawText = extractJsonFromText(rawText);

      const parsed = JSON.parse(rawText) || {};

      const newId = `e-mem-${crypto.randomUUID()}`;

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
      setIsArchiving(false);
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
      const response = await fetchOllama(llmUrl, payload);
      const data = await response.json();
      let rawText = data.message?.content || "";

      // Aggressive JSON extraction
      rawText = extractJsonFromText(rawText);

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
    if (isTyping || isScanning) return;
    setIsScanning(true);
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
      const response = await fetchOllama(llmUrl, payload);
      const data = await response.json();
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.message?.content || "Error: Corrupted feed." }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `[SYSTEM REJECTION]: ${error.message}` }]);
    } finally {
      setIsScanning(false);
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
      const response = await fetchOllama(llmUrl, payload);
      const data = await response.json();
      let rawText = data.message?.content || "";

      // Aggressive JSON extraction
      rawText = extractJsonFromText(rawText);

      let parsedData = JSON.parse(rawText);
      let extractedAudits = parsedData.audits || parsedData;

      if (extractedAudits && !Array.isArray(extractedAudits)) {
        extractedAudits = [extractedAudits];
      }

      if (Array.isArray(extractedAudits)) {
        const sanitizedAudits = extractedAudits.map(audit => ({
          id: safeString(audit.id) || `audit-${crypto.randomUUID()}`,
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
      const response = await fetchOllama(llmUrl, payload);
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
  // Memoized renderIcon to prevent breaking React.memo when passed as a prop
  // or used elsewhere, though mostly handled directly inside SidebarItem now.
  const renderIcon = React.useCallback((type) => {
    switch (type) {
      case 'asset': return <UserX size={16} className="text-rose-500" />;
      case 'personnel': return <UserCog size={16} className="text-slate-400" />;
      case 'technology': return <Cpu size={16} className="text-teal-500" />;
      case 'anomaly': return <Biohazard size={16} className="text-amber-500" />;
      case 'event': return <Clock size={16} className="text-indigo-400" />;
      case 'memory': return <HardDrive size={16} className="text-emerald-500" />;
      default: return <FileWarning size={16} />;
    }
  }, []);

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
        <div role="tablist" aria-label="Entity Types" className="flex flex-wrap text-[10px] uppercase font-bold tracking-widest border-b border-slate-800/60 bg-[#0a0a0c]">
          {['all', 'asset', 'personnel', 'technology', 'anomaly', 'event', 'memory'].map(f => (
            <button
              key={f}
              role="tab"
              aria-selected={activeFilter === f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 min-w-[30%] py-2 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:z-10 relative ${activeFilter === f ? 'bg-slate-800/50 text-white border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
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
              aria-current={selectedId === null ? "true" : undefined}
              title="Switch to Global Search View"
              aria-label="Global Search View"
              className={`w-full text-left px-3 py-2 border border-slate-800/60 rounded flex items-center gap-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${selectedId === null ? 'bg-teal-900/20 text-teal-400 shadow-inner border-teal-800/50' : 'bg-black/20 hover:bg-slate-900/50 text-slate-500 hover:text-slate-300'}`}
            >
              <span className="opacity-80"><Search size={14} /></span>
              <span className="truncate text-xs font-bold uppercase tracking-wider">Global Search View</span>
            </button>
            <button
              onClick={() => setSelectedId('timeline')}
              aria-current={selectedId === 'timeline' ? "true" : undefined}
              title="Switch to Master Timeline View"
              aria-label="Master Timeline View"
              className={`w-full text-left px-3 py-2 border border-slate-800/60 rounded flex items-center gap-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${selectedId === 'timeline' ? 'bg-indigo-900/20 text-indigo-400 shadow-inner border-indigo-800/50' : 'bg-black/20 hover:bg-slate-900/50 text-slate-500 hover:text-slate-300'}`}
            >
              <span className="opacity-80"><Clock size={14} /></span>
              <span className="truncate text-xs font-bold uppercase tracking-wider">Master Timeline View</span>
            </button>
            <button
              onClick={() => setSelectedId('metro')}
              aria-current={selectedId === 'metro' ? "true" : undefined}
              title="Switch to Metro Timeline View"
              aria-label="Metro Timeline View"
              className={`w-full text-left px-3 py-2 border border-slate-800/60 rounded flex items-center gap-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${selectedId === 'metro' ? 'bg-amber-900/20 text-amber-400 shadow-inner border-amber-800/50' : 'bg-black/20 hover:bg-slate-900/50 text-slate-500 hover:text-slate-300'}`}
            >
              <span className="opacity-80"><Route size={14} /></span>
              <span className="truncate text-xs font-bold uppercase tracking-wider">Metro Timeline View</span>
            </button>
            <button
              onClick={() => setSelectedId('network')}
              aria-current={selectedId === 'network' ? "true" : undefined}
              title="Switch to Network Graph View"
              aria-label="Network Graph View"
              className={`w-full text-left px-3 py-2 border border-slate-800/60 rounded flex items-center gap-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${selectedId === 'network' ? 'bg-rose-900/20 text-rose-400 shadow-inner border-rose-800/50' : 'bg-black/20 hover:bg-slate-900/50 text-slate-500 hover:text-slate-300'}`}
            >
              <span className="opacity-80"><Network size={14} /></span>
              <span className="truncate text-xs font-bold uppercase tracking-wider">Network Graph View</span>
            </button>
          </div>

          <div className="h-px w-full bg-slate-800/60 mb-2"></div>

          {filteredEntities.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <Database size={24} className="mx-auto mb-2 opacity-20" />
              <p className="text-xs font-mono uppercase tracking-widest">
                No {activeFilter === 'all' ? '' : activeFilter + ' '}records found
              </p>
            </div>
          ) : (
            filteredEntities.map(entity => (
              <SidebarItem
                key={entity.id}
                entity={entity}
                isSelected={selectedId === entity.id}
                onClick={setSelectedId}
              />
            ))
          )}
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
            className="flex-1 flex items-center justify-center gap-2 p-1.5 bg-[#15181e] hover:bg-slate-800 border rounded text-[10px] uppercase tracking-widest transition-all border-slate-800 text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            title="Save JSON to Desktop Folder"
          >
            <Download size={12} /> Backup
          </button>
          <input type="file" accept=".json" onChange={handleImport} ref={fileInputRef} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 p-1.5 bg-[#15181e] hover:bg-slate-800 border border-slate-800 rounded text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            title="Load JSON backup file"
          >
            <Upload size={12} /> Restore
          </button>
        </div>

        <div className="p-3 border-t border-slate-800/60 bg-black/40">
          <button
            onClick={() => setShowIngest(true)}
            className="w-full flex items-center justify-center gap-2 p-2 bg-teal-900/20 hover:bg-teal-900/40 border border-teal-800/50 rounded text-[10px] uppercase tracking-widest text-teal-500 hover:text-teal-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            title="Open raw text extraction terminal"
          >
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
                  title={isComputingEmbeddings ? "Computing vectors..." : "Calculate semantic similarities for the network graph"}
                  className="px-4 py-2 bg-rose-900/20 hover:bg-rose-900/40 border border-rose-800/50 rounded text-xs text-rose-400 uppercase tracking-widest disabled:opacity-50 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  {isComputingEmbeddings ? <><Activity size={14} className="animate-spin" /> Computing Vectors...</> : <><BrainCircuit size={14} /> Calculate Semantic Links</>}
                </button>
              </div>
            </div>

            <div className="flex-1 w-full h-full bg-[#0a0a0c]">
              <ForceGraph2D
                ref={fgRef}
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
        ) : selectedId === 'metro' ? (
          <div className="relative z-10 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-slate-800/60 flex items-center justify-between bg-gradient-to-b from-[#0f1115] to-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/40 border border-amber-900/50 rounded-lg shadow-inner">
                  <Route size={24} className="text-amber-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-light tracking-wide text-amber-100">Metro Timeline</h1>
                  <p className="text-[10px] text-amber-500/70 uppercase tracking-widest mt-1 font-mono">Entity Intersection Visualization</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="metro-entity-select" className="sr-only">Select entity to add</label>
                <select
                  id="metro-entity-select"
                  value={metroAddTargetId}
                  onChange={(e) => setMetroAddTargetId(e.target.value)}
                  className="bg-[#0a0a0c] border border-amber-900/50 rounded p-1.5 text-xs text-slate-300 outline-none focus:border-amber-500 font-mono focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <option value="">Select entity to add...</option>
                  {metroAddableEntities.filter(e => !selectedMetroIds.includes(e.id)).map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (metroAddTargetId && !selectedMetroIds.includes(metroAddTargetId)) {
                      setSelectedMetroIds([...selectedMetroIds, metroAddTargetId]);
                      setMetroAddTargetId('');
                    }
                  }}
                  disabled={!metroAddTargetId}
                  title={!metroAddTargetId ? 'Select an entity first' : 'Add line to timeline'}
                  className="px-3 py-1.5 bg-amber-900/40 hover:bg-amber-800/60 disabled:opacity-50 border border-amber-700 text-amber-300 text-[10px] uppercase tracking-widest rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 flex items-center gap-1"
                >
                  <Plus size={12} /> Add Line
                </button>
              </div>
            </div>

            {selectedMetroIds.length > 0 && (
              <div className="px-5 py-2 border-b border-slate-800/60 bg-black/20 flex flex-wrap gap-2">
                {selectedMetroIds.map(id => {
                  const entity = entitiesMap.get(id);
                  if (!entity) return null;
                  return (
                    <div key={id} className="flex items-center gap-1.5 px-2 py-1 bg-[#15181e] border border-slate-700 rounded text-xs text-slate-300 font-mono">
                      <span>{entity.name}</span>
                      <button
                        onClick={() => setSelectedMetroIds(selectedMetroIds.filter(mid => mid !== id))}
                        className="text-slate-500 hover:text-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded"
                        title={`Remove ${entity.name}`}
                        aria-label={`Remove ${entity.name}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              ref={metroScrollRef}
              className={`flex-1 w-full h-full bg-[#0a0a0c] overflow-auto relative p-8 ${isMetroDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
              style={{ minHeight: 0 }}
              onMouseDown={(e) => {
                setIsMetroDragging(true);
                setMetroDragStart({
                  x: e.pageX - metroScrollRef.current.offsetLeft,
                  y: e.pageY - metroScrollRef.current.offsetTop,
                  scrollLeft: metroScrollRef.current.scrollLeft,
                  scrollTop: metroScrollRef.current.scrollTop
                });
              }}
              onMouseLeave={() => setIsMetroDragging(false)}
              onMouseUp={() => setIsMetroDragging(false)}
              onMouseMove={(e) => {
                if (!isMetroDragging) return;
                e.preventDefault();
                const x = e.pageX - metroScrollRef.current.offsetLeft;
                const y = e.pageY - metroScrollRef.current.offsetTop;
                const walkX = (x - metroDragStart.x) * 1.5;
                const walkY = (y - metroDragStart.y) * 1.5;
                metroScrollRef.current.scrollLeft = metroDragStart.scrollLeft - walkX;
                metroScrollRef.current.scrollTop = metroDragStart.scrollTop - walkY;
              }}
            >
              {selectedMetroIds.length === 0 ? (
                <div className="text-center text-slate-500 mt-20">
                  <Route size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-mono uppercase tracking-widest">Select an entity from the dropdown to start drawing the metro map.</p>
                </div>
              ) : metroLayout.events.length === 0 ? (
                <div className="text-center text-slate-500 mt-20">
                  <Route size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-mono uppercase tracking-widest">No events found involving the selected entities.</p>
                </div>
              ) : (
                <div style={{ width: metroLayout.width, height: metroLayout.height, minWidth: metroLayout.width, minHeight: metroLayout.height, position: 'relative' }}>
                  <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
                    {metroLayout.lines.map((line) => (
                      <path
                        key={line.id}
                        d={line.pathData}
                        fill="none"
                        stroke={line.color}
                        strokeWidth="4"
                        strokeOpacity="0.8"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    ))}
                    {metroLayout.events.map((event) => (
                      <circle
                        key={`node-${event.id}`}
                        cx={event.x}
                        cy={event.y}
                        r="6"
                        fill="#0a0a0c"
                        stroke="#fff"
                        strokeWidth="2"
                        className="cursor-pointer transition-transform hover:scale-150"
                        onClick={() => setSelectedId(event.id)}
                      >
                        <title>{event.name}</title>
                      </circle>
                    ))}
                  </svg>

                  {metroLayout.events.map((event) => (
                    <div
                      key={`card-${event.id}`}
                      className="absolute bg-[#15181e] border border-slate-700 rounded p-2 text-xs shadow-lg cursor-pointer hover:border-amber-500/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      style={{
                        left: event.x - 75, // Center the 150px wide card
                        top: event.y + 15,
                        width: '150px',
                        zIndex: 10
                      }}
                      onClick={() => setSelectedId(event.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={handleAccessibleKeyDown(() => setSelectedId(event.id))}
                    >
                      <div className="font-bold text-slate-300 truncate mb-1" title={event.name}>{event.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between">
                        <span>#{event.sequence_number}</span>
                        <span>{event.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <div className="text-center text-slate-500 mt-20">
                  <Clock size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-mono uppercase tracking-widest">No events logged in the registry.</p>
                </div>
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
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); if (foundEntity) setSelectedId(foundEntity.id); }}
                          className={`cursor-pointer text-[9px] uppercase tracking-widest px-2 py-1 rounded border flex items-center gap-1 font-mono hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 ${deathWarning ? 'bg-rose-950/40 text-rose-400 border-rose-900/50 focus-visible:ring-rose-500' : 'bg-slate-900 text-slate-400 border-slate-800 focus-visible:ring-slate-400'}`}
                        >
                          {deathWarning ? <AlertTriangle size={10} /> : <GitCommit size={10} />}
                          {name}{ageText}
                          {deathWarning && <span className="ml-1 text-rose-500 font-bold">⚠️ POST-MORTEM</span>}
                        </button>
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

                        <div
                          className="flex-1 bg-black/40 border border-slate-800/60 rounded-lg p-5 hover:border-indigo-500/50 transition-colors cursor-pointer ml-4 shadow-lg group-hover:shadow-indigo-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          onClick={() => setSelectedId(event.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={handleAccessibleKeyDown(() => setSelectedId(event.id))}
                        >
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
                    className={`p-2 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${showMergeUI ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-600 hover:text-indigo-400 hover:bg-indigo-400/10'}`}
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
                  className="flex-1 bg-[#0a0a0c] border border-indigo-900/50 rounded p-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500 font-mono focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <option value="">Select target record to keep...</option>
                  {entities.filter(e => e.id !== selectedEntity.id).map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                  ))}
                </select>
                <button
                  onClick={() => handleMerge(selectedEntity.id, mergeTargetId)}
                  disabled={!mergeTargetId}
                  title={!mergeTargetId ? "Select a target record to merge into first" : "Confirm merge"}
                  aria-label="Confirm Merge"
                  className="px-4 py-1.5 bg-indigo-900/40 hover:bg-indigo-800/60 disabled:opacity-50 disabled:hover:bg-indigo-900/40 border border-indigo-700 text-indigo-300 text-[9px] uppercase tracking-widest rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  Confirm Merge
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <TextAreaField
                label="Base Definition / Purpose"
                colorClass="text-slate-400"
                detectedLinks={getDetectedLinks(selectedEntity.description, selectedEntity.id)}
                onNavigate={setSelectedId}
                value={selectedEntity.description || ''}
                onChange={(e) => handleUpdateEntity('description', e.target.value)}
                placeholder="Define the core nature of this entity..."
              />

              {selectedEntity.type !== 'event' && selectedEntity.type !== 'memory' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-lg border border-slate-800/80">
                  <TextAreaField
                    label="Required Inputs (Dependencies)"
                    colorClass="text-indigo-400"
                    detectedLinks={getDetectedLinks(selectedEntity.systemic_inputs, selectedEntity.id)}
                    onNavigate={setSelectedId}
                    value={selectedEntity.systemic_inputs || ''}
                    onChange={(e) => handleUpdateEntity('systemic_inputs', e.target.value)}
                    placeholder="Materials, tech, or biological fuel required to function..."
                  />
                  <TextAreaField
                    label="Systemic Outputs (Yield & Byproduct)"
                    colorClass="text-emerald-400"
                    detectedLinks={getDetectedLinks(selectedEntity.systemic_outputs, selectedEntity.id)}
                    onNavigate={setSelectedId}
                    value={selectedEntity.systemic_outputs || ''}
                    onChange={(e) => handleUpdateEntity('systemic_outputs', e.target.value)}
                    placeholder="What this produces, excretes, or forces into the system..."
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
            title="Toggle Overseer Settings"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${showSettings ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
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
        <div role="tablist" aria-label="Overseer Tabs" className="flex border-b border-slate-800/60 bg-[#0a0a0c]">
          <button
            role="tab"
            aria-selected={activeOverseerTab === 'terminal'}
            onClick={() => setActiveOverseerTab('terminal')}
            className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:z-10 relative ${activeOverseerTab === 'terminal' ? 'bg-teal-950/20 text-teal-500 border-b-2 border-teal-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Terminal
          </button>
          <button
            role="tab"
            aria-selected={activeOverseerTab === 'audit'}
            onClick={() => setActiveOverseerTab('audit')}
            className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:z-10 relative ${activeOverseerTab === 'audit' ? 'bg-rose-950/20 text-rose-500 border-b-2 border-rose-500' : 'text-slate-500 hover:text-slate-300'}`}
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
                  className="px-2 py-1 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-800/50 hover:border-emerald-700/50 rounded text-[9px] text-emerald-500 hover:text-emerald-400 disabled:opacity-50 uppercase tracking-widest transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  title={isTyping ? "Engine is currently processing..." : "Force AI to summarize and save its current understanding"}
                >
                  {isArchiving ? <><Activity size={10} className="animate-spin" /> Dumping...</> : <><HardDrive size={10} /> Dump</>}
                </button>
                <button
                  onClick={handleParadoxScan}
                  disabled={isTyping}
                  className="px-2 py-1 bg-teal-900/20 hover:bg-rose-900/30 border border-teal-800/50 hover:border-rose-700/50 rounded text-[9px] text-teal-500 hover:text-rose-400 disabled:opacity-50 uppercase tracking-widest transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  title={isTyping ? "Engine is currently processing..." : "Scan entire database for contradictions"}
                >
                  {isScanning ? <><Activity size={10} className="animate-spin" /> Scanning...</> : <><Activity size={10} /> Scan</>}
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
                  title={isTyping ? "Engine is processing..." : !chatInput.trim() ? "Input required" : "Send query"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-teal-600/20 hover:bg-teal-600/40 text-teal-500 disabled:text-slate-600 disabled:bg-transparent rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  {isTyping ? <Activity size={16} className="animate-spin" /> : <Send size={16} />}
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
                title={isAuditing ? "Scanning timeline..." : "Run continuous integration audit"}
                className="px-3 py-1.5 bg-rose-900/20 hover:bg-rose-900/40 border border-rose-800/50 rounded text-[10px] text-rose-400 uppercase tracking-widest disabled:opacity-50 transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                {isAuditing ? <><Activity size={10} className="animate-spin" /> Scanning...</> : 'Run System Audit'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {auditLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <CheckCircle size={24} className="opacity-20 text-emerald-500" />
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
                      className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 px-2 py-1 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-800/50 rounded text-[9px] text-emerald-500 uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
                title="Close ingestion terminal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-4 overflow-hidden">
              <label htmlFor="raw-transcript-input" className="text-xs text-slate-400 font-mono">
                Paste raw text from the "Trauma of Compliance" document below. The extraction algorithm will automatically map Assets, Personnel, Tech, Anomalies, and EVENTS.
              </label>
              <textarea
                id="raw-transcript-input"
                value={ingestText}
                onChange={(e) => setIngestText(e.target.value)}
                placeholder="Paste raw PDF transcript here..."
                className="flex-1 w-full bg-[#0a0a0c] border border-slate-800 rounded p-4 text-sm text-slate-300 focus:outline-none focus:border-teal-600 resize-none font-mono shadow-inner"
              />
            </div>

            <div className="p-4 border-t border-slate-800/60 bg-black/20 flex justify-end gap-3">
              <button
                onClick={() => setShowIngest(false)}
                className="px-4 py-2 border border-slate-700 rounded text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Abort
              </button>
              <button
                onClick={handleIngestRawText}
                disabled={isIngesting || !ingestText.trim()}
                title={isIngesting ? "Extraction in progress..." : !ingestText.trim() ? "Waiting for text input" : "Initialize text extraction"}
                className="flex items-center gap-2 px-6 py-2 bg-teal-900/40 hover:bg-teal-800/60 border border-teal-700 rounded text-xs uppercase tracking-widest text-teal-400 hover:text-teal-300 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                {isIngesting ? <><Activity size={14} className="animate-spin" /> Processing...</> : 'Initialize Extraction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}