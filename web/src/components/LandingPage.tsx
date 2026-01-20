import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid, MessageSquare, Code } from 'lucide-react';

const LandingPage: React.FC = () => {
    const { user } = useAuth();

    const apps = [
        {
            name: "BD_Bot",
            description: "Government solicitation intelligence and pursuit management.",
            icon: <LayoutGrid size={32} />,
            link: "/library",
            color: "#3498db"
        },
        {
            name: "Feedback",
            description: "Submit bug reports, feature requests, or general feedback.",
            icon: <MessageSquare size={32} />,
            link: "/feedback",
            color: "#27ae60"
        }
    ];

    if (user?.role === 'admin' || user?.role === 'developer') {
        apps.push({
            name: "Developer Tools",
            description: "Manage system requirements and configuration.",
            icon: <Code size={32} />,
            link: "/developer/tasks",
            color: "#e74c3c"
        });
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', color: 'var(--bg-logo-text)', marginBottom: '0.5rem' }}>
                    GREETINGS, {(user?.full_name || 'USER').toUpperCase()}. SHALL WE WORK?
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Select an application to launch</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '2rem'
            }}>
                {apps.map((app) => (
                    <Link to={app.link} key={app.name} style={{ textDecoration: 'none' }}>
                        <div className="chart-card" style={{
                            padding: '2rem',
                            textAlign: 'center',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            borderTop: `4px solid ${app.color}`
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{
                                background: `${app.color}20`,
                                color: app.color,
                                padding: '1rem',
                                borderRadius: '50%',
                                marginBottom: '1rem'
                            }}>
                                {app.icon}
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{app.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{app.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default LandingPage;
