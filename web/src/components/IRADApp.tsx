import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { Target, Rocket, ChevronRight, Users, DollarSign, ArrowLeft } from 'lucide-react';
import StrategyDashboard from './StrategyDashboard';
import ReviewerPortal from './ReviewerPortal';

interface Project {
    id: number;
    title: string;
    description: string;
    sco_title: string;
    pi_name: string;
    status: string;
    total_budget: number;
}

const ProposalForm: React.FC = () => {
    const { scoId } = useParams<{ scoId?: string }>();
    const navigate = useNavigate();
    const [scos, setSCOs] = useState<any[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedSCO, setSelectedSCO] = useState(scoId || "");
    const [budget, setBudget] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetch('/api/irad/scos')
            .then(res => res.json())
            .then(setSCOs)
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/irad/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    sco_id: parseInt(selectedSCO),
                    total_budget: budget,
                    status: 'concept'
                })
            });
            if (res.ok) {
                navigate('/irad/portfolio');
            } else {
                alert("Failed to submit concept note.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button onClick={() => navigate(-1)} className="btn-link" style={{ marginBottom: '1rem' }}>
                <ArrowLeft size={16} /> Back
            </button>
            
            <div className="chart-card" style={{ padding: '2rem' }}>
                <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>New IRAD Concept Note</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Describe your initial research idea. The system will identify collaborators and past related works.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Strategic Capability Objective (SCO)</label>
                        <select 
                            value={selectedSCO} 
                            onChange={(e) => setSelectedSCO(e.target.value)} 
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-body)', fontSize: '1rem' }}
                        >
                            <option value="">Select an SCO...</option>
                            {scos.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Project Title</label>
                        <input 
                            type="text" 
                            placeholder="Short, descriptive title"
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-body)', fontSize: '1rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Scientific/Technical Concept</label>
                        <textarea 
                            placeholder="What problem are you solving? What is the technical approach?"
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            required 
                            style={{ width: '100%', height: '150px', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-body)', fontSize: '1rem', resize: 'vertical' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Estimated Year 1 Budget ($)</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>$</span>
                            <input 
                                type="number" 
                                value={budget || ''} 
                                onChange={(e) => setBudget(parseFloat(e.target.value))} 
                                required 
                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2rem', borderRadius: '6px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-body)', fontSize: '1rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => navigate(-1)} className="btn-outline">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Concept Note"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const IRADProjects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
                <button className="btn-primary" onClick={() => navigate('/irad/new-proposal')}>
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
                <Route path="reviews" element={<ReviewerPortal />} />
                <Route path="new-proposal" element={<ProposalForm />} />
                <Route path="new-proposal/:scoId" element={<ProposalForm />} />
                <Route path="/" element={<Navigate to="portfolio" replace />} />
            </Routes>
        </div>
    );
};

export default IRADApp;