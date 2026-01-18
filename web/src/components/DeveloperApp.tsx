import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, ArrowLeft, History, FileCode } from 'lucide-react';
import { Link } from 'react-router-dom';

const DeveloperApp: React.FC = () => {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const [initialContent, setInitialContent] = useState("");
    const [versionId, setVersionId] = useState<number | null>(null);
    const [status, setStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
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
            // Refresh version info?
            // fetchLatest...
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

    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
        return <div style={{padding: '2rem', textAlign: 'center'}}>Access Denied. Developer role required.</div>;
    }

    return (
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '2rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <Link to="/" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7f8c8d', textDecoration: 'none'}}>
                    <ArrowLeft size={16} /> Back to Hub
                </Link>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    {versionId && <span style={{color: '#7f8c8d', fontSize: '0.9rem'}}>Current Version: v{versionId}</span>}
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
                    backgroundColor: status.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: status.type === 'success' ? '#155724' : '#721c24'
                }}>
                    {status.msg}
                </div>
            )}

            <div className="chart-card" style={{padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '70vh'}}>
                <div style={{padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                    <FileCode size={16} color="#34495e" />
                    <span style={{fontWeight: 600, color: '#2c3e50'}}>requirements.md</span>
                </div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{
                        flex: 1, width: '100%', padding: '1.5rem', 
                        border: 'none', resize: 'none', 
                        fontFamily: 'monospace', fontSize: '1rem', lineHeight: '1.6',
                        background: '#fff', color: '#333', outline: 'none'
                    }}
                    spellCheck={false}
                />
            </div>
        </div>
    );
};

export default DeveloperApp;
