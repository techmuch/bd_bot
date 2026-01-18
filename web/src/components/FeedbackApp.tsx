import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeedbackApp: React.FC = () => {
    const { user } = useAuth();
    const [appName, setAppName] = useState("BD_Bot");
    const [viewName, setViewName] = useState("Landing Page");
    const [content, setContent] = useState("");
    const [status, setStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const apps = ["BD_Bot", "Feedback App", "Developer Tools"];
    const views = ["Landing Page", "Library", "Inbox", "Detail View", "Profile", "Login"];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ app_name: appName, view_name: viewName, content }),
            });

            if (!res.ok) throw new Error("Failed to submit feedback");

            setStatus({ msg: "Feedback submitted successfully!", type: 'success' });
            setContent("");
        } catch (err: any) {
            setStatus({ msg: "Error submitting feedback.", type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return <div>Please login to submit feedback.</div>;

    return (
        <div style={{maxWidth: '600px', margin: '0 auto', padding: '2rem'}}>
            <Link to="/" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7f8c8d', textDecoration: 'none', marginBottom: '2rem'}}>
                <ArrowLeft size={16} /> Back to Hub
            </Link>

            <div className="chart-card">
                <h2 style={{marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem'}}>Provide Feedback</h2>
                
                <form onSubmit={handleSubmit}>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'}}>
                        <div>
                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>Application</label>
                            <select 
                                className="search-input"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                style={{border: '1px solid #ddd', padding: '0.75rem', borderRadius: '4px', width: '100%'}}
                            >
                                {apps.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>View / Context</label>
                            <select 
                                className="search-input"
                                value={viewName}
                                onChange={(e) => setViewName(e.target.value)}
                                style={{border: '1px solid #ddd', padding: '0.75rem', borderRadius: '4px', width: '100%'}}
                            >
                                {views.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{marginBottom: '1.5rem'}}>
                        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>Feedback & Suggestions</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Describe your issue or idea..."
                            style={{
                                width: '100%', height: '150px', padding: '1rem', 
                                border: '1px solid #ddd', borderRadius: '4px', 
                                fontFamily: 'inherit', fontSize: '1rem', boxSizing: 'border-box'
                            }}
                            required
                        />
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

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={isSubmitting}
                        style={{width: '100%', justifyContent: 'center'}}
                    >
                        <Send size={18} /> Submit Feedback
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FeedbackApp;
