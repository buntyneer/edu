import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function BatchForm({ batch, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(batch || {
    batch_name: "",
    batch_code: "",
    start_time: "09:00",
    end_time: "11:00",
    entry_time: "08:45",
    exit_time: "11:15",
    days_of_week: [],
    max_capacity: 30,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayChange = (day, checked) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: checked ? [...prev.days_of_week, day] : prev.days_of_week.filter(d => d !== day)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6">
      <Card className="shadow-xl border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{batch ? "Edit Batch" : "Create New Batch"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label htmlFor="batch_name">Batch Name</Label><Input id="batch_name" value={formData.batch_name} onChange={e => handleInputChange('batch_name', e.target.value)} required /></div>
              <div><Label htmlFor="batch_code">Batch Code</Label><Input id="batch_code" value={formData.batch_code} onChange={e => handleInputChange('batch_code', e.target.value)} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label htmlFor="start_time">Class Start Time</Label><Input id="start_time" type="time" value={formData.start_time} onChange={e => handleInputChange('start_time', e.target.value)} required /></div>
              <div><Label htmlFor="end_time">Class End Time</Label><Input id="end_time" type="time" value={formData.end_time} onChange={e => handleInputChange('end_time', e.target.value)} required /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label htmlFor="entry_time">Student Entry Time</Label><Input id="entry_time" type="time" value={formData.entry_time} onChange={e => handleInputChange('entry_time', e.target.value)} required /></div>
              <div><Label htmlFor="exit_time">Student Exit Time</Label><Input id="exit_time" type="time" value={formData.exit_time} onChange={e => handleInputChange('exit_time', e.target.value)} required /></div>
            </div>
            <div><Label htmlFor="max_capacity">Max Students</Label><Input id="max_capacity" type="number" value={formData.max_capacity} onChange={e => handleInputChange('max_capacity', parseInt(e.target.value))} required /></div>
            <div>
              <Label>Days of the Week</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox id={day} checked={formData.days_of_week.includes(day)} onCheckedChange={checked => handleDayChange(day, checked)} />
                    <Label htmlFor={day}>{day}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">{batch ? "Update Batch" : "Create Batch"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}