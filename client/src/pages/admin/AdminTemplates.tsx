import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Code, Trash2, Edit, X, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/utils/authFetch";

/* =======================
   TYPES
======================= */

interface Template {
  id?: number;
  departmentId?: number;
  name: string;
  description?: string;
  structure: string; // JSON string
  checklist?: string; // JSON string
  createdBy?: number;
  createdAt?: string;
}

interface TemplateFormProps {
  templateName: string;
  setTemplateName: (val: string) => void;
  templateDesc: string;
  setTemplateDesc: (val: string) => void;
  sections: string[];
  setSections: (sections: string[]) => void;
  newSection: string;
  setNewSection: (val: string) => void;
  isEdit?: boolean;
}

/* =======================
   SUB-COMPONENT
======================= */

const TemplateFormContent = ({
  templateName,
  setTemplateName,
  templateDesc,
  setTemplateDesc,
  sections,
  setSections,
  newSection,
  setNewSection,
}: TemplateFormProps) => {
  const addSection = () => {
    if (newSection.trim()) {
      setSections([...sections, newSection.trim()]);
      setNewSection("");
    }
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSection();
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Template Name *</Label>
        <Input
          placeholder="e.g. DBMS Course Structure"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Brief description of this template"
          value={templateDesc}
          onChange={(e) => setTemplateDesc(e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Sections / Structure</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add section name and press Enter"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={addSection} variant="outline" type="button">
            Add
          </Button>
        </div>
        <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
          {sections.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No sections added yet
            </p>
          )}
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-muted p-2 rounded group"
            >
              <span className="text-sm font-mono flex items-center gap-2">
                <Code className="h-3 w-3 text-muted-foreground" />
                {section}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => removeSection(idx)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =======================
   MAIN COMPONENT
======================= */

export default function AdminTemplatesPage() {
  const { toast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form states
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [newSection, setNewSection] = useState("");

  /* =======================
     LOAD TEMPLATES
  ======================= */

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await authFetch("/api/templates/department");
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : []);
      } else {
        // Try getting all templates if department endpoint fails
        const allRes = await authFetch("/api/templates");
        if (allRes.ok) {
          const allData = await allRes.json();
          setTemplates(Array.isArray(allData) ? allData : []);
        }
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates from database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     PARSE STRUCTURE
  ======================= */

  const parseStructure = (structure: string | string[] | undefined): string[] => {
    if (!structure) return [];
    if (Array.isArray(structure)) return structure;
    try {
      const parsed = JSON.parse(structure);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  /* =======================
     RESET FORM
  ======================= */

  const resetForm = () => {
    setTemplateName("");
    setTemplateDesc("");
    setSections([]);
    setNewSection("");
    setEditingTemplate(null);
  };

  /* =======================
     CREATE TEMPLATE
  ======================= */

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: "Error", description: "Please enter template name", variant: "destructive" });
      return;
    }

    if (sections.length === 0) {
      toast({ title: "Error", description: "Please add at least one section", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: templateName,
        description: templateDesc || `Template with ${sections.length} sections`,
        structure: JSON.stringify(sections),
        checklist: JSON.stringify([]),
      };

      const res = await authFetch("/api/templates", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Template created and saved to database" });
        resetForm();
        setIsCreateOpen(false);
        loadTemplates();
      } else {
        const error = await res.text();
        toast({ title: "Error", description: error || "Failed to create template", variant: "destructive" });
      }
    } catch (error) {
      console.error("Create error:", error);
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  /* =======================
     EDIT TEMPLATE
  ======================= */

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDesc(template.description || "");
    setSections(parseStructure(template.structure));
    setIsEditOpen(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate?.id) return;

    if (!templateName.trim()) {
      toast({ title: "Error", description: "Please enter template name", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: templateName,
        description: templateDesc,
        structure: JSON.stringify(sections),
        checklist: editingTemplate.checklist || JSON.stringify([]),
      };

      const res = await authFetch(`/api/templates/${editingTemplate.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Template updated successfully" });
        resetForm();
        setIsEditOpen(false);
        loadTemplates();
      } else {
        const error = await res.text();
        toast({ title: "Error", description: error || "Failed to update template", variant: "destructive" });
      }
    } catch (error) {
      console.error("Update error:", error);
      toast({ title: "Error", description: "Failed to update template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  /* =======================
     DELETE TEMPLATE
  ======================= */

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await authFetch(`/api/templates/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "Deleted", description: "Template removed from database" });
        loadTemplates();
      } else {
        toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    }
  };

  /* =======================
     UI
  ======================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Templates</h1>
          <p className="text-muted-foreground mt-1">
            Define structure and required fields for course files.
          </p>
        </div>

        {/* CREATE DIALOG */}
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <TemplateFormContent
              templateName={templateName}
              setTemplateName={setTemplateName}
              templateDesc={templateDesc}
              setTemplateDesc={setTemplateDesc}
              sections={sections}
              setSections={setSections}
              newSection={newSection}
              setNewSection={setNewSection}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTemplate}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* TEMPLATES GRID */}
      {templates.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No templates found.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click "Create Template" to add your first template.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="group hover:border-blue-500 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2">
                    Template
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* EDIT BUTTON */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-600"
                      onClick={() => openEditDialog(t)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {/* DELETE BUTTON */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600"
                      onClick={() => t.id && handleDeleteTemplate(t.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{t.name}</CardTitle>
                {t.description && (
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-3 rounded-md font-mono text-xs text-muted-foreground space-y-1">
                  {parseStructure(t.structure).length > 0 ? (
                    parseStructure(t.structure).map((field, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Code className="h-3 w-3" /> {field}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No sections defined</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <TemplateFormContent
            templateName={templateName}
            setTemplateName={setTemplateName}
            templateDesc={templateDesc}
            setTemplateDesc={setTemplateDesc}
            sections={sections}
            setSections={setSections}
            newSection={newSection}
            setNewSection={setNewSection}
            isEdit
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTemplate}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
