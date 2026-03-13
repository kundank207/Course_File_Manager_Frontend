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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";
import {
    BookOpen,
    Search,
    Eye,
    FileText,
    Users,
    RefreshCw,
    Archive,
} from "lucide-react";

interface CourseFile {
    id: number;
    courseFileId?: number;
    courseCode: string;
    courseTitle: string;
    teacherName: string;
    academicYear: string;
    status: string;
}

export default function SubjectHeadSubjectsPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [courses, setCourses] = useState<CourseFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/subject-head/assigned-courses");
            if (res.ok) {
                const data = await res.json();
                setCourses(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to load courses:", error);
            toast({
                title: "Error",
                description: "Failed to load courses",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadArchive = async (course: CourseFile) => {
        if (!course.courseFileId) return;
        try {
            toast({ title: "Generating Archive...", description: "Please wait..." });
            const res = await authFetch(`/api/archive/download/${course.courseFileId}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Archive_${course.courseCode}_${new Date().getTime()}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                toast({ title: "Archive Generated", description: "Course Portfolio ZIP is ready." });
            } else {
                toast({ title: "Access Restricted", description: "You don't have permission to download this file.", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Download Failed", variant: "destructive" });
        }
    };

    const filteredCourses = courses.filter(
        (course) =>
            course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
            DRAFT: { variant: "secondary", className: "bg-gray-100 text-gray-700" },
            SUBMITTED: { variant: "default", className: "bg-yellow-100 text-yellow-700" },
            UNDER_REVIEW_HOD: { variant: "default", className: "bg-blue-100 text-blue-700" },
            RETURNED_BY_SUBJECT_HEAD: { variant: "destructive", className: "bg-orange-100 text-orange-700" },
            RETURNED_BY_HOD: { variant: "destructive", className: "bg-red-100 text-red-700" },
            APPROVED: { variant: "default", className: "bg-green-100 text-green-700" },
            FINAL_APPROVED: { variant: "default", className: "bg-green-100 text-green-700" },
            NOT_CREATED: { variant: "outline", className: "bg-slate-50 text-slate-500 border-slate-200" },
        };
        const config = statusConfig[status] || { variant: "outline" as const, className: "" };
        return <Badge variant={config.variant} className={config.className}>{(status || "").replace(/_/g, " ")}</Badge>;
    };

    const stats = {
        total: courses.length,
        pending: courses.filter((c) => c.status === "SUBMITTED").length,
        underReview: courses.filter((c) => c.status === "UNDER_REVIEW_HOD").length,
        approved: courses.filter((c) => c.status === "APPROVED" || c.status === "FINAL_APPROVED").length,
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
                    <h1 className="text-3xl font-bold tracking-tight">Assigned Courses</h1>
                    <p className="text-muted-foreground mt-1">
                        View all course files under your supervision
                    </p>
                </div>
                <Button onClick={loadCourses} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Courses</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <FileText className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                                <p className="text-sm text-muted-foreground">Pending Review</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.underReview}</p>
                                <p className="text-sm text-muted-foreground">With HOD</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <FileText className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.approved}</p>
                                <p className="text-sm text-muted-foreground">Approved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Course List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Course Files</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No course files found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Academic Year</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCourses.map((course) => (
                                    <TableRow key={course.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{course.courseCode}</p>
                                                <p className="text-sm text-muted-foreground">{course.courseTitle}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{course.teacherName}</TableCell>
                                        <TableCell>{course.academicYear}</TableCell>
                                        <TableCell>{getStatusBadge(course.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                {course.courseFileId ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDownloadArchive(course)}
                                                            className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                                                            title="Download Archive"
                                                        >
                                                            <Archive className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="hover:bg-blue-50 hover:text-blue-700"
                                                            onClick={() => navigate(`/subject-head/review/${course.courseFileId}`)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Review
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Badge variant="outline" className="text-slate-400 border-slate-200">AWAITING SETUP</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
