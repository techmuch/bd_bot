import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Save, History, FileText } from 'lucide-react';

interface Version {
    id: number;
    created_at: string;
}

interface MarkdownEditorProps {
    initialContent: string;
    onSave: (content: string) => Promise<void>;
    versions: Version[];
    onLoadVersion: (id: number) => Promise<string>;
    title: string;
    icon?: React.ReactNode;
    height?: string;
    readOnly?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
    initialContent, 
    onSave, 
    versions, 
    onLoadVersion, 
    title,
    icon = <FileText size={16} />,
    height = "500px",
    readOnly = false 
}) => {
    const [content, setContent] = useState(initialContent);
    const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
    const [latestVersionId, setLatestVersionId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // Sync versions and determine latest
    useEffect(() => {
        if (versions.length > 0) {
            const latest = versions[0].id;
            setLatestVersionId(latest);
            // If no selection yet, select latest
            if (!selectedVersionId) {
                setSelectedVersionId(latest);
            } else if (selectedVersionId === latestVersionId && latest !== latestVersionId) {
                // If we were on latest and a new version appeared, switch to new latest
                setSelectedVersionId(latest);
            }
        }
    }, [versions]);

    // Handle external content updates (e.g. initial fetch)
    useEffect(() => {
        if (selectedVersionId === latestVersionId) {
            setContent(initialContent);
        }
    }, [initialContent]);

    // Load content when specific version selected
    useEffect(() => {
        if (!selectedVersionId) return;
        
        // If selecting latest, we might want to stick with current edit state?
        // But for "Version History" behavior, clicking "vX" usually loads that snapshot.
        // We'll trust onLoadVersion to fetch even for latest, or optimize in parent.
        // Actually, if we are editing, we don't want to overwrite with saved latest.
        // BUT if user clicks v(Latest) in sidebar, they probably expect to reset to that version.
        
        onLoadVersion(selectedVersionId).then(val => {
            setContent(val);
        }).catch(console.error);
        
    }, [selectedVersionId, onLoadVersion]);

    const handleSave = async () => {
        setIsSaving(true);
        setStatus(null);
        try {
            await onSave(content);
            setStatus({ msg: "Saved!", type: 'success' });
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

    const isLocked = readOnly || (selectedVersionId !== null && selectedVersionId !== latestVersionId);
    const canRevert = isLocked && !readOnly; // Can revert if looking at old version and not globally readonly

    return (
        <div style={{ display: 'flex', gap: '1rem', height: height }}>
            {/* Sidebar */}
            <div className="chart-card" style={{ width: '200px', padding: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--text-primary)', background: 'var(--bg-header)', fontSize: '0.9rem' }}>
                    Version History
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
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
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>v{v.id}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                {new Date(v.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Editor */}
            <div className="chart-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Toolbar */}
                <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {icon}
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
                        {isLocked && <span className="badge" style={{ background: 'var(--warning-color)', color: 'var(--bg-card)', fontSize: '0.7rem' }}>READ ONLY (v{selectedVersionId})</span>}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {status && <span style={{ fontSize: '0.8rem', color: status.type === 'success' ? 'var(--success-color)' : 'var(--error-color)', marginRight: '1rem' }}>{status.msg}</span>}
                        
                        <button 
                            onClick={handleRevert} 
                            className="btn-outline" 
                            disabled={!canRevert || isSaving}
                            title="Create new version from this content"
                            style={{ opacity: canRevert ? 1 : 0.5, padding: '4px 8px', fontSize: '0.8rem' }}
                        >
                            <History size={14} style={{ marginRight: 4 }} /> Revert
                        </button>
                        
                        <button 
                            onClick={handleSave} 
                            className="btn-primary" 
                            disabled={isLocked || isSaving}
                            style={{ opacity: isLocked ? 0.5 : 1, padding: '4px 8px', fontSize: '0.8rem' }}
                        >
                            <Save size={14} style={{ marginRight: 4 }} /> {isSaving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <Editor
                        height="100%"
                        defaultLanguage="markdown"
                        value={content}
                        onChange={(val) => !isLocked && setContent(val || "")}
                        theme="vs-dark"
                        options={{
                            readOnly: isLocked,
                            minimap: { enabled: false },
                            lineNumbers: "on",
                            fontSize: 14,
                            wordWrap: "on"
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default MarkdownEditor;
