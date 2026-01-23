import React, { useState } from 'react'
import { Shield, Send, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react'
import axios from 'axios'

function VerificationForm() {
  const [formData, setFormData] = useState({
    transaction_id: '',
    Contract_Terms: '',
    Acceptance_Criteria: [''],
    Delivery_Content: '',
    seller_address: ''
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

  const formatDataForOracle = () => {
    // Filter out empty criteria
    const criteria = formData.Acceptance_Criteria.filter(c => c.trim() !== '')
    
    return {
      transaction_id: formData.transaction_id || `tx_${Date.now()}_arc`,
      Contract_Terms: formData.Contract_Terms,
      Acceptance_Criteria: criteria,
      Delivery_Content: formData.Delivery_Content
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formattedData = formatDataForOracle()
      
      // Validate required fields
      if (!formattedData.Contract_Terms.trim()) {
        throw new Error('Contract Terms are required')
      }
      if (formattedData.Acceptance_Criteria.length === 0) {
        throw new Error('At least one Acceptance Criterion is required')
      }
      if (!formattedData.Delivery_Content.trim()) {
        throw new Error('Delivery Content is required')
      }

      // Send to backend API
      const response = await axios.post('/api/verify', {
        contract_data: formattedData,
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
    <div className="verification-page">
      <div className="page-header">
        <Shield className="page-icon" size={32} />
        <div>
          <h1>Verify Delivery</h1>
          <p className="page-subtitle">
            Enter your contract details and delivery content. HALE Oracle will verify 
            the delivery against your acceptance criteria using AI-powered analysis.
          </p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Transaction ID (optional)</label>
            <input
              type="text"
              name="transaction_id"
              className="form-input"
              value={formData.transaction_id}
              onChange={handleInputChange}
              placeholder="tx_0x123abc_arc (auto-generated if empty)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contract Terms *</label>
            <textarea
              name="Contract_Terms"
              className="form-textarea"
              value={formData.Contract_Terms}
              onChange={handleInputChange}
              placeholder="Describe what was ordered or agreed upon..."
              required
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Acceptance Criteria *</label>
            {formData.Acceptance_Criteria.map((criterion, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  value={criterion}
                  onChange={(e) => handleCriteriaChange(index, e.target.value)}
                  placeholder={`Criterion ${index + 1} (e.g., "Must be written in Python 3")`}
                />
                {formData.Acceptance_Criteria.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => removeCriterion(index)}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addCriterion}
              style={{ marginTop: '0.5rem' }}
            >
              + Add Criterion
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Content *</label>
            <textarea
              name="Delivery_Content"
              className="form-textarea"
              value={formData.Delivery_Content}
              onChange={handleInputChange}
              placeholder="Paste the code, text, or content that was delivered..."
              required
              rows={12}
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Seller Address (optional)</label>
            <input
              type="text"
              name="seller_address"
              className="form-input"
              value={formData.seller_address}
              onChange={handleInputChange}
              placeholder="0x..."
            />
            <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
              If provided, the oracle will trigger smart contract actions
            </small>
          </div>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? (
              <>
                <Loader className="spinner" />
                Verifying...
              </>
            ) : (
              <>
                <Send size={18} />
                Verify Delivery
              </>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="card">
          <div className="card-header">
            {result.verdict === 'PASS' ? (
              <CheckCircle size={24} style={{ color: 'var(--success)' }} />
            ) : (
              <XCircle size={24} style={{ color: 'var(--danger)' }} />
            )}
            <h2 className="card-title">Verification Result</h2>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <span className={`badge ${result.verdict === 'PASS' ? 'badge-success' : 'badge-danger'}`}>
                  {result.verdict}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Confidence: {result.confidence_score}%
                </span>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Reasoning</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {result.reasoning}
              </p>
            </div>

            {result.risk_flags && result.risk_flags.length > 0 && (
              <div>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Risk Flags</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {result.risk_flags.map((flag, i) => (
                    <span key={i} className="badge badge-warning">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Transaction Details</h3>
              <div className="code-block">
                <div style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Transaction ID: {result.transaction_id}
                </div>
                <div style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Release Funds: {result.release_funds ? 'Yes' : 'No'}
                </div>
                {result.seller_address && (
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Seller: {result.seller_address}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Formatted Request</h3>
              <div className="code-block">
                <pre>{JSON.stringify(formatDataForOracle(), null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VerificationForm
