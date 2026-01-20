import React, { useState, useEffect } from 'react';

interface Project {
    id: number;
    title: string;
    description: string;
    sco_title: string;
    pi_name: string;
    status: string;
    total_budget: number;
}

const ReviewerPortal: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [scores, setScores] = useState({ technical: 5, strategic: 5, transition: 5 });
    const [comments, setComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetch('/api/irad/projects')
            .then(res => res.json())
            .then(data => setProjects(data || []));
    }, []);

    const submitReview = async () => {
        if (!selectedProject) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/irad/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: selectedProject.id,
                    technical_merit: scores.technical,
                    strategic_alignment: scores.strategic,
                    transition_potential: scores.transition,
                    comments,
                    status: 'submitted'
                }),
            });
            if (res.ok) {
                alert("Review submitted successfully!");
                setComments("");
                setScores({ technical: 5, strategic: 5, transition: 5 });
                setSelectedProject(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{display: 'flex', gap: '2rem', height: '80vh'}}>
            <div style={{flex: 1, overflowY: 'auto'}}>
                <h2 style={{color: 'var(--text-primary)', marginTop: 0}}>Review Queue</h2>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    {projects.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => setSelectedProject(p)}
                            className="chart-card"
                            style={{
                                padding: '1.5rem', 
                                cursor: 'pointer', 
                                border: selectedProject?.id === p.id ? '2px solid var(--primary-color)' : '1px solid transparent'
                            }}
                        >
                            <h3 style={{margin: '0 0 0.5rem 0', color: 'var(--text-primary)'}}>{p.title}</h3>
                            <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                                SCO: {p.sco_title} | PI: {p.pi_name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedProject ? (
                <div className="chart-card" style={{width: '400px', display: 'flex', flexDirection: 'column'}}>
                    <h3 style={{marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem'}}>
                        Scorecard
                    </h3>
                    
                    <div style={{flex: 1, overflowY: 'auto', paddingRight: '0.5rem'}}>
                        <div style={{marginBottom: '1.5rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Technical Merit (1-10)</label>
                            <input 
                                type="range" min="1" max="10" 
                                value={scores.technical} 
                                onChange={(e) => setScores({...scores, technical: parseInt(e.target.value)})}
                                style={{width: '100%'}}
                            />
                            <div style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)'}}>{scores.technical}/10</div>
                        </div>

                        <div style={{marginBottom: '1.5rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Strategic Alignment</label>
                            <input 
                                type="range" min="1" max="10" 
                                value={scores.strategic} 
                                onChange={(e) => setScores({...scores, strategic: parseInt(e.target.value)})}
                                style={{width: '100%'}}
                            />
                            <div style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)'}}>{scores.strategic}/10</div>
                        </div>

                        <div style={{marginBottom: '1.5rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Transition Potential</label>
                            <input 
                                type="range" min="1" max="10" 
                                value={scores.transition} 
                                onChange={(e) => setScores({...scores, transition: parseInt(e.target.value)})}
                                style={{width: '100%'}}
                            />
                            <div style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-color)'}}>{scores.transition}/10</div>
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>Comments</label>
                            <textarea 
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                style={{width: '100%', height: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-input)', background: 'var(--bg-input)', color: 'var(--text-body)'}}
                                placeholder="Strengths, weaknesses, recommendations..."
                            />
                        </div>
                    </div>

                    <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto'}}>
                        <button 
                            onClick={submitReview} 
                            className="btn-primary" 
                            style={{width: '100%', justifyContent: 'center'}}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Scorecard"}
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{width: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', border: '2px dashed var(--border-color)', borderRadius: '8px'}}>
                    Select a project to review
                </div>
            )}
        </div>
    );
};

export default ReviewerPortal;
