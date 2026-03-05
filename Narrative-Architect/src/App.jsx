import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Database, Biohazard, UserCog, UserX, Cpu,
  Settings, Send, Trash2, Activity, FileWarning,
  Download, Upload, Search, Clock, GitCommit
} from 'lucide-react';
import TextAreaField from './components/TextAreaField';

// --- Utility Functions ---
function calculateCosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- Trauma of Compliance: Core Database ---
const initialEntities = [
  {
    id: 'e-1',
    type: 'personnel',
    name: 'Ancillus',
    description: 'Lead Creator/Director of the Facility. Operates on a strict transactional and clinical morality system.',
    systemic_inputs: 'Unrestricted Facility Access, Client Capital, Raw Biological Donors.',
    systemic_outputs: 'Facility Directives, Compound S12 Authorization, Structural Parameters.',
    attributes: 'Immaculate presentation, detached empathy, highly intelligent.',
    ulterior_motives: 'To construct perfect biological compliance and transcend physical limitations. Seeks to rectify perceived inadequacies pointed out by his father.',
    liabilities: 'Hubris regarding his control over the "Ghost Variable" (Soul/Consciousness).'
  },
  {
    id: 'e-2',
    type: 'asset',
    name: 'Dolly (Asteria)',
    description: 'High-Value Asset. A unique biological construct heavily modified for client rental and compliance.',
    systemic_inputs: 'Compound S12, Judas Eye V3 Optical Feedback, Regular physical maintenance.',
    systemic_outputs: 'Client Capital (Rental Fees), 99.8% Compliance Metric, Unfiltered Psychological Trauma.',
    biological_alterations: 'Subcutaneous Judas Eye V3 (Right Eye), Frictionless Follicles, Compound S12 (Dissolution of rigid frameworks), Synthetic biological rendering.',
    compliance_metric: '99.8% (Target). Oscillates violently due to extreme psychological fracturing and the "Ghost Variable".',
    degradation_status: 'Severe psychological fracturing resulting in hallucinations (Memory Blends, The Dark Shadow, The Fawn). Frequent physical trauma.'
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
    timestamp: 'Cycle 442',
    involved_records: 'Ancillus, Prototype Asset #4, The Judas Eye (V1)',
    systemic_impact: 'Led to the development of the corrosive tamper-defense mechanism in V2 and V3. Remains of Prototype #4 deposited into the Sepsis Stream.'
  },
  {
    id: 'e-6',
    type: 'event',
    name: 'Integration of Compound S12',
    description: 'First successful administration of Compound S12 into Asset Dolly. Achieved initial dissolution of rigid skeletal/psychological frameworks, enabling hyper-compliance.',
    sequence_number: '20',
    timestamp: 'Cycle 510',
    involved_records: 'Ancillus, Dolly (Asteria), Compound S12',
    systemic_impact: 'Compliance Metric stabilized at 99.8%. First recorded instance of Dolly experiencing "Memory Blends".'
  }
];

export default function App() {
  // --- State Management ---
  const [entities, setEntities] = useState(initialEntities);
  // selectedId can now be a specific ID, null (Global), or 'timeline' (Chronological)
  const [selectedId, setSelectedId] = useState('timeline');
  const [activeFilter, setActiveFilter] = useState('all');

  // --- LLM State ---
  const [llmUrl, setLlmUrl] = useState('http://localhost:11434/api/chat');
  const [llmModel, setLlmModel] = useState('llama3');
  const [embedModel, setEmbedModel] = useState('nomic-embed-text');
  const [chatHistory, setChatHistory] = useState([
    { role: 'system', content: 'Facility Overseer Engine Initialized. Awaiting structural analysis parameters.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Ingestion Modal State
  const [showIngest, setShowIngest] = useState(false);
  const [ingestText, setIngestText] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Derived State ---
  const selectedEntity = useMemo(() =>
    entities.find(e => e.id === selectedId) || null
    , [entities, selectedId]);

  const filteredEntities = useMemo(() =>
    activeFilter === 'all'
      ? entities
      : entities.filter(e => e.type === activeFilter)
    , [entities, activeFilter]);

  // Sort events mathematically by their sequence integer for the Timeline View
  const timelineEvents = useMemo(() =>
    entities.filter(e => e.type === 'event').sort((a, b) => (Number(a.sequence_number) || 0) - (Number(b.sequence_number) || 0))
    , [entities]);

  // --- Effects ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

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
      newEntity = { ...baseEntity, biological_alterations: '', compliance_metric: '', degradation_status: '' };
    } else if (type === 'personnel') {
      newEntity = { ...baseEntity, attributes: '', ulterior_motives: '', liabilities: '' };
    } else if (type === 'technology') {
      newEntity = { ...baseEntity, biological_cost: '', deployment_status: '' };
    } else if (type === 'anomaly') {
      newEntity = { ...baseEntity, manifestation: '', environmental_impact: '' };
    } else if (type === 'event') {
      newEntity = { ...baseEntity, sequence_number: '0', timestamp: 'Cycle XXX', involved_records: '', systemic_impact: '' };
    }

    setEntities([...entities, newEntity]);
    setSelectedId(newId);
  };

  const deleteEntity = (id) => {
    setEntities(entities.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // --- Handlers: Data Persistence ---
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
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          setEntities(importedData);
          setChatHistory(prev => [...prev, { role: 'system', content: '[SYSTEM]: External biological data feed imported successfully.' }]);
        }
      } catch (err) {
        console.error("Failed to parse backup:", err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Handlers: LLM ---
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    let systemContext = `You are a clinical, amoral Facility Overseer AI. Your task is to help the author maintain strict internal logic, biological consistency, and structural continuity for a dark, transgressive sci-fi world ("Trauma of Compliance"). Focus on physical mechanics, psychological degradation, technological limitations, LOGISTICAL SUPPLY CHAINS, and CHRONOLOGICAL CAUSALITY. Do NOT inject standard morality or character drama. Analyze the engineering of the horror.\n\n`;

    try {
      if (selectedEntity) {
        systemContext += `CURRENT FOCAL RECORD:\n${JSON.stringify(selectedEntity, null, 2)}\n\nCross-reference user queries against this exact biological and mechanical data, paying special attention to its Systemic Inputs and Outputs.`;
      } else if (selectedId === 'timeline') {
        systemContext += `CURRENT FOCAL RECORD: The user is currently analyzing the MASTER TIMELINE. \n\nSORTED CHRONOLOGICAL EVENTS:\n${JSON.stringify(timelineEvents, null, 2)}\n\nAnalyze the chronological causality of these events. Hunt for timeline paradoxes (e.g., an asset reacting to an event that hasn't happened yet in the sequence).`;
      } else if (entities.length > 0) {
        setChatHistory(prev => [...prev, { role: 'system', content: '[SYSTEM]: Engaging embedding engine. Vectorizing query for semantic search...' }]);
        const embedUrl = llmUrl.replace('/api/chat', '/api/embed');

        const queryRes = await fetch(embedUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: embedModel, input: userMsg.content })
        });
        if (!queryRes.ok) throw new Error("Embedding Engine Offline. Ensure 'nomic-embed-text' is installed.");
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
        throw new Error(errData.error || `HTTP Error ${response.status}: Registry not found.`);
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message?.content || "Error: Corrupted feed." }]);

    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: `[SYSTEM REJECTION]: ${error.message} (Verify LLM Endpoint and Model Name in configuration).` }]);
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

  const handleIngestRawText = async () => {
    if (!ingestText.trim() || isIngesting) return;
    setIsIngesting(true);

    const systemContext = `You are a clinical data extraction algorithm operating within the Facility. Your absolute directive is to parse the following raw transcript and extract any distinct biological assets, personnel, technologies, anomalies, or TIMELINE EVENTS. 
    
You MUST output strictly a JSON array of objects. Do NOT output any conversational text, markdown formatting, or explanations. 

Each object must strictly follow this schema:
{
  "id": "e-auto-[generate random 5 digit number]",
  "type": "asset" | "personnel" | "technology" | "anomaly" | "event",
  "name": "[Extracted Name]",
  "description": "[Clinical summary of the entity or event]",
  "systemic_inputs": "[Deduced required materials, fuel, dependencies, or biological inputs]",
  "systemic_outputs": "[Deduced products, waste, compliance yields, or psychological outputs]"
  // IF TYPE IS EVENT, include these fields instead of inputs/outputs:
  "sequence_number": "[A deduced numeric sequence order, e.g. 10, 20, 30]",
  "timestamp": "[In-universe time marker]",
  "involved_records": "[Names of assets/tech involved]",
  "systemic_impact": "[How this event altered the facility]"
}`;

    const payload = {
      model: llmModel,
      messages: [
        { role: 'system', content: systemContext },
        { role: 'user', content: `RAW TRANSCRIPT TO PROCESS:\n\n${ingestText}` }
      ],
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
      let rawJson = data.message?.content || "[]";
      rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();

      const extractedEntities = JSON.parse(rawJson);

      if (Array.isArray(extractedEntities) && extractedEntities.length > 0) {
        setEntities(prev => [...prev, ...extractedEntities]);
        setChatHistory(prev => [...prev, { role: 'system', content: `[SYSTEM]: Successfully parsed and ingested ${extractedEntities.length} new records from raw transcript.` }]);
        setShowIngest(false);
        setIngestText('');
      } else {
        throw new Error("No valid entities extracted from text.");
      }
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'system', content: `[SYSTEM ERROR]: Ingestion Failure - ${error.message}. Ensure the local model is responding with valid JSON.` }]);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleParadoxScan = async () => {
    if (isTyping) return;
    const userMsg = { role: 'user', content: 'Initiate a paradox scan. Check the entire registry for any logical anomalies, contradictions, unaddressed biological/mechanical conflicts, SUPPLY CHAIN FAILURES, or CHRONOLOGICAL DISCREPANCIES across all recorded entities and events.' };
    setChatHistory(prev => [...prev, userMsg]);
    setIsTyping(true);

    let systemContext = `You are a clinical, amoral Facility Overseer AI. Your task is to help the author maintain strict internal logic, biological consistency, and structural continuity for a dark, transgressive sci-fi world ("Trauma of Compliance"). Focus on physical mechanics, psychological degradation, technological limitations, and LOGISTICAL SUPPLY CHAINS. Do NOT inject standard morality or character drama. Analyze the engineering of the horror.\n\n`;
    systemContext += `ENTIRE FACILITY REGISTRY DATABASE:\n${JSON.stringify(entities, null, 2)}\n\nCross-reference the entire database to identify contradictions, paradoxes, SUPPLY CHAIN FAILURES (where an entity lacks its 'Required Inputs'), or CHRONOLOGICAL DISCREPANCIES (where an event occurs out of logical order). Provide a clinical, numbered report of any systemic bottlenecks found.`;

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
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${response.status}: Registry not found.`);
      }
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message?.content || "Error: Corrupted feed." }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: `[SYSTEM REJECTION]: ${error.message} (Verify LLM Endpoint and Model Name in configuration).` }]);
    } finally {
      setIsTyping(false);
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
      default: return <FileWarning size={16} />;
    }
  };

  const renderDynamicFields = () => {
    if (!selectedEntity) return null;

    const renderField = (label, field, colorClass, placeholder) => (
      <TextAreaField
        key={field}
        label={label}
        value={selectedEntity[field]}
        onChange={(val) => handleUpdateEntity(field, val)}
        colorClass={colorClass}
        placeholder={placeholder}
      />
    );

    switch (selectedEntity.type) {
      case 'asset':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              {renderField("Biological Alterations & Implants", "biological_alterations", "text-rose-500", "List subcutaneous tech, chemical dependencies, physical alterations...")}
            </div>
            {renderField("Compliance Metric", "compliance_metric", "text-slate-400", "Target vs Actual compliance percentages. Behavioral loops...")}
            {renderField("Degradation Status", "degradation_status", "text-amber-500", "Psychological fracturing, tissue decay, rejection symptoms...")}
          </div>
        );
      case 'personnel':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              {renderField("Psychological Attributes", "attributes", "text-slate-400", "Cognitive biases, operational methodology...")}
            </div>
            {renderField("Ulterior Motives", "ulterior_motives", "text-teal-500", "Hidden agendas, systemic goals...")}
            {renderField("Liabilities / Vulnerabilities", "liabilities", "text-rose-500", "Addictions, emotional compromises, physical limits...")}
          </div>
        );
      case 'technology':
        return (
          <div className="grid grid-cols-2 gap-4">
            {renderField("Biological Cost / Side Effects", "biological_cost", "text-rose-500", "Toll exacted on the host body...")}
            {renderField("Deployment Status", "deployment_status", "text-teal-500", "Active instances, failure rates, integration protocols...")}
          </div>
        );
      case 'anomaly':
        return (
          <div className="grid grid-cols-2 gap-4">
            {renderField("Manifestation Parameters", "manifestation", "text-amber-500", "Physical rules of the anomaly, triggers...")}
            {renderField("Environmental / Subject Impact", "environmental_impact", "text-rose-500", "How it mutates or destroys its surroundings...")}
          </div>
        );
      case 'event':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-4 col-span-2">
              <div className="flex-1">{renderField("Numeric Sequence (Order)", "sequence_number", "text-indigo-400", "e.g., 10, 20, 30...")}</div>
              <div className="flex-1">{renderField("In-Universe Timestamp", "timestamp", "text-slate-400", "e.g., Cycle 899, Year 2098...")}</div>
            </div>
            <div className="col-span-2">
              {renderField("Involved Records", "involved_records", "text-rose-500", "List entities, personnel, or anomalies present...")}
            </div>
            <div className="col-span-2">
              {renderField("Systemic Impact", "systemic_impact", "text-teal-500", "How this event permanently altered the facility or compliance metrics...")}
            </div>
          </div>
        );
      default: return null;
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
          {['all', 'asset', 'personnel', 'technology', 'anomaly', 'event'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 min-w-[33%] py-2 text-center transition-colors ${activeFilter === f ? 'bg-slate-800/50 text-white border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            >
              {f === 'technology' ? 'Tech' : f === 'personnel' ? 'Staff' : f}
            </button>
          ))}
        </div>

        {/* Entity List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* Master View Toggles */}
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
          <div className="grid grid-cols-5 gap-1.5">
            <button onClick={() => createNewEntity('asset')} className="p-1.5 bg-[#15181e] hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/50 rounded flex justify-center transition-colors" title="Log Asset"><UserX size={14} className="text-rose-500" /></button>
            <button onClick={() => createNewEntity('personnel')} className="p-1.5 bg-[#15181e] hover:bg-slate-800 border border-slate-800 rounded flex justify-center transition-colors" title="Log Personnel"><UserCog size={14} className="text-slate-400" /></button>
            <button onClick={() => createNewEntity('technology')} className="p-1.5 bg-[#15181e] hover:bg-teal-950/40 border border-slate-800 hover:border-teal-900/50 rounded flex justify-center transition-colors" title="Log Technology"><Cpu size={14} className="text-teal-500" /></button>
            <button onClick={() => createNewEntity('anomaly')} className="p-1.5 bg-[#15181e] hover:bg-amber-950/40 border border-slate-800 hover:border-amber-900/50 rounded flex justify-center transition-colors" title="Log Anomaly"><Biohazard size={14} className="text-amber-500" /></button>
            <button onClick={() => createNewEntity('event')} className="p-1.5 bg-[#15181e] hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-900/50 rounded flex justify-center transition-colors" title="Log Timeline Event"><Clock size={14} className="text-indigo-400" /></button>
          </div>
        </div>

        {/* System Operations (Data Persistence) */}
        <div className="p-3 border-t border-slate-800/60 bg-[#0a0a0c] flex gap-2">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 p-1.5 bg-[#15181e] hover:bg-slate-800 border border-slate-800 rounded text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <Download size={12} /> Backup
          </button>
          <input type="file" accept=".json" onChange={handleImport} ref={fileInputRef} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-1.5 bg-[#15181e] hover:bg-slate-800 border border-slate-800 rounded text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <Upload size={12} /> Restore
          </button>
        </div>

        {/* Ingestion Trigger */}
        <div className="p-3 border-t border-slate-800/60 bg-black/40">
          <button onClick={() => setShowIngest(true)} className="w-full flex items-center justify-center gap-2 p-2 bg-teal-900/20 hover:bg-teal-900/40 border border-teal-800/50 rounded text-[10px] uppercase tracking-widest text-teal-500 hover:text-teal-400 transition-colors">
            <Database size={12} /> Auto-Ingest Raw Text
          </button>
        </div>
      </div>

      {/* CENTER PANEL: Clinical Workspace OR Master Timeline */}
      <div className="flex-1 flex flex-col bg-[#0a0a0c] relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>

        {selectedId === 'timeline' ? (
          /* --- MASTER TIMELINE VIEW --- */
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
              {/* Vertical Timeline Axis */}
              <div className="absolute left-16 top-10 bottom-10 w-0.5 bg-indigo-900/30"></div>

              {timelineEvents.length === 0 ? (
                <div className="text-center text-slate-600 font-mono mt-20">No events logged in the registry.</div>
              ) : (
                <div className="space-y-12">
                  {timelineEvents.map((event) => (
                    <div key={event.id} className="relative flex items-start group">
                      {/* Timeline Node */}
                      <div className="absolute left-6 -ml-1.5 mt-1.5 w-4 h-4 rounded-full bg-[#0a0a0c] border-2 border-indigo-500 z-10 flex items-center justify-center group-hover:border-rose-500 transition-colors">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full group-hover:bg-rose-500 transition-colors"></div>
                      </div>

                      {/* Sequence Label */}
                      <div className="w-16 pt-1 text-right pr-6">
                        <span className="text-xs font-mono font-bold text-indigo-400">#{event.sequence_number}</span>
                      </div>

                      {/* Event Card */}
                      <div className="flex-1 bg-black/40 border border-slate-800/60 rounded-lg p-5 hover:border-indigo-500/50 transition-colors cursor-pointer ml-4 shadow-lg group-hover:shadow-indigo-900/20" onClick={() => setSelectedId(event.id)}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-slate-200">{event.name}</h3>
                          <span className="text-[10px] font-mono px-2 py-1 bg-indigo-950/40 text-indigo-300 rounded border border-indigo-900/50">{event.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-4 leading-relaxed">{event.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[9px] uppercase tracking-widest px-2 py-1 bg-rose-950/20 text-rose-400 rounded border border-rose-900/30 flex items-center gap-1">
                            <GitCommit size={10} /> {event.involved_records || "No records linked"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : selectedEntity ? (
          /* --- EDITOR MODE --- */
          <div className="relative z-10 flex flex-col h-full">
            <div className="p-5 border-b border-slate-800/60 flex items-start justify-between bg-gradient-to-b from-[#0f1115] to-transparent">
              <div className="flex items-center gap-4 w-full">
                <div className="p-3 bg-black/40 border border-slate-800 rounded-lg shadow-inner">
                  {renderIcon(selectedEntity.type)}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
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
              <button
                onClick={() => deleteEntity(selectedEntity.id)}
                className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors ml-4"
                title="Purge Record"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <TextAreaField
                label="Base Definition / Purpose"
                value={selectedEntity.description}
                onChange={(val) => handleUpdateEntity('description', val)}
                colorClass="text-slate-400"
                placeholder="Define the core nature of this entity..."
              />

              {/* Hide Supply Chain fields if it's an Event, because Events have Impact fields instead */}
              {selectedEntity.type !== 'event' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-lg border border-slate-800/80">
                  <TextAreaField
                    label="Required Inputs (Dependencies)"
                    value={selectedEntity.systemic_inputs}
                    onChange={(val) => handleUpdateEntity('systemic_inputs', val)}
                    colorClass="text-indigo-400"
                    placeholder="Materials, tech, or biological fuel required to function..."
                  />
                  <TextAreaField
                    label="Systemic Outputs (Yield & Byproduct)"
                    value={selectedEntity.systemic_outputs}
                    onChange={(val) => handleUpdateEntity('systemic_outputs', val)}
                    colorClass="text-emerald-400"
                    placeholder="What this produces, excretes, or forces into the system..."
                  />
                </div>
              )}

              <div className="bg-black/20 p-5 rounded-lg border border-slate-800/50 shadow-inner">
                {renderDynamicFields()}
              </div>
            </div>
          </div>
        ) : (
          /* --- GLOBAL SEARCH MODE --- */
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
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition-colors ${showSettings ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
          >
            <Settings size={14} />
          </button>
        </div>

        {showSettings && (
          <div className="p-4 border-b border-slate-800/60 bg-black/40 space-y-3 text-xs font-mono">
            <div>
              <label className="block text-slate-500 mb-1">Terminal Endpoint</label>
              <input
                type="text"
                value={llmUrl}
                onChange={(e) => setLlmUrl(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-slate-700 rounded px-2 py-1.5 text-slate-300 outline-none focus:border-teal-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Local Chat Engine</label>
              <input
                type="text"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-slate-700 rounded px-2 py-1.5 text-slate-300 outline-none focus:border-teal-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Vector Embedding Engine</label>
              <input
                type="text"
                value={embedModel}
                onChange={(e) => setEmbedModel(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-slate-700 rounded px-2 py-1.5 text-slate-300 outline-none focus:border-teal-600 transition-colors"
              />
            </div>
            <div className="text-[10px] text-teal-500/70 p-2 bg-teal-950/20 rounded border border-teal-900/30">
              System explicitly feeds biological and operational data of the active record into context. Global View utilises RAG vector isolation.
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
          /* --- TERMINAL TAB --- */
          <>
            <div className="px-4 py-2 border-b border-slate-800/60 bg-teal-950/10 flex justify-between items-center shadow-inner">
              <span className="text-[9px] text-teal-600/70 uppercase tracking-widest font-mono">Macro Diagnostics</span>
              <button
                onClick={handleParadoxScan}
                disabled={isTyping}
                className="flex items-center gap-1.5 px-2 py-1 bg-teal-900/20 hover:bg-rose-900/30 border border-teal-800/50 hover:border-rose-700/50 rounded text-[9px] text-teal-500 hover:text-rose-400 disabled:opacity-50 disabled:hover:bg-teal-900/20 disabled:hover:border-teal-800/50 disabled:hover:text-teal-500 uppercase tracking-widest transition-colors"
                title="Scan entire database for contradictions"
              >
                <Activity size={10} /> Paradox Scan
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
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
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={selectedEntity ? "Query active record logic..." : "Input directive..."}
                  className="w-full bg-[#15181e] border border-slate-700 rounded pl-3 pr-10 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-600 resize-none h-16 font-mono transition-colors shadow-inner"
                />
                <button
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
          /* --- CI AUDIT TAB --- */
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

                    {/* Resolve Button - Appears on hover */}
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
              <button onClick={() => setShowIngest(false)} className="text-slate-500 hover:text-rose-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-4 overflow-hidden">
              <p className="text-xs text-slate-400 font-mono">
                Paste raw text from the "Trauma of Compliance" document below. The extraction algorithm will automatically map Assets, Personnel, Tech, Anomalies, and EVENTS.
              </p>
              <textarea
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