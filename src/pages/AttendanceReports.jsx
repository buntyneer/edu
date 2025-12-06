
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Attendance, Student } from "@/api/entities";
import { useAppData } from "../layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Download, Users, Clock, TrendingUp, Filter, RefreshCw, Trash2, MoreVertical, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AttendanceReports() {
  const { user, school } = useAppData() || {};

  const [attendanceData, setAttendanceData] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showLateStudents, setShowLateStudents] = useState(false);
  const [showPresentList, setShowPresentList] = useState(false);
  const [showAbsentList, setShowAbsentList] = useState(false);

  const loadReportsData = useCallback(async () => {
    if (!school) return;
    setIsLoading(true);
    try {
      const [attendance, studentsData] = await Promise.all([
        Attendance.filter({ school_id: school.id }, "-created_date", 150), // ✅ OPTIMIZATION 5: Reduced from 200 to 150
        Student.filter({ school_id: school.id })
      ]);
      
      setAttendanceData(attendance);
      setStudents(studentsData);
      if (!dataLoaded) { 
          toast.success(`Loaded ${attendance.length} attendance records.`);
          setDataLoaded(true);
      } else {
          toast.success(`Refreshed ${attendance.length} attendance records.`);
      }

    } catch (error) {
      toast.error("Error loading reports data:", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [school, dataLoaded]);

  useEffect(() => {
    if(school) {
        loadReportsData();
    }
  }, [school, loadReportsData]);

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await Attendance.delete(recordId);
        toast.success("Attendance record deleted successfully!");
        loadReportsData();
      } catch (error) {
        toast.error("Failed to delete attendance record.", { description: error.message });
        console.error("Delete error:", error);
      }
    }
  };

  const getStudentName = useCallback((studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.full_name : 'Unknown Student';
  }, [students]);

  const filteredAttendance = useMemo(() => {
    return attendanceData.filter(record => {
      const studentName = getStudentName(record.student_id);
      const attendanceDate = new Date(record.attendance_date);
      const matchesMonth = attendanceDate.getMonth() + 1 === selectedMonth;
      const matchesYear = attendanceDate.getFullYear() === selectedYear;
      const matchesSearchTerm = studentName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesMonth && matchesYear && matchesSearchTerm;
    });
  }, [attendanceData, selectedMonth, selectedYear, searchTerm, getStudentName]);

  const getStats = () => {
    const uniquePresentStudents = new Set(
      filteredAttendance
        .filter(a => a.entry_time)
        .map(a => a.student_id)
    );
    
    const lateStudentsToday = filteredAttendance.filter(a => a.is_late === true);
    
    const presentCount = uniquePresentStudents.size;
    const totalStudents = students.length;
    const absentCount = totalStudents - presentCount;
    
    return {
      totalRecords: filteredAttendance.length,
      totalStudents,
      presentCount,
      absentCount,
      lateCount: lateStudentsToday.length,
      presentPercentage: totalStudents ? Math.round((presentCount / totalStudents) * 100) : 0
    };
  };

  const stats = getStats();

  const getPresentStudentsList = () => {
    const uniquePresentIds = new Set(
      filteredAttendance
        .filter(a => a.entry_time)
        .map(a => a.student_id)
    );
    return students.filter(s => uniquePresentIds.has(s.id));
  };

  const getAbsentStudentsList = () => {
    const presentIds = new Set(
      filteredAttendance
        .filter(a => a.entry_time)
        .map(a => a.student_id)
    );
    return students.filter(s => !presentIds.has(s.id));
  };

  const getLateStudentsList = () => {
    return filteredAttendance.filter(a => a.is_late === true);
  };

  const handleExportReport = async () => {
    if (!dataLoaded || filteredAttendance.length === 0) {
      toast.error("No data to export!");
      return;
    }

    setIsExporting(true);
    toast.loading("Generating PDF report...", { id: "export-toast" });

    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(school?.school_name || 'Institute', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('Attendance Report', pageWidth / 2, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('default', { month: 'long' });
      doc.text(`Period: ${monthName} ${selectedYear}`, 14, 40);
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}`, 14, 46);
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Summary:', 14, 56);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text(`Total Records: ${stats.totalRecords}`, 14, 62);
      doc.text(`Total Students: ${stats.totalStudents}`, 14, 68); 
      doc.text(`Present (Unique Students): ${stats.presentCount}`, 14, 74); 
      doc.text(`Absent (Unique Students): ${stats.absentCount}`, 14, 80);
      doc.text(`Attendance Rate: ${stats.presentPercentage}%`, 14, 86); 

      let y = 100;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(37, 99, 235);
      doc.setTextColor(255, 255, 255);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.text('Date', 16, y);
      doc.text('Student', 50, y);
      doc.text('Entry', 110, y);
      doc.text('Exit', 140, y);
      doc.text('Status', 170, y);
      
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      y += 10;

      filteredAttendance.forEach((record, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
          
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.setFillColor(37, 99, 235);
          doc.setTextColor(255, 255, 255);
          doc.rect(14, y - 5, 182, 8, 'F');
          doc.text('Date', 16, y);
          doc.text('Student', 50, y);
          doc.text('Entry', 110, y);
          doc.text('Exit', 140, y);
          doc.text('Status', 170, y);
          
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          y += 10;
        }
        
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(14, y - 5, 182, 8, 'F');
        }
        
        doc.text(format(new Date(record.attendance_date), 'MMM dd, yyyy'), 16, y);
        doc.text(getStudentName(record.student_id), 50, y);
        doc.text(record.entry_time ? format(new Date(record.entry_time), 'hh:mm a') : '-', 110, y);
        doc.text(record.exit_time ? format(new Date(record.exit_time), 'hh:mm a') : '-', 140, y);
        doc.text(record.status || '-', 170, y);
        
        y += 10;
      });

      const fileName = `Attendance_Report_${monthName}_${selectedYear}.pdf`;
      doc.save(fileName);

      toast.success("Report exported successfully!", { id: "export-toast" });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report: " + error.message, { id: "export-toast" });
    } finally {
      setIsExporting(false);
    }
  };

  if (!school) {
    return (
      <div className="p-6 text-center">
          <p className="text-slate-600">Initializing reports...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance Reports</h1>
          <p className="text-slate-600 mt-1">View comprehensive attendance analytics for {school?.school_name || 'Institute'}</p>
        </div>
        <Button 
          onClick={handleExportReport} 
          disabled={!dataLoaded || isExporting || filteredAttendance.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export Report'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Students</p>
                <p className="text-3xl font-bold text-slate-900">{dataLoaded ? stats.totalStudents : '--'}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setShowPresentList(true)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Present Today</p>
                <p className="text-3xl font-bold text-green-600">{dataLoaded ? stats.presentCount : '--'}</p>
                <p className="text-xs text-slate-500 mt-1">Click to view list</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setShowAbsentList(true)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Absent Today</p>
                <p className="text-3xl font-bold text-red-600">{dataLoaded ? stats.absentCount : '--'}</p>
                <p className="text-xs text-slate-500 mt-1">Click to view list</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setShowLateStudents(true)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Late Arrivals</p>
                <p className="text-3xl font-bold text-orange-600">{dataLoaded ? stats.lateCount : '--'}</p>
                <p className="text-xs text-slate-500 mt-1">Click to view list</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" />Filter Reports</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]"><Label>Search Student</Label><Input placeholder="Search by student name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!dataLoaded}/></div>
            <div><Label>Month</Label><Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))} disabled={!dataLoaded}><SelectTrigger className="w-48"><SelectValue placeholder="Select Month" /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, i) => (<SelectItem key={i + 1} value={(i + 1).toString()}>{new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Year</Label><Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))} disabled={!dataLoaded}><SelectTrigger className="w-32"><SelectValue placeholder="Year" /></SelectTrigger><SelectContent><SelectItem value="2024">2024</SelectItem><SelectItem value="2025">2025</SelectItem></SelectContent></Select></div>
            <Button onClick={loadReportsData} disabled={isLoading || !school}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading && dataLoaded ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader><CardTitle>Attendance Records - All Entries</CardTitle></CardHeader>
        <CardContent>
          {!dataLoaded && isLoading ? (
             <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Loading Attendance Data...</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Entry Time</TableHead>
                    <TableHead>Exit Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && dataLoaded ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">Refreshing...</TableCell></TableRow>
                  ) : filteredAttendance.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">No records found for selected filters.</TableCell></TableRow>
                  ) : (
                    filteredAttendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {format(new Date(record.attendance_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {getStudentName(record.student_id)}
                        </TableCell>
                        <TableCell>
                          {record.entry_time ? 
                            <span className={`font-medium ${record.is_late ? 'text-red-600' : 'text-green-600'}`}>
                              {new Date(record.entry_time).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit', 
                                hour12: true 
                              })}
                            </span>
                            : <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell>
                          {record.exit_time ? 
                            <span className="text-red-600 font-medium">
                              {new Date(record.exit_time).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit', 
                                hour12: true 
                              })}
                            </span>
                            : <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            record.status === 'present' ? 'bg-green-100 text-green-800' : 
                            record.status === 'late' ? 'bg-orange-100 text-orange-800' : 
                            record.status === 'early_departure' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-32 truncate">
                          {record.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleDeleteRecord(record.id)}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Record
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showLateStudents && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLateStudents(false)}>
          <Card className="max-w-2xl w-full m-4 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>⚠️ Late Arrivals ({stats.lateCount})</span>
                <Button variant="ghost" size="icon" onClick={() => setShowLateStudents(false)}><X className="w-4 h-4" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Entry Time</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getLateStudentsList().map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{getStudentName(record.student_id)}</TableCell>
                      <TableCell className="text-red-600 font-bold">
                        {new Date(record.entry_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </TableCell>
                      <TableCell>{format(new Date(record.attendance_date), 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {showPresentList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPresentList(false)}>
          <Card className="max-w-2xl w-full m-4 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>✅ Present Students ({stats.presentCount})</span>
                <Button variant="ghost" size="icon" onClick={() => setShowPresentList(false)}><X className="w-4 h-4" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPresentStudentsList().map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{student.class} - {student.section}</TableCell>
                      <TableCell>{student.student_id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {showAbsentList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAbsentList(false)}>
          <Card className="max-w-2xl w-full m-4 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>❌ Absent Students ({stats.absentCount})</span>
                <Button variant="ghost" size="icon" onClick={() => setShowAbsentList(false)}><X className="w-4 h-4" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getAbsentStudentsList().map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{student.class} - {student.section}</TableCell>
                      <TableCell>{student.student_id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
