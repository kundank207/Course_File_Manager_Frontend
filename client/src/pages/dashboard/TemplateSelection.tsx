import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "@/utils/authFetch";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, BookOpen, FileText, AlertCircle, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ================= TYPES ================= */

interface Course {
  courseId: number;
  code: string;
  title: string;
  academicYear: string;
  section: string;
  hasTheory: boolean;
  hasLab: boolean;
  hasProject: boolean;
}

interface HeadingItem {
  title: string;
  order: number;
}

interface Template {
  id: number;
  name: string;
  templateType: string;
  sectionsCount: number;
  structure: HeadingItem[];
}

/* ================= COMPONENT ================= */

export default function TemplateSelectionPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [viewTemplate, setViewTemplate] = useState<Template | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [previousFiles, setPreviousFiles] = useState<any[]>([]);
  const [showReuseDialog, setShowReuseDialog] = useState(false);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await authFetch("/api/teacher/my-courses");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCourses(data);
    } catch {
      toast({
        title: "Error",
        description: "Unable to load your courses",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      checkPreviousFiles();
      loadTemplates(selectedCourse);
    } else {
      setPreviousFiles([]);
      setTemplates([]);
      setSelectedTemplate(null);
    }
  }, [selectedCourse]);

  const checkPreviousFiles = async () => {
    const course = courses.find(c => String(c.courseId) === selectedCourse);
    if (!course) return;

    try {
      const res = await authFetch(`/api/teacher/course-files/previous?course_id=${course.courseId}&academic_year=${course.academicYear}`);
      if (res.ok) {
        const data = await res.json();
        setPreviousFiles(data);
        if (data.length > 0) {
          setShowReuseDialog(true);
        }
      }
    } catch (err) {
      console.error("Error checking previous files", err);
    }
  };

  const loadTemplates = async (courseId: string) => {
    setLoadingTemplates(true);
    try {
      const res = await authFetch(`/api/teacher/templates?course_id=${courseId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      const formatted = data.map((t: any) => {
        let structureHeadings: HeadingItem[] = [];
        try {
          if (t.structure && typeof t.structure === "string") {
            const parsed = JSON.parse(t.structure);
            structureHeadings = Array.isArray(parsed.headings) ? parsed.headings : [];
          }
        } catch (e) {
          console.error("Failed to parse template structure", t);
        }

        return {
          id: t.id,
          name: t.name,
          templateType: t.templateType,
          sectionsCount: t.sectionsCount || 0,
          structure: structureHeadings,
        };
      });

      setTemplates(formatted);

      // Auto-select if only one template exists
      if (formatted.length === 1) {
        setSelectedTemplate(formatted[0].id);
      } else {
        setSelectedTemplate(null);
      }
    } catch {
      toast({
        title: "Error",
        description: "Unable to load templates for this course",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  /* ================= APPLY TEMPLATE ================= */

  const handleApplyTemplate = async () => {
    if (!selectedCourse || !selectedTemplate) return;

    setIsApplying(true);

    try {
      const course = courses.find(
        (c) => c.courseId.toString() === selectedCourse
      );

      const template = templates.find(t => t.id === selectedTemplate);

      // Save to localStorage for demo data passing
      if (course) localStorage.setItem("temp_selected_course", JSON.stringify(course));
      if (template) localStorage.setItem("temp_selected_template", JSON.stringify(template));

      const res = await authFetch("/api/teacher/course-files", {
        method: "POST",
        body: JSON.stringify({
          courseId: Number(selectedCourse),
          templateId: selectedTemplate,
          academicYear: course?.academicYear,
          section: course?.section,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create course file");
      }

      const data = await res.json();

      navigate(`/teacher/course-structure/${data.id}`);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleReuseFile = async (previousFileId: number) => {
    const course = courses.find(c => String(c.courseId) === selectedCourse);
    if (!course) return;

    setIsApplying(true);
    try {
      const res = await authFetch("/api/teacher/course-files/reuse", {
        method: "POST",
        body: JSON.stringify({
          previousFileId,
          newCourseId: course.courseId,
          academicYear: course.academicYear,
          section: course.section
        })
      });

      if (!res.ok) throw new Error("Failed to reuse course file");
      const data = await res.json();
      setShowReuseDialog(false);
      navigate(`/teacher/course-structure/${data.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsApplying(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Setup Your Course</h1>
        <p className="text-muted-foreground mt-1">
          Choose your course and select a template to organize your materials.
        </p>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="about">What is a Template?</TabsTrigger>
        </TabsList>

        {/* ================= SETUP TAB ================= */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* COURSE */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Step 1: Select Your Course
                </CardTitle>
                <CardDescription>
                  Only courses assigned to you are shown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.courseId} value={String(c.courseId)}>
                        {c.code} - {c.title} ({c.section})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedCourse && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      Course selected ✓
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TEMPLATE */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Step 2: Choose a Template
                </CardTitle>
                <CardDescription>
                  Templates matching your course components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {!selectedCourse && (
                  <p className="text-sm text-muted-foreground italic py-4 text-center border-2 border-dashed rounded-lg">
                    Select a course first to see available templates
                  </p>
                )}

                {selectedCourse && loadingTemplates && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}

                {selectedCourse && !loadingTemplates && templates.length === 0 && (
                  <p className="text-sm text-destructive py-4 text-center border-2 border-dashed border-destructive/20 rounded-lg">
                    No templates found for this course's department/components.
                  </p>
                )}

                {templates.map((t) => {
                  const getBadgeColor = (type: string) => {
                    switch (type) {
                      case 'THEORY': return "bg-blue-600 hover:bg-blue-700";
                      case 'LAB': return "bg-purple-600 hover:bg-purple-700";
                      case 'PROJECT': return "bg-orange-600 hover:bg-orange-700";
                      default: return "bg-gray-600";
                    }
                  };

                  return (
                    <div
                      key={t.id}
                      onClick={() => setViewTemplate(t)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedTemplate === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getBadgeColor(t.templateType)} text-white`}>
                            {t.templateType}
                          </Badge>
                          <div>
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.sectionsCount} Sections | {t.structure.length} Headings
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(t.id);
                        }}>
                          {selectedTemplate === t.id ? 'Selected' : 'Select'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* TEMPLATE PREVIEW DIALOG */}
            <Dialog open={!!viewTemplate} onOpenChange={(open) => !open && setViewTemplate(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{viewTemplate?.name}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-2">
                  <p className="font-medium text-sm text-muted-foreground mb-2">Structure:</p>
                  <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                    {(Array.isArray(viewTemplate?.structure) ? viewTemplate.structure : []).map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm">{s.title}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setViewTemplate(null)}>Cancel</Button>
                    <Button onClick={() => {
                      if (viewTemplate) {
                        setSelectedTemplate(viewTemplate.id);
                        setViewTemplate(null);
                      }
                    }}>Select Template</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* PREVIEW */}
          {selectedTemplate && (() => {
            const selected = templates.find((t) => t.id === selectedTemplate);
            const structureArr = Array.isArray(selected?.structure) ? selected.structure : [];
            return (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">
                    📋 Template Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {structureArr.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 bg-background rounded-lg"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{s.title}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })()}

          {/* ACTION */}
          <Button
            onClick={handleApplyTemplate}
            disabled={!selectedCourse || !selectedTemplate || isApplying}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isApplying ? "Setting up..." : "Continue to Course Structure"}
          </Button>

          {!selectedCourse && (
            <div className="flex gap-3 p-4 bg-amber-50 rounded-lg border">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-sm">
                Please select both a course and a template to continue.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ================= ABOUT TAB ================= */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                What is a Template?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              Templates help standardize and speed up course file creation.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* REUSE DIALOG */}
      <Dialog open={showReuseDialog} onOpenChange={setShowReuseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reuse Previous Content?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg flex gap-3 border border-blue-100">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">Previous course file is available.</p>
                <p className="text-xs text-blue-700">Do you want to reuse its structure and documents for the new academic year?</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Available Files:</p>
              {previousFiles.map((pf) => (
                <div key={pf.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                  <div>
                    <p className="text-sm font-semibold">{pf.academicYear} ({pf.section})</p>
                    <p className="text-[10px] text-muted-foreground italic">Status: {pf.status}</p>
                  </div>
                  <Button size="sm" onClick={() => handleReuseFile(pf.id)}>Reuse This</Button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowReuseDialog(false)}>
              Start New Instead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
