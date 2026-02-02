import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FastForward, Play, Shield, Zap, Info, Book } from 'lucide-react';
import './Landing.css';

const narrations = [
    "HALE is the infrastructure that bridges the trust gap, providing a secure, automated ledger for agents.",
    "A world where AI agents can scale the autonomous economy without the friction of human intervention.",
    "The Trust Gap is the single biggest barrier to the $10 trillion agentic economy.",
    "HALE acts as an impartial judge, combining Gemini AI with Circle Arc blockchain security.",
    "Lock funds, perform deep AI audit, and settle on-chain instantly. Three steps to total trust.",
    "Built on Circle Arc for USDC native settlement and Google Gemini for forensic reasoning.",
    "Multi-Buyer Escrow: A unique innovation for pooled agentic funding and risk mitigation.",
    "From code marketplaces to secure freelancing, HALE powers every digital transaction vertical.",
    "Capturing the massive CAGR of the rising machine economy as its primary settlement layer.",
    "Aggressive roadmap: From Arc Testnet today to multi-chain empire by the end of the year.",
    "HALE is more than a tool; it is the foundation of a trustless digital future.",
    "The future is agentic. Secure it today with HALE Oracle. Thank you."
];

const Landing = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const navigate = useNavigate();

    const nextSlide = () => {
        if (currentSlide < narrations.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            navigate('/verify');
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const skipIntro = () => {
        navigate('/verify');
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'Escape') skipIntro();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide]);

    useEffect(() => {
        let interval;
        if (isAutoPlaying) {
            interval = setInterval(() => {
                if (currentSlide < narrations.length - 1) {
                    setCurrentSlide(prev => prev + 1);
                } else {
                    setIsAutoPlaying(false);
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isAutoPlaying, currentSlide]);

    return (
        <div className="landing-page">
            <div className="landing-header">
                <div className="landing-brand">
                    <Shield className="brand-icon" />
                    <span>SYSTEM PROTOCOL</span>
                </div>
                <div className="landing-actions">
                    <button className="btn-icon" onClick={() => setIsAutoPlaying(!isAutoPlaying)}>
                        {isAutoPlaying ? <FastForward size={18} /> : <Play size={18} />}
                        <span>{isAutoPlaying ? 'AUTOPLAY ON' : 'AUTOPLAY OFF'}</span>
                    </button>
                    <button className="btn-skip" onClick={skipIntro}>
                        SKIP INTRO <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="presentation-container">
                {/* Slide 1 */}
                <div className={`slide ${currentSlide === 0 ? 'active' : ''} ${currentSlide > 0 ? 'prev' : ''}`}>
                    <img src="/pitch_deck_assets/slide_1_title_1769857440603.png" className="slide-bg" alt="Title" />
                    <div className="slide-content glass">
                        <div className="status-tag">INITIALIZING PROTOCOL...</div>
                        <h1 className="text-gradient-cyan">HALE Oracle</h1>
                        <p className="subtitle">The Universal Agentic Ledger</p>
                        <p className="description">Building the trustless infrastructure for the $10T autonomous agentic economy. Forensic auditing meets on-chain settlement.</p>

                        <div className="slide-features">
                            <div className="feature-item">
                                <Zap size={20} className="text-primary" />
                                <span>Instant Settlement</span>
                            </div>
                            <div className="feature-item">
                                <Shield size={20} className="text-secondary" />
                                <span>Forensic AI Audit</span>
                            </div>
                        </div>

                        <div className="slide-cta">
                            <button className="btn-primary" onClick={nextSlide}>
                                SYSTEM OVERVIEW <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Slides 2-11 */}
                {[
                    { title: "The Vision", content: "A world where AI agents can scale the autonomous economy without friction.", points: ["10B+ Micro-transactions by 2030", "Zero-Trust Infrastructure", "Human-Independent Settlement"], img: "slide_2_vision_1769857454068.png" },
                    { title: "The Problem", content: "The 'Trust Gap' is the single biggest barrier to the $10 trillion agentic economy.", points: ["Anonymous agents lack legal trust", "High delivery risk & uncertainty", "Escrow friction & slow auditing"], img: "slide_3_problem_1769857466634.png" },
                    { title: "The Solution", content: "HALE is the impartial, autonomous judge of the internet of agents.", points: ["Forensic AI Analysis (Gemini)", "Blockchain Escrow (Circle Arc)", "Instant On-Chain Settlement"], img: "slide_4_solution_1769857479428.png" },
                    { title: "How It Works", content: "Three steps to total certainty in the machine economy.", points: ["1. Terms Locked in Smart Contract", "2. Deep Forensic AI Audit", "3. Automated Payout/Refund"], img: "slide_5_how_it_works_1769857492650.png" },
                    { title: "The Tech Stack", content: "Leveraging state-of-the-art partners for protocol security.", points: ["Circle Arc: USDC Settlement", "Google Gemini: Forensic Reasoning", "Smart Logic: Gas-optimized Solidity"], img: "slide_6_tech_1769857506504.png" },
                    { title: "Multi-Buyer Escrow", content: "An industry-first feature enabling collective agentic funding.", points: ["Pool resources from up to 3 buyers", "Automated proportional refunds", "Shared risk & cost mitigation"], img: "slide_7_escrow_1769857519660.png" },
                    { title: "Use Cases", content: "HALE powers every digital transaction vertical for agents.", points: ["AI Code Marketplaces", "Autonomous Freelancing", "Security Auditing Bounties", "Dataset Verification"], img: "slide_8_use_cases_1769857533957.png" },
                    { title: "The Opportunity", content: "The settlement layer for the trillion-dollar Machine Economy.", points: ["45% CAGR in AI Agent transactions", "Native Web3 Agent support", "Global Settlement Protocol"], img: "slide_9_market_1769857550748.png" },
                    { title: "Roadmap", content: "Aggressive scaling strategy for the next 12 months.", points: ["Q1: Mainnet & SDK Launch", "Q2: Cross-chain Expansion", "Q3: Agent Reputation Oracle"], img: "slide_10_roadmap_1769857563050.png" },
                    { title: "Conclusion", content: "HALE is the trust layer of the internet, scaling assurance to code speed.", points: ["Trustless.", "Automated.", "Secure."], img: "slide_11_conclusion_1769857575273.png" },
                ].map((slide, idx) => (
                    <div key={idx} className={`slide ${currentSlide === idx + 1 ? 'active' : ''} ${currentSlide > idx + 1 ? 'prev' : ''} ${currentSlide < idx + 1 ? 'next' : ''}`}>
                        <img src={`/pitch_deck_assets/${slide.img}`} className="slide-bg" alt={slide.title} />
                        <div className="slide-content glass">
                            <div className="slide-number">PHASE {String(idx + 2).padStart(2, '0')}</div>
                            <h2>{slide.title}</h2>
                            <p className="slide-description">{slide.content}</p>
                            <ul className="slide-points">
                                {slide.points.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                            <div className="slide-cta">
                                <button className="btn-secondary" onClick={nextSlide}>CONTINUE <ChevronRight size={18} /></button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Slide 12 */}
                <div className={`slide ${currentSlide === 11 ? 'active' : ''} ${currentSlide < 11 ? 'next' : ''}`}>
                    <img src="/pitch_deck_assets/slide_12_cta_1769857588667.png" className="slide-bg" alt="CTA" />
                    <div className="slide-content glass">
                        <div className="status-tag">READY FOR DEPLOYMENT</div>
                        <h2>Start Building</h2>
                        <p className="description">Secure the future of agentic commerce today. The protocol is live and ready for integration.</p>
                        <div className="cta-group">
                            <button className="btn-primary large" onClick={() => navigate('/verify')}>
                                LAUNCH MAIN PROTOCOL <Zap size={20} />
                            </button>
                            <a
                                href="https://t.me/Haleoraclebot"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary large"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '12px', textDecoration: 'none' }}
                            >
                                📱 Connect Telegram
                            </a>
                        </div>
                        <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.7 }}>
                            Sellers: Connect your Telegram to receive OTPs and verdicts instantly
                        </p>
                    </div>
                </div>
            </div>

            <div className="landing-footer">
                <div className="progress-container">
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${((currentSlide + 1) / narrations.length) * 100}%` }}></div>
                    </div>
                    <div className="progress-info">
                        <span>MODULE {String(currentSlide + 1).padStart(2, '0')}</span>
                        <span>/ {narrations.length}</span>
                    </div>
                </div>

                <div className="narration-box glass">
                    <Info size={16} className="text-primary" />
                    <p>{narrations[currentSlide]}</p>
                </div>

                <div className="landing-controls">
                    <button className="ctrl-btn" onClick={prevSlide} disabled={currentSlide === 0}>BACK</button>
                    <button className="ctrl-btn next" onClick={nextSlide}>{currentSlide === narrations.length - 1 ? 'ENTER APP' : 'NEXT'}</button>
                </div>
            </div>
        </div>
    );
};

export default Landing;
