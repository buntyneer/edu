import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

export default function StudentForm({ student, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(() => student || {
    student_photo: "",
    full_name: "",
    father_name: "",
    mother_name: "",
    date_of_birth: "",
    class: "",
    section: "",
    address: "",
    emergency_contact: "",
    parent_whatsapp: "",
    parent_email: "",
    medical_info: "",
    previous_school: ""
  });

  // Memoized input change handler to prevent re-renders
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Memoized submit handler
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit(formData);
  }, [formData, onSubmit]);

  // Memoized cancel handler
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Memoized input components to prevent unnecessary re-renders
  const inputComponents = useMemo(() => ({
    fullName: (
      <div className="space-y-2">
        <Label htmlFor="form-full-name">Full Name *</Label>
        <Input 
          id="form-full-name"
          type="text"
          value={formData.full_name || ""} 
          onChange={(e) => handleInputChange('full_name', e.target.value)} 
          placeholder="Enter student's full name"
          autoComplete="name"
          required 
        />
      </div>
    ),
    dateOfBirth: (
      <div className="space-y-2">
        <Label htmlFor="form-date-of-birth">Date of Birth *</Label>
        <Input 
          id="form-date-of-birth"
          type="date" 
          value={formData.date_of_birth || ""} 
          onChange={(e) => handleInputChange('date_of_birth', e.target.value)} 
          required 
        />
      </div>
    ),
    fatherName: (
      <div className="space-y-2">
        <Label htmlFor="form-father-name">Father's Name *</Label>
        <Input 
          id="form-father-name"
          type="text"
          value={formData.father_name || ""} 
          onChange={(e) => handleInputChange('father_name', e.target.value)} 
          placeholder="Enter father's name"
          autoComplete="off"
          required 
        />
      </div>
    ),
    motherName: (
      <div className="space-y-2">
        <Label htmlFor="form-mother-name">Mother's Name *</Label>
        <Input 
          id="form-mother-name"
          type="text"
          value={formData.mother_name || ""} 
          onChange={(e) => handleInputChange('mother_name', e.target.value)} 
          placeholder="Enter mother's name"
          autoComplete="off"
          required 
        />
      </div>
    ),
    class: (
      <div className="space-y-2">
        <Label htmlFor="form-class">Class/Grade *</Label>
        <Input 
          id="form-class"
          type="text"
          value={formData.class || ""} 
          onChange={(e) => handleInputChange('class', e.target.value)} 
          placeholder="e.g. Grade 5, Class 10"
          autoComplete="off"
          required 
        />
      </div>
    ),
    section: (
      <div className="space-y-2">
        <Label htmlFor="form-section">Section</Label>
        <Input 
          id="form-section"
          type="text"
          value={formData.section || ""} 
          onChange={(e) => handleInputChange('section', e.target.value)} 
          placeholder="e.g. A, B, C"
          autoComplete="off"
        />
      </div>
    ),
    parentEmail: (
      <div className="space-y-2">
        <Label htmlFor="form-parent-email">Parent's Email</Label>
        <Input 
          id="form-parent-email"
          type="email" 
          value={formData.parent_email || ""} 
          onChange={(e) => handleInputChange('parent_email', e.target.value)} 
          placeholder="parent@example.com"
          autoComplete="email"
        />
      </div>
    ),
    parentWhatsapp: (
      <div className="space-y-2">
        <Label htmlFor="form-parent-whatsapp">Parent's WhatsApp</Label>
        <Input 
          id="form-parent-whatsapp"
          type="tel" 
          value={formData.parent_whatsapp || ""} 
          onChange={(e) => handleInputChange('parent_whatsapp', e.target.value)} 
          placeholder="+919876543210"
          autoComplete="tel"
        />
      </div>
    ),
    emergencyContact: (
      <div className="space-y-2">
        <Label htmlFor="form-emergency-contact">Emergency Contact</Label>
        <Input 
          id="form-emergency-contact"
          type="tel" 
          value={formData.emergency_contact || ""} 
          onChange={(e) => handleInputChange('emergency_contact', e.target.value)} 
          placeholder="Emergency contact number"
          autoComplete="tel"
        />
      </div>
    ),
    address: (
      <div className="space-y-2">
        <Label htmlFor="form-address">Address *</Label>
        <Textarea 
          id="form-address"
          value={formData.address || ""} 
          onChange={(e) => handleInputChange('address', e.target.value)} 
          placeholder="Enter complete address"
          rows={3}
          required 
        />
      </div>
    ),
    medicalInfo: (
      <div className="space-y-2">
        <Label htmlFor="form-medical-info">Medical Information</Label>
        <Textarea 
          id="form-medical-info"
          value={formData.medical_info || ""} 
          onChange={(e) => handleInputChange('medical_info', e.target.value)} 
          placeholder="Any medical conditions, allergies, medications..."
          rows={3}
        />
      </div>
    ),
    previousSchool: (
      <div className="space-y-2">
        <Label htmlFor="form-previous-school">Previous School</Label>
        <Input 
          id="form-previous-school"
          type="text"
          value={formData.previous_school || ""} 
          onChange={(e) => handleInputChange('previous_school', e.target.value)} 
          placeholder="Name of previous school (if any)"
          autoComplete="off"
        />
      </div>
    )
  }), [formData, handleInputChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      <Card className="shadow-xl border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{student ? "Edit Student" : "Add New Student"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {inputComponents.fullName}
              {inputComponents.dateOfBirth}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {inputComponents.fatherName}
              {inputComponents.motherName}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {inputComponents.class}
              {inputComponents.section}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {inputComponents.parentEmail}
              {inputComponents.parentWhatsapp}
            </div>

            {inputComponents.emergencyContact}
            {inputComponents.address}
            {inputComponents.medicalInfo}
            {inputComponents.previousSchool}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {student ? 'Update Student' : 'Save Student'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}