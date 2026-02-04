import React, { useEffect, useState, useMemo } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { Shield, CheckCircle2, AlertCircle, Clock, Activity, ExternalLink, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Buffer } from 'buffer';
import idl from './idl.json';

// Polling interval for live updates
const FETCH_INTERVAL = 5000;

// Program ID from IDL
const PROGRAM_ID = new PublicKey(idl.address);

export default function App() {
    const [attestations, setAttestations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const connection = useMemo(() => new Connection("http://127.0.0.1:8899", "confirmed"), []);

    const provider = useMemo(() => {
        // Mock provider since we're just reading
        return new anchor.AnchorProvider(connection, {} as any, { commitment: 'confirmed' });
    }, [connection]);

    const program = useMemo(() => new anchor.Program(idl as any, provider), [provider]);

    const fetchAttestations = async () => {
        try {
            const accounts = await (program.account as any).attestation.all();
            setAttestations(accounts.sort((a: any, b: any) => b.publicKey.toBase58().localeCompare(a.publicKey.toBase58())));
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch attestations:", err);
        }
    };

    useEffect(() => {
        fetchAttestations();
        const timer = setInterval(fetchAttestations, FETCH_INTERVAL);
        return () => clearInterval(timer);
    }, []);

    const filteredAttestations = attestations.filter(a =>
        a.publicKey.toBase58().toLowerCase().includes(search.toLowerCase()) ||
        a.account.authority.toBase58().toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-10 h-10 text-accent" />
                        <h1 className="text-4xl font-bold tracking-tight">HALE Dashboard</h1>
                    </div>
                    <p className="text-gray-400 text-lg">Hyper-Accountable Ledger Engine • Forensic Explorer</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by address or authority..."
                        className="bg-card glass pl-12 pr-6 py-3 rounded-2xl w-full md:w-96 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            {/* Stats Bar */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard
                    icon={<Activity className="text-accent" />}
                    label="Total Attestations"
                    value={attestations.length.toString()}
                />
                <StatCard
                    icon={<CheckCircle2 className="text-success" />}
                    label="Verified Valid"
                    value={attestations.filter(a => Object.keys(a.account.status)[0] === 'audited').length.toString()}
                />
                <StatCard
                    icon={<AlertCircle className="text-destructive" />}
                    label="Disputed"
                    value={attestations.filter(a => Object.keys(a.account.status)[0] === 'disputed').length.toString()}
                />
            </div>

            {/* Main Grid */}
            <main className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredAttestations.map((a) => (
                                <AttestationCard key={a.publicKey.toBase58()} attestation={a} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="bg-card glass p-6 rounded-3xl flex items-center gap-4">
            <div className="p-3 bg-background rounded-2xl">{icon}</div>
            <div>
                <p className="text-gray-400 font-medium">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}

function AttestationCard({ attestation }: { attestation: any }) {
    const status = Object.keys(attestation.account.status)[0];
    const { publicKey, account } = attestation;

    const statusConfig: any = {
        draft: { icon: <Clock className="w-5 h-5" />, color: 'text-warning', bg: 'bg-warning/10', label: 'Draft' },
        sealed: { icon: <Activity className="w-5 h-5" />, color: 'text-accent', bg: 'bg-accent/10', label: 'Sealed' },
        audited: { icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-success', bg: 'bg-success/10', label: 'Audited' },
        disputed: { icon: <AlertCircle className="w-5 h-5" />, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Disputed' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card glass rounded-3xl overflow-hidden hover:border-accent/30 transition-colors group"
        >
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.bg} ${config.color}`}>
                        {config.icon}
                        {config.label}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">{publicKey.toBase58().slice(0, 8)}...</div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Authority</p>
                        <p className="text-sm font-mono truncate text-gray-300">{account.authority.toBase58()}</p>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Intent Hash</p>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-mono truncate text-gray-300 bg-background/50 p-2 rounded-lg flex-1">
                                {Buffer.from(account.intentHash).toString('hex')}
                            </p>
                        </div>
                    </div>

                    {account.outcomeHash && (
                        <div>
                            <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Outcome Hash</p>
                            <p className="text-sm font-mono truncate text-gray-300 bg-background/50 p-2 rounded-lg">
                                {Buffer.from(account.outcomeHash).toString('hex')}
                            </p>
                        </div>
                    )}

                    {account.evidenceUri && (
                        <div className="bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                            <p className="text-[10px] uppercase text-destructive font-bold mb-1">Challenge Evidence</p>
                            <a
                                href={account.evidenceUri}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-destructive hover:underline flex items-center gap-1 font-mono break-all"
                            >
                                {account.evidenceUri} <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <a
                            href={account.metadataUri}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-accent hover:underline flex items-center gap-1 font-bold"
                        >
                            Metadata URI <ExternalLink className="w-3 h-3" />
                        </a>

                        {(status === 'sealed' || status === 'audited') && (
                            <button
                                onClick={() => alert('In a real app, this would trigger a challenge transaction via your wallet adapter.')}
                                className="px-3 py-1 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                                <AlertCircle className="w-3 h-3" /> Challenge
                            </button>
                        )}

                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <Shield className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
