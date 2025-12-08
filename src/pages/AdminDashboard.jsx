import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Student, Attendance, Gatekeeper } from "@/api/entities";
import { useAppData } from "../Layout.jsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, UserCheck, CheckCircle, TrendingUp, Plus, Link as LinkIcon, Calendar, RefreshCw, Activity, Clock
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";

// 🚀 PERFORMANCE: Lazy load heavy components
const QuickStats = React.lazy(() => import("../components/dashboard/QuickStats"));
const RecentActivity = React.lazy(() => import("../components/dashboard/RecentActivity"));
const GenerateLinkDialog = React.lazy(() => import("../components/dashboard/GenerateLinkDialog"));
const AttendanceChart = React.lazy(() => import("../components/dashboard/AttendanceChart"));

export default function AdminDashboard() {
  const { user, school } = useAppData() || {};
  
  const [stats, setStats] = useState({ totalStudents: 0, totalGatekeepers: 0, todayPresent: 0, monthlyAverage: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerateLinkDialog, setShowGenerateLinkDialog] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [showGatekeepersDialog, setShowGatekeepersDialog] = useState(false);
  const [showPresentDialog, setShowPresentDialog] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [allGatekeepers, setAllGatekeepers] = useState([]);
  const [todayPresentStudents, setTodayPresentStudents] = useState([]);

  const loadEverything = useCallback(async () => {
    if (!school) {
        return;
    }
    setIsLoading(true);
    try {
      const [students, gatekeepers, attendance] = await Promise.all([
        Student.filter({ school_id: school.id }),
        Gatekeeper.filter({ school_id: school.id }),
        Attendance.filter({ school_id: school.id }, "-created_date", 50)
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(a => a.attendance_date === today);

      const uniquePresentStudents = new Set(
        todayAttendance
          .filter(a => a.status === 'present')
          .map(a => a.student_id)
      );

      const presentStudentsData = students.filter(s => uniquePresentStudents.has(s.id));

      setStats({
        totalStudents: students.length,
        totalGatekeepers: gatekeepers.length,
        todayPresent: uniquePresentStudents.size,
        monthlyAverage: 85
      });

      setAllStudents(students);
      setAllGatekeepers(gatekeepers);
      setTodayPresentStudents(presentStudentsData);
      setRecentActivities(attendance.slice(0, 5));
      setDataLoaded(true);
      
      if (school.id) {
        localStorage.setItem('current_school_id', school.id);
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      if (String(error).includes('429')) {
        toast.error("Too many requests. Please wait a moment before trying again.");
      } else {
        toast.error("Failed to load dashboard data.");
      }
      setDataLoaded(false);
    } finally {
      setIsLoading(false);
    }
  }, [school, dataLoaded]);

  useEffect(() => {
    loadEverything();
  }, [loadEverything]);

  if (!school) {
    return (
        <div className="p-6 text-center">
             <p className="text-slate-500">Initializing dashboard...</p>
        </div>
    );
  }

  return (
    <>
      <SubscriptionBanner />
      <div className="p-6 space-y-6" data-school-id={school?.id}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">School Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome! Here's an overview of your school's activity.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={loadEverything}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              {isLoading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Refreshing...</>
              ) : (
                <><RefreshCw className="w-4 h-4" />Refresh</>
              )}
            </Button>
            <Button onClick={() => setShowGenerateLinkDialog(true)} disabled={!school} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Generate Student Link
            </Button>
            <Link to={createPageUrl("Students")}>
              <Button variant="outline" className="flex items-center gap-2"><Plus className="w-4 h-4" />Add Student</Button>
            </Link>
          </div>
        </div>

        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <QuickStats 
                  title="Total Students" 
                  value={stats.totalStudents} 
                  icon={Users} 
                  color="blue" 
                  trend="+12% this month" 
                  isLoading={false}
                  onClick={() => setShowStudentsDialog(true)}
                />
                <QuickStats 
                  title="Gatekeepers" 
                  value={stats.totalGatekeepers} 
                  icon={UserCheck} 
                  color="green" 
                  trend="All active" 
                  isLoading={false}
                  onClick={() => setShowGatekeepersDialog(true)}
                />
                <QuickStats 
                  title="Today Present" 
                  value={stats.todayPresent} 
                  icon={CheckCircle} 
                  color="purple" 
                  trend={`${Math.round((stats.todayPresent / stats.totalStudents) * 100 || 0)}% attendance`} 
                  isLoading={false}
                  onClick={() => setShowPresentDialog(true)}
                />
                <QuickStats 
                  title="Monthly Average" 
                  value={`${stats.monthlyAverage}%`} 
                  icon={TrendingUp} 
                  color="orange" 
                  trend="+5% from last month" 
                  isLoading={false}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Attendance Overview (Last 6 Days)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                          <AttendanceChart />
                      </CardContent>
                    </Card>
                </div>
                <div>
                    <Card className="shadow-lg border-0">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <RecentActivity activities={recentActivities} isLoading={false} />
                      </CardContent>
                    </Card>
                </div>
            </div>
          </>
      </div>

      <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Students ({allStudents.length})</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Class</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>{student.student_id}</TableCell>
                  <TableCell>{student.class} - {student.section}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={showGatekeepersDialog} onOpenChange={setShowGatekeepersDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Gatekeepers ({allGatekeepers.length})</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Gate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allGatekeepers.map((gk) => (
                <TableRow key={gk.id}>
                  <TableCell className="font-medium">{gk.full_name}</TableCell>
                  <TableCell>{gk.gatekeeper_id}</TableCell>
                  <TableCell>{gk.gate_number}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${gk.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {gk.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={showPresentDialog} onOpenChange={setShowPresentDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Students Present Today ({todayPresentStudents.length})</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Class</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayPresentStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>{student.student_id}</TableCell>
                  <TableCell>{student.class} - {student.section}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {showGenerateLinkDialog && (
          <GenerateLinkDialog open={showGenerateLinkDialog} onOpenChange={setShowGenerateLinkDialog} schoolId={school?.id} />
      )}
    </>
  );
}