import React, { createContext, useContext, useState } from 'react';

interface ChatContextType {
    viewContext: string;
    setViewContext: (ctx: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [viewContext, setViewContext] = useState("");
    return (
        <ChatContext.Provider value={{ viewContext, setViewContext }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChatContext must be used within ChatProvider");
    return context;
};

export const usePageContext = (context: string) => {
    const { setViewContext } = useChatContext();
    React.useEffect(() => {
        setViewContext(context);
        return () => setViewContext(""); // Clear on unmount
    }, [context, setViewContext]);
};
