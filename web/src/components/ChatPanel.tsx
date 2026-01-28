import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import { MessageSquare, X, Send, ChevronRight, Bot } from 'lucide-react';

interface Message {
	role: 'user' | 'assistant';
	content: string;
}

interface ChatPanelProps {
	isOpen: boolean;
	onToggle: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onToggle }) => {
	const { user } = useAuth();
	const { viewContext } = useChatContext();
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		if (isOpen) scrollToBottom();
	}, [messages, isOpen]);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isTyping) return;

		const userMsg: Message = { role: 'user', content: input };
		const newMessages = [...messages, userMsg];
		setMessages(newMessages);
		setInput("");
		setIsTyping(true);

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: userMsg.content, context: viewContext }),
			});

			if (!response.ok) throw new Error("Connection lost");
			if (!response.body) throw new Error("No response body");

			// Create placeholder for assistant response
			setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						try {
							const jsonStr = line.slice(6);
							if (!jsonStr.trim()) continue;
							
							const data = JSON.parse(jsonStr);
							
							if (data.error) {
								throw new Error(data.error);
							}

							if (data.content) {
								setMessages(prev => {
									const msgs = [...prev];
									const last = msgs[msgs.length - 1];
									if (last.role === 'assistant') {
										last.content += data.content;
									}
									return msgs;
								});
							}
						} catch (e) {
							console.error("Error parsing stream chunk", e);
						}
					}
				}
			}

		} catch (err) {
			setMessages(prev => {
				const last = prev[prev.length - 1];
				if (last.role === 'assistant' && last.content === '') {
					return [...prev.slice(0, -1), { role: 'assistant', content: "ERROR: UNABLE TO ESTABLISH CONNECTION WITH JOSHUA MAINCORE." }];
				}
				return [...prev, { role: 'assistant', content: "ERROR: UNABLE TO ESTABLISH CONNECTION WITH JOSHUA MAINCORE." }];
			});
		} finally {
			setIsTyping(false);
		}
	};

    if (!user) return null;

    return (
        <div style={{
            position: 'fixed',
            right: 0,
            top: '64px', // Below header
            bottom: 0,
            width: isOpen ? '400px' : '0px',
            background: 'var(--bg-card)',
            borderLeft: isOpen ? '1px solid var(--border-color)' : 'none',
            transition: 'width 0.3s ease-in-out',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isOpen ? '-5px 0 15px rgba(0,0,0,0.2)' : 'none'
        }}>
            {/* Toggle Handle */}
            <button 
                onClick={onToggle}
                style={{
                    position: 'absolute',
                    left: '-48px',
                    top: '20px',
                    width: '48px',
                    height: '48px',
                    background: 'var(--primary-color)',
                    color: 'var(--primary-text)',
                    border: 'none',
                    borderRadius: '8px 0 0 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)'
                }}
            >
                {isOpen ? <ChevronRight size={24} /> : <MessageSquare size={24} />}
            </button>

            {/* Chat Content */}
            {isOpen && (
                <>
                    {/* Header */}
                    <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-header)'
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <Bot size={20} color="var(--text-primary)" />
                            <span style={{fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '1px'}}>JOSHUA_CORE</span>
                        </div>
                        <button onClick={onToggle} style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'}}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {messages.length === 0 && (
                            <div style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem', fontSize: '0.9rem', opacity: 0.7}}>
                                <p>JOSHUA TERMINAL ONLINE.</p>
                                <p>AWAITING INPUT...</p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                background: m.role === 'user' ? 'var(--primary-color)' : 'var(--bg-body)',
                                color: m.role === 'user' ? 'var(--primary-text)' : 'var(--text-body)',
                                border: m.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                                fontSize: '0.95rem',
                                whiteSpace: 'pre-line'
                            }}>
                                {m.content}
                            </div>
                        ))}
                        {isTyping && messages[messages.length-1].role !== 'assistant' && (
                            <div style={{alignSelf: 'flex-start', color: 'var(--text-primary)', fontSize: '0.8rem'}}>
                                ANALYZING...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} style={{
                        padding: '1rem',
                        borderTop: '1px solid var(--border-color)',
                        background: 'var(--bg-header)',
                        display: 'flex',
                        gap: '0.5rem'
                    }}>
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Send message to JOSHUA..."
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: '4px',
                                border: '1px solid var(--border-input)',
                                background: 'var(--bg-input)',
                                color: 'var(--text-body)',
                                fontSize: '0.9rem'
                            }}
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            style={{
                                background: 'var(--primary-color)',
                                color: 'var(--primary-text)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0 1rem',
                                cursor: 'pointer'
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default ChatPanel;