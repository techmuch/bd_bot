import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface StrategyStat {
    sco_id: number;
    sco_title: string;
    target_percent: number;
    project_count: number;
    total_allocated: number;
}

interface ROIData {
    total_captured: number;
    win_count: number;
}

interface DashboardData {
    stats: StrategyStat[];
    roi: ROIData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StrategyDashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/irad/stats')
            .then(res => res.json())
            .then(resData => {
                setData(resData || { stats: [], roi: { total_captured: 0, win_count: 0 } });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading || !data) return <div>Loading dashboard...</div>;

    const stats = data.stats;
    const totalBudget = stats.reduce((acc, s) => acc + s.total_allocated, 0);
    const chartData = stats.map(s => ({ name: s.sco_title, value: s.total_allocated })).filter(d => d.value > 0);

    return (
        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                {/* Allocation Table */}
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
                                            <td style={{padding: '1rem 0.5rem'}}>{actualPercent.toFixed(1)}% ({s.project_count})</td>
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

                {/* Sunburst / Pie Chart */}
                <div className="chart-card" style={{minHeight: '350px'}}>
                    <h3 style={{marginTop: 0, color: 'var(--text-primary)'}}>Funding Distribution (Actuals)</h3>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={chartData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={100} 
                                    innerRadius={60}
                                    label
                                >
                                    {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)'}}>No budget allocated yet.</div>
                    )}
                </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
                {/* ROI Tracker */}
                <div className="chart-card">
                    <h3 style={{marginTop: 0, color: 'var(--text-primary)'}}>Portfolio ROI</h3>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                        <div style={{padding: '1rem', background: 'var(--primary-light)', borderRadius: '50%'}}>
                            <TrendingUp size={24} color="var(--primary-color)" />
                        </div>
                        <div>
                            <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Total Captured Funding</div>
                            <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)'}}>
                                ${data.roi.total_captured.toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                        <strong>{data.roi.win_count}</strong> successful transitions recorded.
                    </div>
                </div>

                {/* Gap Analysis */}
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
                                <button 
                                    className="btn-link" 
                                    style={{fontSize: '0.8rem', marginTop: '0.5rem'}}
                                    onClick={() => navigate(`/irad/new-proposal/${s.sco_id}`)}
                                >
                                    Draft Proposal
                                </button>
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
        </div>
    );
};

export default StrategyDashboard;