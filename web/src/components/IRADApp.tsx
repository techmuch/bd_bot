import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Target, Rocket, ChevronRight, Users, DollarSign } from 'lucide-react';
import StrategyDashboard from './StrategyDashboard';

interface Project {
    id: number;
    title: string;
    description: string;
    sco_title: string;
    pi_name: string;
    status: string;
    total_budget: number;
}

const IRADProjects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/irad/projects')
            .then(res => res.json())
            .then(data => {
                setProjects(data || []);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading portfolio...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>IRAD Portfolio</h2>
                <button className="btn-primary">
                    <Rocket size={16} /> Submit Concept Note
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {projects.map(p => (
                    <div key={p.id} className="chart-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', fontSize: '0.7rem' }}>
                                {p.status.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>v1.0</span>
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{p.title}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', minHeight: '3rem' }}>{p.description}</p>
                        
                        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                <Target size={14} color="var(--text-secondary)" />
                                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.sco_title}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                <Users size={14} color="var(--text-secondary)" />
                                <span>PI: {p.pi_name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                <DollarSign size={14} color="var(--text-secondary)" />
                                <span>Budget: ${p.total_budget.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <button className="btn-link" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                            View Roadmap <ChevronRight size={16} />
                        </button>
                    </div>
                ))}
                {projects.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '8px', border: '2px dashed var(--border-color)' }}>
                        <Rocket size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <h3 style={{ color: 'var(--text-secondary)' }}>No Active Projects</h3>
                        <p>Launch a new concept note to begin the IRAD lifecycle.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const IRADApp: React.FC = () => {
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <Routes>
                <Route path="strategy" element={<StrategyDashboard />} />
                <Route path="portfolio" element={<IRADProjects />} />
                <Route path="/" element={<Navigate to="portfolio" replace />} />
            </Routes>
        </div>
    );
};

export default IRADApp;
