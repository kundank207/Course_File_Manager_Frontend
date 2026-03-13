import React, { useState, useEffect, useRef } from "react";
import { Search, Send, Circle, MessageSquare, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { adminApi } from "@/api/adminApi";
import { notificationApi } from "@/api/notificationApi";
import { safeFormatDistanceToNow } from "@/utils/dateUtils";
import { UserAvatar } from "@/components/common/UserAvatar";

export default function AdminChat() {
    const { user } = useAuth();
    const { client, isConnected } = useSocket();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Fetch teachers list
    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const data = await adminApi.getChatTeachers();
                setTeachers(data);
            } catch (error) {
                console.error("Failed to fetch teachers", error);
            }
        };

        fetchTeachers();
    }, []);

    // Fetch chat history when teacher is selected
    useEffect(() => {
        if (!selectedTeacher) return;

        const loadChat = async () => {
            setIsLoading(true);
            try {
                const data = await adminApi.getChatHistory(selectedTeacher.id);
                setMessages(data);
                // Mark as seen
                await adminApi.markChatAsSeen(selectedTeacher.id);

                // Update local counts
                setTeachers(prev => prev.map(t =>
                    t.id === selectedTeacher.id ? { ...t, unreadCount: 0 } : t
                ));
            } catch (error) {
                console.error("Failed to load chat", error);
            } finally {
                setIsLoading(false);
                setTimeout(scrollToBottom, 100);
            }
        };

        loadChat();

        // Setup polling
        const interval = setInterval(loadChat, 5000);
        return () => clearInterval(interval);
    }, [selectedTeacher]);

    // WebSocket subscription for new messages
    useEffect(() => {
        if (!client || !isConnected || !user) return;

        const topic = `/topic/chat/user/${user.id}`;
        const subscription = client.subscribe(topic, (messageBody) => {
            const newMsg = JSON.parse(messageBody.body);

            // If message is from current selected teacher, add to messages
            if (selectedTeacher && (newMsg.senderId === selectedTeacher.id || newMsg.senderId === user.id)) {
                setMessages(prev => {
                    const exists = prev.some(m => m.id === newMsg.id);
                    if (exists) return prev;
                    return [...prev, newMsg];
                });
                scrollToBottom();
                if (newMsg.senderId === selectedTeacher.id) {
                    adminApi.markChatAsSeen(selectedTeacher.id);
                }
            } else {
                setTeachers(prev => prev.map(t =>
                    t.id === newMsg.senderId ? { ...t, unreadCount: (t.unreadCount || 0) + 1 } : t
                ));
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [client, isConnected, user, selectedTeacher]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedTeacher || !user) return;

        try {
            const msg = await adminApi.sendPrivateMessage(selectedTeacher.id, inputText);
            setMessages(prev => [...prev, msg]);
            setInputText("");
            scrollToBottom();
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleDeleteMessage = async (messageId: number) => {
        try {
            // Optimistic update
            setMessages(prev => prev.filter(m => m.id !== messageId));
            await adminApi.deleteMessage(messageId);
        } catch (error) {
            console.error("Failed to delete message", error);
        }
    };

    const filteredTeachers = teachers.filter(t =>
        (t.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.department || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-200px)] gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sidebar - Teachers List */}
            <Card className="w-80 flex flex-col overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur-md">
                <div className="p-4 border-b space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Messages
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search teachers..."
                            className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {filteredTeachers.map(teacher => (
                            <button
                                key={teacher.id}
                                onClick={() => setSelectedTeacher(teacher)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedTeacher?.id === teacher.id
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                    : "hover:bg-muted/80"
                                    }`}
                            >
                                <div className="relative">
                                    <UserAvatar
                                        firstName={teacher.name}
                                        lastName=""
                                        imageUrl={teacher.profileImageUrl}
                                        size="sm"
                                        className="h-10 w-10 border-2 border-background shadow-sm"
                                    />
                                    {teacher.isOnline && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <p className="font-semibold text-sm truncate">{teacher.name}</p>
                                    <p className={`text-[10px] truncate ${selectedTeacher?.id === teacher.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                        {teacher.department} • {teacher.email}
                                    </p>
                                </div>
                                {teacher.unreadCount && teacher.unreadCount > 0 ? (
                                    <Badge variant="destructive" className="rounded-full h-5 min-w-[20px] flex items-center justify-center">
                                        {teacher.unreadCount}
                                    </Badge>
                                ) : null}
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur-md">
                {selectedTeacher ? (
                    <>
                        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                            <div className="flex items-center gap-3">
                                <UserAvatar
                                    firstName={selectedTeacher.name}
                                    lastName=""
                                    imageUrl={selectedTeacher.profileImageUrl}
                                    size="sm"
                                    className="h-10 w-10 shadow-sm"
                                />
                                <div>
                                    <h3 className="font-bold text-sm">{selectedTeacher.name}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <Circle className={`h-2 w-2 fill-current ${selectedTeacher.isOnline ? "text-green-500" : "text-muted-foreground"}`} />
                                        <span className="text-[10px] text-muted-foreground">
                                            {selectedTeacher.isOnline ? "Online" : "Offline"} • {selectedTeacher.department}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-6 bg-[#efeae2] dark:bg-gray-900">
                            <div className="space-y-4">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 pt-20">
                                        <MessageSquare className="h-12 w-12 mb-4" />
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.senderId === user?.id;
                                        return (
                                            <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2 group mb-2`}>
                                                {!isMe && (
                                                    <UserAvatar
                                                        firstName={selectedTeacher.name}
                                                        lastName=""
                                                        imageUrl={selectedTeacher.profileImageUrl}
                                                        size="sm"
                                                        className="h-8 w-8 shrink-0 mb-1 rounded-full border shadow-sm"
                                                    />
                                                )}
                                                <div className={`relative max-w-[70%] space-y-1`}>
                                                    <div className={`p-3 rounded-2xl text-sm shadow-sm relative group-hover:shadow-md transition-all ${isMe
                                                        ? "bg-[#d9fdd3] text-gray-900 rounded-tr-none dark:bg-green-700 dark:text-white"
                                                        : "bg-white text-gray-900 rounded-tl-none border border-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                                                        }`}>
                                                        <p className="leading-relaxed whitespace-pre-wrap pr-4 pb-2">{msg.message}</p>
                                                        <div className={`flex items-center justify-end gap-1 mt-[-6px] `}>
                                                            <span className={`text-[10px] ${isMe ? "text-gray-500 dark:text-gray-300" : "text-gray-400"}`}>
                                                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                                            </span>
                                                            {isMe && (msg.seen ? <span className="text-blue-500 text-[10px] font-bold">✓✓</span> : <span className="text-gray-400 text-[10px] font-bold">✓</span>)}
                                                        </div>

                                                        {/* Delete Menu */}
                                                        <div className={`absolute top-0 ${isMe ? "-left-10" : "-right-10"} opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 hover:bg-background shadow-sm">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align={isMe ? "end" : "start"}>
                                                                    <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => handleDeleteMessage(msg.id)}>
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete for me
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        <form onSubmit={handleSendMessage} className="p-4 bg-background border-t flex gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                            <Input
                                placeholder="Type your message here..."
                                className="flex-1 bg-muted/30 border-none focus-visible:ring-1"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                            <Button type="submit" size="icon" disabled={!inputText.trim()} className="shrink-0 shadow-md">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                        <div className="p-8 rounded-full bg-primary/5 mb-4">
                            <MessageSquare className="h-12 w-12 text-primary/40" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">Select a contact</h3>
                        <p className="max-w-[250px] text-center mt-2">
                            Choose a teacher from the list to start a real-time conversation.
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
}
