import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Client, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    client: Client | null;
    isConnected: boolean;
    sendChat: (destination: string, body: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [client, setClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user || client) return;

        let socket;
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
            socket = new SockJS(`${baseUrl}/ws`);
        } catch (e) {
            console.error("SocketInit Error", e);
            return;
        }

        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            debug: (str) => {
                console.log(str);
            },
            onConnect: (frame) => {
                console.log('Connected: ' + frame);
                setIsConnected(true);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            onDisconnect: () => {
                setIsConnected(false);
            }
        });

        stompClient.activate();
        setClient(stompClient);

        return () => {
            if (stompClient) {
                stompClient.deactivate();
            }
        };
    }, [user]);

    const sendChat = (destination: string, body: any) => {
        if (client && isConnected) {
            client.publish({
                destination: destination,
                body: JSON.stringify(body),
            });
        }
    };

    return (
        <SocketContext.Provider value={{ client, isConnected, sendChat }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
