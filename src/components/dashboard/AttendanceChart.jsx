import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Attendance } from "@/api/entities";

export default function AttendanceChart() {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        // ✅ OPTIMIZATION 2: Load only last 7 days data for chart
        const schoolId = localStorage.getItem('current_school_id');
        if (!schoolId) {
          setIsLoading(false);
          return;
        }

        const attendance = await Attendance.filter({ school_id: schoolId }, "-created_date", 30);
        
        // Get last 6 days
        const last6Days = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          last6Days.push(date.toISOString().split('T')[0]);
        }

        const processedData = last6Days.map(date => {
          const dayAttendance = attendance.filter(a => a.attendance_date === date);
          const present = new Set(dayAttendance.filter(a => a.entry_time).map(a => a.student_id)).size;
          const absent = dayAttendance.filter(a => !a.entry_time).length;
          
          const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
          
          return {
            day: dayName,
            present: present,
            absent: absent
          };
        });

        setChartData(processedData);
      } catch (error) {
        console.error('Error loading chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Store school_id when available
    const interval = setInterval(() => {
      const schoolId = document.querySelector('[data-school-id]')?.dataset?.schoolId;
      if (schoolId) {
        localStorage.setItem('current_school_id', schoolId);
        clearInterval(interval);
      }
    }, 100);

    loadChartData();

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-500">
        <p>No attendance data available for chart</p>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar dataKey="present" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}