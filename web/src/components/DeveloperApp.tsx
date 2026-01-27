import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, ArrowLeft, History, FileCode, CheckSquare, Square, MessageSquare, ThumbsUp, AlertCircle } from 'lucide-react';
import { Link, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

interface Task {
    id: number;
    description: string;
    is_completed: boolean;
    is_selected: boolean;
    updated_at: string;
    plan: string;
    plan_status: string;
}

interface Comment {
    id: number;
    content: string;
    created_at: string;
    user: { full_name: string; avatar_url: string };
}

const TaskDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [task, setTask] = useState<Task | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [plan, setPlan] = useState("");
    const [planStatus, setPlanStatus] = useState("none");
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchDetail = async () => {
        try {
            const res = await fetch(`/api/tasks/${id}`);
            if (res.ok) {
                const data = await res.json();
                setTask(data.Task);
                setComments(data.Comments || []);
                setPlan(data.Task.plan || "");
                setPlanStatus(data.Task.plan_status || "none");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleSavePlan = async (newStatus?: string) => {
        setIsSaving(true);
        const statusToSave = newStatus || planStatus;
        try {
            const res = await fetch(`/api/tasks/${id}/plan`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, plan_status: statusToSave }),
            });
            if (res.ok) {
                if (newStatus && newStatus !== planStatus) {
                    await fetch(`/api/tasks/${id}/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: `Status changed from ${planStatus} to ${newStatus}` }),
                    });
                    fetchDetail();
                } else {
                    setPlanStatus(statusToSave);
                    alert("Plan saved!");
                }
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const res = await fetch(`/api/tasks/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            if (res.ok) {
                setNewComment("");
                fetchDetail();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!task) return <div>Task not found</div>;

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'approved': return 'var(--success-color)';
            case 'review': return 'var(--warning-color)';
            case 'revision': return 'var(--error-color)';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
            <Link to="/developer/tasks" className="btn-link" style={{ marginBottom: '1rem', width: 'fit-content', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <ArrowLeft size={16} /> Back to Tasks
            </Link>
            <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                <div className="chart-card" style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Development Plan</h3>
                            <span className="badge" style={{ background: getStatusColor(planStatus), color: 'var(--bg-card)' }}>
                                {planStatus.toUpperCase()}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Task #{task.id}: {task.description}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleSavePlan('draft')} className="btn-outline" disabled={isSaving} title="Save as Draft">
                            <Save size={16} /> Save
                        </button>
                        <button onClick={() => handleSavePlan('review')} className="btn-primary" disabled={isSaving} style={{ background: 'var(--warning-color)', color: 'var(--bg-card)' }}>
                            Submit for Review
                        </button>
                        <button onClick={() => handleSavePlan('approved')} className="btn-primary" disabled={isSaving} style={{ background: 'var(--success-color)' }}>
                            <ThumbsUp size={16} /> Approve
                        </button>
                        <button onClick={() => handleSavePlan('revision')} className="btn-primary" disabled={isSaving} style={{ background: 'var(--error-color)' }}>
                            <AlertCircle size={16} /> Request Revision
                        </button>
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <Editor
                        height="100%"
                        defaultLanguage="markdown"
                        value={plan}
                        onChange={(val) => setPlan(val || "")}
                        theme="vs-dark"
                        options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
                    />
                </div>
            </div>

            <div className="chart-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} /> Discussion
                </h4>
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {comments.map(c => (
                        <div key={c.id} style={{ background: 'var(--bg-body)', padding: '0.75rem', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: 600 }}>{c.user.full_name}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{c.content}</div>
                        </div>
                    ))}
                    {comments.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No comments yet.</div>}
                </div>
                <form onSubmit={handlePostComment}>
                    <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        style={{ width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-body)' }}
                    />
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={!newComment.trim()}>Post Comment</button>
                </form>
            </div>
            </div>
        </div>
    );
};

const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showCompleted, setShowCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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

    const toggleSelection = async (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
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
                            <th style={{ padding: '1rem', width: '100px' }}>Plan</th>
                            <th style={{ padding: '1rem', width: '100px' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No tasks found. Run `joshua task sync` from CLI.</td></tr>
                        ) : (
                            filteredTasks.map(task => (
                                <tr key={task.id} 
                                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                                    onClick={() => navigate(`${task.id}`)}
                                    className="task-row"
                                >
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div
                                            onClick={(e) => toggleSelection(e, task)}
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
                                        <span className="badge" style={{ background: task.plan_status === 'approved' ? 'var(--success-color)' : (task.plan_status === 'none' ? 'var(--bg-input)' : 'var(--warning-color)'), color: task.plan_status === 'none' ? 'var(--text-secondary)' : 'white' }}>
                                            {task.plan_status || 'none'}
                                        </span>
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
    const [versions, setVersions] = useState<any[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
    const [latestVersionId, setLatestVersionId] = useState<number | null>(null);
    const [status, setStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchVersions = async () => {
        try {
            const res = await fetch('/api/requirements/versions');
            if (res.ok) {
                const data = await res.json();
                setVersions(data);
                if (data.length > 0) {
                    const latest = data[0].id;
                    setLatestVersionId(latest);
                    if (!selectedVersionId || selectedVersionId === latest) {
                        setSelectedVersionId(latest);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchVersions();
    }, []);

    useEffect(() => {
        if (!selectedVersionId) return;
        fetch(`/api/requirements?version=${selectedVersionId}`)
            .then(res => res.json())
            .then(data => {
                setContent(data.content || "");
            })
            .catch(err => console.error("Failed to load content", err));
    }, [selectedVersionId]);

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
            
            setStatus({ msg: "Version saved!", type: 'success' });
            // Refresh list. New version will be latest.
            const verRes = await fetch('/api/requirements/versions');
            if (verRes.ok) {
                const data = await verRes.json();
                setVersions(data);
                if (data.length > 0) {
                    const newLatest = data[0].id;
                    setLatestVersionId(newLatest);
                    setSelectedVersionId(newLatest);
                }
            }
        } catch (err) {
            setStatus({ msg: "Error saving.", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRevert = () => {
        if (confirm(`Revert to version v${selectedVersionId}? This will create a new version.`)) {
            handleSave();
        }
    };

    const isReadOnly = selectedVersionId !== latestVersionId;
    const canRevert = isReadOnly;

    return (
        <div style={{display: 'flex', gap: '1rem', height: '75vh'}}>
            {/* Sidebar */}
            <div className="chart-card" style={{width: '250px', padding: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column'}}>
                <div style={{padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--text-primary)', background: 'var(--bg-header)'}}>
                    Version History
                </div>
                <div style={{flex: 1, overflowY: 'auto'}}>
                    {versions.map(v => (
                        <div 
                            key={v.id}
                            onClick={() => setSelectedVersionId(v.id)}
                            style={{
                                padding: '0.75rem 1rem', 
                                cursor: 'pointer',
                                background: selectedVersionId === v.id ? 'var(--primary-light)' : 'transparent',
                                borderLeft: selectedVersionId === v.id ? '3px solid var(--primary-color)' : '3px solid transparent',
                                color: selectedVersionId === v.id ? 'var(--primary-color)' : 'var(--text-secondary)',
                                borderBottom: '1px solid var(--border-color)'
                            }}
                        >
                            <div style={{fontWeight: 600}}>v{v.id}</div>
                            <div style={{fontSize: '0.75rem', opacity: 0.8}}>
                                {new Date(v.created_at).toLocaleDateString()}
                            </div>
                            <div style={{fontSize: '0.75rem', opacity: 0.6}}>
                                {new Date(v.created_at).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Area */}
            <div className="chart-card" style={{flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                {/* Toolbar */}
                <div style={{padding: '0.75rem 1rem', background: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                        <FileCode size={16} color="var(--text-primary)" />
                        <span style={{fontWeight: 600, color: 'var(--text-primary)'}}>requirements.md</span>
                        {isReadOnly && <span className="badge" style={{background: 'var(--warning-color)', color: 'var(--bg-card)', fontSize: '0.7rem'}}>READ ONLY (v{selectedVersionId})</span>}
                    </div>
                    
                    <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                        {status && <span style={{fontSize: '0.8rem', color: status.type === 'success' ? 'var(--success-color)' : 'var(--error-color)', marginRight: '1rem'}}>{status.msg}</span>}
                        
                        <button 
                            onClick={handleRevert} 
                            className="btn-outline" 
                            disabled={!canRevert || isSaving}
                            title="Create new version from this content"
                            style={{opacity: canRevert ? 1 : 0.5}}
                        >
                            <History size={14} style={{marginRight: 4}} /> Revert
                        </button>
                        
                        <button 
                            onClick={handleSave} 
                            className="btn-primary" 
                            disabled={isReadOnly || isSaving}
                            style={{opacity: isReadOnly ? 0.5 : 1}}
                        >
                            <Save size={14} style={{marginRight: 4}} /> {isSaving ? "Saving..." : "Save Version"}
                        </button>
                    </div>
                </div>

                {/* Editor */}
                <div style={{flex: 1}}>
                    <Editor
                        height="100%"
                        defaultLanguage="markdown"
                        value={content}
                        onChange={(val) => !isReadOnly && setContent(val || "")}
                        theme="vs-dark"
                        options={{
                            readOnly: isReadOnly,
                            minimap: { enabled: false },
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            fontSize: 14,
                            fontFamily: "monospace",
                            wordWrap: "on"
                        }}
                    />
                </div>
            </div>
        </div>
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
                <Route path="tasks/:id" element={<TaskDetailView />} />
                <Route path="requirements" element={<RequirementsEditor />} />
                <Route path="/" element={<Navigate to="tasks" replace />} />
            </Routes>
        </div>
    );
};

export default DeveloperApp;