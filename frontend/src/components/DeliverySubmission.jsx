import React, { useState, useEffect } from 'react';
import './Landing.css';

const API_BASE_URL = 'http://localhost:5001/api';

function DeliverySubmission() {
    const [sellerAddress, setSellerAddress] = useState('');
    const [escrowAddress, setEscrowAddress] = useState('');
    const [otp, setOtp] = useState('');
    const [code, setCode] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-fill from URL parameters (for shareable links)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlSeller = params.get('seller');
        const urlEscrow = params.get('escrow');
        const urlOtp = params.get('otp');

        if (urlSeller) setSellerAddress(urlSeller);
        if (urlEscrow) setEscrowAddress(urlEscrow);
        if (urlOtp) setOtp(urlOtp);

        if (urlSeller && urlOtp) {
            setStatus('✅ Link verified! You can now submit your code.');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/submit-delivery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    seller_address: sellerAddress,
                    escrow_address: escrowAddress,
                    otp: otp,
                    code: code,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Submission failed');
            }

            setStatus('✅ Delivery submitted successfully! Oracle is verifying your code...');
            setOtp('');
            setCode('');

            // Poll for status
            pollStatus();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const pollStatus = async () => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/delivery-status/${sellerAddress}`);
                const data = await response.json();

                if (data.status === 'processing') {
                    setStatus('⏳ Oracle is verifying your code...');
                } else if (data.status === 'complete') {
                    // Show verdict details
                    if (data.verdict === 'PASS') {
                        setStatus(`✅ PASSED! (${data.confidence}% confidence)\n\n${data.reasoning}`);
                    } else if (data.verdict === 'FAIL') {
                        setStatus(`❌ FAILED (${data.confidence}% confidence)\n\n${data.reasoning}${data.risk_flags?.length ? '\n\nRisks: ' + data.risk_flags.join(', ') : ''}`);
                    } else {
                        setStatus(`📊 Verdict: ${data.verdict} (${data.confidence}%)\n\n${data.reasoning}`);
                    }
                    clearInterval(interval);
                } else if (data.status === 'completed') {
                    // Backwards compatibility
                    setStatus('✅ Verification complete!');
                    clearInterval(interval);
                } else if (data.status === 'failed') {
                    setStatus('❌ Verification failed. Funds refunded to buyer.');
                    clearInterval(interval);
                } else if (data.status === 'unknown') {
                    // Keep waiting - maybe processing hasn't started yet
                    setStatus('⏳ Waiting for Oracle verification...');
                }
            } catch (err) {
                console.error('Status poll error:', err);
            }
        }, 3000);  // Poll every 3 seconds instead of 5

        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(interval), 300000);
    };

    return (
        <div className="page-container">
            <div className="content-wrapper">
                <div className="hero-section">
                    <h1 className="gradient-text">Submit Your Delivery</h1>
                    <p className="subtitle">
                        Enter your OTP and smart contract code to submit for verification
                    </p>
                </div>

                <div className="form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="escrowAddress">Escrow Contract Address</label>
                            <input
                                type="text"
                                id="escrowAddress"
                                value={escrowAddress}
                                onChange={(e) => setEscrowAddress(e.target.value)}
                                placeholder="0x..."
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#fff',
                                    fontSize: '16px',
                                    marginBottom: '20px'
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="sellerAddress">Your Wallet Address (Seller)</label>
                            <input
                                type="text"
                                id="sellerAddress"
                                value={sellerAddress}
                                onChange={(e) => setSellerAddress(e.target.value)}
                                placeholder="0x..."
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#fff',
                                    fontSize: '16px',
                                    marginBottom: '20px'
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="otp">5-Digit OTP (from Telegram)</label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="12345"
                                maxLength="5"
                                pattern="[0-9]{5}"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#fff',
                                    fontSize: '24px',
                                    letterSpacing: '8px',
                                    textAlign: 'center',
                                    marginBottom: '20px'
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="code">Smart Contract Code</label>
                            <textarea
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="// SPDX-License-Identifier: MIT&#10;pragma solidity ^0.8.0;&#10;&#10;contract YourContract {&#10;    // Your code here&#10;}"
                                rows="20"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontFamily: 'monospace',
                                    marginBottom: '20px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'rgba(255,0,0,0.1)',
                                border: '1px solid rgba(255,0,0,0.3)',
                                color: '#ff6b6b',
                                marginBottom: '20px'
                            }}>
                                ❌ {error}
                            </div>
                        )}

                        {status && (
                            <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'rgba(0,255,0,0.1)',
                                border: '1px solid rgba(0,255,0,0.3)',
                                color: '#51cf66',
                                marginBottom: '20px'
                            }}>
                                {status}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: loading
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {loading ? '⏳ Submitting...' : '🚀 Submit Delivery'}
                        </button>
                    </form>

                    <div style={{
                        marginTop: '40px',
                        padding: '20px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h3 style={{ marginBottom: '16px', color: '#fff' }}>📋 Instructions</h3>
                        <ol style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                            <li>You should have received a 5-digit OTP via Telegram</li>
                            <li>Enter your wallet address (the seller address from the escrow)</li>
                            <li>Enter the OTP you received</li>
                            <li>Paste your complete smart contract code</li>
                            <li>Click "Submit Delivery"</li>
                            <li>The HALE Oracle will verify your code using AI + sandbox testing</li>
                            <li>If verification passes with ≥90% confidence, funds are auto-released!</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeliverySubmission;
