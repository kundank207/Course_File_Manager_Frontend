import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderOpen, MessageSquare, Loader2, ThumbsUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResubmitDialogProps {
    document: { id: number; fileName: string };
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ResubmitDialog: React.FC<ResubmitDialogProps> = ({
    document,
    isOpen,
    onClose,
    onSuccess
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleResubmit = async () => {
        if (!file || !note.trim()) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('teacherNote', note);

            const authStr = localStorage.getItem('courseflow_auth');
            const auth = authStr ? JSON.parse(authStr) : null;
            const token = auth?.token;

            if (!token) throw new Error("Not authenticated");

            const res = await fetch(`/api/teacher/documents/${document.id}/resubmit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                toast({ title: "Fix Transmitted", description: "Your corrected document has been uploaded for review." });
                onSuccess();
            } else {
                const errorData = await res.text();
                throw new Error(errorData || "Failed to resubmit");
            }
        } catch (err: any) {
            toast({ title: "Transmission Failed", description: err.message || "Failed to upload fix", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md rounded-[40px] p-8 bg-white overflow-hidden">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">Resubmit Fix</DialogTitle>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                REPLACING: <span className="text-blue-600 italic font-black">{document.fileName}</span>
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Corrected Document</label>
                        <div className="relative group">
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                            />
                            <div className="p-10 border-2 border-dashed border-slate-200 rounded-[30px] text-center group-hover:border-blue-500/50 transition-all bg-slate-50/50 group-hover:bg-blue-50/50">
                                <FolderOpen className="h-8 w-8 text-slate-300 mx-auto mb-3 group-hover:text-blue-500" />
                                <p className="text-xs font-bold text-slate-500 group-hover:text-blue-600">
                                    {file ? file.name : "Tap to select corrected file"}
                                </p>
                                <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-widest">PDF, Office, Zip supported</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Message to Reviewer</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Explain what you have changed/fixed..."
                            className="w-full h-32 p-5 rounded-[30px] bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-300 outline-none"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            className="flex-1 bg-slate-900 hover:bg-blue-600 text-white rounded-[30px] h-14 font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 shadow-xl shadow-slate-200"
                            onClick={handleResubmit}
                            disabled={!file || !note.trim() || loading}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ThumbsUp className="h-5 w-5 mr-3" />}
                            Transmit Fix
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-[30px] h-14 px-8 border-slate-200 text-slate-400 font-bold uppercase text-[10px] hover:bg-slate-50"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
