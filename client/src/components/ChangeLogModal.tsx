import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authFetch } from "@/utils/authFetch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, User, Calendar, Tag, FileText, PlusCircle, MinusCircle, AlertCircle, RefreshCw } from "lucide-react";
import { safeToLocaleDateString } from "@/utils/dateUtils";

interface ChangeLog {
    id: number;
    versionId: number;
    updatedByName: string;
    changeType: string;
    sectionName: string;
    description: string;
    createdAt: string;
}

interface ChangeLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseFileId: number;
    courseTitle: string;
}

export function ChangeLogModal({ isOpen, onClose, courseFileId, courseTitle }: ChangeLogModalProps) {
    const [logs, setLogs] = useState<ChangeLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && courseFileId) {
            fetchLogs();
        }
    }, [isOpen, courseFileId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/api/features/change-logs/${courseFileId}`);
            if (res.ok) {
                setLogs(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const getChangeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'added': return <PlusCircle className="h-5 w-5 text-green-600" />;
            case 'removed': return <MinusCircle className="h-5 w-5 text-red-600" />;
            case 'modified': return <AlertCircle className="h-5 w-5 text-orange-600" />;
            default: return <Tag className="h-5 w-5 text-blue-600" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <History className="h-6 w-6 text-blue-600" />
                        Detailed Change Log
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">{courseTitle}</p>
                </DialogHeader>

                <ScrollArea className="flex-1 px-8 py-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 opacity-50">
                            <RefreshCw className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                            <p className="font-bold">Retrieving change history...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                            <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium italic">No modifications recorded for this version yet.</p>
                            <p className="text-xs text-slate-400 mt-1">Changes are automatically logged as you edit or upload files.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 relative ml-4 border-l-2 border-slate-100 pl-8 pb-10">
                            {logs.map((log, idx) => (
                                <div key={log.id} className="relative group">
                                    {/* Timeline dot */}
                                    <div className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 z-10 shadow-sm ${log.changeType === 'Added' ? 'border-green-500 text-green-600' : log.changeType === 'Removed' ? 'border-red-500 text-red-600' : 'border-orange-500 text-orange-600'}`}>
                                        {getChangeIcon(log.changeType)}
                                    </div>

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-50/50 hover:border-slate-300 relative">
                                        <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold uppercase tracking-wider text-[10px]">Version {log.versionId}</Badge>
                                                <span className="text-slate-400 text-sm">•</span>
                                                <span className="text-slate-900 font-bold text-sm tracking-tight">{log.sectionName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                                                <Calendar className="h-3 w-3" />
                                                {safeToLocaleDateString(log.createdAt)}
                                            </div>
                                        </div>

                                        <p className="text-slate-700 text-sm leading-relaxed mb-4 font-medium italic">"{log.description}"</p>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]"><User className="h-2.5 w-2.5" /></div>
                                                Updated by <span className="text-blue-600">{log.updatedByName}</span>
                                            </div>
                                            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md ${log.changeType === 'Added' ? 'text-green-600 bg-green-50' : log.changeType === 'Removed' ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50'}`}>
                                                {log.changeType}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-4 border-t border-slate-100 text-center text-[10px] text-slate-400 uppercase font-black tracking-widest">End of History Record</div>
            </DialogContent>
        </Dialog>
    );
}
