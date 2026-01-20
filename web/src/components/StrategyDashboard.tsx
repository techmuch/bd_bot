import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface StrategyStat {
    sco_id: number;
    sco_title: string;
    target_percent: number;
    project_count: number;
    total_allocated: number;
}

const StrategyDashboard: React.FC = () => {
    const [stats, setStats] = useState<StrategyStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/irad/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data || []);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    const totalBudget = stats.reduce((acc, s) => acc + s.total_allocated, 0);

    return (
        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem'}}>
            <div className="chart-card">
                <h3 style={{marginTop: 0, color: 'var(--text-primary)'}}>Target Allocation vs Actuals</h3>
                <div className="table-responsive">
                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                        <thead>
                            <tr style={{textAlign: 'left', color: 'var(--text-secondary)'}}>
                                <th style={{padding: '0.5rem'}}>SCO</th>
                                <th style={{padding: '0.5rem'}}>Target %</th>
                                <th style={{padding: '0.5rem'}}>Actual %</th>
                                <th style={{padding: '0.5rem'}}>Delta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map(s => {
                                const actualPercent = totalBudget > 0 ? (s.total_allocated / totalBudget) * 100 : 0;
                                const delta = actualPercent - s.target_percent;
                                return (
                                    <tr key={s.sco_id} style={{borderBottom: '1px solid var(--border-color)'}}>
                                        <td style={{padding: '1rem 0.5rem'}}>{s.sco_title}</td>
                                        <td style={{padding: '1rem 0.5rem'}}>{s.target_percent.toFixed(1)}%</td>
                                        <td style={{padding: '1rem 0.5rem'}}>{actualPercent.toFixed(1)}% ({s.project_count} projects)</td>
                                        <td style={{padding: '1rem 0.5rem', color: Math.abs(delta) > 10 ? 'var(--error-color)' : Math.abs(delta) > 5 ? 'var(--warning-color)' : 'var(--success-color)'}}>
                                            {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="chart-card">
                <h3 style={{marginTop: 0, color: 'var(--text-primary)'}}>Gap Analysis</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    {stats.filter(s => s.project_count === 0).map(s => (
                        <div key={s.sco_id} style={{padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', borderLeft: '4px solid var(--error-color)'}}>
                            <div style={{fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <AlertTriangle size={16} color="var(--error-color)" /> {s.sco_title}
                            </div>
                            <p style={{margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                                Zero active projects. Target allocation is {s.target_percent}%.
                            </p>
                            <button className="btn-link" style={{fontSize: '0.8rem', marginTop: '0.5rem'}}>Draft Proposal</button>
                        </div>
                    ))}
                    {stats.every(s => s.project_count > 0) && (
                        <div style={{textAlign: 'center', padding: '2rem', color: 'var(--success-color)'}}>
                            All SCOs have active coverage!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StrategyDashboard;
