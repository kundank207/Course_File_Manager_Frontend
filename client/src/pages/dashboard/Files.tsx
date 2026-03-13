import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  FolderOpen,
  MoreVertical,
  Eye,
  Trash2,
  RefreshCw,
  LayoutGrid,
  List,
  PlusCircle,
  Edit,
  Share2,
  Copy,
  AlertCircle,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "@/utils/authFetch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { VersionComparisonModal } from "@/components/VersionComparisonModal";
import { ChangeLogModal } from "@/components/ChangeLogModal";
import { History, GitCompare } from "lucide-react";

interface CourseFile {
  id: number;
  course: {
    id: number;
    code: string;
    title: string;
  };
  academicYear: string;
  section: string;
  status: string;
  createdAt: string;
  revisionNumber?: number;
  versionCount?: number;
}

export default function FilesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my");

  // Sharing state
  const [sharingFile, setSharingFile] = useState<CourseFile | null>(null);
  const [allFaculty, setAllFaculty] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [teacherSearchOpen, setTeacherSearchOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Copy-Shared state
  const [copyingShare, setCopyingShare] = useState<any | null>(null);
  const [newAcademicYear, setNewAcademicYear] = useState("");
  const [newSection, setNewSection] = useState("");
  const [isCopying, setIsCopying] = useState(false);

  // Feature modals
  const [comparisonFile, setComparisonFile] = useState<CourseFile | null>(null);
  const [logFile, setLogFile] = useState<CourseFile | null>(null);

  const fetchCourseFiles = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/teacher/course-files/my");
      if (res.ok) {
        setCourseFiles(await res.json());
      }
    } catch (err) {
      console.error("Error fetching course files:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedWithMe = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/teacher/course-files/shared-with-me');
      if (res.ok) {
        setSharedWithMe(await res.json());
      }
    } catch (err) {
      console.error("Error fetching shared files:", err);
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

  useEffect(() => {
    if (activeTab === "my") {
      fetchCourseFiles();
    } else {
      fetchSharedWithMe();
    }
  }, [activeTab]);

  const filteredFiles = courseFiles.filter(
    (f) =>
      f.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.course?.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewCourseFile = (courseFile: CourseFile) => {
    localStorage.setItem('temp_selected_course', JSON.stringify({
      id: courseFile.course?.id,
      code: courseFile.course?.code,
      title: courseFile.course?.title
    }));
    localStorage.setItem('temp_selected_template', JSON.stringify({
      name: 'Course Template'
    }));
    navigate(`/teacher/course-structure/${courseFile.id}`);
  };

  const handleDelete = async (courseFileId: number) => {
    if (!confirm("Are you sure you want to delete this course file? All sections and files within it will be permanently deleted.")) {
      return;
    }

    try {
      const res = await authFetch(`/api/teacher/course-files/${courseFileId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast({ title: "Success", description: "Course file deleted successfully" });
        fetchCourseFiles();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete course file");
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      toast({ title: "Error", description: err.message || "Failed to delete course file", variant: "destructive" });
    }
  };

  const handleCreateRevision = async (courseFileId: number) => {
    try {
      const res = await authFetch(`/api/teacher/course-file/${courseFileId}/revision`, {
        method: "POST"
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "New Revision Created",
          description: `Revision ${data.revisionNumber} has been created as a DRAFT.`,
        });
        fetchCourseFiles();
        navigate(`/teacher/course-structure/${data.id}`);
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to create revision");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create revision",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive", label: string }> = {
      DRAFT: { variant: "outline", label: "Draft" },
      SUBMITTED: { variant: "secondary", label: "Submitted" },
      APPROVED: { variant: "default", label: "Approved" },
      FINAL_APPROVED: { variant: "default", label: "FINAL APPROVED" },
      REJECTED: { variant: "destructive", label: "Rejected" },
      UNDER_REVIEW_HOD: { variant: "secondary", label: "Under Review (HOD)" }
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleShare = async () => {
    if (!sharingFile || !selectedTeacherId) return;
    setIsSharing(true);
    try {
      const res = await authFetch('/api/teacher/course-files/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: sharingFile.id,
          sharedWithId: Number(selectedTeacherId),
          message: shareMessage
        })
      });

      if (res.ok) {
        toast({ title: "Shared", description: "Course file shared successfully." });
        setSharingFile(null);
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

  const handleCopyShared = async () => {
    if (!copyingShare) return;
    setIsCopying(true);
    try {
      const res = await authFetch('/api/teacher/course-files/copy-shared', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareId: copyingShare.id,
          academicYear: newAcademicYear,
          section: newSection
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: "Success", description: "File copied to your drafts." });
        setCopyingShare(null);
        setActiveTab("my");
        navigate(`/teacher/course-structure/${data.id}`);
      } else {
        throw new Error("Copy failed");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsCopying(false);
    }
  };

  const handleViewSharedFile = (share: any) => {
    navigate(`/teacher/view-course-file?id=${share.fileId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Files</h1>
          <p className="text-muted-foreground mt-1">View and manage your course file structures</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={activeTab === 'my' ? fetchCourseFiles : fetchSharedWithMe}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/teacher/template-selection')}>
            <Plus className="h-4 w-4 mr-2" />
            New Course File
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="my">My Files</TabsTrigger>
          <TabsTrigger value="shared">Shared With Me</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search course files..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-muted rounded-md p-1">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No course files yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first course file by selecting a template
                </p>
                <Button onClick={() => navigate('/teacher/template-selection')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course File
                </Button>
              </CardContent>
            </Card>
          ) : view === "grid" ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewCourseFile(file)}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <FolderOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewCourseFile(file); }}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        {file.status !== "FINAL_APPROVED" && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewCourseFile(file); }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        {(file.status === "APPROVED" || file.status === "FINAL_APPROVED") && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCreateRevision(file.id); }}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Update New Version
                          </DropdownMenuItem>
                        )}
                        {file.status !== "FINAL_APPROVED" && (
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        )}
                        {file.versionCount && file.versionCount >= 2 && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setComparisonFile(file); }}>
                            <GitCompare className="mr-2 h-4 w-4" /> Compare Versions
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLogFile(file); }}>
                          <History className="mr-2 h-4 w-4" /> View Change Log
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSharingFile(file); fetchAllFaculty(); }}>
                          <Share2 className="mr-2 h-4 w-4" /> Share
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base font-medium truncate" title={file.course?.title}>
                      {file.course?.code} - {file.course?.title}
                      {file.revisionNumber && file.revisionNumber > 1 && (
                        <span className="text-[10px] font-normal text-muted-foreground ml-2">
                          (Rev {file.revisionNumber})
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.academicYear} {file.section ? `• Section ${file.section}` : ''}
                    </p>
                    <div className="mt-3">
                      {getStatusBadge(file.status)}
                    </div>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground border-t pt-3">
                    <span>Created: {new Date(file.createdAt).toLocaleDateString()}</span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Course</th>
                    <th className="text-left p-3 text-sm font-medium">Academic Year</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Created</th>
                    <th className="text-right p-3 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => handleViewCourseFile(file)}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{file.course?.code}</span>
                          <span className="text-muted-foreground">- {file.course?.title}</span>
                          {file.revisionNumber && file.revisionNumber > 1 && (
                            <Badge variant="outline" className="text-[10px] h-4">Rev {file.revisionNumber}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm">{file.academicYear}</td>
                      <td className="p-3">{getStatusBadge(file.status)}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewCourseFile(file)} title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(file.status === "APPROVED" || file.status === "FINAL_APPROVED") && (
                            <Button variant="ghost" size="sm" onClick={() => handleCreateRevision(file.id)} title="Update New Version">
                              <RefreshCw className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => { setSharingFile(file); fetchAllFaculty(); }} title="Share">
                            <Share2 className="h-4 w-4" />
                          </Button>
                          {file.versionCount && file.versionCount >= 2 && (
                            <Button variant="ghost" size="sm" onClick={() => setComparisonFile(file)} title="Compare Versions">
                              <GitCompare className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setLogFile(file)} title="View Change Log">
                            <History className="h-4 w-4 text-purple-600" />
                          </Button>
                          {file.status !== "FINAL_APPROVED" && (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(file.id)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin" /></div>
          ) : sharedWithMe.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No files shared with you yet.</CardContent></Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {sharedWithMe.map(s => (
                <Card key={s.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-base truncate" title={`${s.courseCode} - ${s.courseTitle}`}>
                      {s.courseCode} - {s.courseTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2 flex-1">
                    <p>Shared by: <span className="font-semibold text-blue-600">{s.sharedBy}</span></p>
                    <p className="text-xs text-muted-foreground italic bg-slate-50 p-2 rounded border border-slate-100 min-h-[40px]">
                      "{s.message || 'No message'}"
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center border-t pt-3">
                    <span className="text-[10px] text-muted-foreground">{new Date(s.sharedAt).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewSharedFile(s)} title="Preview Structure">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={() => {
                        setCopyingShare(s);
                        setNewAcademicYear("");
                        setNewSection("");
                      }}>
                        <Copy className="h-3.5 w-3.5 mr-2" /> Copy & Edit
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* SHARING MODAL */}
      <Dialog open={!!sharingFile} onOpenChange={o => !o && setSharingFile(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share Course File</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Teacher</Label>
              <Popover open={teacherSearchOpen} onOpenChange={setTeacherSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedTeacherId ? (() => {
                      const f = allFaculty.find(f => String(f.id) === selectedTeacherId);
                      return f ? `${f.name} (${f.departmentName})` : "Select Teacher...";
                    })() : "Select Teacher..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search teacher by name or department..." />
                    <CommandList>
                      <CommandEmpty>No teacher found.</CommandEmpty>
                      <CommandGroup>
                        {allFaculty.map(f => (
                          <CommandItem
                            key={f.id}
                            value={`${f.name} ${f.departmentName} ${f.departmentCode}`}
                            onSelect={() => { setSelectedTeacherId(String(f.id)); setTeacherSearchOpen(false); }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedTeacherId === String(f.id) ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span className="font-medium">{f.name}</span>
                              <span className="text-xs text-muted-foreground">{f.departmentName} {f.departmentCode ? `(${f.departmentCode})` : ''}</span>
                            </div>
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

      {/* COPY MODAL */}
      <Dialog open={!!copyingShare} onOpenChange={o => !o && setCopyingShare(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Copy & Edit Shared File</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Specify your section and academic year for the copy.</p>
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input value={newAcademicYear} onChange={e => setNewAcademicYear(e.target.value)} placeholder="e.g. 2024-25" />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="e.g. A" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCopyShared} disabled={!newAcademicYear || !newSection || isCopying}>{isCopying ? "Copying..." : "Create My Copy"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FEATURE MODALS */}
      {comparisonFile && (
        <VersionComparisonModal
          isOpen={!!comparisonFile}
          onClose={() => setComparisonFile(null)}
          courseFileId={comparisonFile.id}
          courseTitle={`${comparisonFile.course?.code} - ${comparisonFile.course?.title}`}
        />
      )}
      {logFile && (
        <ChangeLogModal
          isOpen={!!logFile}
          onClose={() => setLogFile(null)}
          courseFileId={logFile.id}
          courseTitle={`${logFile.course?.code} - ${logFile.course?.title}`}
        />
      )}
    </div>
  );
}
