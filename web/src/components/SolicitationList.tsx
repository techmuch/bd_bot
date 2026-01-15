import React, { useEffect, useState, useMemo } from 'react';
import type { Solicitation } from '../types';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';
import { 
    ChevronDown, 
    ChevronRight, 
    Search, 
    ExternalLink, 
    FileText, 
    ArrowUpDown,
    X
} from 'lucide-react';

const SolicitationList: React.FC = () => {
    const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    
    // Filtering & Sorting State
    const [filterText, setFilterText] = useState("");
    const [dateFilter, setDateFilter] = useState<string | null>(null);
    const [agencyFilter, setAgencyFilter] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Solicitation; direction: 'asc' | 'desc' } | null>({ key: 'due_date', direction: 'asc' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/solicitations');
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                setSolicitations(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper to calc days remaining
    const getDaysRemaining = (dateStr: string) => {
        if (dateStr === "0001-01-01T00:00:00Z") return -999;
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getDateBucket = (days: number) => {
        if (days < 0) return "Expired";
        if (days <= 7) return "0-7 Days";
        if (days <= 14) return "8-14 Days";
        if (days <= 30) return "15-30 Days";
        return "30+ Days";
    };

    // 1. Text Filtered (Base for all charts and table)
    const textFilteredSolicitations = useMemo(() => {
        if (!filterText) return solicitations;
        const lower = filterText.toLowerCase();
        return solicitations.filter(item => 
            item.title.toLowerCase().includes(lower) ||
            item.agency.toLowerCase().includes(lower)
        );
    }, [solicitations, filterText]);

    // 2. Time Data (Derived from textFiltered + agencyFilter)
    const timeData = useMemo(() => {
        const buckets = {
            "Expired": 0, "0-7 Days": 0, "8-14 Days": 0, "15-30 Days": 0, "30+ Days": 0
        };
        const source = agencyFilter 
            ? textFilteredSolicitations.filter(s => s.agency === agencyFilter) 
            : textFilteredSolicitations;

        source.forEach(sol => {
            const days = getDaysRemaining(sol.due_date);
            if (days === -999) return;
            const bucket = getDateBucket(days);
            if (buckets[bucket as keyof typeof buckets] !== undefined) {
                buckets[bucket as keyof typeof buckets]++;
            }
        });
        return Object.entries(buckets).map(([name, count]) => ({ name, count }));
    }, [textFilteredSolicitations, agencyFilter]);

    // 3. Agency Data (Derived from textFiltered + dateFilter)
    const agencyData = useMemo(() => {
        const counts: Record<string, number> = {};
        const source = dateFilter
            ? textFilteredSolicitations.filter(s => getDateBucket(getDaysRemaining(s.due_date)) === dateFilter)
            : textFilteredSolicitations;

        source.forEach(sol => {
            counts[sol.agency] = (counts[sol.agency] || 0) + 1;
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const top5 = sorted.slice(0, 5).map(([name, count]) => ({ name, count }));
        
        return top5;
    }, [textFilteredSolicitations, dateFilter]);

    // 4. Main Table Logic (Derived from textFiltered + both filters)
    const processedSolicitations = useMemo(() => {
        let items = [...textFilteredSolicitations];

        if (dateFilter) {
            items = items.filter(item => getDateBucket(getDaysRemaining(item.due_date)) === dateFilter);
        }
        if (agencyFilter) {
            items = items.filter(item => item.agency === agencyFilter);
        }

        if (sortConfig) {
            items.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return items;
    }, [textFilteredSolicitations, dateFilter, agencyFilter, sortConfig]);

    const requestSort = (key: keyof Solicitation) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    if (loading) return <div className="loading">Loading opportunities...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="solicitation-list">
            {/* Dashboard Grid */}
            <div className="dashboard-grid">
                <div className="chart-card">
                    <h3>Timeline</h3>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={timeData} onClick={(data) => data && setDateFilter(data.activeLabel ? String(data.activeLabel) : null)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} hide />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} cursor="pointer">
                                    {timeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === dateFilter ? "#2980b9" : "#3498db"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="chart-card">
                    <h3>Top Agencies</h3>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart layout="vertical" data={agencyData} onClick={(data) => data && setAgencyFilter(data.activeLabel ? String(data.activeLabel) : null)}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} cursor="pointer">
                                    {agencyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === agencyFilter ? "#8e44ad" : "#9b59b6"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Controls & Active Filters */}
            <div className="controls-section">
                <div className="search-group">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search opportunities..." 
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    {/* Active Filters */}
                    <div className="active-filters">
                        {dateFilter && (
                            <span className="filter-chip" onClick={() => setDateFilter(null)}>
                                {dateFilter} <X size={14} />
                            </span>
                        )}
                        {agencyFilter && (
                            <span className="filter-chip" onClick={() => setAgencyFilter(null)}>
                                {agencyFilter} <X size={14} />
                            </span>
                        )}
                        {(dateFilter || agencyFilter) && (
                            <span className="clear-all" onClick={() => {setDateFilter(null); setAgencyFilter(null)}}>
                                Clear all
                            </span>
                        )}
                    </div>
                </div>
                <div className="stats-box">
                    {processedSolicitations.length} results
                </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th style={{width: '40px'}}></th>
                            <th onClick={() => requestSort('agency')} className="sortable">Agency <ArrowUpDown size={14} /></th>
                            <th onClick={() => requestSort('title')} className="sortable">Title <ArrowUpDown size={14} /></th>
                            <th onClick={() => requestSort('due_date')} className="sortable">Due Date <ArrowUpDown size={14} /></th>
                            <th>Docs</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedSolicitations.map((sol) => (
                            <React.Fragment key={sol.source_id}>
                                <tr 
                                    onClick={() => toggleRow(sol.source_id)} 
                                    className={expandedRow === sol.source_id ? "row-active" : ""}
                                >
                                    <td className="chevron-cell">
                                        {expandedRow === sol.source_id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </td>
                                    <td>{sol.agency}</td>
                                    <td>{sol.title}</td>
                                    <td>{sol.due_date === "0001-01-01T00:00:00Z" ? "N/A" : new Date(sol.due_date).toLocaleDateString()}</td>
                                    <td>
                                        {sol.documents?.length > 0 ? (
                                            <span className="badge">{sol.documents.length} <FileText size={12} style={{marginLeft: 4}}/></span>
                                        ) : <span className="text-muted">-</span>}
                                    </td>
                                    <td>
                                        <a href={sol.url} target="_blank" rel="noreferrer" className="btn-link" onClick={(e) => e.stopPropagation()}>
                                            <ExternalLink size={16} />
                                        </a>
                                    </td>
                                </tr>
                                {expandedRow === sol.source_id && (
                                    <tr className="expanded-row">
                                        <td colSpan={6}>
                                            <div className="details-panel">
                                                {sol.description && <p style={{marginBottom: '1rem'}}>{sol.description}</p>}
                                                <strong>Documents:</strong>
                                                {sol.documents?.length > 0 ? (
                                                    <ul className="doc-grid">
                                                        {sol.documents.map((doc, idx) => (
                                                            <li key={idx}>
                                                                <a href={doc.url} target="_blank" rel="noreferrer" className="doc-link">
                                                                    <FileText size={16} /> {doc.title || "File"}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : <p className="text-muted">No documents found.</p>}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SolicitationList;
