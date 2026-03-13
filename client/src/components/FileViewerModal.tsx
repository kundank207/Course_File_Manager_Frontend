import { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertCircle, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string;
    fileName: string;
}

export function FileViewerModal({ isOpen, onClose, fileId, fileName }: FileViewerModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [size, setSize] = useState({ width: 900, height: 600 });
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen || !fileId) {
            setFileUrl(null);
            setError(null);
            return;
        }

        const fetchFile = async () => {
            setLoading(true);
            setError(null);
            try {
                const authStr = localStorage.getItem('courseflow_auth');
                const auth = authStr ? JSON.parse(authStr) : null;
                const token = auth?.token;

                if (!token) throw new Error("Authentication required");

                const res = await fetch(`http://localhost:8080/api/teacher/documents/view/${fileId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    throw new Error(`Failed to load file: ${res.statusText}`);
                }

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                setFileUrl(url);
            } catch (err: any) {
                console.error("Error viewing file:", err);
                setError(err.message || "Failed to load file");
            } finally {
                setLoading(false);
            }
        };

        fetchFile();

        return () => {
            if (fileUrl) {
                window.URL.revokeObjectURL(fileUrl);
            }
        };
    }, [isOpen, fileId]);

    const handleMouseDown = (e: React.MouseEvent, corner: string) => {
        e.preventDefault();
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            if (corner.includes('right')) {
                newWidth = Math.max(400, Math.min(window.innerWidth - 100, startWidth + deltaX));
            }
            if (corner.includes('left')) {
                newWidth = Math.max(400, Math.min(window.innerWidth - 100, startWidth - deltaX));
            }
            if (corner.includes('bottom')) {
                newHeight = Math.max(300, Math.min(window.innerHeight - 100, startHeight + deltaY));
            }
            if (corner.includes('top')) {
                newHeight = Math.max(300, Math.min(window.innerHeight - 100, startHeight - deltaY));
            }

            setSize({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const toggleFullscreen = () => {
        if (isFullscreen) {
            setSize({ width: 900, height: 600 });
        } else {
            setSize({ width: window.innerWidth - 80, height: window.innerHeight - 80 });
        }
        setIsFullscreen(!isFullscreen);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                ref={containerRef}
                className="flex flex-col p-0 overflow-hidden"
                style={{
                    maxWidth: 'none',
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    transition: isResizing ? 'none' : 'width 0.2s, height 0.2s'
                }}
            >
                <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-base">
                            Viewing: {fileName}
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 mr-6"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? "Restore size" : "Maximize"}
                        >
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative bg-slate-100">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-4 text-center">
                            <AlertCircle className="h-10 w-10 mb-2" />
                            <p className="font-medium">{error}</p>
                            <Button variant="outline" className="mt-4" onClick={onClose}>Close</Button>
                        </div>
                    )}

                    {!loading && !error && fileUrl && (
                        <iframe
                            src={fileUrl}
                            className="w-full h-full border-0"
                            title={fileName}
                        />
                    )}
                </div>

                {/* Resize handles */}
                {!isFullscreen && (
                    <>
                        {/* Corner handles */}
                        <div
                            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50"
                            onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
                            style={{ background: 'linear-gradient(135deg, transparent 50%, #94a3b8 50%)' }}
                        />
                        <div
                            className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-50"
                            onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
                            style={{ background: 'linear-gradient(225deg, transparent 50%, #94a3b8 50%)' }}
                        />
                        <div
                            className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-50 mt-12"
                            onMouseDown={(e) => handleMouseDown(e, 'top-right')}
                        />
                        <div
                            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-50 mt-12"
                            onMouseDown={(e) => handleMouseDown(e, 'top-left')}
                        />

                        {/* Edge handles */}
                        <div
                            className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize z-40"
                            onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                        />
                        <div
                            className="absolute top-12 bottom-4 right-0 w-2 cursor-e-resize z-40"
                            onMouseDown={(e) => handleMouseDown(e, 'right')}
                        />
                        <div
                            className="absolute top-12 bottom-4 left-0 w-2 cursor-w-resize z-40"
                            onMouseDown={(e) => handleMouseDown(e, 'left')}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
