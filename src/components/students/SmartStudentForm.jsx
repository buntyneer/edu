import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, Camera } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { toast } from "sonner";
import { Batch } from "@/api/entities";
import { compressImage, validateImage } from "@/components/utils/imageCompression";

const COURSE_OPTIONS = {
  ielts_center: [
    "IELTS General Training", "IELTS Academic", "PTE Academic",
    "TOEFL", "Spoken English", "Business English"
  ],
  computer_center: [
    "Basic Computer Course", "MS Office", "Tally ERP", "Web Development",
    "Programming (Python)", "Programming (Java)", "Data Entry",
    "Graphic Design", "Digital Marketing"
  ],
  tuition_center: [
    "Mathematics", "Science (Physics, Chemistry, Biology)",
    "English Literature", "Social Studies", "Combined (All Subjects)"
  ],
  coaching_center: [
    "JEE Preparation", "NEET Preparation", "UPSC Preparation",
    "Banking Exam Prep", "SSC Preparation", "Gate Preparation"
  ]
};

const BATCH_TIMINGS = [
  "Morning (8:00 AM - 12:00 PM)", "Afternoon (1:00 PM - 5:00 PM)",
  "Evening (5:00 PM - 9:00 PM)", "Weekend Only", "Flexible Timing"
];

export default function SmartStudentForm({ student, instituteType, school, onSubmit, onCancel }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [formData, setFormData] = useState(() => {
    const initialData = student || {
      student_photo: "",
      full_name: "",
      father_name: "",
      mother_name: "",
      guardian_name: "",
      date_of_birth: "",
      class: "",
      section: "",
      course_name: "",
      course_duration: "",
      batch_timing: "",
      target_score: "",
      current_level: "",
      subjects: "",
      address: "",
      emergency_contact: "",
      parent_whatsapp: "",
      parent_email: "",
      medical_info: "",
      previous_school: "",
      batch_id: "",
      batch_ids: []
    };
    return {
        ...initialData,
        batch_id: initialData.batch_id || "", // Ensure batch_id is initialized
    };
  });

  const isSchoolType = instituteType === 'school';

  useEffect(() => {
    if (!isSchoolType && school?.id) {
      loadBatches();
    }
  }, [isSchoolType, school]);

  const loadBatches = async () => {
    try {
      const batches = await Batch.filter({ school_id: school.id, status: 'active' });
      setAvailableBatches(batches);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateImage(file, 10);

      setIsUploading(true);
      toast.loading("Compressing photo...", { id: "photo-toast" });

      // AGGRESSIVE: 800x800 max, 70% quality = ~150KB average
      const compressedFile = await compressImage(file, 800, 800, 0.7);

      toast.loading("Uploading compressed photo...", { id: "photo-toast" });

      const result = await UploadFile({ file: compressedFile });

      handleInputChange('student_photo', result.file_url);

      const originalSizeKB = (file.size / 1024).toFixed(0);
      const compressedSizeKB = (compressedFile.size / 1024).toFixed(0);

      toast.success(
        `Photo uploaded! ${originalSizeKB}KB → ${compressedSizeKB}KB`,
        { id: "photo-toast" }
      );

    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error(error.message || "Failed to upload photo", { id: "photo-toast" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      <Card className="shadow-xl border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{student ? 'Edit Student' : 'Add New Student'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="text-center mb-6">
              <div className="relative w-32 h-32 mx-auto mb-4">
                {formData.student_photo ? (
                  <img
                    src={formData.student_photo}
                    alt="Student"
                    className="w-full h-full object-cover rounded-full border-4 border-blue-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center border-4 border-slate-300">
                    <Camera className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <p className="text-sm text-slate-600">
                {isUploading ? "Compressing & uploading..." : "Click to upload student photo"}
              </p>
              <p className="text-xs text-slate-400 mt-1">✨ Auto-compressed to ~150KB</p>
            </div>

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name || ""}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth || ""}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* School Type Fields */}
            {isSchoolType ? (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="father_name">Father's Name *</Label>
                    <Input
                      id="father_name"
                      value={formData.father_name || ""}
                      onChange={(e) => handleInputChange('father_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_name">Mother's Name *</Label>
                    <Input
                      id="mother_name"
                      value={formData.mother_name || ""}
                      onChange={(e) => handleInputChange('mother_name', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="class">Class/Grade *</Label>
                    <Input
                      id="class"
                      value={formData.class || ""}
                      onChange={(e) => handleInputChange('class', e.target.value)}
                      placeholder="Enter class (e.g., 10th, LKG)"
                      required
                      list="class-suggestions"
                    />
                    <datalist id="class-suggestions">
                      {school?.classes_offered?.map(cls => (
                        <option key={cls} value={cls} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      value={formData.section || ""}
                      onChange={(e) => handleInputChange('section', e.target.value)}
                      placeholder="Enter section (e.g., A, B)"
                      list="section-suggestions"
                    />
                    <datalist id="section-suggestions">
                      {school?.default_sections?.map(sec => (
                        <option key={sec} value={sec} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="guardian_name">Parent/Guardian Name *</Label>
                  <Input
                    id="guardian_name"
                    value={formData.guardian_name || ""}
                    onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course_name">Course *</Label>
                    <Select value={formData.course_name || ""} onValueChange={(value) => handleInputChange('course_name', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_OPTIONS[instituteType]?.map(course => (
                          <SelectItem key={course} value={course}>{course}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="batch_id">Batch *</Label>
                    <Select value={formData.batch_id || ""} onValueChange={(value) => handleInputChange('batch_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBatches.map(batch => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.batch_name} ({batch.start_time} - {batch.end_time})
                          </SelectItem>
                        ))}
                        {availableBatches.length === 0 && (
                          <SelectItem value={null} disabled>No batches available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course_duration">Course Duration</Label>
                    <Input
                      id="course_duration"
                      value={formData.course_duration || ""}
                      onChange={(e) => handleInputChange('course_duration', e.target.value)}
                      placeholder="e.g., 3 months, 6 months"
                    />
                  </div>
                  <div>
                    <Label htmlFor="current_level">Current Level</Label>
                    <Select value={formData.current_level || ""} onValueChange={(value) => handleInputChange('current_level', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parent_email">Parent Email</Label>
                <Input
                  id="parent_email"
                  type="email"
                  value={formData.parent_email || ""}
                  onChange={(e) => handleInputChange('parent_email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="parent_whatsapp">Parent WhatsApp *</Label>
                <Input
                  id="parent_whatsapp"
                  type="tel"
                  value={formData.parent_whatsapp || ""}
                  onChange={(e) => handleInputChange('parent_whatsapp', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address || ""}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  type="tel"
                  value={formData.emergency_contact || ""}
                  onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="previous_school">Previous School/Institute</Label>
                <Input
                  id="previous_school"
                  value={formData.previous_school || ""}
                  onChange={(e) => handleInputChange('previous_school', e.target.value)}
                />
              </div>
            </div>

            {isSchoolType && (
              <div>
                <Label htmlFor="medical_info">Medical Information</Label>
                <Textarea
                  id="medical_info"
                  value={formData.medical_info || ""}
                  onChange={(e) => handleInputChange('medical_info', e.target.value)}
                  placeholder="Allergies, medications, health conditions..."
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isUploading}>
                {student ? 'Update Student' : 'Add Student'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}