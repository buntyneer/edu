import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

export default function HolidayForm({ holiday, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(holiday || {
    holiday_name: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.end_date) {
        data.end_date = data.start_date;
    }
    onSubmit(data);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6">
      <Card className="shadow-xl border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{holiday ? "Edit Holiday" : "Add New Holiday"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="holiday_name">Holiday Name</Label>
              <Input id="holiday_name" value={formData.holiday_name} onChange={e => handleInputChange('holiday_name', e.target.value)} required />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label htmlFor="start_date">Start Date</Label><Input id="start_date" type="date" value={formData.start_date} onChange={e => handleInputChange('start_date', e.target.value)} required /></div>
              <div><Label htmlFor="end_date">End Date (optional)</Label><Input id="end_date" type="date" value={formData.end_date} onChange={e => handleInputChange('end_date', e.target.value)} /></div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} />
            </div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">{holiday ? "Update Holiday" : "Add Holiday"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}