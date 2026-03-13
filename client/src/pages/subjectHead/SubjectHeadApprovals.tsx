import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";
import {
    CheckCircle,
    Eye,
    Download,
    RefreshCw,
    XCircle,
    History,
    Archive,
    FileCheck
} from "lucide-react";

interface FinalizedApproval {
    id: number;
    courseFileId: number;
    courseCode: string;
    courseTitle: string;
    teacherName: string;
    status: string;
    submittedDate: string;
    reviewedByName: string;
    reviewDate: string;
}

export default function SubjectHeadApprovalsPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [approvals, setApprovals] = useState<FinalizedApproval[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFinalizedApprovals();
    }, []);

    const loadFinalizedApprovals = async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/subject-head/finalized-approvals");
            if (res.ok) {
                const data = await res.json();
                setApprovals(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to load finalized approvals:", error);
            toast({
                title: "Error",
                description: "Failed to load finalized course files",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Approved
                </Badge>;
            case "REJECTED":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" /> Rejected
                </Badge>;
            case "ARCHIVED":
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">
                    <Archive className="h-3 w-3 mr-1" /> Archived
                </Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleDownloadArchive = async (item: FinalizedApproval) => {
        try {
            const res = await authFetch(`/api/archive/download/${item.courseFileId}`);
            if (res.ok) {
                toast({ title: "Generating Archive...", description: "Please wait while we prepare your course file ZIP." });
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Archive_${item.courseCode}_${new Date().getTime()}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                toast({ title: "Archive Generated", description: "Course File ZIP is ready." });
            } else {
                let errMsg = "You don't have permission to download this archive.";
                try {
                    const errData = await res.json();
                    if (errData && errData.message) errMsg = errData.message;
                } catch (e) { }
                toast({ title: "Access Restricted", description: errMsg, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Download Failed", description: "An error occurred while generating the archive.", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finalized Approvals</h1>
                    <p className="text-muted-foreground mt-1">
                        View history of approved and rejected course files
                    </p>
                </div>
                <Button onClick={loadFinalizedApprovals} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Approvals Table */}
            <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="flex items-center justify-between text-lg">
                        <span className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Finalized Course Files
                        </span>
                        <Badge variant="outline" className="font-semibold">
                            {approvals.length} Records
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {approvals.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground bg-white/80">
                            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileCheck className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold text-foreground">No finalized course files available.</p>
                            <p className="text-sm mt-1">Files will appear here once they are approved or rejected.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/20">
                                    <TableRow>
                                        <TableHead className="font-bold">Course Name</TableHead>
                                        <TableHead className="font-bold">Faculty Name</TableHead>
                                        <TableHead className="font-bold">Reviewed By</TableHead>
                                        <TableHead className="font-bold">Final Status</TableHead>
                                        <TableHead className="font-bold">Review Date</TableHead>
                                        <TableHead className="text-right font-bold w-[120px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {approvals.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-muted/5 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">{item.courseCode}</span>
                                                    <span className="text-xs text-muted-foreground line-clamp-1">{item.courseTitle}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{item.teacherName}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {item.reviewedByName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm">{item.reviewedByName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {item.reviewDate ? new Date(item.reviewDate).toLocaleDateString("en-US", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                }) : "N/A"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                                        onClick={() => navigate(`/subject-head/review/${item.courseFileId}`)}
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                        title="Download Archive"
                                                        onClick={() => handleDownloadArchive(item)}
                                                    >
                                                        <Archive className="h-4 w-4" />
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
        </div>
    );
}
