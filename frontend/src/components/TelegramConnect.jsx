import React, { useState, useEffect } from 'react';
import TelegramLogin from './TelegramLogin';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001/api';

function TelegramConnect() {
    const [botName, setBotName] = useState('');
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch bot name
        fetch(`${API_BASE_URL}/telegram/bot_info`)
            .then(res => res.json())
            .then(data => {
                if (data.username) {
                    setBotName(data.username);
                } else {
                    setError('Could not fetch bot information.');
                }
            })
            .catch(err => {
                console.error(err);
                setError('Failed to connect to backend.');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleAuth = async (user) => {
        try {
            const response = await fetch(`${API_BASE_URL}/telegram/verify_login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user),
            });

            const data = await response.json();

            if (data.ok) {
                setUser(data.user);
            } else {
                setError(data.error || 'Verification failed');
            }
        } catch (err) {
            console.error(err);
            setError('Auth verification failed');
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <div className="glass-panel p-8 max-w-[600px] mx-auto text-center">
                <div className="mb-6 flex justify-center">
                    <Shield size={48} className="text-emerald-500" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Connect Telegram</h1>
                <p className="text-secondary mb-8">
                    Link your Telegram account to receive real-time notifications for HALE Oracle deliveries and escrow updates.
                </p>

                {/* Step 1: Open Bot */}
                <div className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-emerald-500/20 p-6 rounded-xl mb-6">
                    <h3 className="text-lg font-bold text-white mb-3">Step 1: Open @Haleoraclebot</h3>
                    <p className="text-secondary text-sm mb-4">
                        Click the button below to open the HALE Oracle bot in Telegram
                    </p>
                    <a
                        href="https://t.me/Haleoraclebot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        📱 Open @Haleoraclebot in Telegram
                    </a>
                </div>

                {/* Step 2: Start */}
                <div className="bg-black/30 border border-white/10 p-6 rounded-xl mb-6">
                    <h3 className="text-lg font-bold text-white mb-3">Step 2: Press /start</h3>
                    <p className="text-secondary text-sm">
                        In Telegram, press the <strong className="text-emerald-400">/start</strong> button or type <code className="bg-black/50 px-2 py-1 rounded">/start</code> to register your account.
                    </p>
                </div>

                {/* Step 3: Ready */}
                <div className="bg-black/30 border border-white/10 p-6 rounded-xl mb-6">
                    <h3 className="text-lg font-bold text-white mb-3">Step 3: You're Ready!</h3>
                    <p className="text-secondary text-sm">
                        After starting the bot, you'll automatically receive:
                    </p>
                    <ul className="text-secondary text-sm mt-2 text-left list-disc list-inside">
                        <li>🔑 OTP codes when a buyer sets requirements for you</li>
                        <li>📊 Oracle verdicts after code verification</li>
                        <li>💰 Payment confirmations</li>
                    </ul>
                </div>

                {loading && <div className="text-emerald-400">Loading bot info...</div>}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-400 mb-6 flex items-center justify-center gap-2">
                        <AlertTriangle size={18} />
                        {error}
                    </div>
                )}

                {!user && botName && !loading && (
                    <div className="border-t border-white/10 pt-6 mt-6">
                        <p className="text-secondary text-sm mb-4">Or verify your connection with the login widget:</p>
                        <div className="flex justify-center">
                            <TelegramLogin
                                botName={botName}
                                onAuth={handleAuth}
                            />
                        </div>
                    </div>
                )}

                {user && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-xl animate-fade-in">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <CheckCircle size={24} className="text-emerald-500" />
                            <h3 className="text-xl font-bold text-white">Connected!</h3>
                        </div>

                        <div className="flex items-center gap-4 bg-black/30 p-4 rounded-lg mb-4">
                            {user.photo_url && (
                                <img src={user.photo_url} alt="Profile" className="w-12 h-12 rounded-full" />
                            )}
                            <div className="text-left">
                                <div className="text-white font-bold">{user.first_name} {user.last_name}</div>
                                <div className="text-emerald-400 text-sm">@{user.username}</div>
                            </div>
                        </div>

                        <p className="text-secondary text-sm">
                            Your Telegram account is now linked. You can close this page.
                        </p>
                    </div>
                )}

                <div className="mt-8 text-xs text-secondary/50">
                    Tip: Make sure to use your Telegram username (e.g., @YourName) when setting up escrows as a seller.
                </div>
            </div>
        </div>
    );
}

export default TelegramConnect;
