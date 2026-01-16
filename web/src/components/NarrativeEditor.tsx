import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save } from 'lucide-react';

const NarrativeEditor: React.FC = () => {
    const { user } = useAuth(); // We might need a better way to update user in context
    const [narrative, setNarrative] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (user) {
            setNarrative(user.narrative || "");
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/user/narrative', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ narrative }),
            });

            if (!res.ok) throw new Error("Failed to save narrative");

            setMessage({ text: "Narrative saved successfully!", type: 'success' });
            
            // Reload user to update context
            // In a real app, we'd have a specific updateUser method
            // For now, we rely on the fact that next load will get it, 
            // or we could force a reload. 
            // Let's rely on the user refreshing for now or the fact that local state is updated.
        } catch (err) {
            setMessage({ text: "Error saving narrative.", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (!user) return <div>Please login to edit your narrative.</div>;

    return (
        <div className="solicitation-list narrative-container">
            <h2>Business Capability Narrative</h2>
            <p className="text-muted" style={{marginBottom: '1rem'}}>
                Describe your company's core competencies, past performance, and value proposition. 
                The AI will use this narrative to find the best matching opportunities for you.
            </p>
            
            <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                className="narrative-textarea"
                placeholder="e.g., We are a specialized IT consulting firm focused on cloud migration and cybersecurity..."
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                    onClick={handleSave} 
                    className="btn-primary" 
                    disabled={saving}
                    style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.6rem 1.2rem',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        opacity: saving ? 0.7 : 1
                    }}
                >
                    <Save size={18} /> {saving ? "Saving..." : "Save Narrative"}
                </button>
                
                {message && (
                    <span style={{ color: message.type === 'success' ? '#27ae60' : '#e74c3c' }}>
                        {message.text}
                    </span>
                )}
            </div>
        </div>
    );
};

export default NarrativeEditor;
