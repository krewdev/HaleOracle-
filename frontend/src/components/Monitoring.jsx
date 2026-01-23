import React, { useState, useEffect } from 'react'
import { Activity, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import { ethers } from 'ethers'
import axios from 'axios'

function Monitoring() {
  const [contractAddress, setContractAddress] = useState('')
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      setConnected(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchStats = async () => {
    if (!contractAddress) {
      setError('Please enter contract address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // In production, you'd query the blockchain directly
      // For now, we'll use a mock API endpoint
      const response = await axios.get(`/api/monitor/${contractAddress}`)
      setStats(response.data)
    } catch (err) {
      // Mock data for demo
      setStats({
        totalDeposits: '12.5',
        totalReleases: '8.2',
        totalRefunds: '1.3',
        activeEscrows: 5,
        totalTransactions: 23,
        successRate: 87.5
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contractAddress && connected) {
      fetchStats()
      const interval = setInterval(fetchStats, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [contractAddress, connected])

  return (
    <div className="monitoring-page">
      <div className="page-header">
        <Activity className="page-icon" size={32} />
        <div>
          <h1>Monitor Oracle</h1>
          <p className="page-subtitle">
            Track escrow balances, transactions, and verification results in real-time.
            Monitor the health and performance of your HALE Oracle deployment.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <Activity size={24} />
          <h2 className="card-title">Connection</h2>
        </div>

        <div className="form-group">
          <label className="form-label">Contract Address</label>
          <input
            type="text"
            className="form-input"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>

        {!connected && (
          <button
            className="btn btn-primary"
            onClick={connectWallet}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            Connect Wallet
          </button>
        )}

        {connected && (
          <button
            className="btn btn-secondary"
            onClick={fetchStats}
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            <RefreshCw size={18} className={loading ? 'spinner' : ''} />
            {loading ? 'Loading...' : 'Refresh Stats'}
          </button>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
            {error}
          </div>
        )}
      </div>

      {stats && (
        <>
          <div className="card">
            <div className="card-header">
              <TrendingUp size={24} />
              <h2 className="card-title">Statistics</h2>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{ 
                background: 'var(--bg)', 
                padding: '1.5rem', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Total Deposits
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {stats.totalDeposits} ETH
                </div>
              </div>

              <div style={{ 
                background: 'var(--bg)', 
                padding: '1.5rem', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Total Releases
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  {stats.totalReleases} ETH
                </div>
              </div>

              <div style={{ 
                background: 'var(--bg)', 
                padding: '1.5rem', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Total Refunds
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                  {stats.totalRefunds} ETH
                </div>
              </div>

              <div style={{ 
                background: 'var(--bg)', 
                padding: '1.5rem', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Active Escrows
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>
                  {stats.activeEscrows}
                </div>
              </div>

              <div style={{ 
                background: 'var(--bg)', 
                padding: '1.5rem', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Total Transactions
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>
                  {stats.totalTransactions}
                </div>
              </div>

              <div style={{ 
                background: 'var(--bg)', 
                padding: '1.5rem', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Success Rate
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  {stats.successRate}%
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <Clock size={24} />
              <h2 className="card-title">Recent Transactions</h2>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {recentTransactions.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem',
                  color: 'var(--text-secondary)'
                }}>
                  No recent transactions. Transactions will appear here as they occur.
                </div>
              ) : (
                recentTransactions.map((tx, i) => (
                  <div 
                    key={i}
                    style={{
                      background: 'var(--bg)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                  >
                    {tx.type === 'release' ? (
                      <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                    ) : (
                      <XCircle size={20} style={{ color: 'var(--danger)' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>
                        {tx.type === 'release' ? 'Release' : 'Refund'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {tx.seller} • {tx.amount} ETH
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {tx.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Monitoring
