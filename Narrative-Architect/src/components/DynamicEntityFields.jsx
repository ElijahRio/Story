import React from 'react';
import { Fingerprint, Activity } from 'lucide-react';
import InputField from './InputField';
import TextAreaField from './TextAreaField';

const AssetPersonnelFields = ({ selectedEntity, renderField, handleUpdateEntity, handleProfileAudit, isAuditingProfile }) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="col-span-2 flex gap-4 bg-black/40 p-3 rounded border border-slate-800/60">
      <InputField
        label="Birth / Assembly Date"
        colorClass="text-emerald-500"
        value={selectedEntity.birth_date || ''}
        onChange={(e) => handleUpdateEntity('birth_date', e.target.value)}
        placeholder="DD-MM-YYYY"
      />
      <InputField
        label="Death / Expiration Date"
        colorClass="text-rose-500"
        value={selectedEntity.death_date || ''}
        onChange={(e) => handleUpdateEntity('death_date', e.target.value)}
        placeholder="DD-MM-YYYY or Empty"
      />
    </div>
    {selectedEntity.type === 'asset' ? (
      <>
        <div className="col-span-2">
          {renderField("Biological Alterations & Implants", "biological_alterations", "text-rose-500", "List subcutaneous tech, chemical dependencies, physical alterations...")}
        </div>
        {renderField("Compliance Metric", "compliance_metric", "text-slate-400", "Target vs Actual compliance percentages. Behavioral loops...")}
        {renderField("Degradation Status", "degradation_status", "text-amber-500", "Psychological fracturing, tissue decay, rejection symptoms...")}
      </>
    ) : (
      <>
        <div className="col-span-2">
          {renderField("Psychological Attributes", "attributes", "text-slate-400", "Cognitive biases, operational methodology...")}
        </div>
        {renderField("Ulterior Motives", "ulterior_motives", "text-teal-500", "Hidden agendas, systemic goals...")}
        {renderField("Liabilities / Vulnerabilities", "liabilities", "text-rose-500", "Addictions, emotional compromises, physical limits...")}
      </>
    )}

    {/* AI Profile Audit Section */}
    <div className="col-span-2 mt-4 pt-4 border-t border-slate-800/60">
      <div className="flex justify-between items-center mb-3">
        <label htmlFor="behavioral-audit-textarea" className="text-[10px] font-bold uppercase tracking-widest text-teal-500 flex items-center gap-1.5">
          <Fingerprint size={12} /> Behavioral Profile Audit
        </label>
        <button
          onClick={() => handleProfileAudit(selectedEntity)}
          disabled={isAuditingProfile}
          title={isAuditingProfile ? "Analysis in progress..." : "Run behavioral consistency audit"}
          className="px-3 py-1.5 bg-teal-950/30 hover:bg-teal-900/50 border border-teal-900/50 rounded text-[9px] uppercase tracking-widest text-teal-400 hover:text-teal-300 disabled:opacity-50 transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          {isAuditingProfile ? <><Activity size={10} className="animate-spin" /> Analyzing Timeline...</> : 'Generate Report'}
        </button>
      </div>
      <textarea
        id="behavioral-audit-textarea"
        value={selectedEntity.ai_analysis || ''}
        onChange={(e) => handleUpdateEntity('ai_analysis', e.target.value)}
        className="w-full h-64 bg-teal-950/10 border border-teal-900/30 rounded p-4 text-xs text-slate-300 focus:outline-none focus:border-teal-700 resize-none font-mono leading-relaxed shadow-inner"
        placeholder="Click 'Generate Report' to execute a behavioral consistency audit against the master timeline..."
      />
    </div>
  </div>
);

const TechnologyFields = ({ renderField }) => (
  <div className="grid grid-cols-2 gap-4">
    {renderField("Biological Cost / Side Effects", "biological_cost", "text-rose-500", "Toll exacted on the host body...")}
    {renderField("Deployment Status", "deployment_status", "text-teal-500", "Active instances, failure rates, integration protocols...")}
  </div>
);

const AnomalyFields = ({ renderField }) => (
  <div className="grid grid-cols-2 gap-4">
    {renderField("Manifestation Parameters", "manifestation", "text-amber-500", "Physical rules of the anomaly, triggers...")}
    {renderField("Environmental / Subject Impact", "environmental_impact", "text-rose-500", "How it mutates or destroys its surroundings...")}
  </div>
);

const EventFields = ({ selectedEntity, renderField, handleUpdateEntity }) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="flex gap-4 col-span-2">
      <InputField
        label="Numeric Sequence (Order)"
        colorClass="text-indigo-400"
        value={selectedEntity.sequence_number || ''}
        onChange={(e) => handleUpdateEntity('sequence_number', e.target.value)}
        placeholder="e.g., 10, 20"
      />
      <InputField
        label="In-Universe Timestamp"
        colorClass="text-slate-400"
        value={selectedEntity.timestamp || ''}
        onChange={(e) => handleUpdateEntity('timestamp', e.target.value)}
        placeholder="DD-MM-YYYY"
      />
    </div>
    <div className="col-span-2">
      {renderField("Involved Records", "involved_records", "text-rose-500", "List entities, personnel, or anomalies present...")}
    </div>
    <div className="col-span-2">
      {renderField("Systemic Impact", "systemic_impact", "text-teal-500", "How this event permanently altered the facility or compliance metrics...")}
    </div>
  </div>
);

const MemoryFields = ({ selectedEntity, renderField, handleUpdateEntity }) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="col-span-2">
      <InputField
        label="Archival Timestamp"
        colorClass="text-emerald-500"
        value={selectedEntity.timestamp || ''}
        onChange={(e) => handleUpdateEntity('timestamp', e.target.value)}
        placeholder="DD-MM-YYYY"
      />
    </div>
    <div className="col-span-2">
      {renderField("Unresolved Threads / Overseer Notes", "unresolved_threads", "text-amber-500", "Logic gaps the AI is currently tracking...")}
    </div>
  </div>
);

const DynamicEntityFields = ({
  selectedEntity,
  handleUpdateEntity,
  getDetectedLinks,
  setSelectedId,
  handleProfileAudit,
  isAuditingProfile
}) => {
  if (!selectedEntity) return null;

  const renderField = (label, field, colorClass, placeholder) => (
    <TextAreaField
      key={field}
      label={label}
      colorClass={colorClass}
      detectedLinks={getDetectedLinks(selectedEntity[field], selectedEntity.id)}
      onNavigate={setSelectedId}
      value={selectedEntity[field] || ''}
      onChange={(e) => handleUpdateEntity(field, e.target.value)}
      placeholder={placeholder}
    />
  );

  switch (selectedEntity.type) {
    case 'asset':
    case 'personnel':
      return <AssetPersonnelFields selectedEntity={selectedEntity} renderField={renderField} handleUpdateEntity={handleUpdateEntity} handleProfileAudit={handleProfileAudit} isAuditingProfile={isAuditingProfile} />;
    case 'technology':
      return <TechnologyFields renderField={renderField} />;
    case 'anomaly':
      return <AnomalyFields renderField={renderField} />;
    case 'event':
      return <EventFields selectedEntity={selectedEntity} renderField={renderField} handleUpdateEntity={handleUpdateEntity} />;
    case 'memory':
      return <MemoryFields selectedEntity={selectedEntity} renderField={renderField} handleUpdateEntity={handleUpdateEntity} />;
    default:
      return null;
  }
};

export default DynamicEntityFields;
