import React, { useState, useEffect } from 'react'
import { Activity, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp, Shield, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { ethers } from 'ethers'
import axios from 'axios'

const chartData = [
  { name: 'Mon', verifications: 12, success: 10, failure: 2 },
  { name: 'Tue', verifications: 18, success: 15, failure: 3 },
  { name: 'Wed', verifications: 15, success: 14, failure: 1 },
  { name: 'Thu', verifications: 25, success: 22, failure: 3 },
  { name: 'Fri', verifications: 32, success: 28, failure: 4 },
  { name: 'Sat', verifications: 28, success: 25, failure: 3 },
  { name: 'Sun', verifications: 40, success: 38, failure: 2 },
];

const distributionData = [
  { name: 'Code Audit', value: 45 },
  { name: 'Data Verification', value: 30 },
  { name: 'Contract Compliance', value: 25 },
];

const COLORS = ['#818cf8', '#c084fc', '#22d3ee'];

// Custom SVG Area Chart Component
const CustomAreaChart = ({ data }) => {
  const width = 800;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 40;

  const successes = data.map(d => d.success);
  const maxVal = Math.max(...successes, 10); // Ensure at least scale of 10
  const yScale = (height - paddingTop - paddingBottom) / maxVal;
  const xScale = (width - paddingLeft - paddingRight) / (data.length - 1);

  const points = data.map((d, i) => ({
    x: paddingLeft + i * xScale,
    y: height - paddingBottom - d.success * yScale
  }));

  const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  // Y Axis Ticks
  const ticks = [0, maxVal / 4, maxVal / 2, (3 * maxVal) / 4, maxVal];

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '240px' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid Lines & Y-Axis Labels */}
        {ticks.map((t, i) => {
          const y = height - paddingBottom - t * yScale;
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                strokeOpacity="0.5"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                fill="var(--text-muted)"
                fontSize="11"
                textAnchor="end"
                fontFamily="Fira Code"
              >
                {Math.round(t)}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, i) => {
          const x = paddingLeft + i * xScale;
          return (
            <text
              key={i}
              x={x}
              y={height - 15}
              fill="var(--text-muted)"
              fontSize="11"
              textAnchor="middle"
              fontFamily="Inter"
            >
              {d.name}
            </text>
          );
        })}

        {/* Area */}
        <path d={areaD} fill="url(#areaGradient)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

        {/* Data Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill="var(--bg-card)" stroke="var(--primary)" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
};

// Custom SVG Bar Chart Component
const CustomBarChart = ({ data }) => {
  const width = 400;
  const height = 150;
  const barHeight = 20;
  const gap = 15;
  const labelWidth = 100;
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
        {data.map((d, i) => {
          const barWidth = (d.value / maxVal) * (width - labelWidth - 20);
          return (
            <g key={i} transform={`translate(0, ${i * (barHeight + gap)})`}>
              <text x="0" y={barHeight / 1.5} fill="var(--text-secondary)" fontSize="12">{d.name}</text>
              <rect
                x={labelWidth}
                y="0"
                width={barWidth}
                height={barHeight}
                fill={COLORS[i % COLORS.length]}
                rx="4"
              />
              <text x={labelWidth + barWidth + 5} y={barHeight / 1.5} fill="var(--text-primary)" fontSize="12" fontWeight="bold">{d.value}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

function Monitoring() {
  const [contractAddress, setContractAddress] = useState('')
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState({
    totalDeposits: '12.5',
    totalReleases: '8.2',
    totalRefunds: '1.3',
    activeEscrows: 5,
    totalTransactions: 23,
    successRate: 87.5
  })
  const [recentTransactions, setRecentTransactions] = useState([
    { type: 'release', seller: '0x1234...5678', amount: '2.5', timestamp: '2 mins ago', status: 'PASS' },
    { type: 'release', seller: '0x8888...9999', amount: '1.2', timestamp: '15 mins ago', status: 'PASS' },
    { type: 'refund', seller: '0x4444...3333', amount: '0.8', timestamp: '1 hour ago', status: 'FAIL' },
    { type: 'release', seller: '0x9999...0000', amount: '3.0', timestamp: '3 hours ago', status: 'PASS' },
  ])
  const [pendingReviews, setPendingReviews] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPendingReviews()
    const interval = setInterval(fetchPendingReviews, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchPendingReviews = async () => {
    try {
      const resp = await axios.get('http://localhost:8000/api/reviews')
      setPendingReviews(resp.data)
    } catch (err) {
      console.error("Failed to fetch reviews:", err)
    }
  }

  const handleDecision = async (id, decision) => {
    const reason = window.prompt(`Provide reason for ${decision}:`, "Verified by Human Auditor")
    if (reason === null) return // Cancelled

    setLoading(true)
    try {
      await axios.post(`http://localhost:8000/api/reviews/${id}/decision`, {
        decision,
        reason
      })
      fetchPendingReviews()
    } catch (err) {
      console.error("Decision failed:", err)
      alert("Failed to process decision: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error('Please install MetaMask')
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      setConnected(true)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="monitoring-page">
      <div className="page-header">
        <Activity className="page-icon" size={32} />
        <div>
          <h1 className="text-gradient">Oracle Monitor</h1>
          <p className="page-subtitle">
            Real-time analytics for your HALE Oracle instance. Track performance,
            security flags, and on-chain settlement efficiency.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Total Escrow Volume</div>
          <div className="stat-value">{stats.totalDeposits} USDC</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.875rem' }}>
            <ArrowUpRight size={16} /> +12.5% this week
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Successfully Released</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.totalReleases} USDC</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Verified & Disbursed</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Security Flags Avoided</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>04</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '0.875rem' }}>
            <Shield size={16} /> Blocked attempts
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Audit Success Rate</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.successRate}%</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Based on 48 deliveries</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header" style={{ border: 'none' }}>
            <TrendingUp size={20} color="var(--primary)" />
            <h3 className="card-title" style={{ fontSize: '1.25rem' }}>Verification Volume</h3>
          </div>
          <div className="chart-card">
            <CustomAreaChart data={chartData} />
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ border: 'none' }}>
            <Activity size={20} color="var(--secondary)" />
            <h3 className="card-title" style={{ fontSize: '1.25rem' }}>Audit Types</h3>
          </div>
          <div className="chart-card">
            <CustomBarChart data={distributionData} />
          </div>
        </div>
      </div>

      {pendingReviews.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', borderColor: 'var(--warning)', background: 'rgba(251, 191, 36, 0.05)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <Shield size={20} color="var(--warning)" />
            <h2 className="card-title" style={{ fontSize: '1.25rem', color: 'var(--warning)' }}>
              Pending Forensic Audits (HITL)
            </h2>
            <div className="badge" style={{ background: 'var(--warning)', color: 'var(--bg-deep)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
              ACTION REQUIRED
            </div>
          </div>
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            {pendingReviews.map((review) => (
              <div key={review.id} className="stat-item" style={{ background: 'var(--bg-card)', padding: '1.5rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Tx ID: {review.contract_data.transaction_id}</span>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>• {new Date(review.timestamp * 1000).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      <div style={{ marginBottom: '4px' }}><strong>Terms:</strong> {review.contract_data.Contract_Terms}</div>
                      <div style={{ fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                        <strong>AI Reason:</strong> {review.ai_verdict.reasoning}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', background: 'var(--success)', boxShadow: '0 0 10px rgba(52, 211, 153, 0.3)' }}
                        onClick={() => handleDecision(review.id, 'PASS')}
                        disabled={loading}
                      >
                        <CheckCircle size={16} /> Approve Release
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                        onClick={() => handleDecision(review.id, 'FAIL')}
                        disabled={loading}
                      >
                        <XCircle size={16} /> Reject & Refund
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI CONFIDENCE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>{review.ai_verdict.confidence_score}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <Clock size={20} />
          <h2 className="card-title" style={{ fontSize: '1.25rem' }}>Recent Activity</h2>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {recentTransactions.map((tx, i) => (
            <div
              key={i}
              className="stat-item"
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  background: tx.status === 'PASS' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                  padding: '10px',
                  borderRadius: '12px',
                  color: tx.status === 'PASS' ? 'var(--success)' : 'var(--danger)'
                }}>
                  {tx.status === 'PASS' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                    {tx.type === 'release' ? 'Fund Release' : 'Fund Refund'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Destination: <span style={{ fontFamily: 'monospace' }}>{tx.seller}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{tx.amount} USDC</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Monitoring

