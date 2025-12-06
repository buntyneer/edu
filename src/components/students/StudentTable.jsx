import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, CreditCard, Users, Pencil, Share2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function StudentTable({ students, isLoading, onEdit, onDelete, onViewIdCard, onShareParentApp, onMoveStudent }) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-500">Loading students...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <p className="text-lg font-semibold text-slate-700 mb-2">No Students Found</p>
        <p className="text-slate-500">Add your first student to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Student ID</TableHead>
            <TableHead>Course/Class</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <Avatar>
                  {/* ✅ OPTIMIZATION 1: Lazy loading images */}
                  <AvatarImage src={student.student_photo} alt={student.full_name} loading="lazy" />
                  <AvatarFallback>{student.full_name?.charAt(0) || 'S'}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">{student.full_name}</TableCell>
              <TableCell>
                <Badge variant="outline">{student.student_id}</Badge>
              </TableCell>
              <TableCell>
                {student.course_name || (student.class ? `${student.class}${student.section ? ` - ${student.section}` : ''}` : 'N/A')}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {student.parent_whatsapp || student.parent_email || 'No contact'}
              </TableCell>
              <TableCell>
                <Badge className={student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {student.status || 'active'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(student)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewIdCard(student)}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      View ID Card
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onShareParentApp(student)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Parent App
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveStudent(student)}>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Move Student
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(student.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}