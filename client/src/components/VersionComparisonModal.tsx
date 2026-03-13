import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authFetch } from "@/utils/authFetch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    FileText,
    FolderOpen,
    AlertCircle,
    PlusCircle,
    MinusCircle,
    RefreshCw,
    ArrowRightLeft,
    Layers,
    User,
    Calendar,
    Layout
} from "lucide-react";

interface Version {
    id: number;
    revisionNumber: number;
    status: string;
    createdAt: string;
    createdByName: string;
}

interface DiffNode {
    title: string;
    nodeType: string;
    diffStatus: string;
    oldValue?: string;
    newValue?: string;
    children?: DiffNode[];
    documents?: DiffNode[];
}

interface VersionComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseFileId: number;
    courseTitle: string;
}

export function VersionComparisonModal({ isOpen, onClose, courseFileId, courseTitle }: VersionComparisonModalProps) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [v1Id, setV1Id] = useState<string>("");
    const [v2Id, setV2Id] = useState<string>("");
    const [diff, setDiff] = useState<DiffNode[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialFetchDone, setInitialFetchDone] = useState(false);

    useEffect(() => {
        if (isOpen && courseFileId) {
            fetchVersions();
        } else {
            setDiff(null);
            setV1Id("");
            setV2Id("");
            setInitialFetchDone(false);
        }
    }, [isOpen, courseFileId]);

    const fetchVersions = async () => {
        try {
            const res = await authFetch(`/api/features/versions/${courseFileId}`);
            if (res.ok) {
                const data: Version[] = await res.json();
                setVersions(data);

                if (data.length >= 2) {
                    const latest = data[0];
                    const previous = data[1];
                    setV1Id(String(previous.id));
                    setV2Id(String(latest.id));

                    // Automatic comparison if exactly 2 versions
                    if (data.length === 2) {
                        handleCompare(String(previous.id), String(latest.id));
                    }
                }
                setInitialFetchDone(true);
            }
        } catch (error) {
            console.error("Failed to fetch versions:", error);
        }
    };

    useEffect(() => {
        if (v1Id && v2Id && initialFetchDone) {
            handleCompare();
        }
    }, [v1Id, v2Id, initialFetchDone]);

    const handleCompare = async (id1?: string, id2?: string) => {
        const finalId1 = id1 || v1Id;
        const finalId2 = id2 || v2Id;

        if (!finalId1 || !finalId2) return;

        setLoading(true);
        try {
            const res = await authFetch(`/api/features/compare?v1=${finalId1}&v2=${finalId2}`);
            if (res.ok) {
                setDiff(await res.json());
            }
        } catch (error) {
            console.error("Comparison failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const summary = useMemo(() => {
        let added = 0, modified = 0, removed = 0;
        const count = (nodes: DiffNode[]) => {
            nodes.forEach(n => {
                if (n.diffStatus === 'ADDED') added++;
                else if (n.diffStatus === 'REMOVED') removed++;
                else if (n.diffStatus === 'MODIFIED') modified++;
                if (n.children) count(n.children);
                if (n.documents) count(n.documents);
            });
        };
        if (diff) count(diff);
        return { added, modified, removed };
    }, [diff]);

    const ver1 = versions.find(v => String(v.id) === v1Id);
    const ver2 = versions.find(v => String(v.id) === v2Id);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl border-none shadow-2xl">
                <DialogHeader className="p-6 pb-4 bg-white border-b border-slate-100 shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                                <ArrowRightLeft className="h-6 w-6 text-indigo-600" />
                                Version Comparison
                            </DialogTitle>
                            <p className="text-slate-500 font-medium mt-1">{courseTitle}</p>
                        </div>
                        {diff && (
                            <div className="flex gap-4">
                                <div className="text-center bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                                    <div className="text-lg font-black text-green-700">{summary.added}</div>
                                    <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Added</div>
                                </div>
                                <div className="text-center bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                                    <div className="text-lg font-black text-orange-700">{summary.modified}</div>
                                    <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Modified</div>
                                </div>
                                <div className="text-center bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                                    <div className="text-lg font-black text-red-700">{summary.removed}</div>
                                    <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Removed</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {versions.length >= 2 && (
                        <div className="flex items-center gap-4 mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                            <div className="flex flex-1 flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Version</label>
                                <Select value={v1Id} onValueChange={setV1Id}>
                                    <SelectTrigger className="bg-white border-slate-200 rounded-xl font-semibold shadow-sm focus:ring-indigo-500">
                                        <SelectValue placeholder="Select version" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {versions.map(v => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                Version {v.revisionNumber} ({v.status})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="pt-5"><ArrowRightLeft className="h-5 w-5 text-slate-300" /></div>
                            <div className="flex flex-1 flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Compared Version</label>
                                <Select value={v2Id} onValueChange={setV2Id}>
                                    <SelectTrigger className="bg-white border-slate-200 rounded-xl font-semibold shadow-sm focus:ring-indigo-500">
                                        <SelectValue placeholder="Select version" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {versions.map(v => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                Version {v.revisionNumber} ({v.status})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="pt-5">
                                <Button
                                    onClick={() => handleCompare()}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 shadow-lg shadow-indigo-100"
                                    disabled={loading || !v1Id || !v2Id}
                                >
                                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Compare Versions"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
                    {diff && (
                        <div className="grid grid-cols-2 divide-x divide-slate-200 bg-white border-b border-slate-100 shrink-0 shadow-sm z-10">
                            <VersionMetadata ver={ver1} title="Base Version" iconColor="text-slate-400" bgColor="bg-slate-50" />
                            <VersionMetadata ver={ver2} title="Compared Version" iconColor="text-indigo-600" bgColor="bg-indigo-50/30" />
                        </div>
                    )}

                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-32">
                                    <div className="relative">
                                        <RefreshCw className="h-12 w-12 animate-spin text-indigo-600" />
                                        <Layers className="h-6 w-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="mt-4 font-bold text-slate-600">Analyzing architecture differences...</p>
                                </div>
                            ) : diff ? (
                                <div className="border border-slate-200 rounded-2xl bg-white shadow-xl overflow-hidden divide-y divide-slate-100">
                                    {diff.length === 0 ? (
                                        <div className="p-20 text-center flex flex-col items-center">
                                            <Layout className="h-12 w-12 text-slate-200 mb-4" />
                                            <p className="text-slate-400 font-bold">No structural data available for comparison.</p>
                                        </div>
                                    ) : (
                                        diff.map((node, idx) => (
                                            <SideBySideItem key={idx} node={node} level={0} />
                                        ))
                                    )}
                                </div>
                            ) : initialFetchDone ? (
                                <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                                    <ArrowRightLeft className="h-16 w-16 opacity-10 mb-6" />
                                    <p className="text-xl font-bold">Select versions and click compare</p>
                                    <p className="text-sm">Highlighting changes across your course file structure</p>
                                </div>
                            ) : null}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function VersionMetadata({ ver, title, iconColor, bgColor }: { ver?: Version, title: string, iconColor: string, bgColor: string }) {
    if (!ver) return <div className={`p-4 ${bgColor} flex flex-col justify-center items-center text-slate-300 italic text-xs`}>No version selected</div>;
    return (
        <div className={`p-5 ${bgColor} space-y-3`}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
                <Badge variant="outline" className="bg-white font-bold border-slate-200">Version {ver.revisionNumber}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                    <User className={`h-4 w-4 ${iconColor} opacity-70`} />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Author</span>
                        <span className="text-xs font-bold text-slate-700">{ver.createdByName}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className={`h-4 w-4 ${iconColor} opacity-70`} />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Created</span>
                        <span className="text-xs font-bold text-slate-700">{new Date(ver.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
                <div className={`h-2 w-2 rounded-full ${ver.status === 'APPROVED' || ver.status === 'FINAL_APPROVED' ? 'bg-green-500' : 'bg-orange-400'}`} />
                <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{ver.status.replace('_', ' ')}</span>
            </div>
        </div>
    );
}

function SideBySideItem({ node, level }: { node: DiffNode, level: number }) {
    const isRemoved = node.diffStatus === 'REMOVED';
    const isAdded = node.diffStatus === 'ADDED';
    const isModified = node.diffStatus === 'MODIFIED';

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-2 divide-x divide-slate-100 hover:bg-slate-50/50 transition-colors">
                {/* Left Panel - Version 1 (Older) */}
                <div className={`p-4 text-sm ${isAdded ? 'bg-slate-50/30 overflow-hidden' : ''}`}>
                    {!isAdded && (
                        <div className={`flex items-center gap-3 py-1 px-3 rounded-lg border transition-all ${isRemoved
                            ? 'text-red-700 bg-red-50/80 border-red-200 shadow-sm line-through'
                            : isModified
                                ? 'text-orange-800 bg-orange-50/50 border-orange-100'
                                : 'text-slate-700 bg-white border-transparent'
                            }`}>
                            <div className="flex items-center gap-3" style={{ marginLeft: `${level * 1.5}rem` }}>
                                {node.nodeType === 'HEADING'
                                    ? <FolderOpen className={`h-4 w-4 shrink-0 ${isRemoved ? 'text-red-400' : 'text-slate-400'}`} />
                                    : <FileText className={`h-4 w-4 shrink-0 ${isRemoved ? 'text-red-400' : 'text-slate-300'}`} />}
                                <span className="font-bold tracking-tight">{node.title}</span>
                            </div>
                            {isRemoved && <PlusCircle className="h-3 w-3 ml-auto text-red-400 rotate-45" />}
                        </div>
                    )}
                    {isAdded && (
                        <div className="h-8 flex items-center px-4" style={{ marginLeft: `${level * 1.5}rem` }}>
                            <div className="h-px w-8 bg-slate-200 opacity-30" />
                        </div>
                    )}
                </div>

                {/* Right Panel - Version 2 (Newer) */}
                <div className={`p-4 text-sm ${isRemoved ? 'bg-slate-50/30 overflow-hidden' : ''}`}>
                    {!isRemoved && (
                        <div className={`flex items-center gap-3 py-1 px-3 rounded-lg border shadow-sm transition-all ${isAdded
                            ? 'text-green-800 bg-green-50 border-green-200'
                            : isModified
                                ? 'text-orange-800 bg-orange-50 border-orange-200'
                                : 'text-slate-700 bg-white border-white'
                            }`}>
                            <div className="flex items-center gap-3" style={{ marginLeft: `${level * 1.5}rem` }}>
                                {node.nodeType === 'HEADING'
                                    ? <FolderOpen className={`h-4 w-4 shrink-0 ${isAdded ? 'text-green-500' : isModified ? 'text-orange-500' : 'text-blue-500'}`} />
                                    : <FileText className={`h-4 w-4 shrink-0 ${isAdded ? 'text-green-500' : isModified ? 'text-orange-500' : 'text-slate-400'}`} />}
                                <span className="font-bold tracking-tight">{node.title}</span>
                            </div>
                            {isAdded && <PlusCircle className="h-3 w-3 ml-auto text-green-500 animate-pulse" />}
                            {isModified && <AlertCircle className="h-3 w-3 ml-auto text-orange-500" />}
                        </div>
                    )}
                    {isRemoved && (
                        <div className="h-8 flex items-center px-4" style={{ marginLeft: `${level * 1.5}rem` }}>
                            <div className="h-px w-8 bg-slate-200 opacity-30" />
                        </div>
                    )}
                </div>
            </div>

            {/* Render nested content */}
            {(node.children || node.documents) && (
                <div className="flex flex-col">
                    {node.children?.map((child, idx) => (
                        <SideBySideItem key={`child-${node.title}-${idx}`} node={child} level={level + 1} />
                    ))}
                    {node.documents?.map((doc, idx) => (
                        <SideBySideItem key={`doc-${node.title}-${idx}`} node={doc} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}
