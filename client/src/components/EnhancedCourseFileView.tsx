import { useState, useEffect } from "react";
import { X, FileText, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/utils/authFetch";
import { useToast } from "@/hooks/use-toast";

interface FileItem {
    id: string;
    fileName: string;
    fileUrl?: string;
}

interface HeadingItem {
    id: number;
    title: string;
    files?: FileItem[];
    documents?: { id: number; fileName: string }[];
    children: HeadingItem[];
}

interface EnhancedCourseFileViewProps {
    courseFileId: number;
    courseName: string;
    courseCode: string;
    teacherName?: string;
    onClose: () => void;
    useReviewApi?: boolean;
}

export function EnhancedCourseFileView({
    courseFileId,
    courseName,
    courseCode,
    teacherName,
    onClose,
    useReviewApi = false,
}: EnhancedCourseFileViewProps) {
    const { toast } = useToast();
    const [headings, setHeadings] = useState<HeadingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string>("");

    useEffect(() => {
        loadHeadings();
    }, [courseFileId]);

    const loadHeadings = async () => {
        try {
            const apiUrl = useReviewApi
                ? `/api/review/course-file/${courseFileId}/tree`
                : `/api/teacher/headings/course-file/${courseFileId}/tree`;

            const res = await authFetch(apiUrl);
            if (res.ok) {
                const data = await res.json();
                const normalizedData = normalizeHeadings(data);
                setHeadings(normalizedData);
                if (normalizedData.length > 0) {
                    setActiveSection(`section-${normalizedData[0].id}`);
                }
            }
        } catch (error) {
            console.error("Failed to load headings:", error);
        } finally {
            setLoading(false);
        }
    };

    const normalizeHeadings = (items: any[]): HeadingItem[] => {
        return items.map((item) => ({
            id: item.id,
            title: item.title,
            files: normalizeFiles(item),
            children: item.children ? normalizeHeadings(item.children) : [],
        }));
    };

    const normalizeFiles = (item: any): FileItem[] => {
        const fileList = item.files || item.documents || [];
        return fileList.map((f: any) => ({
            id: String(f.id),
            fileName: f.fileName,
            fileUrl: f.fileUrl,
        }));
    };

    const handleViewFile = async (fileId: string, fileName: string) => {
        try {
            const res = await authFetch(`/api/teacher/documents/view/${fileId}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, "_blank");
            } else {
                throw new Error("Failed to view file");
            }
        } catch (error) {
            console.error("Failed to get file URL:", error);
            toast({ title: "Error", description: "Failed to open file", variant: "destructive" });
        }
    };

    const handleDownloadFile = async (fileId: string, fileName: string) => {
        try {
            const res = await authFetch(`/api/teacher/documents/download/${fileId}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast({ title: "Success", description: `Downloaded ${fileName}` });
            } else {
                throw new Error("Download failed");
            }
        } catch (error) {
            console.error("Failed to download file:", error);
            toast({ title: "Error", description: "Failed to download file", variant: "destructive" });
        }
    };

    const scrollToSection = (sectionId: string) => {
        setActiveSection(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Render document links with Open and Download buttons
    const renderDocumentLinks = (files: FileItem[]) => {
        if (!files || files.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2 my-3">
                {files.map((file) => (
                    <div
                        key={file.id}
                        className="flex items-center gap-2 p-3 border-2 border-[#2980b9] rounded-lg bg-white hover:bg-blue-50 transition-colors"
                    >
                        <FileText className="h-5 w-5 text-[#2980b9] flex-shrink-0" />
                        <span className="text-[#2c3e50] font-medium truncate max-w-[200px]">
                            {file.fileName}
                        </span>
                        <div className="flex gap-1 ml-2">
                            <button
                                onClick={() => handleViewFile(file.id, file.fileName)}
                                className="flex items-center gap-1 px-2 py-1 text-sm bg-[#2980b9] text-white rounded hover:bg-[#1f6aa5] transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Open
                            </button>
                            <button
                                onClick={() => handleDownloadFile(file.id, file.fileName)}
                                className="flex items-center gap-1 px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                title="Download file"
                            >
                                <Download className="h-4 w-4" />
                                Download
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Render headings matching coursefile.html structure exactly
    const renderSection = (items: HeadingItem[], level: number = 0, parentIndex: string = "") => {
        return items.map((item, index) => {
            const sectionNumber = parentIndex ? `${parentIndex}.${index + 1}` : `${index + 1}`;
            const sectionId = `section${item.id}`;

            return (
                <div key={item.id}>
                    {/* Main section heading - h2 style from coursefile.html */}
                    {level === 0 && (
                        <h2
                            id={sectionId}
                            style={{
                                fontSize: '22px',
                                color: '#2c3e50',
                                marginTop: '30px',
                            }}
                        >
                            {sectionNumber}. {item.title}
                        </h2>
                    )}

                    {/* Sub-section heading - h3 style */}
                    {level === 1 && (
                        <h3
                            style={{
                                fontSize: '15px',
                                color: '#2890c9',
                                borderBottom: '2px solid #ddd',
                                paddingBottom: '10px',
                                marginBottom: '10px',
                                marginLeft: '10px',
                            }}
                        >
                            {sectionNumber}. {item.title}
                        </h3>
                    )}

                    {/* Sub-sub-section heading - h4 style */}
                    {level >= 2 && (
                        <h4
                            style={{
                                fontSize: '15px',
                                color: '#2870d9',
                                borderBottom: '2px solid #ddd',
                                paddingBottom: '10px',
                                marginBottom: '10px',
                                marginLeft: '10px',
                            }}
                        >
                            {sectionNumber}. {item.title}
                        </h4>
                    )}

                    {/* Document links */}
                    {renderDocumentLinks(item.files || [])}

                    {/* Children */}
                    {item.children && item.children.length > 0 && (
                        <div style={{ marginLeft: level === 0 ? '0' : '20px' }}>
                            {renderSection(item.children, level + 1, sectionNumber)}
                        </div>
                    )}
                </div>
            );
        });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-[#f4f6f9] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-[#2980b9] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course file structure...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" style={{ fontFamily: "'Arial', sans-serif", backgroundColor: '#f4f6f9' }}>
            {/* Sidebar - exactly like coursefile.html */}
            <div
                className="fixed top-0 left-0 h-full overflow-y-auto"
                style={{
                    width: '250px',
                    backgroundColor: '#2c3e50',
                    paddingTop: '20px',
                    boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Close button */}
                <div style={{ padding: '0 30px 15px', borderBottom: '1px solid #34495e' }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-[#34495e] w-full justify-start"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Close View
                    </Button>
                </div>

                {/* Navigation links */}
                {headings.map((heading, index) => (
                    <a
                        key={heading.id}
                        onClick={() => scrollToSection(`section${heading.id}`)}
                        className="cursor-pointer block"
                        style={{
                            padding: '15px 30px',
                            textDecoration: 'none',
                            fontSize: '18px',
                            color: '#f4f6f9',
                            display: 'block',
                            transition: '0.3s',
                            backgroundColor: activeSection === `section${heading.id}` ? '#34495e' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#34495e';
                        }}
                        onMouseLeave={(e) => {
                            if (activeSection !== `section${heading.id}`) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        {index + 1}. {heading.title}
                    </a>
                ))}
            </div>

            {/* Content - exactly like coursefile.html */}
            <div
                className="h-full overflow-y-auto"
                style={{
                    marginLeft: '260px',
                    padding: '20px',
                }}
            >
                {/* Header */}
                <h1
                    style={{
                        fontSize: '26px',
                        color: '#2980b9',
                        borderBottom: '2px solid #ddd',
                        paddingBottom: '10px',
                        marginBottom: '10px',
                    }}
                >
                    Course File
                </h1>

                {/* Course info - h3 style from coursefile.html */}
                <h3 style={{ fontSize: '15px', color: '#2890c9', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '10px', marginLeft: '10px' }}>
                    Course Name: {courseName}
                </h3>
                <h3 style={{ fontSize: '15px', color: '#2890c9', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '10px', marginLeft: '10px' }}>
                    Course Code: {courseCode}
                </h3>
                {teacherName && (
                    <h3 style={{ fontSize: '15px', color: '#2890c9', borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '10px', marginLeft: '10px' }}>
                        Prepared by: {teacherName}
                    </h3>
                )}

                {/* Render sections */}
                {headings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>
                        <FileText style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
                        <p>No course structure found.</p>
                    </div>
                ) : (
                    renderSection(headings)
                )}
            </div>
        </div>
    );
}
