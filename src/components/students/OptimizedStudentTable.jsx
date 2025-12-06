import React, { useMemo, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, Share2, ArrowRightLeft } from "lucide-react";
import { useIntersectionObserver } from "@/components/utils/performanceOptimizer";

// 🚀 Memoized row component for performance
const StudentRow = React.memo(({ student, onEdit, onDelete, onViewIdCard, onShareParentApp, onMoveStudent }) => {
  const [imgRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <TableRow ref={imgRef}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            {isVisible && student.student_photo ? (
              <AvatarImage
                src={student.student_photo}
                alt={student.full_name}
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <AvatarFallback className="text-sm">
              {student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{student.full_name}</p>
            <p className="text-xs text-slate-500">{student.student_id}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {student.class && <Badge variant="outline">{student.class}</Badge>}
        {student.section && <Badge variant="secondary" className="ml-1">{student.section}</Badge>}
        {student.course_name && <Badge variant="outline">{student.course_name}</Badge>}
      </TableCell>
      <TableCell className="text-sm">{student.father_name || student.guardian_name || 'N/A'}</TableCell>
      <TableCell className="text-sm">{student.parent_whatsapp || student.parent_email || 'N/A'}</TableCell>
      <TableCell>
        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
          {student.status || 'active'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button onClick={() => onViewIdCard(student)} variant="ghost" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
          <Button onClick={() => onEdit(student)} variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button onClick={() => onShareParentApp(student)} variant="ghost" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button onClick={() => onMoveStudent(student)} variant="ghost" size="sm">
            <ArrowRightLeft className="w-4 h-4" />
          </Button>
          <Button onClick={() => onDelete(student.id)} variant="ghost" size="sm" className="text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

StudentRow.displayName = 'StudentRow';

// 🎯 Main optimized table component
export default function OptimizedStudentTable({ 
  students, 
  isLoading, 
  onEdit, 
  onDelete, 
  onViewIdCard, 
  onShareParentApp,
  onMoveStudent 
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50; // Show 50 students per page for performance

  // Memoized pagination
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return students.slice(startIndex, startIndex + pageSize);
  }, [students, currentPage, pageSize]);

  const totalPages = Math.ceil(students.length / pageSize);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-slate-500 mt-4">Loading students...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No students found. Add your first student to get started!
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Student</TableHead>
                <TableHead className="font-semibold">Class/Course</TableHead>
                <TableHead className="font-semibold">Parent/Guardian</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewIdCard={onViewIdCard}
                  onShareParentApp={onShareParentApp}
                  onMoveStudent={onMoveStudent}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, students.length)} of {students.length} students
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}