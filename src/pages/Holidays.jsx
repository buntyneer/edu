import React, { useState, useEffect, useCallback } from "react";
import { Holiday } from "@/api/entities";
import { useAppData } from "./Layout.jsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import HolidayForm from "../components/holidays/HolidayForm";

export default function HolidaysPage() {
  const { school } = useAppData() || {};
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  const loadHolidays = useCallback(async () => {
    if (!school) return;
    setIsLoading(true);
    try {
      const fetchedHolidays = await Holiday.filter({ school_id: school.id });
      setHolidays(fetchedHolidays.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)));
    } catch (error) {
      toast.error("Failed to load holidays.");
    } finally {
      setIsLoading(false);
    }
  }, [school]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleFormSubmit = async (holidayData) => {
    try {
      if (editingHoliday) {
        await Holiday.update(editingHoliday.id, holidayData);
        toast.success("Holiday updated successfully!");
      } else {
        await Holiday.create({ ...holidayData, school_id: school.id });
        toast.success("New holiday added successfully!");
      }
      setShowForm(false);
      setEditingHoliday(null);
      loadHolidays();
    } catch (error) {
      toast.error("Failed to save holiday details.");
    }
  };

  const handleDelete = async (holidayId) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        await Holiday.delete(holidayId);
        loadHolidays();
        toast.success("Holiday deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete holiday.");
      }
    }
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setShowForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Holiday Calendar</h1>
          <p className="text-slate-600 mt-1">Manage your institute's holiday schedule.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Holiday
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <HolidayForm
            holiday={editingHoliday}
            onSubmit={handleFormSubmit}
            onCancel={() => { setShowForm(false); setEditingHoliday(null); }}
          />
        )}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Holidays</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? <p>Loading holidays...</p> : holidays.map(holiday => (
              <div key={holiday.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="font-semibold text-slate-800">{holiday.holiday_name}</p>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(holiday.start_date), 'MMMM dd, yyyy')}
                    {holiday.end_date && holiday.end_date !== holiday.start_date && ` - ${format(new Date(holiday.end_date), 'MMMM dd, yyyy')}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(holiday)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(holiday.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}