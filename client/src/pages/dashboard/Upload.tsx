
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function UploadPage() {
  const [files, setFiles] = useState<Array<{ file: File; progress: number; status: 'uploading' | 'completed' | 'error' }>>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));
    
    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload for each file
    newFiles.forEach((fileObj, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setFiles(prev => {
          const newPrev = [...prev];
          // Find the file in the current state that matches the one we're uploading
          // Note: This is a simple simulation, in real app use IDs
          const targetIndex = prev.length - newFiles.length + index;
          if (newPrev[targetIndex]) {
            newPrev[targetIndex] = {
              ...newPrev[targetIndex],
              progress: Math.min(progress, 100),
              status: progress >= 100 ? 'completed' : 'uploading'
            };
          }
          return newPrev;
        });

        if (progress >= 100) {
          clearInterval(interval);
          toast({
            title: "Upload Completed",
            description: `${fileObj.file.name} has been uploaded successfully.`,
          });
        }
      }, 300);
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Upload Files</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Course</CardTitle>
          <CardDescription>Choose the course you want to upload files for.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cs101">CS101 - Intro to CS</SelectItem>
              <SelectItem value="eng202">ENG202 - Advanced Composition</SelectItem>
              <SelectItem value="math301">MATH301 - Linear Algebra</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <UploadCloud className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? "Drop the files here" : "Drag & drop files here, or click to select files"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: PDF, DOCX, JPG, PNG (Max 50MB)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((fileObj, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{fileObj.file.name}</span>
                    <span>{fileObj.progress}%</span>
                  </div>
                  <Progress value={fileObj.progress} className="h-2" />
                </div>
                <div className="w-8 flex justify-center">
                  {fileObj.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
