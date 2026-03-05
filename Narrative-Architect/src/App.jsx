import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Database, Biohazard, UserCog, UserX, Cpu,
  Settings, Send, Trash2, Activity, FileWarning,
  Download, Upload, Search
} from 'lucide-react';
import TextAreaField from './components/TextAreaField';

// --- Utility Functions ---
/**
 * Calculates the cosine similarity between two vectors.
 * Useful for determining semantic closeness of two embeddings.
 */
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
    attributes: 'Immaculate presentation, detached empathy, highly intelligent.',
    ulterior_motives: 'To construct perfect biological compliance and transcend physical limitations. Seeks to rectify perceived inadequacies pointed out by his father.',
    liabilities: 'Hubris regarding his control over the "Ghost Variable" (Soul/Consciousness).'
  },
  {
    id: 'e-2',
    type: 'asset',
    name: 'Dolly (Asteria)',
    description: 'High-Value Asset. A unique biological construct heavily modified for client rental and compliance.',
    biological_alterations: 'Subcutaneous Judas Eye V3 (Right Eye), Frictionless Follicles, Compound S12 (Dissolution of rigid frameworks), Synthetic biological rendering.',
    compliance_metric: '99.8% (Target). Oscillates violently due to extreme psychological fracturing and the "Ghost Variable".',
    degradation_status: 'Severe psychological fracturing resulting in hallucinations (Memory Blends, The Dark Shadow, The Fawn). Frequent physical trauma.'
  },
  {
    id: 'e-3',
    type: 'technology',
    name: 'The Judas Eye (V3)',
    description: 'A compliance tool utilizing high-frequency optical feedback and neural hijacking to bypass primitive fight-or-flight responses.',
    biological_cost: 'Secretes localized corrosive agent upon unauthorized tampering. Forces agonizing muscular compliance overriding conscious will.',
    deployment_status: 'Active within Asset: Dolly. V1 resulted in catastrophic biological assimilation.'
  },
  {
    id: 'e-4',
    type: 'anomaly',
    name: 'The Sepsis Stream',
    description: 'A volatile coalescence of industrial runoff, dissolved organic waste, and discarded biological failures. Has achieved a primitive state of chemical sentience.',
    manifestation: 'Manifests pseudo-mouths, weeping eyes, and jagged teeth. Demands "Life" as a toll for transit. Induces extreme auditory and psychological distress.',
    environmental_impact: 'Consumes biological matter (e.g., Hanna). Pollutes lower levels of the Sunken District.'
  }
];

export default function App() {
  // --- State Management ---
  // The main array holding all records in the registry
  const [entities, setEntities] = useState(initialEntities);
  // Keeps track of the currently selected record's ID
  const [selectedId, setSelectedId] = useState('e-2'); // Default to Dolly
  // State for the entity category filter in the left panel
  const [activeFilter, setActiveFilter] = useState('all');

  // --- LLM State ---
  // Default URL points to a standard local Ollama instance
  const [llmUrl, setLlmUrl] = useState('http://localhost:11434/api/chat');
  const [llmModel, setLlmModel] = useState('llama3');
  const [embedModel, setEmbedModel] = useState('nomic-embed-text');
  // Tracks the conversation history with the Overseer AI
  const [chatHistory, setChatHistory] = useState([
    { role: 'system', content: 'Facility Overseer Engine Initialized. Awaiting structural analysis parameters.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  // Visual indicator for when the LLM is generating a response
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Reference to automatically scroll the chat window to the newest message
  const chatEndRef = useRef(null);
  // Hidden reference to trigger the file input dialog for importing backups
  const fileInputRef = useRef(null);

  // --- Derived State ---
  // Retrieves the complete object of the currently selected record.
  // useMemo prevents O(N) array search on every keystroke when typing in the chat or updating unrelated state.
  const selectedEntity = useMemo(() =>
    entities.find(e => e.id === selectedId) || null
  , [entities, selectedId]);

  // Filters the list of records based on the active category (or shows all).
  // useMemo prevents O(N) array filtering on every unrelated re-render.
  const filteredEntities = useMemo(() =>
    activeFilter === 'all'
      ? entities
      : entities.filter(e => e.type === activeFilter)
  , [entities, activeFilter]);

  // --- Effects ---
  // Automatically scroll to the bottom of the chat window whenever chatHistory updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // --- Handlers: Entities ---
  // Generic handler to update a specific field of the currently selected entity
  const handleUpdateEntity = (field, value) => {
    if (!selectedEntity) return;
    setEntities(entities.map(e =>
      e.id === selectedId ? { ...e, [field]: value } : e
    ));
  };

  const createNewEntity = (type) => {
    const newId = `e-${Date.now()}`;
    const baseEntity = { id: newId, type: type, name: `New ${type}`, description: '' };

    // Dynamic schema generation
    let newEntity = { ...baseEntity };
    if (type === 'asset') {
      newEntity = { ...baseEntity, biological_alterations: '', compliance_metric: '', degradation_status: '' };
    } else if (type === 'personnel') {
      newEntity = { ...baseEntity, attributes: '', ulterior_motives: '', liabilities: '' };
    } else if (type === 'technology') {
      newEntity = { ...baseEntity, biological_cost: '', deployment_status: '' };
    } else if (type === 'anomaly') {
      newEntity = { ...baseEntity, manifestation: '', environmental_impact: '' };
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
    // Convert the current state of entities into a formatted JSON string
    const dataStr = JSON.stringify(entities, null, 2);
    // Package the raw JSON string into a file-like Blob object
    const blob = new Blob([dataStr], { type: 'application/json' });
    // Create an object URL representing the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger the browser's download manager
    const link = document.createElement('a');
    link.href = url;
    // Generate a filename with the current date
    link.download = `facility_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click(); // Simulate a click to start the download
    document.body.removeChild(link); // Clean up the DOM
  };

  const handleImport = (e) => {
    // Get the file selected by the user
    const file = e.target.files[0];
    if (!file) return;

    // Use FileReader to read the contents of the local file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // Parse the JSON text back into a Javascript object/array
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          // If valid, replace the current entities state with the imported data
          setEntities(importedData);
          // Add a system message to the chat indicating a successful import
          setChatHistory(prev => [...prev, { role: 'system', content: '[SYSTEM]: External biological data feed imported successfully.' }]);
        }
      } catch (err) {
        console.error("Failed to parse backup:", err);
      }
    };
    // Begin reading the file as text
    reader.readAsText(file);

    // Clear the input value so the `onChange` event will trigger again
    // even if the user selects the exact same file immediately afterwards.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Handlers: LLM ---
  const handleSendMessage = async () => {
    // Prevent sending empty messages
    if (!chatInput.trim()) return;

    // Add the user's message to the chat history immediately for UI responsiveness
    const userMsg = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true); // Show the loading animation

    // Construct the "System Prompt" which dictates the AI's persona and rules.
    let systemContext = `You are a clinical, amoral Facility Overseer AI. Your task is to help the author maintain strict internal logic, biological consistency, and structural continuity for a dark, transgressive sci-fi world ("Trauma of Compliance"). Focus on physical mechanics, psychological degradation, technological limitations, and LOGISTICAL SUPPLY CHAINS. Do NOT inject standard morality or character drama. Analyze the engineering of the horror.\n\n`;

    try {
      if (selectedEntity) {
        // Direct Context Mode: User is looking directly at an entity.
        systemContext += `CURRENT FOCAL RECORD:\n${JSON.stringify(selectedEntity, null, 2)}\n\nCross-reference user queries against this exact biological and mechanical data, paying special attention to its Systemic Inputs and Outputs.`;
      } else if (entities.length > 0) {
        // Vector Search (RAG) Mode: User is in Global View.
        setChatHistory(prev => [...prev, { role: 'system', content: '[SYSTEM]: Engaging embedding engine. Vectorizing query for semantic search...' }]);

        const embedUrl = llmUrl.replace('/api/chat', '/api/embed');

        // 1. Vectorize the User Query
        const queryRes = await fetch(embedUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: embedModel, input: userMsg.content })
        });
        if (!queryRes.ok) throw new Error("Embedding Engine Offline. Ensure 'nomic-embed-text' is installed.");
        const queryData = await queryRes.json();
        const queryVector = queryData.embeddings[0];

        // 2. Vectorize the Database (Batch processing)
        const entityTexts = entities.map(e => JSON.stringify(e));
        const batchRes = await fetch(embedUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: embedModel, input: entityTexts })
        });
        const batchData = await batchRes.json();

        // 3. Mathematical Scoring & Sorting
        const scoredEntities = entities.map((entity, index) => ({
          entity,
          score: calculateCosineSimilarity(queryVector, batchData.embeddings[index])
        })).sort((a, b) => b.score - a.score);

        // 4. Inject only the top 2 highest-scoring assets
        const topMatches = scoredEntities.slice(0, 2).map(match => match.entity);
        systemContext += `[VECTOR RETRIEVAL ACTIVE] - To prevent context overload, the system has isolated the 2 most mathematically relevant records to the user's query:\n${JSON.stringify(topMatches, null, 2)}\n\nBase your clinical analysis strictly on these isolated records.`;
      }

      // Build the payload expected by the Ollama Chat API
      const payload = {
        model: llmModel,
        messages: [
          { role: 'system', content: systemContext },
          // Include previous messages for context, but filter out our local "system status" messages
          ...chatHistory.filter(m => m.role !== 'system'),
          userMsg
        ],
        stream: false // We wait for the full response rather than streaming it token-by-token
      };

      // Send the request to the configured LLM endpoint
      const response = await fetch(llmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${response.status}: Registry not found.`);
      }

      // Parse the response and append the AI's message to the chat history
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message?.content || "Error: Corrupted feed." }]);

    } catch (error) {
      console.error(error);
      // Display error messages directly in the chat interface
      setChatHistory(prev => [...prev, { role: 'assistant', content: `[SYSTEM REJECTION]: ${error.message} (Verify LLM Endpoint and Model Name in configuration).` }]);
    } finally {
      setIsTyping(false); // Hide the loading animation regardless of success or failure
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleParadoxScan = async () => {
    // Prevent sending empty messages
    if (isTyping) return;

    // Add the user's message to the chat history immediately for UI responsiveness
    const userMsg = { role: 'user', content: 'Initiate a paradox scan. Check the entire registry for any logical anomalies, contradictions, unaddressed biological/mechanical conflicts, or SUPPLY CHAIN FAILURES across all recorded entities.' };
    setChatHistory(prev => [...prev, userMsg]);
    setIsTyping(true); // Show the loading animation

    // Construct the "System Prompt" which dictates the AI's persona and rules.
    let systemContext = `You are a clinical, amoral Facility Overseer AI. Your task is to help the author maintain strict internal logic, biological consistency, and structural continuity for a dark, transgressive sci-fi world ("Trauma of Compliance"). Focus on physical mechanics, psychological degradation, technological limitations, and LOGISTICAL SUPPLY CHAINS. Do NOT inject standard morality or character drama. Analyze the engineering of the horror.\n\n`;

    // Dynamic Context Injection:
    // Feed ALL records into the context to search for paradoxes.
    systemContext += `ENTIRE FACILITY REGISTRY DATABASE:\n${JSON.stringify(entities, null, 2)}\n\nCross-reference the entire database to identify contradictions, paradoxes, SUPPLY CHAIN FAILURES (where an entity lacks its 'Required Inputs' or produces unmanaged 'Systemic Outputs'), or unaddressed logical flaws. Provide a clinical, numbered report of any systemic bottlenecks found.`;

    // Build the payload expected by the Ollama Chat API
    const payload = {
      model: llmModel,
      messages: [
        { role: 'system', content: systemContext },
        // Include previous messages for context, but filter out our local "system status" messages
        ...chatHistory.filter(m => m.role !== 'system'),
        userMsg
      ],
      stream: false // We wait for the full response rather than streaming it token-by-token
    };

    try {
      // Send the request to the configured LLM endpoint
      const response = await fetch(llmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${response.status}: Registry not found.`);
      }

      // Parse the response and append the AI's message to the chat history
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message?.content || "Error: Corrupted feed." }]);

    } catch (error) {
      console.error(error);
      // Display error messages directly in the chat interface
      setChatHistory(prev => [...prev, { role: 'assistant', content: `[SYSTEM REJECTION]: ${error.message} (Verify LLM Endpoint and Model Name in configuration).` }]);
    } finally {
      setIsTyping(false); // Hide the loading animation regardless of success or failure
    }
  };

  // --- Sub-Components ---
  const renderIcon = (type) => {
    switch (type) {
      case 'asset': return <UserX size={16} className="text-rose-500" />;
      case 'personnel': return <UserCog size={16} className="text-slate-400" />;
      case 'technology': return <Cpu size={16} className="text-teal-500" />;
      case 'anomaly': return <Biohazard size={16} className="text-amber-500" />;
      default: return <FileWarning size={16} />;
    }
  };

  // Dynamic Form Renderer based on Entity Type
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
        <div className="flex text-[10px] uppercase font-bold tracking-widest border-b border-slate-800/60 bg-[#0a0a0c]">
          {['all', 'asset', 'personnel', 'technology', 'anomaly'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 py-2.5 text-center transition-colors ${activeFilter === f ? 'bg-slate-800/50 text-white border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            >
              {f === 'technology' ? 'Tech' : f === 'personnel' ? 'Staff' : f}
            </button>
          ))}
        </div>

        {/* Entity List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* Global Mode Toggle */}
          <button
            onClick={() => setSelectedId(null)}
            className={`w-full text-left px-3 py-3 mb-2 border-b border-slate-800/60 rounded flex items-center gap-3 transition-all duration-200 ${selectedId === null ? 'bg-teal-900/20 text-teal-400 shadow-inner border-teal-800/50' : 'hover:bg-slate-900/50 text-slate-500 hover:text-slate-300'}`}
          >
            <span className="opacity-80"><Search size={16} /></span>
            <span className="truncate text-sm font-bold uppercase tracking-wider">Global Facility View</span>
          </button>

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
          <div className="grid grid-cols-4 gap-1.5">
            <button onClick={() => createNewEntity('asset')} className="p-1.5 bg-[#15181e] hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/50 rounded flex justify-center transition-colors" title="Log Asset"><UserX size={14} className="text-rose-500" /></button>
            <button onClick={() => createNewEntity('personnel')} className="p-1.5 bg-[#15181e] hover:bg-slate-800 border border-slate-800 rounded flex justify-center transition-colors" title="Log Personnel"><UserCog size={14} className="text-slate-400" /></button>
            <button onClick={() => createNewEntity('technology')} className="p-1.5 bg-[#15181e] hover:bg-teal-950/40 border border-slate-800 hover:border-teal-900/50 rounded flex justify-center transition-colors" title="Log Technology"><Cpu size={14} className="text-teal-500" /></button>
            <button onClick={() => createNewEntity('anomaly')} className="p-1.5 bg-[#15181e] hover:bg-amber-950/40 border border-slate-800 hover:border-amber-900/50 rounded flex justify-center transition-colors" title="Log Anomaly"><Biohazard size={14} className="text-amber-500" /></button>
          </div>
        </div>

        {/* System Operations (Data Persistence) */}
        <div className="p-3 border-t border-slate-800/60 bg-[#0a0a0c] flex gap-2">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 p-1.5 bg-[#15181e] hover:bg-slate-800 border border-slate-800 rounded text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <Download size={12} /> Backup
          </button>

          {/* Hidden physical file input */}
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            ref={fileInputRef}
            className="hidden"
          />

          <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-1.5 bg-[#15181e] hover:bg-slate-800 border border-slate-800 rounded text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <Upload size={12} /> Restore
          </button>
        </div>
      </div>

      {/* CENTER PANEL: Clinical Workspace */}
      <div className="flex-1 flex flex-col bg-[#0a0a0c] relative">
        {/* Faint background grid for clinical feel */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>

        {selectedEntity ? (
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
              {/* Universal Description Field */}
              <TextAreaField
                label="Base Definition / Purpose"
                value={selectedEntity.description}
                onChange={(val) => handleUpdateEntity('description', val)}
                colorClass="text-slate-400"
                placeholder="Define the core nature of this entity..."
              />

              {/* Logistical Supply Chain Fields */}
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

              {/* Render Type-Specific Fields */}
              <div className="bg-black/20 p-5 rounded-lg border border-slate-800/50 shadow-inner">
                {renderDynamicFields()}
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
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition-colors ${showSettings ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
          >
            <Settings size={14} />
          </button>
        </div>

        {/* LLM Settings Overlay */}
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
              System explicitly feeds biological and operational data of the active record into context. Global View utilizes RAG vector isolation.
            </div>
          </div>
        )}

        {/* System Macros */}
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

        {/* Chat Output */}
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

        {/* Chat Input */}
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
      </div>

    </div>
  );
}