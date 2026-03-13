import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EnhancedCourseFileView } from "@/components/EnhancedCourseFileView";
import { RefreshCw } from "lucide-react";
import { authFetch } from "@/utils/authFetch";

interface CourseFileDetails {
  id: number;
  courseCode: string;
  courseTitle: string;
  teacherName: string;
}

export default function ViewCourseFilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [courseFileId, setCourseFileId] = useState<number | null>(null);
  const [courseFile, setCourseFile] = useState<CourseFileDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idParam = searchParams.get("id");
    const storageId = localStorage.getItem("viewCourseFileId");
    const id = idParam ? parseInt(idParam) : storageId ? parseInt(storageId) : null;
    if (id) {
      setCourseFileId(id);
      loadData(id);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const loadData = async (id: number) => {
    setLoading(true);
    try {
      const detailsRes = await authFetch(`/api/review/course-file/${id}`);
      if (detailsRes.ok) {
        const data = await detailsRes.json();
        setCourseFile({
          id: data.id,
          courseCode: data.courseCode || "",
          courseTitle: data.courseTitle || "",
          teacherName: data.teacherName || "",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!courseFile || !courseFileId) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border">
          <p className="text-slate-500 font-medium">Record not found or access denied.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <EnhancedCourseFileView
      courseFileId={courseFileId}
      courseName={courseFile.courseTitle}
      courseCode={courseFile.courseCode}
      teacherName={courseFile.teacherName}
      onClose={() => navigate(-1)}
      useReviewApi={true}
    />
  );
}
