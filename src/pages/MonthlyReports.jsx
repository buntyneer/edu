import React, { useState, useEffect, useCallback } from "react";
import { Attendance, Student } from "@/api/entities";
import { useAppData } from "./Layout.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Download, BarChart, Users, AlertTriangle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function MonthlyReports() {
  const { school } = useAppData() || {};
  
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  const isSchoolType = school?.institute_type === 'school';

  const loadData = useCallback(async () => {
    if (!school) return;
    setIsLoading(true);
    try {
      const [studentsData, attendanceData] = await Promise.all([
        Student.filter({ school_id: school.id }),
        Attendance.filter({ school_id: school.id }, "-created_date", 500)
      ]);
      setStudents(studentsData);
      setAttendance(attendanceData);
      toast.success("Data loaded successfully!");
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [school]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (students.length && attendance.length) {
      generateReport();
    }
  }, [students, attendance, selectedMonth, selectedYear]);

  const generateReport = () => {
    const monthAttendance = attendance.filter(a => {
      const date = new Date(a.attendance_date);
      return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
    });

    const classData = {};
    
    students.forEach(student => {
      const classKey = isSchoolType ? `${student.class}-${student.section}` : student.course_name || 'N/A';
      
      if (!classData[classKey]) {
        classData[classKey] = {
          className: classKey,
          totalStudents: 0,
          studentDetails: []
        };
      }
      
      classData[classKey].totalStudents++;
      
      const studentAttendance = monthAttendance.filter(a => a.student_id === student.id && a.entry_time);
      const presentDays = new Set(studentAttendance.map(a => a.attendance_date)).size;
      const totalDays = new Set(monthAttendance.map(a => a.attendance_date)).size;
      const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      
      classData[classKey].studentDetails.push({
        id: student.id,
        name: student.full_name,
        fatherName: isSchoolType ? student.father_name : student.guardian_name,
        studentId: student.student_id,
        presentDays,
        totalDays,
        percentage,
        isDefaulter: percentage < 75
      });
    });

    // ✅ Sort students by percentage (highest first)
    Object.values(classData).forEach(classInfo => {
      classInfo.studentDetails.sort((a, b) => b.percentage - a.percentage);
    });

    const overallStats = Object.values(classData).map(classInfo => {
      const avgAttendance = classInfo.studentDetails.reduce((sum, s) => sum + s.percentage, 0) / classInfo.studentDetails.length;
      const defaulters = classInfo.studentDetails.filter(s => s.isDefaulter).length;
      
      return {
        className: classInfo.className,
        totalStudents: classInfo.totalStudents,
        avgAttendance: Math.round(avgAttendance),
        defaulters
      };
    });

    setReportData({
      classWise: Object.values(classData),
      overallStats,
      monthName: new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('default', { month: 'long' }),
      totalStudents: students.length,
      totalDays: new Set(monthAttendance.map(a => a.attendance_date)).size
    });
  };

  const exportClassPDF = async (classInfo) => {
    toast.loading("Generating class report...", { id: "export-class" });
    
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(school.school_name, 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(`Class: ${classInfo.className}`, 105, 30, { align: 'center' });
      doc.text(`Monthly Attendance Report - ${reportData.monthName} ${selectedYear}`, 105, 38, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Students: ${classInfo.totalStudents}`, 14, 50);
      doc.text(`Total Working Days: ${reportData.totalDays}`, 14, 56);
      
      let y = 70;
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(37, 99, 235);
      doc.setTextColor(255, 255, 255);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.text('Roll No', 16, y);
      doc.text('Student Name', 45, y);
      doc.text('Father/Guardian', 95, y);
      doc.text('Present', 140, y);
      doc.text('%', 170, y);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      y += 10;

      classInfo.studentDetails.forEach((student, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(14, y - 5, 182, 8, 'F');
        }
        
        doc.text(student.studentId || 'N/A', 16, y);
        doc.text((student.name || 'N/A').substring(0, 20), 45, y);
        doc.text((student.fatherName || 'N/A').substring(0, 20), 95, y);
        doc.text(`${student.presentDays}/${student.totalDays}`, 140, y);
        
        if (student.isDefaulter) {
          doc.setTextColor(220, 38, 38);
          doc.setFont(undefined, 'bold');
        }
        doc.text(`${student.percentage}%`, 170, y);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        
        y += 10;
      });

      doc.save(`${classInfo.className}_${reportData.monthName}_${selectedYear}.pdf`);
      toast.success("Class report exported!", { id: "export-class" });
    } catch (error) {
      toast.error("Export failed", { id: "export-class" });
    }
  };

  const exportSchoolPDF = async () => {
    toast.loading("Generating school report...", { id: "export-school" });
    
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(school.school_name, 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(`Monthly Attendance Summary - ${reportData.monthName} ${selectedYear}`, 105, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Students: ${reportData.totalStudents}`, 14, 45);
      doc.text(`Total Working Days: ${reportData.totalDays}`, 14, 51);
      
      let y = 65;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(37, 99, 235);
      doc.setTextColor(255, 255, 255);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.text('Class', 16, y);
      doc.text('Students', 80, y);
      doc.text('Avg Attendance', 120, y);
      doc.text('Defaulters', 165, y);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      y += 10;

      reportData.overallStats.forEach((classData, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(14, y - 5, 182, 8, 'F');
        }
        
        doc.text(classData.className, 16, y);
        doc.text(String(classData.totalStudents), 90, y);
        doc.text(`${classData.avgAttendance}%`, 135, y);
        doc.text(String(classData.defaulters), 175, y);
        
        y += 10;
      });

      doc.save(`${school.school_name}_${reportData.monthName}_${selectedYear}.pdf`);
      toast.success("School report exported!", { id: "export-school" });
    } catch (error) {
      toast.error("Export failed", { id: "export-school" });
    }
  };

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // ✅ Filter classes based on selection
  const filteredClasses = reportData?.classWise.filter(classInfo => 
    selectedClassFilter === 'all' || classInfo.className === selectedClassFilter
  ) || [];

  if (!school) {
    return <div className="p-6 text-center">Initializing...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📊 Monthly Attendance Reports</h1>
          <p className="text-slate-600 mt-1">Comprehensive attendance analysis for {school.school_name}</p>
        </div>
        <Button onClick={exportSchoolPDF} disabled={!reportData} className="bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4 mr-2" />
          Export School Report
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Select Period & Class</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filter by Class</Label>
              <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {reportData?.classWise.map(c => (
                    <SelectItem key={c.className} value={c.className}>{c.className}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading monthly data...</p>
          </CardContent>
        </Card>
      ) : reportData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Working Days</p>
                    <p className="text-3xl font-bold text-blue-600">{reportData.totalDays}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Students</p>
                    <p className="text-3xl font-bold text-green-600">{reportData.totalStudents}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total {isSchoolType ? 'Classes' : 'Courses'}</p>
                    <p className="text-3xl font-bold text-purple-600">{reportData.classWise.length}</p>
                  </div>
                  <BarChart className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader><CardTitle>Class-wise Average Attendance</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={reportData.overallStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="className" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgAttendance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader><CardTitle>Defaulters Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.overallStats}
                      dataKey="defaulters"
                      nameKey="className"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {reportData.overallStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {filteredClasses.map((classInfo, index) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {isSchoolType ? `Class: ${classInfo.className}` : `Course: ${classInfo.className}`}
                  </CardTitle>
                  <Button onClick={() => exportClassPDF(classInfo)} size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
                <div className="flex gap-4 mt-2">
                  <Badge variant="outline">Students: {classInfo.totalStudents}</Badge>
                  <Badge variant="outline">Defaulters: {classInfo.studentDetails.filter(s => s.isDefaulter).length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Father/Guardian</TableHead>
                        <TableHead>Present Days</TableHead>
                        <TableHead>Total Days</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classInfo.studentDetails.map(student => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.studentId}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell className="text-slate-600">{student.fatherName || 'N/A'}</TableCell>
                          <TableCell>{student.presentDays}</TableCell>
                          <TableCell>{student.totalDays}</TableCell>
                          <TableCell>
                            <span className={`font-bold ${student.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                              {student.percentage}%
                            </span>
                          </TableCell>
                          <TableCell>
                            {student.isDefaulter ? (
                              <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                Defaulter
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">Good</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <p className="text-slate-600">No data available for selected period</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}