import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    AlertTriangle,
    BookOpen,
    User,
    Mail,
    AlertCircle
} from "lucide-react";
import { getMissingMaterials } from "@/api/hodApi";
import { useToast } from "@/hooks/use-toast";

export default function HodMissingCoveragePage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState<any[]>([]);

    useEffect(() => {
        loadMissing();
    }, []);

    const loadMissing = async () => {
        try {
            setLoading(true);
            const res = await getMissingMaterials();
            setMissing(res);
        } catch (error) {
            console.error("Failed to load missing materials:", error);
            toast({
                title: "Error",
                description: "Failed to load coverage analysis",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Coverage Gaps</h1>
                        <p className="text-muted-foreground mt-1">
                            Courses without any uploaded documentation
                        </p>
                    </div>
                </div>
                <Badge variant="destructive" className="px-4 py-1 text-sm">
                    {missing.length} Gaps Found
                </Badge>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : missing.length === 0 ? (
                    <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <BookOpen className="h-8 w-8" />
                            </div>
                            <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Full Coverage!</h2>
                            <p className="text-green-700/80 dark:text-green-400/80 max-w-sm"> All department courses have at least some materials uploaded.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {missing.map((course) => (
                            <Card key={course.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="mb-2">{course.code}</Badge>
                                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Assigned Teachers</p>
                                        <div className="flex flex-wrap gap-2">
                                            {course.assignedTeachers.length > 0 ? (
                                                course.assignedTeachers.map((t: string) => (
                                                    <div key={t} className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs font-medium">
                                                        <User className="h-3 w-3" />
                                                        {t}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-1 text-xs text-destructive">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Unassigned
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-2 flex gap-2">
                                        <Button variant="outline" size="sm" className="w-full text-xs">
                                            <Mail className="h-3 w-3 mr-2" /> Remind
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
