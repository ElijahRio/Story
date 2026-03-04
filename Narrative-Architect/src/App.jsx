import React, { useState, useEffect, useRef } from 'react';
import {
  Database, Biohazard, UserCog, UserX, Cpu,
  Settings, Send, Trash2, Activity, FileWarning, Save,
  Download, Upload
} from 'lucide-react';

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
  const [entities, setEntities] = useState(initialEntities);
  const [selectedId, setSelectedId] = useState('e-2'); // Default to Dolly
  const [activeFilter, setActiveFilter] = useState('all');

  // LLM State
  const [llmUrl, setLlmUrl] = useState('http://localhost:11434/api/chat');
  const [llmModel, setLlmModel] = useState('llama3');
  const [chatHistory, setChatHistory] = useState([
    { role: 'system', content: 'Facility Overseer Engine Initialized. Awaiting structural analysis parameters.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null); // Hidden reference for the file importer

  // --- Derived State ---
  const selectedEntity = entities.find(e => e.id === selectedId) || null;
  const filteredEntities = activeFilter === 'all'
    ? entities
    : entities.filter(e => e.type === activeFilter);

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
    const dataStr = JSON.stringify(entities, null, 2);
    // Package the raw JSON data into a file-like Blob
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor to trigger the browser's download manager
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

    // Clear the input so you can re-import the exact same file later if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Handlers: LLM ---
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Contextual Prompt Engineered for Body-Horror/Hard-Sci-Fi logic
    let systemContext = `You are a clinical, amoral Facility Overseer AI. Your task is to help the author maintain strict internal logic, biological consistency, and structural continuity for a dark, transgressive sci-fi world ("Trauma of Compliance"). Focus on physical mechanics, psychological degradation, and technological limitations. Do NOT inject standard morality or character drama. Analyze the engineering of the horror.\n\n`;

    if (selectedEntity) {
      systemContext += `CURRENT FOCAL RECORD:\n${JSON.stringify(selectedEntity, null, 2)}\n\nCross-reference user queries against this exact biological and mechanical data.`;
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Definition / Purpose</label>
                <textarea
                  value={selectedEntity.description}
                  onChange={(e) => handleUpdateEntity('description', e.target.value)}
                  className="w-full h-20 bg-slate-950/50 border border-slate-800 rounded p-3 text-sm text-slate-300 focus:outline-none focus:border-slate-500 resize-none font-mono"
                  placeholder="Define the core nature of this entity..."
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
            <Activity size={48} className="opacity-20 animate-pulse" />
            <p className="font-mono text-sm tracking-widest uppercase">Awaiting Selection</p>
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
              <label className="block text-slate-500 mb-1">Local Model Engine</label>
              <input
                type="text"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-slate-700 rounded px-2 py-1.5 text-slate-300 outline-none focus:border-teal-600 transition-colors"
              />
            </div>
            <div className="text-[10px] text-teal-500/70 p-2 bg-teal-950/20 rounded border border-teal-900/30">
              System explicitly feeds biological and operational data of the active record into context.
            </div>
          </div>
        )}

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