import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, User } from 'lucide-react';

export const LoginButton: React.FC = () => {
    const { user, login, logout, isLoading } = useAuth();

    const handleLogin = () => {
        // Mock Login
        login("demo@example.com", "Demo User");
    };

    if (isLoading) return <div className="text-muted">...</div>;

    if (user) {
        return (
            <div className="user-menu" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <span className="user-name" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500}}>
                    <User size={18} />
                    {user.full_name}
                </span>
                <button 
                    onClick={logout} 
                    className="btn-outline"
                    style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.4rem 0.8rem',
                        background: 'transparent',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>
        );
    }

    return (
        <button 
            onClick={handleLogin} 
            className="btn-primary"
            style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500
            }}
        >
            <LogIn size={16} /> Login (Mock)
        </button>
    );
};
