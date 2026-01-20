import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, ArrowLeft, History, FileCode, CheckSquare, Square } from 'lucide-react';
import { Link, Routes, Route, Navigate } from 'react-router-dom';

interface Task {
    id: number;
    description: string;
    is_completed: boolean;
    is_selected: boolean;
    updated_at: string;
}

const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showCompleted, setShowCompleted] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/tasks');
            if (res.ok) {
                const data = await res.json();
                setTasks(data || []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const toggleSelection = async (task: Task) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_selected: !t.is_selected } : t));

        try {
            await fetch(`/api/tasks/${task.id}/select`, { method: 'POST' });
        } catch (err) {
            // Revert on error
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_selected: task.is_selected } : t));
        }
    };

    const filteredTasks = tasks.filter(t => showCompleted || !t.is_completed);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading tasks...</div>;

    return (
        <div className="chart-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Development Tasks</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={showCompleted} onChange={() => setShowCompleted(!showCompleted)} />
                    Show Completed
                </label>
            </div>
            <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', textAlign: 'left', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '1rem', width: '80px', textAlign: 'center' }}>Select</th>
                            <th style={{ padding: '1rem' }}>Task Description</th>
                            <th style={{ padding: '1rem', width: '100px' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.length === 0 ? (
                            <tr><td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No tasks found. Run `joshua task sync` from CLI.</td></tr>
                        ) : (
                            filteredTasks.map(task => (
                                <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div
                                            onClick={() => toggleSelection(task)}
                                            style={{
                                                cursor: 'pointer',
                                                color: task.is_selected ? 'var(--primary-color)' : 'var(--text-secondary)',
                                                display: 'flex', justifyContent: 'center'
                                            }}
                                            title="Flag for development"
                                        >
                                            {task.is_selected ? <CheckSquare size={24} /> : <Square size={24} />}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: task.is_completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: task.is_completed ? 'line-through' : 'none' }}>
                                        {task.description}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className="badge" style={{
                                            background: task.is_completed ? 'var(--success-color)' : 'var(--warning-color)',
                                            color: 'var(--bg-body)',
                                            fontSize: '0.8rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px'
                                        }}>
                                            {task.is_completed ? 'Done' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const RequirementsEditor: React.FC = () => {
    const [content, setContent] = useState("");
    const [initialContent, setInitialContent] = useState("");
    const [versionId, setVersionId] = useState<number | null>(null);
    const [status, setStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetch('/api/requirements')
            .then(res => res.json())
            .then(data => {
                setContent(data.content || "");
                setInitialContent(data.content || "");
                setVersionId(data.id);
            })
            .catch(err => console.error("Failed to load requirements", err));
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setStatus(null);
        try {
            const res = await fetch('/api/requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            if (!res.ok) throw new Error("Failed to save requirements");

            setStatus({ msg: "Requirements saved as new version!", type: 'success' });
            // Refresh logic could go here
        } catch (err) {
            setStatus({ msg: "Error saving requirements.", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRevert = () => {
        if (confirm("Discard unsaved changes?")) {
            setContent(initialContent);
        }
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {versionId && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Current Version: v{versionId}</span>}
                    <button onClick={handleRevert} className="btn-outline">
                        <History size={16} /> Revert
                    </button>
                    <button onClick={handleSave} className="btn-primary" disabled={isSaving}>
                        <Save size={16} /> {isSaving ? "Saving..." : "Save Version"}
                    </button>
                </div>
            </div>

            {status && (
                <div style={{
                    padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem',
                    backgroundColor: status.type === 'success' ? 'var(--success-color)' : 'var(--error-color)',
                    color: 'white'
                }}>
                    {status.msg}
                </div>
            )}

            <div className="chart-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '70vh' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <FileCode size={16} color="var(--text-primary)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>requirements.md</span>
                </div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{
                        flex: 1, width: '100%', padding: '1.5rem',
                        border: 'none', resize: 'none',
                        fontFamily: 'monospace', fontSize: '1rem', lineHeight: '1.6',
                        background: 'var(--bg-input)', color: 'var(--text-body)', outline: 'none'
                    }}
                    spellCheck={false}
                />
            </div>
        </>
    );
};

const DeveloperApp: React.FC = () => {
    const { user } = useAuth();

    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Access Denied. Developer role required.</div>;
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    <ArrowLeft size={16} /> Back to Hub
                </Link>
            </div>

            <Routes>
                <Route path="tasks" element={<TaskList />} />
                <Route path="requirements" element={<RequirementsEditor />} />
                <Route path="/" element={<Navigate to="tasks" replace />} />
            </Routes>
        </div>
    );
};

export default DeveloperApp;
