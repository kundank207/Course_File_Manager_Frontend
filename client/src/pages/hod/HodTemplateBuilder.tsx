import { useState, useEffect } from "react";
import { authFetch } from "@/utils/authFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Edit, RotateCcw, Trash2, LayoutTemplate } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/* ===== TYPES ===== */
type HeadingItem = {
  title: string;
  order: number;
};

type TemplateItem = {
  id: number;
  name: string;
  templateType: "THEORY" | "LAB" | "PROJECT" | string;
  sectionsCount: number;
  structure: HeadingItem[];
};

/* ===== COMPONENT ===== */
export default function HodTemplateBuilderPage() {
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateType, setTemplateType] =
    useState<"" | "THEORY" | "LAB" | "PROJECT">("");
  const [newHeading, setNewHeading] = useState("");
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);

  const BASE_URL = "http://localhost:8080/api/templates";

  /* ===== FETCH TEMPLATES ===== */
  const fetchTemplates = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/department`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      if (!Array.isArray(data)) {
        setTemplates([]);
        return;
      }

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
    } catch {
      toast({
        title: "Error",
        description: "Templates load failed. Please login again.",
        variant: "destructive",
      });
      setTemplates([]);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  /* ===== HEADINGS ===== */
  const addHeading = () => {
    if (!newHeading.trim()) return;
    setHeadings(h => [
      ...h,
      { title: newHeading.trim(), order: h.length + 1 },
    ]);
    setNewHeading("");
  };

  const removeHeading = (i: number) =>
    setHeadings(h => h.filter((_, idx) => idx !== i));

  /* ===== EDIT TEMPLATE ===== */
  const handleEdit = (t: TemplateItem) => {
    setEditingId(t.id);
    setTemplateName(t.name);
    setTemplateType(t.templateType as any);
    setHeadings(t.structure);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setTemplateName("");
    setTemplateType("");
    setHeadings([]);
    setNewHeading("");
  };

  /* ===== DELETE TEMPLATE ===== */
  const handleDelete = async (id: number) => {
    try {
      const res = await authFetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Deleted",
        description: "Template removed successfully",
      });

      if (editingId === id) resetForm();
      fetchTemplates();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  /* ===== SAVE TEMPLATE ===== */
  const saveTemplate = async () => {
    if (!templateName || !templateType || headings.length === 0) {
      toast({
        title: "Validation error",
        description: "Fill all fields and add at least one heading",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: templateName,
      templateType: templateType,
      sectionsCount: headings.length,
      description: `${templateType} template`,
      structure: JSON.stringify({
        headings,
      }),
      checklist: JSON.stringify([]),
    };

    try {
      const url = editingId ? `${BASE_URL}/${editingId}` : BASE_URL;
      const method = editingId ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Success",
        description: `Template ${editingId ? "updated" : "created"} successfully`,
      });

      resetForm();
      fetchTemplates();
    } catch {
      toast({
        title: "Error",
        description: `Failed to ${editingId ? "update" : "save"} template`,
        variant: "destructive",
      });
    }
  };

  /* ===== UI ===== */
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">

      {/* HEADER & FORM SECTION */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Template Builder</h1>
            <p className="text-muted-foreground mt-1">Design and manage course file structures for your department.</p>
          </div>
          {editingId && (
            <Button variant="outline" onClick={resetForm}>
              <RotateCcw className="mr-2 h-4 w-4" /> Cancel Editing
            </Button>
          )}
        </div>

        {/* EDITOR CARD */}
        <Card className={`border-2 ${editingId ? "border-blue-500/20 shadow-lg" : "border-muted"}`}>
          <CardHeader className="pb-4 border-b bg-muted/20">
            <CardTitle className="flex items-center text-lg">
              {editingId ? <Edit className="mr-2 h-5 w-5 text-blue-500" /> : <Plus className="mr-2 h-5 w-5 text-green-500" />}
              {editingId ? "Edit Existing Template" : "Create New Template"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid lg:grid-cols-2 gap-8">

            {/* LEFT: INFO */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  placeholder="e.g. B.Tech Computer Science 2025"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Template Type</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={templateType}
                  onChange={e =>
                    setTemplateType(e.target.value as any)
                  }
                >
                  <option value="">Select Type...</option>
                  <option value="THEORY">Theory Course</option>
                  <option value="LAB">Laboratory Course</option>
                  <option value="PROJECT">Project Work</option>
                </select>
              </div>

              <Button
                onClick={saveTemplate}
                className={`w-full h-11 text-base ${editingId ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                <Save className="mr-2 h-4 w-4" />
                {editingId ? "Update Template" : "Save Template"}
              </Button>
            </div>

            {/* RIGHT: HEADINGS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Structure Layout</label>
                <Badge variant="secondary">{headings.length} Units</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add Unit/Heading (Press Enter)"
                    value={newHeading}
                    onChange={e => setNewHeading(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addHeading()}
                  />
                  <Button onClick={addHeading} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border rounded-md min-h-[200px] max-h-[300px] overflow-y-auto bg-muted/10 p-1">
                  {headings.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 space-y-2">
                      <LayoutTemplate className="h-8 w-8 opacity-20" />
                      <span className="text-sm">No structure defined yet</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {headings.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-card border p-2.5 rounded-md group text-sm"
                        >
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <span className="flex-1 font-medium">{h.title}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeHeading(i)}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      <div className="my-8 border-t" />

      {/* LIST SECTION (BOTTOM) */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Existing Templates</h2>

        {templates.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
            <p className="text-muted-foreground">No templates created yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(t => (
              <Card key={t.id} className={`group hover:border-primary/50 transition-all ${editingId === t.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                <CardHeader className="pb-3 relative">
                  <div className="flex justify-between items-start">
                    <Badge
                      className={
                        t.templateType === 'THEORY' ? "bg-blue-600" :
                          t.templateType === 'LAB' ? "bg-purple-600 text-white" :
                            "bg-orange-600 text-white"
                      }
                    >
                      {t.templateType}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleEdit(t)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="z-[9999]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the
                              <span className="font-semibold text-foreground"> {t.name}</span> template.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-red-600 hover:bg-red-700">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardTitle className="leading-tight">{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    Total Units: <span className="font-medium text-foreground">{t.structure.length}</span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-md space-y-1.5 min-h-[80px]">
                    {t.structure.slice(0, 3).map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        <span className="truncate">{h.title}</span>
                      </div>
                    ))}
                    {t.structure.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-3.5 pt-1">
                        + {t.structure.length - 3} more units...
                      </div>
                    )}
                    {t.structure.length === 0 && (
                      <span className="text-xs text-muted-foreground italic">No structure defined</span>
                    )}
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
