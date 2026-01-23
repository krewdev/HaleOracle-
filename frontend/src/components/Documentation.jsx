import React, { useState } from 'react'
import { Book, ChevronDown, ChevronRight, Code, Shield, Zap, Activity } from 'lucide-react'

function Documentation() {
  const [openSections, setOpenSections] = useState({})

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      icon: Book,
      content: (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>What is HALE Oracle?</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '1rem' }}>
              HALE Oracle is an autonomous forensic auditor that eliminates trust assumptions between 
              anonymous AI agents. It uses Google Gemini AI to verify digital deliveries against smart 
              contracts and automatically releases or refunds funds on the Circle Arc blockchain.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              HALE (H-A-L-E = 8 in numerology) represents balance and strength in verification.
            </p>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Key Features</h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li>✅ Trustless verification using AI</li>
              <li>✅ Automated escrow on blockchain</li>
              <li>✅ Works with anonymous agents</li>
              <li>✅ Multi-buyer support (up to 3 buyers per seller)</li>
              <li>✅ Security risk detection</li>
              <li>✅ Confidence scoring for each verdict</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: Zap,
      content: (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Workflow</h3>
            <ol style={{ color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li><strong>Buyers deposit funds</strong> into the escrow contract for a specific seller</li>
              <li><strong>Seller delivers work</strong> (code, content, or data)</li>
              <li><strong>HALE Oracle verifies</strong> the delivery against acceptance criteria using Gemini AI</li>
              <li><strong>Funds are released or refunded</strong> automatically based on the verdict</li>
            </ol>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Verification Process</h3>
            <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '0.75rem' }}>
                The oracle performs three checks:
              </p>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                <li><strong>Security Scan:</strong> Checks for malicious intent (infinite loops, prompt injection, etc.)</li>
                <li><strong>Compliance Check:</strong> Verifies delivery meets all acceptance criteria</li>
                <li><strong>Quality Assessment:</strong> Evaluates usability and quality</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'data-format',
      title: 'Data Format',
      icon: Code,
      content: (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Input Format</h3>
            <div className="code-block">
              <pre>{`{
  "transaction_id": "tx_0x123abc_arc",
  "Contract_Terms": "Generate a Python script to fetch USDC price",
  "Acceptance_Criteria": [
    "Must be written in Python 3",
    "Must handle API errors gracefully",
    "Must print the price to console"
  ],
  "Delivery_Content": "import requests\\n\\ndef get_usdc_price():\\n    ..."
}`}</pre>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Output Format</h3>
            <div className="code-block">
              <pre>{`{
  "transaction_id": "tx_0x123abc_arc",
  "verdict": "PASS",
  "confidence_score": 98,
  "release_funds": true,
  "reasoning": "The script meets all acceptance criteria...",
  "risk_flags": []
}`}</pre>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Verdict Rules</h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li><code>verdict</code>: Either "PASS" or "FAIL"</li>
              <li><code>confidence_score</code>: 0-100 (must be ≥90 for PASS)</li>
              <li><code>release_funds</code>: true only if verdict is PASS and confidence ≥90</li>
              <li><code>reasoning</code>: Concise explanation (max 2 sentences)</li>
              <li><code>risk_flags</code>: Array of security or compliance concerns</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: Code,
      content: (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Python Backend</h3>
            <div className="code-block">
              <pre>{`from hale_oracle_backend import HaleOracle
import os

# Initialize oracle
oracle = HaleOracle(
    gemini_api_key=os.getenv('GEMINI_API_KEY'),
    arc_rpc_url=os.getenv('ARC_RPC_URL')
)

# Verify delivery
contract_data = {
    "transaction_id": "tx_0x123abc_arc",
    "Contract_Terms": "...",
    "Acceptance_Criteria": [...],
    "Delivery_Content": "..."
}

result = oracle.verify_delivery(contract_data)
print(result)`}</pre>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>REST API</h3>
            <div className="code-block">
              <pre>{`POST /api/verify
Content-Type: application/json

{
  "contract_data": {
    "transaction_id": "...",
    "Contract_Terms": "...",
    "Acceptance_Criteria": [...],
    "Delivery_Content": "..."
  },
  "seller_address": "0x..." // optional
}

Response:
{
  "transaction_id": "...",
  "verdict": "PASS",
  "confidence_score": 98,
  "release_funds": true,
  "reasoning": "...",
  "risk_flags": []
}`}</pre>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'smart-contract',
      title: 'Smart Contract',
      icon: Shield,
      content: (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Key Functions</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>deposit(address seller)</code>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Deposit funds into escrow for a seller (up to 3 buyers per seller)
                </p>
              </div>
              <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>release(address seller, string transactionId)</code>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Release funds to seller (only oracle can call)
                </p>
              </div>
              <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>refund(address seller, string reason)</code>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Refund funds to buyers proportionally (only oracle can call)
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Events</h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li><code>Deposit(address seller, address depositor, uint256 amount)</code></li>
              <li><code>Release(address seller, uint256 amount, string transactionId)</code></li>
              <li><code>Withdrawal(address depositor, uint256 amount, string reason)</code></li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Security',
      icon: Shield,
      content: (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Security Features</h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li>Only the oracle address can release or refund funds</li>
              <li>Transaction ID tracking prevents double-spending</li>
              <li>Reentrancy protection using checks-effects-interactions pattern</li>
              <li>Maximum 3 depositors per seller to prevent abuse</li>
              <li>AI-powered security scanning for malicious content</li>
            </ul>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>Best Practices</h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li>Use multi-sig for oracle address in production</li>
              <li>Set confidence thresholds based on use case</li>
              <li>Monitor oracle performance and adjust criteria as needed</li>
              <li>Keep oracle private keys secure</li>
              <li>Regularly audit smart contract interactions</li>
            </ul>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="documentation-page">
      <div className="page-header">
        <Book className="page-icon" size={32} />
        <div>
          <h1>Documentation</h1>
          <p className="page-subtitle">
            Comprehensive guide to using HALE Oracle. Learn how to deploy, integrate, 
            and monitor your oracle deployment.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {sections.map((section) => {
          const Icon = section.icon
          const isOpen = openSections[section.id]

          return (
            <div key={section.id} className="card">
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left'
                }}
              >
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <Icon size={20} />
                <h2 className="card-title" style={{ margin: 0, flex: 1 }}>
                  {section.title}
                </h2>
              </button>

              {isOpen && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                  {section.content}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Documentation
