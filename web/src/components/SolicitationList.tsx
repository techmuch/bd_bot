import React, { useEffect, useState } from 'react';
import type { Solicitation } from '../types';

const SolicitationList: React.FC = () => {
    const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

    if (loading) return <div className="loading">Loading opportunities...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="solicitation-list">
            <h2>Current Opportunities</h2>
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Agency</th>
                            <th>Title</th>
                            <th>Due Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {solicitations.map((sol) => (
                            <tr key={sol.source_id}>
                                <td>{sol.agency}</td>
                                <td>{sol.title}</td>
                                <td>
                                    {sol.due_date === "0001-01-01T00:00:00Z" 
                                        ? "N/A" 
                                        : new Date(sol.due_date).toLocaleDateString()}
                                </td>
                                <td>
                                    <a 
                                        href={sol.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn-link"
                                    >
                                        View Source
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SolicitationList;
