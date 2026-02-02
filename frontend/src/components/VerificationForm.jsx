import React, { useState } from 'react'
import { Shield, Send, CheckCircle, XCircle, AlertCircle, Loader, Plus, Trash2, Cpu, Fingerprint, RefreshCw, Zap, Lock, Terminal } from 'lucide-react'
import axios from 'axios'

function VerificationForm() {
  const [formData, setFormData] = useState({
    transaction_id: '',
    Contract_Terms: '',
    Acceptance_Criteria: [''],
    Delivery_Content: '',
    seller_address: '',
    contract_address: ''
  })

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCriteriaChange = (index, value) => {
    const newCriteria = [...formData.Acceptance_Criteria]
    newCriteria[index] = value
    setFormData(prev => ({ ...prev, Acceptance_Criteria: newCriteria }))
  }

  const addCriterion = () => {
    setFormData(prev => ({
      ...prev,
      Acceptance_Criteria: [...prev.Acceptance_Criteria, '']
    }))
  }

  const removeCriterion = (index) => {
    if (formData.Acceptance_Criteria.length > 1) {
      const newCriteria = formData.Acceptance_Criteria.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, Acceptance_Criteria: newCriteria }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const criteria = formData.Acceptance_Criteria.filter(c => c.trim() !== '')
      if (criteria.length === 0) throw new Error('At least one Acceptance Criterion is required')

      const response = await axios.post('/api/verify', {
        contract_data: {
          transaction_id: formData.transaction_id || `tx_${Date.now()}_usdc`,
          Contract_Terms: formData.Contract_Terms,
          Acceptance_Criteria: criteria,
          Delivery_Content: formData.Delivery_Content,
          contract_address: formData.contract_address || undefined
        },
        seller_address: formData.seller_address || undefined
      })

      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div className="page-icon">
          <Shield size={32} />
        </div>
        <div>
          <h1 className="text-gradient">Agent Forensic Audit</h1>
          <p className="page-subtitle">
            Autonomous verification of digital deliverables. Bridge the trust gap
            between anonymous AI agents with cryptographic certainty.
          </p>
        </div>
      </div>

      <div className="audit-layout">
        <div className="audit-input-panel">
          <div className="glass-panel p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Cpu size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">Forensic Parameters</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label className="form-label-vivid">
                  <Lock size={14} className="text-primary" />
                  Agreement Intent (Contract Terms)
                </label>
                <textarea
                  name="Contract_Terms"
                  className="form-input-cyber"
                  value={formData.Contract_Terms}
                  onChange={handleInputChange}
                  placeholder="Describe the objective or deliverable commissioned..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label-vivid">Acceptance Criteria (Checklist)</label>
                <div className="space-y-3">
                  {formData.Acceptance_Criteria.map((criterion, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        className="form-input-cyber"
                        value={criterion}
                        onChange={(e) => handleCriteriaChange(index, e.target.value)}
                        placeholder={`Requirement #${index + 1}`}
                      />
                      {formData.Acceptance_Criteria.length > 1 && (
                        <button
                          type="button"
                          className="btn-trash"
                          onClick={() => removeCriterion(index)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-add-requirement"
                    onClick={addCriterion}
                  >
                    <Plus size={14} /> Add Requirement
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label-vivid">
                  <Terminal size={14} className="text-primary" />
                  Settlement Targets (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="seller_address"
                    className="form-input-cyber"
                    value={formData.seller_address}
                    onChange={handleInputChange}
                    placeholder="Recipient (0x...)"
                  />
                  <input
                    type="text"
                    name="contract_address"
                    className="form-input-cyber"
                    value={formData.contract_address}
                    onChange={handleInputChange}
                    placeholder="Contract (0x...)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label-vivid">Material for Forensic Audit</label>
                <textarea
                  name="Delivery_Content"
                  className="form-input-cyber font-mono text-sm"
                  value={formData.Delivery_Content}
                  onChange={handleInputChange}
                  placeholder="Paste the delivered code, text, or binary logs for analysis..."
                  required
                  style={{ minHeight: '260px' }}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold flex items-center gap-3">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full py-5 text-xl font-black rounded-2xl shadow-[0_0_30px_rgba(129,140,248,0.2)]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <RefreshCw className="spinner" size={24} />
                    <span>ALGORITHMIC ANALYSIS...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Fingerprint size={24} />
                    <span>RUN FORENSIC AUDIT</span>
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="audit-result-panel">
          {!result && !loading && (
            <div className="glass-panel p-12 text-center border-dashed border-2 min-h-[500px] flex flex-col items-center justify-center">
              <Shield size={80} className="text-white opacity-10 mb-8" />
              <h3 className="text-2xl font-black text-white mb-2">SYSTEM IDLE</h3>
              <p className="text-secondary max-w-[320px] mx-auto">
                Enter protocol parameters and deliverable material to generate a cryptographic audit verdict.
              </p>
            </div>
          )}

          {loading && (
            <div className="glass-panel p-12 text-center min-h-[500px] flex flex-col items-center justify-center">
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-primary filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <Cpu className="absolute inset-0 m-auto text-primary" size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">FORENSIC SCAN ACTIVE</h3>
              <p className="text-secondary animate-pulse max-w-[350px]">
                Matching deliverable patterns against contract semantics...
              </p>
            </div>
          )}

          {result && (
            <div className={`glass-panel p-0 overflow-hidden animate-fade-in border-2 shadow-2xl ${result.verdict === 'PASS' ? 'border-emerald-500/40 shadow-emerald-500/10' : 'border-red-500/40 shadow-red-500/10'}`}>
              <div className={`p-8 flex items-center justify-between ${result.verdict === 'PASS' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <div className="flex items-center gap-6">
                  {result.verdict === 'PASS' ? (
                    <div className="p-4 bg-emerald-500 rounded-2xl text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                      <CheckCircle size={40} />
                    </div>
                  ) : (
                    <div className="p-4 bg-red-500 rounded-2xl text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                      <XCircle size={40} />
                    </div>
                  )}
                  <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter">VERDICT: {result.verdict}</h2>
                    <div className="flex items-center gap-2 text-sm font-bold text-secondary uppercase tracking-widest mt-1">
                      <Zap size={14} className="text-primary" />
                      CONFIDENCE: {result.confidence_score}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                  <h4 className="text-xs font-black text-muted uppercase tracking-[0.2em] mb-4">Forensic Reasoning Log</h4>
                  <div className="text-secondary leading-relaxed italic text-lg leading-relaxed">
                    "{result.reasoning}"
                  </div>
                </div>

                {result.risk_flags && result.risk_flags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-red-400 uppercase tracking-[0.2em] mb-4">Critical Anomalies</h4>
                    <div className="flex flex-wrap gap-3">
                      {result.risk_flags.map((flag, i) => (
                        <div key={i} className="flex items-center gap-3 bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-xs font-black border border-red-500/20">
                          <AlertCircle size={16} /> {flag}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-black/40 border border-white/10 rounded-[1.5rem] p-8 font-mono text-sm relative">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <span className="text-primary font-black uppercase tracking-tighter">System_Registry::Audit_Trail</span>
                    <span className="text-muted text-[10px]">{new Date().toISOString()}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center group">
                      <span className="text-muted group-hover:text-secondary transition-colors">SETTLEMENT_STATE:</span>
                      <span className={`font-black ${result.release_funds ? 'text-emerald-500' : 'text-red-400'}`}>{result.release_funds ? 'AUTHORIZED_DISBURSEMENT' : 'PAYMENT_VOIDED'}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-muted group-hover:text-secondary transition-colors">BLOCKCHAIN_ID:</span>
                      <span className="text-primary font-bold">{result.transaction_id}</span>
                    </div>
                    {result.transaction_success !== undefined && (
                      <div className="flex justify-between items-center group">
                        <span className="text-muted group-hover:text-secondary transition-colors">LEDGER_CONFIRMATION:</span>
                        <span className={result.transaction_success ? 'text-emerald-500' : 'text-red-500'}>{result.transaction_success ? 'ATOMIC_SUCCESS' : 'SETTLEMENT_ERROR'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .audit-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2.5rem;
            align-items: start;
        }

        @media (max-width: 1024px) {
            .audit-layout {
                grid-template-columns: 1fr;
            }
        }

        .form-label-vivid {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.85rem;
            font-weight: 800;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.75rem;
        }

        .form-input-cyber {
            width: 100%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 14px;
            padding: 1rem 1.25rem;
            color: #ffffff;
            font-family: inherit;
            transition: all 0.2s ease;
        }

        .form-input-cyber:focus {
            outline: none;
            border-color: var(--primary);
            background: rgba(129, 140, 248, 0.05);
            box-shadow: 0 0 15px var(--primary-glow);
        }

        .btn-trash {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
            padding: 0.75rem;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-trash:hover {
            background: #ef4444;
            color: white;
        }

        .btn-add-requirement {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-secondary);
            border: 1px dashed rgba(255, 255, 255, 0.2);
            padding: 1rem;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-weight: 700;
            transition: all 0.2s ease;
        }

        .btn-add-requirement:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border-color: var(--primary);
        }

        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .justify-between { justify-content: space-between; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-8 { margin-bottom: 2rem; }
        .w-full { width: 100%; }
        .text-sm { font-size: 0.875rem; }
        .text-lg { font-size: 1.125rem; }
        .text-xl { font-size: 1.25rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-3xl { font-size: 1.875rem; }
        .font-black { font-weight: 900; }
        .font-bold { font-weight: 700; }
        .font-mono { font-family: 'Fira Code', monospace; }
      `}} />
    </div>
  )
}

export default VerificationForm
