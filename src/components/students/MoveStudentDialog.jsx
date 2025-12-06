import React, { useState, useEffect } from 'react';
import { Batch } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MoveStudentDialog({ open, onOpenChange, student, school, onMoveConfirm }) {
  const [targetClass, setTargetClass] = useState(student?.class || "");
  const [targetSection, setTargetSection] = useState(student?.section || "");
  const [targetBatchId, setTargetBatchId] = useState(student?.batch_id || "");
  const [batches, setBatches] = useState([]);
  
  const isSchoolType = school?.institute_type === 'school';

  useEffect(() => {
    if (!isSchoolType && school) {
      Batch.filter({ school_id: school.id }).then(setBatches);
    }
  }, [isSchoolType, school]);

  const handleMove = () => {
    if (isSchoolType) {
      onMoveConfirm({ class: targetClass, section: targetSection });
    } else {
      onMoveConfirm({ batch_id: targetBatchId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Student: {student?.full_name}</DialogTitle>
          <DialogDescription>
            Select the new class, section, or batch for the student.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isSchoolType ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="class">New Class</Label>
                <Select value={targetClass} onValueChange={setTargetClass}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{school?.classes_offered?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">New Section</Label>
                <Select value={targetSection} onValueChange={setTargetSection}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>{school?.default_sections?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="batch">New Batch</Label>
              <Select value={targetBatchId} onValueChange={setTargetBatchId}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.batch_name} ({b.start_time} - {b.end_time})</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleMove}>Move Student</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}