import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Minimize2, Maximize2, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch, safeJson } from "@/utils/authFetch";
import { adminApi } from "@/api/adminApi";
import { safeFormatDistanceToNow } from "@/utils/dateUtils";
import { UserAvatar } from "../common/UserAvatar";

interface ChatMessage {
    id?: number;
    senderId?: number;
    senderName: string;
    senderProfileImageUrl?: string;
    message: string;
    timestamp: string;
    seen: boolean;
}

export function ChatWidget(): React.ReactElement | null {
    const { user } = useAuth();
    const { client, isConnected } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeTab, setActiveTab] = useState<"department" | "admin">("department");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const chatId = activeTab === "department" ? "department" : "1";

    useEffect(() => {
        if (!client || !isConnected || !user) return;

        const deptTopic = `/topic/department/${user.departmentId}`;
        const userTopic = `/topic/chat/user/${user.id}`;

        const handleMessage = (msg: any) => {
            const newMsg = JSON.parse(msg.body);
            // Only add if relevant to current tab
            // For department tab: must match department topic (implicit if we filter by source or just add)
            // For admin tab: must be private message

            // Simplification: Add to messages if current tab matches context
            // If activeTab is department, and message has departmentId, add it.
            // If activeTab is admin, and message is private (isAdminHelp=true or receiverId=user.id), add it.

            if (activeTab === "department" && newMsg.departmentId == user.departmentId) {
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                scrollToBottom();
            } else if (activeTab === "admin" && (newMsg.isAdminHelp || newMsg.senderId === user.id || newMsg.receiverId === user.id)) { // senderId check is for self-sent sync
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                scrollToBottom();
            }
        };

        const deptSub = client.subscribe(deptTopic, handleMessage);
        const userSub = client.subscribe(userTopic, handleMessage);

        return () => {
            deptSub.unsubscribe();
            userSub.unsubscribe();
        };
    }, [client, isConnected, user, activeTab]);

    useEffect(() => {
        if (isOpen) {
            loadChatHistory();
            const interval = setInterval(loadChatHistory, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen, activeTab]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const loadChatHistory = async () => {
        try {
            const res = await authFetch(`/api/chat/${chatId}/messages`);
            if (res.ok) {
                const data = await safeJson(res);
                const fetchedMessages = data?.messages || [];
                // Only update if data changed to avoid flash
                if (JSON.stringify(fetchedMessages) !== JSON.stringify(messages)) {
                    setMessages(fetchedMessages);
                }
            }
        } catch (error) {
            console.error("Failed to load chat history", error)
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        try {
            const res = await authFetch(`/api/chat/${chatId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: inputText })
            });
            if (res.ok) {
                setInputText("");
                loadChatHistory();
            }
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleDeleteMessage = async (messageId: number) => {
        try {
            setMessages(prev => prev.filter(m => m.id !== messageId));
            await adminApi.deleteMessage(messageId);
        } catch (error) {
            console.error("Failed to delete message", error);
        }
    };

    if (!user || user.role === "ADMIN") return null;

    if (!isOpen) {
        return (
            <Button
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-all hover:scale-110 bg-primary"
                onClick={() => setIsOpen(true)}
            >
                <MessageCircle className="h-6 w-6" />
            </Button>
        );
    }

    return (
        <Card className={`fixed right-6 z-50 shadow-2xl transition-all duration-300 flex flex-col ${isMinimized ? "bottom-6 h-14 w-72" : "bottom-6 h-[520px] w-80 md:w-96"
            }`}>
            <CardHeader className="p-0 border-b bg-primary text-primary-foreground rounded-t-lg overflow-hidden shrink-0">
                <div className="p-3 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <CardTitle className="text-sm font-medium">Communication</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-white/20" onClick={() => setIsMinimized(!isMinimized)}>
                            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-white/20" onClick={() => setIsOpen(false)}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                {!isMinimized && (
                    <div className="flex bg-primary/20 p-1 mx-2 mb-2 rounded-lg">
                        <button
                            className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${activeTab === 'department' ? 'bg-white text-primary shadow-sm' : 'text-primary-foreground/70 hover:text-primary-foreground'}`}
                            onClick={() => setActiveTab('department')}
                        >
                            DEPARTMENT
                        </button>
                        <button
                            className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${activeTab === 'admin' ? 'bg-white text-primary shadow-sm' : 'text-primary-foreground/70 hover:text-primary-foreground'}`}
                            onClick={() => setActiveTab('admin')}
                        >
                            ADMIN HELP
                        </button>
                    </div>
                )}
            </CardHeader>

            {!isMinimized && (
                <>
                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col bg-[#efeae2] dark:bg-gray-900">
                        <ScrollArea className="flex-1 p-4">
                            <div className="flex flex-col gap-3">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.senderId === user.id;
                                    return (
                                        <div
                                            key={msg.id || idx}
                                            className={`flex gap-2 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"} group items-end mb-2`}
                                        >
                                            {!isMe && (
                                                <UserAvatar
                                                    firstName={msg.senderName}
                                                    lastName=""
                                                    imageUrl={msg.senderProfileImageUrl}
                                                    size="sm"
                                                    className="h-8 w-8 shrink-0 rounded-full border shadow-sm"
                                                />
                                            )}
                                            <div className="space-y-1 relative">
                                                {!isMe && idx > 0 && messages[idx - 1]?.senderId !== msg.senderId && (
                                                    <p className="text-[10px] text-muted-foreground ml-1 font-semibold mb-1">
                                                        {msg.senderName}
                                                    </p>
                                                )}
                                                <div
                                                    className={`p-3 rounded-2xl text-sm shadow-sm relative group-hover:shadow-md transition-all ${isMe
                                                        ? "bg-[#d9fdd3] text-gray-900 rounded-tr-none dark:bg-green-700 dark:text-white"
                                                        : "bg-white text-gray-900 rounded-tl-none border border-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                                                        } `}
                                                >
                                                    <p className="leading-relaxed whitespace-pre-wrap pr-4 pb-2">{msg.message}</p>
                                                    <div className={`flex items-center justify-end gap-1 mt-[-6px] `}>
                                                        <span className={`text-[10px] ${isMe ? "text-gray-500 dark:text-gray-300" : "text-gray-400"}`}>
                                                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                                        </span>
                                                        {isMe && (msg.seen ? <span className="text-blue-500 text-[10px] font-bold">✓✓</span> : <span className="text-gray-400 text-[10px] font-bold">✓</span>)}
                                                    </div>

                                                    {/* Delete Menu */}
                                                    {msg.id && (
                                                        <div className={`absolute top-0 ${isMe ? "-left-10" : "-right-10"} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 hover:bg-background shadow-sm">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align={isMe ? "end" : "start"}>
                                                                    <DropdownMenuItem className="text-destructive focus:text-destructive text-xs cursor-pointer" onClick={() => handleDeleteMessage(msg.id!)}>
                                                                        <Trash2 className="mr-2 h-3 w-3" />
                                                                        Delete for me
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <div className="p-3 border-t bg-background mt-auto shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendMessage();
                            }}
                            className="flex gap-2"
                        >
                            <Input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={activeTab === 'admin' ? "Ask Admin..." : "Message Department..."}
                                className="flex-1 bg-muted/30 border-none focus-visible:ring-1"
                            />
                            <Button type="submit" size="icon" disabled={!inputText.trim()} className="shrink-0">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </>
            )}
        </Card>
    );
}
