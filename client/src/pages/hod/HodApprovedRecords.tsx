import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText, CheckCircle, RefreshCw, GraduationCap, Calendar, UserCheck, Archive, Download, Share2, ChevronsUpDown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { History, GitCompare } from "lucide-react";
import { VersionComparisonModal } from "@/components/VersionComparisonModal";
import { ChangeLogModal } from "@/components/ChangeLogModal";

interface ApprovedRecord {
    id: number;
    courseFileId: number;
    courseCode: string;
    courseTitle: string;
    teacherName: string;
    academicYear: string;
    section: string;
    status: string;
    approvedDate?: string;
    versionCount?: number;
}

export default function HodApprovedRecordsPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [records, setRecords] = useState<ApprovedRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Sharing state
    const [sharingFileId, setSharingFileId] = useState<number | null>(null);
    const [allFaculty, setAllFaculty] = useState<any[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [shareMessage, setShareMessage] = useState("");
    const [teacherSearchOpen, setTeacherSearchOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    // Feature modals
    const [comparisonFile, setComparisonFile] = useState<ApprovedRecord | null>(null);
    const [logFile, setLogFile] = useState<ApprovedRecord | null>(null);

    useEffect(() => { loadApprovedRecords(); }, []);

    const loadApprovedRecords = async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/hod/approved-records");
            if (res.ok) {
                const data = await res.json();
                setRecords(Array.isArray(data) ? data : []);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAllFaculty = async () => {
        try {
            const res = await authFetch('/api/common/faculty');
            if (res.ok) {
                setAllFaculty(await res.json());
            }
        } catch (err) {
            console.error("Error fetching faculty:", err);
        }
    };

    const handleShare = async () => {
        if (!sharingFileId || !selectedTeacherId) return;
        setIsSharing(true);
        try {
            const res = await authFetch('/api/teacher/course-files/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId: sharingFileId,
                    sharedWithId: Number(selectedTeacherId),
                    message: shareMessage
                })
            });

            if (res.ok) {
                toast({ title: "Shared", description: "Course file shared successfully." });
                setSharingFileId(null);
                setSelectedTeacherId("");
                setShareMessage("");
            } else {
                throw new Error("Sharing failed");
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSharing(false);
        }
    };

    const handleDownloadArchive = async (item: ApprovedRecord) => {
        try {
            toast({ title: "Generating Archive...", description: "Please wait while we prepare the course file ZIP." });
            const res = await authFetch(`/api/archive/download/${item.courseFileId}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Final_Archive_${item.courseCode}_${item.academicYear}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                toast({ title: "Archive Generated", description: "Course File ZIP is ready." });
            } else {
                let errMsg = "Access restricted.";
                try {
                    const errData = await res.json();
                    if (errData && (errData.message || errData.error)) errMsg = errData.message || errData.error;
                } catch (e) { }
                toast({ title: "Access Restricted", description: errMsg, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Download failed", variant: "destructive" });
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Approved Records</h1>
                    <p className="text-muted-foreground mt-1">Archive of finalized and approved course files.</p>
                </div>
                <Button variant="outline" onClick={loadApprovedRecords} className="rounded-xl px-6 border-2 font-bold text-slate-600 hover:bg-slate-50 border-slate-200 shadow-sm transition-all hover:-translate-y-0.5">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Synchronize Data
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><CheckCircle className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Approved</p>
                            <p className="text-2xl font-bold text-slate-900">{records.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><GraduationCap className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dept. Quality</p>
                            <p className="text-2xl font-bold text-slate-900">100%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><UserCheck className="h-6 w-6" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verification</p>
                            <p className="text-sm font-bold text-slate-700 uppercase tracking-tight">Locked & Secure</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-xl border">
                <CardHeader className="bg-slate-50/50 border-b p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-600" />
                                Finalized Documents
                            </CardTitle>
                            <CardDescription className="text-muted-foreground mt-1">
                                Archived {records.length} academic files that completed the review cycle.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {records.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/20">
                            <FileText className="h-20 w-20 mx-auto mb-6 text-slate-200" />
                            <p className="text-2xl font-black text-slate-800">No finalized approved course files available.</p>
                            <p className="text-slate-500 font-medium italic">Pending reviews will appear here once approved by you.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="py-4 pl-6 text-xs font-bold uppercase text-slate-500 tracking-wider">Course Identity</TableHead>
                                        <TableHead className="text-xs font-bold uppercase text-slate-500 tracking-wider">Instructor</TableHead>
                                        <TableHead className="text-xs font-bold uppercase text-slate-500 tracking-wider text-center">Session / Sec</TableHead>
                                        <TableHead className="text-xs font-bold uppercase text-slate-500 tracking-wider">Approved Date</TableHead>
                                        <TableHead className="text-right pr-6 text-xs font-bold uppercase text-slate-500 tracking-wider">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                                            <TableCell className="py-5 pl-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-sm font-bold text-slate-900 leading-none">{item.courseCode}</p>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight truncate max-w-[200px]">{item.courseTitle}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-900 tracking-tight">{item.teacherName}</TableCell>
                                            <TableCell className="text-center font-bold text-slate-500">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-bold text-slate-900 border border-slate-200 px-2 py-0.5 rounded-md inline-block">{item.academicYear}</span>
                                                    <span className="text-[10px] mt-1 uppercase font-semibold text-muted-foreground">SEC: {item.section || "N/A"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-emerald-300" />
                                                    <span className="text-xs font-bold text-slate-600">{item.approvedDate ? new Date(item.approvedDate).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => handleDownloadArchive(item)} className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md font-bold text-xs uppercase tracking-tight">
                                                        <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/hod/review/${item.courseFileId}`)} className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md font-bold text-xs uppercase tracking-tight">
                                                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => { setSharingFileId(item.courseFileId); fetchAllFaculty(); }} className="h-8 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md font-bold text-xs uppercase tracking-tight" title="Share Course File">
                                                        <Share2 className="h-3.5 w-3.5 mr-1" /> Share
                                                    </Button>
                                                    {item.versionCount && item.versionCount >= 2 && (
                                                        <Button variant="ghost" size="sm" onClick={() => setComparisonFile(item)} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md" title="Diff Comparison">
                                                            <GitCompare className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" onClick={() => setLogFile(item)} className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md" title="Audit Trace">
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* SHARING MODAL */}
            <Dialog open={!!sharingFileId} onOpenChange={o => !o && setSharingFileId(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Share Course File</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Teacher</Label>
                            <Popover open={teacherSearchOpen} onOpenChange={setTeacherSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {selectedTeacherId ? allFaculty.find(f => String(f.id) === selectedTeacherId)?.name : "Select Teacher..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search teacher..." />
                                        <CommandList>
                                            <CommandEmpty>No teacher found.</CommandEmpty>
                                            <CommandGroup>
                                                {allFaculty.map(f => (
                                                    <CommandItem key={f.id} value={f.name} onSelect={() => { setSelectedTeacherId(String(f.id)); setTeacherSearchOpen(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedTeacherId === String(f.id) ? "opacity-100" : "opacity-0")} />
                                                        {f.name} ({f.departmentCode})
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Message (Optional)</Label>
                            <Input value={shareMessage} onChange={e => setShareMessage(e.target.value)} placeholder="Add a note..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleShare} disabled={!selectedTeacherId || isSharing}>{isSharing ? "Sharing..." : "Share"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* FEATURE MODALS */}
            {comparisonFile && (
                <VersionComparisonModal
                    isOpen={!!comparisonFile}
                    onClose={() => setComparisonFile(null)}
                    courseFileId={comparisonFile.courseFileId}
                    courseTitle={`${comparisonFile.courseCode} - ${comparisonFile.courseTitle}`}
                />
            )}
            {logFile && (
                <ChangeLogModal
                    isOpen={!!logFile}
                    onClose={() => setLogFile(null)}
                    courseFileId={logFile.courseFileId}
                    courseTitle={`${logFile.courseCode} - ${logFile.courseTitle}`}
                />
            )}
        </div>
    );
}
