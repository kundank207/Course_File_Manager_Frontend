import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit2, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function AdminCoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [formData, setFormData] = useState({ code: "", title: "", credits: "", contact_hour: "", semester_id: "", program_id: "", branch_id: "" });

  useEffect(() => {
    const stored = localStorage.getItem("admin_courses") || JSON.stringify([
      { id: 1, program_id: 1, branch_id: 1, semester_id: 1, code: "CS101", title: "Intro to Computer Science", credits: 4, contact_hour: 60 },
      { id: 2, program_id: 1, branch_id: 1, semester_id: 2, code: "CS201", title: "Data Structures", credits: 4, contact_hour: 60 },
      { id: 3, program_id: 1, branch_id: 1, semester_id: 3, code: "CS301", title: "Database Management", credits: 4, contact_hour: 60 },
      { id: 4, program_id: 1, branch_id: 1, semester_id: 4, code: "CS401", title: "Web Development", credits: 4, contact_hour: 60 },
    ]);
    setCourses(JSON.parse(stored));
  }, []);

  const handleAddCourse = () => {
    if (!formData.code || !formData.title || !formData.credits || !formData.contact_hour) {
      toast({ title: "Error", description: "Fill all required fields" });
      return;
    }
    const newCourse = { id: Math.max(...courses.map(c => c.id), 0) + 1, ...formData, credits: parseInt(formData.credits), contact_hour: parseInt(formData.contact_hour), semester_id: parseInt(formData.semester_id || "1"), program_id: 1, branch_id: 1 };
    const updated = [...courses, newCourse];
    setCourses(updated);
    localStorage.setItem("admin_courses", JSON.stringify(updated));
    toast({ title: "Success", description: "Course created" });
    setFormData({ code: "", title: "", credits: "", contact_hour: "", semester_id: "", program_id: "", branch_id: "" });
    setIsAddOpen(false);
  };

  const handleEditCourse = () => {
    if (!formData.code || !formData.title || !formData.credits || !formData.contact_hour) {
      toast({ title: "Error", description: "Fill all required fields" });
      return;
    }
    const updated = courses.map(c => c.id === editingCourse.id ? { ...c, code: formData.code, title: formData.title, credits: parseInt(formData.credits), contact_hour: parseInt(formData.contact_hour) } : c);
    setCourses(updated);
    localStorage.setItem("admin_courses", JSON.stringify(updated));
    toast({ title: "Success", description: "Course updated" });
    setEditingCourse(null);
    setIsEditOpen(false);
    setFormData({ code: "", title: "", credits: "", contact_hour: "", semester_id: "", program_id: "", branch_id: "" });
  };

  /* ================= DELETE ================= */
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const confirmDelete = () => {
    if (!deleteId) return;
    const updated = courses.filter(c => c.id !== deleteId);
    setCourses(updated);
    localStorage.setItem("admin_courses", JSON.stringify(updated));
    toast({ title: "Deleted", description: "Course removed" });
    setDeleteId(null);
  };

  const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground mt-1">Oversee all active and archived courses.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Create New Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Course Code</Label><Input placeholder="e.g. CS501" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
              <div><Label>Course Title</Label><Input placeholder="e.g. Advanced AI" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
              <div><Label>Credits</Label><Input type="number" placeholder="e.g. 4" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: e.target.value })} /></div>
              <div><Label>Contact Hours</Label><Input type="number" placeholder="e.g. 60" value={formData.contact_hour} onChange={(e) => setFormData({ ...formData, contact_hour: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={handleAddCourse}>Create Course</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) { setEditingCourse(null); setIsEditOpen(false); setFormData({ code: "", title: "", credits: "", contact_hour: "", semester_id: "", program_id: "", branch_id: "" }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Course Code</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
            <div><Label>Course Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><Label>Credits</Label><Input type="number" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: e.target.value })} /></div>
            <div><Label>Contact Hours</Label><Input type="number" value={formData.contact_hour} onChange={(e) => setFormData({ ...formData, contact_hour: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleEditCourse}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center py-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Contact Hours</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-mono font-medium text-blue-600">{course.code}</TableCell>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.credits}</TableCell>
                <TableCell>{course.contact_hour}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCourse(course); setFormData({ code: course.code, title: course.title, credits: course.credits.toString(), contact_hour: course.contact_hour.toString(), semester_id: "", program_id: "", branch_id: "" }); setIsEditOpen(true); }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => { setDeleteId(course.id); setDeleteName(course.title); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium text-slate-800">
              Kya aap sach mein ise delete karna chahte hain? Isse data hamesha ke liye chala jayega.
            </p>
            {deleteName && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 italic">
                <b>Deleting Course:</b> {deleteName}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Nahi, Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Haan, Delete Kar Do
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
