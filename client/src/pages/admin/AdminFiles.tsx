
import { useState } from "react";
import { files } from "@/lib/dummy-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List, FileText, MoreVertical, Download, Trash, CheckSquare, Square } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function AdminFilesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "list">("list"); // Default to list for admin
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);

  const filteredFiles = files.filter(
    (f) => f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    if (selectedFiles.includes(id)) {
      setSelectedFiles(selectedFiles.filter(fid => fid !== id));
    } else {
      setSelectedFiles([...selectedFiles, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(f => f.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Manager</h1>
          <p className="text-muted-foreground mt-1">Global file administration and cleanup.</p>
        </div>
        
        {selectedFiles.length > 0 && (
           <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
             <span className="text-sm font-medium text-blue-700 dark:text-blue-300 px-2">{selectedFiles.length} selected</span>
             <Button size="sm" variant="destructive">Delete Selected</Button>
           </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
                <Input
                placeholder="Search all files..."
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
        
        <div className="flex gap-2 w-full sm:w-auto">
            <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="cs101">CS101</SelectItem>
                <SelectItem value="math301">MATH301</SelectItem>
            </SelectContent>
            </Select>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className={`group relative transition-shadow ${selectedFiles.includes(file.id) ? 'ring-2 ring-blue-600 border-blue-600' : 'hover:shadow-md'}`}>
              <div className="absolute top-2 left-2 z-10">
                 <button onClick={() => toggleSelect(file.id)} className="text-muted-foreground hover:text-primary">
                    {selectedFiles.includes(file.id) ? <CheckSquare className="h-5 w-5 text-blue-600 bg-white rounded-sm" /> : <Square className="h-5 w-5" />}
                 </button>
              </div>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pl-10">
                <div className="bg-primary/5 p-2 rounded-md">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base font-medium truncate" title={file.name}>
                  {file.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{file.course}</p>
                <div className="flex gap-2 mt-3">
                  {file.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 h-5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground border-t pt-3">
                <span>{file.size}</span>
                <span className="mx-2">•</span>
                <span>{file.date}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
           <table className="w-full text-sm text-left">
             <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
               <tr>
                 <th className="p-4 w-10">
                    <button onClick={toggleSelectAll}>
                        {selectedFiles.length === filteredFiles.length && filteredFiles.length > 0 ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                    </button>
                 </th>
                 <th className="p-4">File Name</th>
                 <th className="p-4">Course</th>
                 <th className="p-4">Type</th>
                 <th className="p-4">Size</th>
                 <th className="p-4">Date Uploaded</th>
                 <th className="p-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody>
               {filteredFiles.map((file) => (
                 <tr key={file.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${selectedFiles.includes(file.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                   <td className="p-4">
                      <button onClick={() => toggleSelect(file.id)}>
                         {selectedFiles.includes(file.id) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                      </button>
                   </td>
                   <td className="p-4 font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {file.name}
                   </td>
                   <td className="p-4 text-muted-foreground">{file.course}</td>
                   <td className="p-4 uppercase text-xs font-bold text-muted-foreground">{file.type}</td>
                   <td className="p-4 text-muted-foreground">{file.size}</td>
                   <td className="p-4 text-muted-foreground">{file.date}</td>
                   <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
}
