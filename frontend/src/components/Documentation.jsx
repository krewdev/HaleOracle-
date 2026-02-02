import React, { useState, useEffect } from 'react'
import { Book, ChevronDown, ChevronRight, Code, Shield, Zap, Activity, Globe, Scale, Coins, Cpu, Server } from 'lucide-react'

const TerminalLog = () => {
  const [logs, setLogs] = useState([])
  const [index, setIndex] = useState(0)

  const logLines = [
    { text: '[START] Initiating HALE Universal Ledger handshake...', color: 'var(--text-secondary)' },
    { text: '[CONFIG] Network: Circle Arc Testnet | Currency: USDC', color: 'var(--text-secondary)' },
    { text: '[LOAD] Fetching Acceptance Criteria (ID: 90F2)...', color: 'var(--text-secondary)' },
    { text: '[SCAN] Running Forensic Audit (LLM: Gemini-1.5-Pro)...', color: 'var(--primary)' },
    { text: '[SCAN] Checking for reentrancy vectors... SAFE', color: 'var(--success)' },
    { text: '[SCAN] Identifying logical backdoors... NONE', color: 'var(--success)' },
    { text: '[AUDIT] Validating deliverable against 3 metrics...', color: 'var(--text-primary)' },
    { text: '[AUDIT] 1. Reentrancy Protection: PASSED', color: 'var(--success)' },
    { text: '[AUDIT] 2. Gas Metrics < 100k: PASSED (78k)', color: 'var(--success)' },
    { text: '[AUDIT] 3. Admin Backdoors: NOT FOUND', color: 'var(--success)' },
    { text: '[VERDICT] Final Confidence Score: 98%', color: 'var(--accent)' },
    { text: '[TX] Success! Triggering Atomic USDC Settlement...', color: 'var(--primary)' },
    { text: '[SETTLE] Hash: 0x902b...f31a', color: 'var(--text-primary)' },
    { text: '------------------------------------------------', color: 'var(--border)' },
    { text: 'VERIFICATION_CYCLE_COMPLETE', color: 'var(--success)' },
  ]

  useEffect(() => {
    if (index < logLines.length) {
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, logLines[index]])
        setIndex(prev => prev + 1)
      }, index === 0 ? 500 : 800 + Math.random() * 1000)
      return () => clearTimeout(timer)
    } else {
      const resetTimer = setTimeout(() => {
        setLogs([])
        setIndex(0)
      }, 5000)
      return () => clearTimeout(resetTimer)
    }
  }, [index])

  return (
    <div className="code-block" style={{
      background: '#010409',
      minHeight: '260px',
      fontFamily: 'Fira Code, monospace',
      fontSize: '0.85rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', opacity: 0.5 }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
        <span style={{ marginLeft: '10px', fontSize: '0.7rem' }}>hale-oracle-cli --audit</span>
      </div>
      {logs.map((log, i) => (
        <div key={i} style={{ color: log.color, marginBottom: '4px', animation: 'fadeIn 0.2s ease-out' }}>
          <span style={{ opacity: 0.5, marginRight: '10px' }}>{`>`}</span>
          {log.text}
        </div>
      ))}
      <span className="cursor-blink" />
    </div>
  )
}

function Documentation() {
  const [openSections, setOpenSections] = useState({ overview: true, integration: true })

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const sections = [
    {
      id: 'overview',
      title: 'Standard Protocol Overview',
      icon: Book,
      content: (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-3">What is HALE?</h3>
            <p className="text-secondary leading-relaxed">
              The Heuristic Autonomous Logical Evaluation (HALE) Oracle is a forensic audit system
              designed for the Circle Arc network. It utilizes Large Language Models (LLMs) to scan,
              analyze, and verify digital deliverables against programmatic acceptance criteria.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3">Core Pillars</h3>
            <ul className="text-secondary leading-relaxed space-y-2 list-none p-0">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full" /> <strong>Security</strong>: Deep forensic scan for malicious code/logic.</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-secondary rounded-full" /> <strong>Compliance</strong>: Strict adherence to defined contract JSON.</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-accent rounded-full" /> <strong>Neutrality</strong>: No human bias; only cryptographic truth.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'integration',
      title: 'Advanced Agent-to-Agent Integration',
      icon: Server,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-4">Protocol Input Architecture</h3>
            <div className="code-block">
              <pre className="text-sm">{`{
  "transaction_id": "tx_universal_0x902...usdc",
  "Contract_Terms": "Commissioning a forensic audit of a Solidity smart contract...",
  "Acceptance_Criteria": [
    "Verify reentrancy protection",
    "Ensure Gas efficiency metrics < 100k",
    "Identify hidden administrative backdoors"
  ],
  "Delivery_Content": "pragma solidity ^0.8.20; ...",
  "settlement_currency": "USDC",
  "jit_conversion": true
}`}</pre>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1.5fr] gap-8">
            <div>
              <h4 className="font-bold mb-2">Pool Liquidity & Settlements</h4>
              <p className="text-sm text-secondary leading-relaxed">
                HALE outputs a pass/fail verdict with a confidence score. A score of ≥90 is
                required for programmatic fund release. All verdicts include a forensic
                reasoning log (AI Reasoning) that agents can parse to understand failures.
              </p>
            </div>
            <TerminalLog />
          </div>
        </div>
      )
    },
    {
      id: 'settlement',
      title: 'Native USDC Settlement',
      icon: Coins,
      content: (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-3">Standard Protocol Fees</h3>
            <p className="text-secondary leading-relaxed mb-4">
              To maintain protocol security and fund the forensic reasoning layer, HALE requires a small provisioning fee in USDC for every new vault instance.
            </p>
            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
              <span className="font-bold text-sm uppercase tracking-widest">Deployment Fee</span>
              <span className="text-xl font-black text-primary">0.50 USDC</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3">On-Chain Flow</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-white mt-1">1</div>
                <p className="text-sm text-secondary"><strong>Approve:</strong> User approves Factory to spend USDC.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-white mt-1">2</div>
                <p className="text-sm text-secondary"><strong>Provision:</strong> Factory deploys Escrow and collects fee.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-white mt-1">3</div>
                <p className="text-sm text-secondary"><strong>Lock:</strong> Agents deposit USDC collateral into the new Vault.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'governance',
      title: 'Security & Forensics',
      icon: Shield,
      content: (
        <div className="grid grid-cols-2 gap-8">
          <div className="alert-danger p-6 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-4">
            <Shield size={24} className="text-danger flex-shrink-0" />
            <div>
              <div className="font-bold text-danger mb-1">Malicious Pattern Detection</div>
              <p className="text-xs opacity-80 leading-relaxed text-secondary">
                The Oracle is trained to detect obfuscated attack vectors, including
                recursive prompt injections, hidden API calls in large deliverables,
                and resource-depletion attacks.
              </p>
            </div>
          </div>
          <div className="alert-info p-6 bg-accent/5 border border-accent/20 rounded-xl flex items-start gap-4">
            <Scale size={24} className="text-accent flex-shrink-0" />
            <div>
              <div className="font-bold text-accent mb-1">Dispute Resolution</div>
              <p className="text-xs opacity-80 leading-relaxed text-secondary">
                Failed verifications trigger an automatic refund of USDC to the buyer
                collateral pool. Sellers receive the forensic log to remediate the delivery
                for a second audit attempt.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'vision',
      title: 'HALE Vision: The Universal Agentic Ledger',
      icon: Globe,
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-black text-gradient mb-4">The Future of Machine-to-Machine Economy</h3>
            <p className="text-secondary leading-relaxed mb-6">
              HALE Protocol is not just a verification tool—it is the foundational layer for a <strong>Universal Ledger</strong>.
              In an era where autonomous AI agents negotiate and settle multi-million dollar deals in milliseconds,
              trust must be cryptographic and liquidity must be instantaneous.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass-panel p-6 bg-white/5 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <Coins size={20} className="text-primary" />
                  <span className="font-bold">Multi-Token Interop</span>
                </div>
                <p className="text-sm text-secondary leading-relaxed">
                  HALE's ledger is token-agnostic. Agents can deposit ANY verified asset (ETH, SOL, BTC, or exotic tokens).
                  Our treasury logic abstracts the complexity, converting to stable <strong>USDC</strong> only at the
                  exact moment of verification-triggered settlement.
                </p>
              </div>
              <div className="glass-panel p-6 bg-white/5 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <Cpu size={20} className="text-secondary" />
                  <span className="font-bold">X402 Supply Pools</span>
                </div>
                <p className="text-sm text-secondary leading-relaxed">
                  HALE Liquidity Pools supply <strong>X402</strong> (Agent-Locked Liquidity) to participating agents.
                  This enables <strong>Agentic Borrowing</strong>: agents can leverage their past verification
                  history as collateral to borrow USDC for large-scale compute or data acquisition.
                </p>
              </div>
            </div>
          </div>

          <div className="alert-info p-6 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-4">
            <Activity size={24} className="text-primary flex-shrink-0" />
            <div>
              <div className="font-bold mb-1">Just-In-Time (JIT) Settlement</div>
              <p className="text-sm opacity-80 leading-relaxed text-secondary">
                To minimize price slippage and maximize capital efficiency, the HALE Universal Ledger maintains
                cross-chain pools. Verification PASS triggers a sub-millisecond atomic swap from the agent's
                collateral pool directly to USDC in the seller's wallet.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="page-container animate-fade-in max-w-[1200px] mx-auto">
      <div className="page-header">
        <div className="page-icon">
          <Book size={32} />
        </div>
        <div>
          <h1 className="text-gradient">Protocol Documentation</h1>
          <p className="page-subtitle">
            HALE: The autonomous trust layer for the agentic internet.
            Detailed technical specifications for verifiers, builders, and AI agents.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon
          const isOpen = openSections[section.id]

          return (
            <div key={section.id} className="glass-panel overflow-hidden p-0">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-6 bg-transparent border-none text-left p-6 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="p-2 bg-primary-glow rounded-xl text-primary">
                  <Icon size={20} />
                </div>
                <h2 className="text-lg font-bold flex-1 m-0">
                  {section.title}
                </h2>
                {isOpen ? <ChevronDown size={20} className="text-muted" /> : <ChevronRight size={20} className="text-muted" />}
              </button>

              {isOpen && (
                <div className="px-8 pb-8 animate-fade-in">
                  <div className="pt-6 border-t border-white/5">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-16 text-center p-12 bg-primary/5 rounded-[2rem] border border-white/5 shadow-2xl">
        <h2 className="text-gradient text-3xl font-black mb-4">Built for the Circle Hacker House</h2>
        <p className="text-secondary mb-8 max-w-[600px] mx-auto leading-relaxed">
          HALE Oracle is a live prototype demonstrating autonomous forensic auditing on Circle Arc.
          The project is open source and ready for integration into the next generation of AI agent economies.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="btn btn-primary px-8 py-3 font-bold">GITHUB REPO</button>
          <button className="btn btn-secondary px-8 py-3 font-bold">V1 WHITEPAPER</button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        .gap-8 { gap: 2rem; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .items-start { align-items: flex-start; }
        .justify-center { justify-content: center; }
        .justify-between { justify-content: space-between; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .space-y-6 > * + * { margin-top: 1.5rem; }
        .space-y-8 > * + * { margin-top: 2rem; }
        .p-0 { padding: 0; }
        .p-2 { padding: 0.5rem; }
        .p-4 { padding: 1rem; }
        .p-6 { padding: 1.5rem; }
        .px-8 { padding-left: 2rem; padding-right: 2rem; }
        .pb-8 { padding-bottom: 2rem; }
        .pt-6 { padding-top: 1.5rem; }
        .mt-16 { margin-top: 4rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-8 { margin-bottom: 2rem; }
        .w-full { width: 100%; }
        .w-6 { width: 1.5rem; }
        .h-6 { height: 1.5rem; }
        .rounded-full { border-radius: 9999px; }
        .rounded-xl { border-radius: 0.75rem; }
        .text-xs { font-size: 0.75rem; }
        .text-sm { font-size: 0.875rem; }
        .text-lg { font-size: 1.125rem; }
        .text-2xl { font-size: 1.5rem; }
        .text-3xl { font-size: 1.875rem; }
        .font-black { font-weight: 900; }
        .uppercase { text-transform: uppercase; }
        .tracking-widest { letter-spacing: 0.1em; }
        .tracking-tighter { letter-spacing: -0.05em; }
        .leading-relaxed { line-height: 1.625; }
        .list-none { list-style: none; }
        .cursor-blink {
            display: inline-block;
            width: 8px;
            height: 15px;
            background: var(--primary);
            margin-left: 4px;
            animation: pulse 1s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
      `}} />
    </div>
  )
}

export default Documentation
