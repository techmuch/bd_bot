import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Solicitation } from '../types';
import { 
    ChevronDown, 
    ChevronRight, 
    ExternalLink, 
    FileText, 
    ArrowUpDown,
    User,
    Users
} from 'lucide-react';
import { useAnalytics, getDaysRemaining, getDateBucket } from '../hooks/useAnalytics';
import DashboardCharts from './DashboardCharts';
import FilterControls from './FilterControls';

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

    // 1. Text Filtered (Base for all charts and table)
    const textFilteredSolicitations = useMemo(() => {
        if (!filterText) return solicitations;
        const lower = filterText.toLowerCase();
        return solicitations.filter(item => 
            item.title.toLowerCase().includes(lower) ||
            item.agency.toLowerCase().includes(lower)
        );
    }, [solicitations, filterText]);

    // 2. Analytics Hook
    const { timeData, agencyData } = useAnalytics(
        textFilteredSolicitations,
        (s) => s.due_date,
        (s) => s.agency,
        dateFilter,
        agencyFilter
    );

    // 3. Main Table Logic (Derived from textFiltered + both filters)
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
                count={processedSolicitations.length}
                total={solicitations.length}
            />

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
                                    <td>
                                        <Link to={`/solicitation/${sol.source_id}`} style={{fontWeight: 500, color: '#2c3e50', textDecoration: 'none'}}>
                                            {sol.title}
                                        </Link>
                                        <div style={{display: 'flex', gap: '1rem', marginTop: '4px'}}>
                                            {sol.lead_name && (
                                                <div style={{fontSize: '0.8rem', color: '#e67e22', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                                    <User size={12} /> Lead: {sol.lead_name}
                                                </div>
                                            )}
                                            {sol.interested_parties && (
                                                <div style={{fontSize: '0.8rem', color: '#3498db', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                                    <Users size={12} /> Interested: {sol.interested_parties}
                                                </div>
                                            )}
                                        </div>
                                    </td>
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