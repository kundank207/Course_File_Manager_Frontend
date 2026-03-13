import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Clock,
    FileText,
    CheckCircle,
    Calendar,
    History,
    Layout,
    Award
} from "lucide-react";
import { getTeacherActivity } from "@/api/hodApi";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/common/UserAvatar";
import { format } from "date-fns";

export default function HodTeacherActivityPage() {
    const { teacherId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (teacherId) {
            loadActivity();
        }
    }, [teacherId]);

    const loadActivity = async () => {
        try {
            setLoading(true);
            const res = await getTeacherActivity(Number(teacherId));
            setData(res);
        } catch (error) {
            console.error("Failed to load activity:", error);
            toast({
                title: "Error",
                description: "Failed to load teacher history",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (!data) return <div>Teacher not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div className="flex items-center gap-3">
                    <UserAvatar name={data.stats.name} size="lg" />
                    <div>
                        <h1 className="text-2xl font-bold">{data.stats.name}</h1>
                        <p className="text-muted-foreground">{data.stats.designation}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.uploads}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Course Files</CardTitle>
                        <Layout className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.courseFiles}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved Files</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.approvals}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Templates Created</CardTitle>
                        <Award className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.templates}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" /> Recent Activity Log
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.logs.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">No recent activity detected</p>
                            ) : (
                                data.logs.map((log: any) => (
                                    <div key={log.id} className="flex gap-4 border-b pb-3 last:border-0 last:pb-0">
                                        <div className="mt-1">
                                            <Clock className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{log.action}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(log.createdAt), "PPP p")}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" /> Course Documentation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.files.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">No course files created yet</p>
                            ) : (
                                data.files.map((file: any) => (
                                    <div key={file.id} className="p-3 border rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-sm">{file.course.title}</p>
                                            <p className="text-xs text-muted-foreground">{file.course.code} • {file.academicYear}</p>
                                        </div>
                                        <Badge variant={file.status === 'APPROVED' ? 'default' : 'secondary'}>
                                            {file.status}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
