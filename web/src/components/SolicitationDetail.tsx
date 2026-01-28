import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import type { Solicitation } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePageContext } from '../context/ChatContext';
import { ArrowLeft, ExternalLink, FileText, User, Star, Flag, Share2, Archive, X } from 'lucide-react';

interface Claim {
	id: number;
	user_id: number;
	solicitation_id: number;
	claim_type: 'interested' | 'lead';
	created_at: string;
	archived: boolean;
	user: {

        id: number;
        full_name: string;
        email: string;
        avatar_url?: string;
        organization_name?: string;
    };
}

interface Comment {
    id: number;
    user_id: number;
    content: string;
    created_at: string;
    user_full_name: string;
    user_avatar_url: string;
}

interface SolicitationDetail extends Solicitation {
    claims: Claim[];
    comments: Comment[];
}

const SolicitationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [solicitation, setSolicitation] = useState<SolicitationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareEmail, setShareEmail] = useState("");
    const [shareMessage, setShareMessage] = useState("");

    const location = useLocation();
    const backState = location.state as { from?: string } | null;

    let backLink = "/library";
    let backText = "Back to Library";

    if (backState?.from === 'inbox') {
        backLink = "/inbox";
        backText = "Back to Inbox";
    }

    const fetchDetail = async () => {
        try {
            const res = await fetch(`/api/solicitations/${id}`);
            if (!res.ok) throw new Error("Failed to fetch solicitation");
            const data = await res.json();
            setSolicitation(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsPosting(true);
        try {
            const res = await fetch(`/api/solicitations/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            if (res.ok) {
                setNewComment("");
                fetchDetail();
            }
        } finally {
            setIsPosting(false);
        }
    };

    const handleArchive = async () => {
        const myClaim = solicitation?.claims?.find(c => c.user_id === user?.id);
        const isArchived = myClaim?.archived || false;
        try {
            const res = await fetch(`/api/solicitations/${id}/archive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archived: !isArchived }),
            });
            if (res.ok) fetchDetail();
        } catch (err) { console.error(err); }
    };

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/solicitations/${id}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: shareEmail, message: shareMessage }),
            });
            if (res.ok) {
                alert("Shared successfully!");
                setShareModalOpen(false);
                setShareEmail("");
                setShareMessage("");
            }
        } catch (err) { console.error(err); }
    };

    const handleClaim = async (type: 'interested' | 'lead' | 'none') => {
        if (!user) return;
        try {
            const res = await fetch(`/api/solicitations/${id}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });
            if (res.ok) {
                fetchDetail(); // Refresh to show updates
            }
        } catch (err) {
            console.error("Claim failed", err);
        }
    };

    if (loading) return <div className="loading">Loading details...</div>;
    if (error || !solicitation) return <div className="error">Error: {error || "Solicitation not found"}</div>;

    const claims = solicitation.claims || [];
    const leadClaim = claims.find(c => c.claim_type === 'lead');
    const interestedClaims = claims.filter(c => c.claim_type === 'interested');

    const myClaim = claims.find(c => c.user_id === user?.id);
    const isLead = myClaim?.claim_type === 'lead';
    const isInterested = myClaim?.claim_type === 'interested';
    const isArchived = myClaim?.archived || false;

    const contextStr = solicitation ? `Viewing Solicitation: ${solicitation.title} (${solicitation.agency}). Status: Lead=${leadClaim?.user.full_name || 'None'}.` : "Loading solicitation...";
    usePageContext(contextStr);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <Link to={backLink} className="btn-link" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>
                    <ArrowLeft size={16} /> {backText}
                </Link>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {/* Header */}
                <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <span className="badge" style={{ background: 'var(--primary-color)', color: 'var(--primary-text)', marginBottom: '0.5rem', display: 'inline-block' }}>
                                {solicitation.agency}
                            </span>
                            <h1 style={{ margin: '0.5rem 0', color: 'var(--text-primary)', fontSize: '1.8rem' }}>{solicitation.title}</h1>
                            <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                                <span>Due: {new Date(solicitation.due_date).toLocaleDateString()}</span>
                                <span>Source ID: {solicitation.source_id}</span>
                            </div>
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button onClick={() => setShareModalOpen(true)} className="btn-outline" title="Share">
                                <Share2 size={16} />
                            </button>
                            <button onClick={handleArchive} className="btn-outline" title={isArchived ? "Unarchive" : "Archive"}>
                                <Archive size={16} color={isArchived ? 'var(--primary-color)' : 'currentColor'} />
                            </button>
                            <a href={solicitation.url} target="_blank" rel="noreferrer" className="btn-primary">
                                Original Source <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Team Status Bar */}
                <div style={{ padding: '1.5rem', background: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>Current Lead</span>
                            {leadClaim ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {leadClaim.user.avatar_url ? (
                                        <img src={leadClaim.user.avatar_url} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                                    ) : <User size={24} color="var(--text-primary)" />}
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{leadClaim.user.full_name}</span>
                                    {leadClaim.user.organization_name && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({leadClaim.user.organization_name})</span>}
                                </div>
                            ) : (
                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.7 }}>No lead assigned</span>
                            )}
                        </div>

                        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                            <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>Interested Parties</span>
                            {interestedClaims.length > 0 ? (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {interestedClaims.map(c => (
                                        <div key={c.id} title={c.user.full_name} style={{
                                            width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--primary-color)', border: '2px solid var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}>
                                            {c.user.avatar_url ? (
                                                <img src={c.user.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{c.user.full_name.charAt(0)}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : <span style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>None yet</span>}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => handleClaim(isInterested ? 'none' : 'interested')}
                            className={isInterested ? "btn-primary" : "btn-outline"}
                            style={isInterested ? { background: 'var(--warning-color)', borderColor: 'var(--warning-color)', color: 'white' } : {}}
                        >
                            <Star size={16} fill={isInterested ? "white" : "none"} />
                            {isInterested ? "Interested" : "Mark Interest"}
                        </button>

                        <button
                            onClick={() => handleClaim(isLead ? 'none' : 'lead')}
                            className={isLead ? "btn-primary" : "btn-outline"}
                            disabled={!!leadClaim && !isLead} // Disable if someone else is lead
                            title={!!leadClaim && !isLead ? `Lead taken by ${leadClaim.user.full_name}` : ""}
                        >
                            <Flag size={16} fill={isLead ? "white" : "none"} />
                            {isLead ? "Lead Owner" : "Take Lead"}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Description</h3>
                    <p style={{ lineHeight: 1.6, color: 'var(--text-body)', whiteSpace: 'pre-line' }}>
                        {solicitation.description || "No description provided."}
                    </p>

                    <h3 style={{ marginTop: '2rem', color: 'var(--text-primary)' }}>Documents</h3>
                    {solicitation.documents?.length > 0 ? (
                        <ul className="doc-grid">
                            {solicitation.documents.map((doc, idx) => (
                                <li key={idx}>
                                    <a href={doc.url} target="_blank" rel="noreferrer" className="doc-link">
                                        <FileText size={16} /> {doc.title || "File"}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-muted">No documents found.</p>}
                </div>

                {/* Comments */}
                <div style={{ padding: '2rem', borderTop: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Comments</h3>
                    
                    <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {solicitation.comments?.map(comment => (
                            <div key={comment.id} style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-input)', overflow: 'hidden', flexShrink: 0}}>
                                    {comment.user_avatar_url ? (
                                        <img src={comment.user_avatar_url} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                    ) : (
                                        <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                            <User size={16} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div style={{marginBottom: '0.25rem'}}>
                                        <span style={{fontWeight: 600, marginRight: '0.5rem', color: 'var(--text-primary)'}}>{comment.user_full_name}</span>
                                        <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{new Date(comment.created_at).toLocaleString()}</span>
                                    </div>
                                    <div style={{color: 'var(--text-body)', lineHeight: 1.5}}>{comment.content}</div>
                                </div>
                            </div>
                        ))}
                        {(!solicitation.comments || solicitation.comments.length === 0) && (
                            <p className="text-muted">No comments yet.</p>
                        )}
                    </div>

                    {user && (
                        <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '1rem' }}>
                            <textarea 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', minHeight: '80px', color: 'var(--text-body)' }}
                            />
                            <button type="submit" className="btn-primary" disabled={isPosting || !newComment.trim()} style={{ height: 'fit-content' }}>
                                Post
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {shareModalOpen && (
                <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                    <div className="chart-card" style={{width: '400px', padding: '2rem'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                            <h3>Share Opportunity</h3>
                            <button onClick={() => setShareModalOpen(false)} style={{background: 'none', border: 'none', cursor: 'pointer'}}><X size={20}/></button>
                        </div>
                        <form onSubmit={handleShare}>
                            <div style={{marginBottom: '1rem'}}>
                                <label style={{display: 'block', marginBottom: '0.5rem'}}>Email Address</label>
                                <input type="email" required value={shareEmail} onChange={e => setShareEmail(e.target.value)} style={{width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-body)'}} />
                            </div>
                            <div style={{marginBottom: '1rem'}}>
                                <label style={{display: 'block', marginBottom: '0.5rem'}}>Message (Optional)</label>
                                <textarea value={shareMessage} onChange={e => setShareMessage(e.target.value)} style={{width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-body)'}} />
                            </div>
                            <button type="submit" className="btn-primary" style={{width: '100%', justifyContent: 'center'}}>Share</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SolicitationDetail;