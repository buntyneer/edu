
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Student, Batch } from "@/api/entities";
import { useAppData } from "../layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, Download, Search, Link as LinkIcon, RefreshCw, Users, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useDebounce } from "@/components/utils/performanceOptimizer";

// 🚀 PERFORMANCE: Lazy load heavy components
const OptimizedStudentTable = React.lazy(() => import("../components/students/OptimizedStudentTable"));
const SmartStudentForm = React.lazy(() => import("../components/students/SmartStudentForm"));
const StudentIdCard = React.lazy(() => import("../components/students/StudentIdCard"));
const GenerateLinkDialog = React.lazy(() => import("../components/dashboard/GenerateLinkDialog"));
const ParentAppLink = React.lazy(() => import("../components/students/ParentAppLink"));
const MoveStudentDialog = React.lazy(() => import("../components/students/MoveStudentDialog"));

export default function StudentsPage() {
  const { user, school } = useAppData() || {};

  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingStudent, setViewingStudent] = useState(null);
  const [showGenerateLinkDialog, setShowGenerateLinkDialog] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showParentAppDialog, setShowParentAppDialog] = useState(false);
  const [selectedStudentForApp, setSelectedStudentForApp] = useState(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [movingStudent, setMovingStudent] = useState(null);

  // Filters state
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  
  // 🚀 PERFORMANCE: Debounce search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const isSchoolType = school?.institute_type === 'school';

  const loadData = useCallback(async () => {
    if (!school) return;
    setIsLoading(true);
    try {
      const fetchedStudents = await Student.filter({ school_id: school.id });
      setStudents(fetchedStudents);
      if (!isSchoolType) {
          const fetchedBatches = await Batch.filter({ school_id: school.id });
          setBatches(fetchedBatches);
      }
      setDataLoaded(true);
    } catch (error) {
      toast.error("Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  }, [school, isSchoolType]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleMoveStudent = (student) => {
    setMovingStudent(student);
    setShowMoveDialog(true);
  };

  const handleMoveConfirm = async (updateData) => {
    if (!movingStudent) return;
    try {
      await Student.update(movingStudent.id, updateData);
      toast.success(`${movingStudent.full_name} moved successfully!`);
      setShowMoveDialog(false);
      setMovingStudent(null);
      loadData();
    } catch (error) {
      toast.error("Failed to move student.");
    }
  };

  const handleFormSubmit = async (studentData) => {
    if (!school) return;
    try {
      if (editingStudent) {
        await Student.update(editingStudent.id, studentData);
        toast.success("Student updated successfully!");
      } else {
        const student_id = `${(school.school_name || 'INS').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        await Student.create({ ...studentData, school_id: school.id, student_id });
        toast.success("New student added!");
      }
      setShowForm(false);
      setEditingStudent(null);
      loadData();
    } catch (error) {
      toast.error("Failed to save student.");
    }
  };
  
  const handleDelete = async (studentId) => {
      if (!window.confirm("Sure you want to delete?")) return;
      await Student.delete(studentId);
      loadData();
  };
  
  const handleCloseForm = () => {setShowForm(false); setEditingStudent(null);};
  const handleEdit = (student) => {setEditingStudent(student); setShowForm(true);};
  const handleViewIdCard = (student) => setViewingStudent(student);
  const handleShareParentApp = (student) => {setSelectedStudentForApp(student); setShowParentAppDialog(true);};

  // 🚀 PERFORMANCE: Memoized filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const searchMatch = student.full_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          student.student_id?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const classMatch = isSchoolType ? (classFilter === 'all' || student.class === classFilter) : true;
      const sectionMatch = isSchoolType ? (sectionFilter === 'all' || student.section === sectionFilter) : true;
      const batchMatch = !isSchoolType ? (batchFilter === 'all' || student.batch_id === batchFilter) : true;
      return searchMatch && classMatch && sectionMatch && batchMatch;
    });
  }, [students, debouncedSearchTerm, classFilter, sectionFilter, batchFilter, isSchoolType]);

  if (!school) return <div className="p-6 text-center">Initializing...</div>;

  return (
    <>
      <div className="p-6 space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Student Management</h1>
            <p className="text-slate-600 mt-1">Managing students for {school.school_name}</p>
          </div>
          <div className="flex gap-3">
             <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" /> Add Student</Button>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <React.Suspense fallback={<div className="text-center py-4">Loading form...</div>}>
              <SmartStudentForm 
                student={editingStudent} 
                instituteType={school.institute_type} 
                school={school} 
                onSubmit={handleFormSubmit} 
                onCancel={handleCloseForm} 
              />
            </React.Suspense>
          )}
        </AnimatePresence>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
            <div className="flex flex-wrap items-end gap-4 pt-4">
                <div className="flex-grow"><Input placeholder="Search by name, ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                {isSchoolType ? (
                    <>
                    <div className="flex-grow"><Select value={classFilter} onValueChange={setClassFilter}><SelectTrigger><SelectValue placeholder="Filter by Class" /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{school.classes_offered?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <div className="flex-grow"><Select value={sectionFilter} onValueChange={setSectionFilter}><SelectTrigger><SelectValue placeholder="Filter by Section" /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{school.default_sections?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                    </>
                ) : (
                    <div className="flex-grow"><Select value={batchFilter} onValueChange={setBatchFilter}><SelectTrigger><SelectValue placeholder="Filter by Batch" /></SelectTrigger><SelectContent><SelectItem value="all">All Batches</SelectItem>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.batch_name}</SelectItem>)}</SelectContent></Select></div>
                )}
                 <Button onClick={() => { setClassFilter("all"); setSectionFilter("all"); setBatchFilter("all"); setSearchTerm("");}} variant="ghost">Clear Filters</Button>
            </div>
          </CardHeader>
          <CardContent>
            <React.Suspense fallback={<div className="text-center py-12">Loading table...</div>}>
              <OptimizedStudentTable
                students={filteredStudents}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewIdCard={handleViewIdCard}
                onShareParentApp={handleShareParentApp}
                onMoveStudent={handleMoveStudent}
              />
            </React.Suspense>
          </CardContent>
        </Card>
      </div>
      
      {viewingStudent && (
        <React.Suspense fallback={null}>
          <StudentIdCard 
            student={viewingStudent} 
            schoolName={school.school_name} 
            schoolLogo={school.logo_url}
            instituteType={school.institute_type}
            onOpenChange={() => setViewingStudent(null)} 
          />
        </React.Suspense>
      )}
      
      {selectedStudentForApp && (
        <React.Suspense fallback={null}>
          <ParentAppLink 
            student={selectedStudentForApp} 
            schoolName={school.school_name} 
            open={showParentAppDialog} 
            onOpenChange={open => { if(!open) setSelectedStudentForApp(null); setShowParentAppDialog(open);}} 
          />
        </React.Suspense>
      )}
      
      {showGenerateLinkDialog && (
        <React.Suspense fallback={null}>
          <GenerateLinkDialog 
            open={showGenerateLinkDialog} 
            onOpenChange={setShowGenerateLinkDialog} 
            schoolId={school.id} 
          />
        </React.Suspense>
      )}
      
      {movingStudent && (
        <React.Suspense fallback={null}>
          <MoveStudentDialog 
            open={showMoveDialog} 
            onOpenChange={setShowMoveDialog} 
            student={movingStudent} 
            school={school} 
            onMoveConfirm={handleMoveConfirm} 
          />
        </React.Suspense>
      )}
    </>
  );
}
