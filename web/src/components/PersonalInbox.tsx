import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Match, Solicitation } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
    ChevronDown, 
    ChevronRight, 
    ExternalLink, 
    FileText, 
    Sparkles, 
    ArrowUpDown,
    User 
} from 'lucide-react';
import { useAnalytics, getDaysRemaining, getDateBucket } from '../hooks/useAnalytics';
import DashboardCharts from './DashboardCharts';
import FilterControls from './FilterControls';

const PersonalInbox: React.FC = () => {
    const { user } = useAuth();
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Filtering & Sorting State
    const [filterText, setFilterText] = useState("");
    const [dateFilter, setDateFilter] = useState<string | null>(null);
    const [agencyFilter, setAgencyFilter] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Match | keyof Solicitation; direction: 'asc' | 'desc' } | null>({ key: 'score', direction: 'desc' });

    useEffect(() => {
        if (!user) return;

        const fetchMatches = async () => {
            try {
                const response = await fetch('/api/matches');
                if (response.ok) {
                    const data = await response.json();
                    setMatches(data || []);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [user]);

    // 1. Text Filtered (Base)
    const textFilteredMatches = useMemo(() => {
        if (!filterText) return matches;
        const lower = filterText.toLowerCase();
        return matches.filter(m => 
            m.solicitation.title.toLowerCase().includes(lower) ||
            m.solicitation.agency.toLowerCase().includes(lower)
        );
    }, [matches, filterText]);

    // 2. Analytics Hook (Mapping Match -> Solicitation fields)
    const { timeData, agencyData } = useAnalytics(
        textFilteredMatches,
        (m) => m.solicitation.due_date,
        (m) => m.solicitation.agency,
        dateFilter,
        agencyFilter
    );

    // 3. Main Table Logic
    const processedMatches = useMemo(() => {
        let items = [...textFilteredMatches];

        if (dateFilter) {
            items = items.filter(m => getDateBucket(getDaysRemaining(m.solicitation.due_date)) === dateFilter);
        }
        if (agencyFilter) {
            items = items.filter(m => m.solicitation.agency === agencyFilter);
        }

        if (sortConfig) {
            items.sort((a, b) => {
                let valA: any = a[sortConfig.key as keyof Match];
                let valB: any = b[sortConfig.key as keyof Match];

                // Check if key is on solicitation
                if (valA === undefined) valA = a.solicitation[sortConfig.key as keyof Solicitation];
                if (valB === undefined) valB = b.solicitation[sortConfig.key as keyof Solicitation];

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return items;
    }, [textFilteredMatches, dateFilter, agencyFilter, sortConfig]);

    const requestSort = (key: keyof Match | keyof Solicitation) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    if (!user) return <div>Please login to view your inbox.</div>;
    if (loading) return <div className="loading">Loading AI matches...</div>;

    if (matches.length === 0) {
        return (
            <div style={{textAlign: 'center', padding: '3rem', color: '#7f8c8d'}}>
                <Sparkles size={48} style={{marginBottom: '1rem', opacity: 0.5}} />
                <h3>No matches found yet.</h3>
                <p>Ensure you have set your narrative and run the matching engine.</p>
            </div>
        );
    }

    return (
        <div className="solicitation-list">
            <DashboardCharts 
                timeData={timeData} 
                agencyData={agencyData}
                dateFilter={dateFilter}
                agencyFilter={agencyFilter}
                setDateFilter={setDateFilter}
                setAgencyFilter={setAgencyFilter}
            />

            <FilterControls 
                filterText={filterText}
                setFilterText={setFilterText}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                agencyFilter={agencyFilter}
                setAgencyFilter={setAgencyFilter}
                count={processedMatches.length}
                total={matches.length}
            />

            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th style={{width: 40}}></th>
                            <th onClick={() => requestSort('score')} className="sortable" style={{width: 80}}>
                                Score <ArrowUpDown size={14} />
                            </th>
                            <th onClick={() => requestSort('agency')} className="sortable">
                                Agency <ArrowUpDown size={14} />
                            </th>
                            <th onClick={() => requestSort('title')} className="sortable">
                                Title <ArrowUpDown size={14} />
                            </th>
                            <th>Reasoning</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedMatches.map((match) => (
                            <React.Fragment key={match.match_id}>
                                <tr onClick={() => setExpandedRow(expandedRow === match.solicitation.source_id ? null : match.solicitation.source_id)} className={expandedRow === match.solicitation.source_id ? "row-active" : ""}>
                                    <td className="chevron-cell">
                                        {expandedRow === match.solicitation.source_id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            backgroundColor: match.score >= 80 ? '#27ae60' : match.score >= 50 ? '#f39c12' : '#e74c3c'
                                        }}>
                                            {match.score}
                                        </span>
                                    </td>
                                    <td>{match.solicitation.agency}</td>
                                    <td>
                                        <Link to={`/solicitation/${match.solicitation.source_id}`} style={{fontWeight: 500, color: '#2c3e50', textDecoration: 'none'}}>
                                            {match.solicitation.title}
                                        </Link>
                                        {match.solicitation.lead_name && (
                                            <div style={{fontSize: '0.8rem', color: '#e67e22', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px'}}>
                                                <User size={12} /> Lead: {match.solicitation.lead_name}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{
                                            maxWidth: '400px', 
                                            whiteSpace: 'nowrap', 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis',
                                            color: '#555'
                                        }}>
                                            {match.explanation}
                                        </div>
                                    </td>
                                    <td>
                                        <a 
                                            href={match.solicitation.url} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="btn-link"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    </td>
                                </tr>
                                {expandedRow === match.solicitation.source_id && (
                                    <tr className="expanded-row">
                                        <td colSpan={6}>
                                            <div className="details-panel">
                                                <div style={{marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fdfdfd', borderLeft: '4px solid #3498db'}}>
                                                    <strong>AI Analysis:</strong>
                                                    <p style={{marginTop: '0.5rem'}}>{match.explanation}</p>
                                                </div>
                                                
                                                {match.solicitation.description && (
                                                    <div style={{marginBottom: '1rem'}}>
                                                        <strong>Description:</strong>
                                                        <p>{match.solicitation.description}</p>
                                                    </div>
                                                )}

                                                {match.solicitation.documents?.length > 0 && (
                                                    <>
                                                        <strong>Documents:</strong>
                                                        <ul className="doc-grid">
                                                            {match.solicitation.documents.map((doc, idx) => (
                                                                <li key={idx}>
                                                                    <a href={doc.url} target="_blank" rel="noreferrer" className="doc-link">
                                                                        <FileText size={16} /> {doc.title || "File"}
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
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

export default PersonalInbox;