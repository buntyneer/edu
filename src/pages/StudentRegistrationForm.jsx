
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Student, RegistrationLink, School } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Camera, CheckCircle, AlertTriangle, School as SchoolIcon, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function StudentRegistrationForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [school, setSchool] = useState(null);
  const [isValidLink, setIsValidLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formData, setFormData] = useState({
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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    validateRegistrationLink();
  }, []);

  const validateRegistrationLink = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const linkId = urlParams.get('link');
    
    if (!linkId) {
      setErrors({ general: "Invalid registration link. Please contact the school." });
      return;
    }

    try {
      const links = await RegistrationLink.filter({ link_id: linkId });
      if (links.length === 0) {
        setErrors({ general: "Registration link not found or expired." });
        return;
      }

      const link = links[0];
      const now = new Date();
      const expiryDate = new Date(link.expiry_date);

      if (!link.is_active || now > expiryDate) {
        setErrors({ general: "This registration link has expired. Please contact the school." });
        return;
      }

      // Get school information
      const schools = await School.filter({ id: link.school_id });
      if (schools.length > 0) {
        setSchool(schools[0]);
        setIsValidLink(true);
      } else {
        setErrors({ general: "School information not found." });
      }
    } catch (error) {
      console.error("Error validating registration link:", error);
      setErrors({ general: "Error validating registration link. Please try again." });
    }
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const result = await UploadFile({ file });
      setFormData(prev => ({ ...prev, student_photo: result.file_url }));
      toast.success("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!formData.father_name.trim()) newErrors.father_name = "Father's name is required";
    if (!formData.mother_name.trim()) newErrors.mother_name = "Mother's name is required";
    if (!formData.date_of_birth) newErrors.date_of_birth = "Date of birth is required";
    if (!formData.class.trim()) newErrors.class = "Class is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";

    // Email validation
    if (formData.parent_email && !/\S+@\S+\.\S/.test(formData.parent_email)) {
      newErrors.parent_email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Generate unique student ID
      const student_id = `${school.school_name.substring(0, 2).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const studentData = {
        ...formData,
        school_id: school.id,
        student_id,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      await Student.create(studentData);
      setRegistrationSuccess(true);
      toast.success("Registration submitted successfully!");
    } catch (error) {
      console.error("Error submitting registration:", error);
      toast.error("Failed to submit registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, school, validateForm]);

  if (!isValidLink && !errors.general) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Validating registration link...</p>
        </div>
      </div>
    );
  }

  if (errors.general) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Link</h2>
            <p className="text-slate-600 mb-6">{errors.general}</p>
            <Button onClick={() => window.close()}>Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
              <p className="text-slate-600 mb-6">
                Thank you for registering with {school.school_name}. 
                The school administration will review your application and contact you soon.
              </p>
              <Button onClick={() => window.close()}>Close</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 overflow-hidden bg-white shadow-2xl border-4 border-blue-100">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c112913d9da1e2ebed8be6/a23e5cb66_Gemini_Generated_Image_p6574bp6574bp657.png" 
              alt="Edumanege Logo" 
              className="w-full h-full object-contain scale-110" 
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Student Registration</h1>
          <h2 className="text-xl text-blue-600 font-semibold">{school.school_name}</h2>
          <p className="text-slate-600 mt-2">Please fill in all the required information</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Student Information Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  {formData.student_photo ? (
                    <img
                      src={formData.student_photo}
                      alt="Student"
                      className="w-full h-full object-cover rounded-full border-4 border-blue-200"
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
                  {isUploading ? "Uploading..." : "Click to upload student photo"}
                </p>
              </div>

              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className={errors.full_name ? "border-red-500" : ""}
                    placeholder="Enter student's full name"
                  />
                  {errors.full_name && <p className="text-sm text-red-600">{errors.full_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className={errors.date_of_birth ? "border-red-500" : ""}
                  />
                  {errors.date_of_birth && <p className="text-sm text-red-600">{errors.date_of_birth}</p>}
                </div>
              </div>

              {/* Parent Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="father_name">Father's Name *</Label>
                  <Input
                    id="father_name"
                    value={formData.father_name}
                    onChange={(e) => handleInputChange('father_name', e.target.value)}
                    className={errors.father_name ? "border-red-500" : ""}
                    placeholder="Enter father's name"
                  />
                  {errors.father_name && <p className="text-sm text-red-600">{errors.father_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother_name">Mother's Name *</Label>
                  <Input
                    id="mother_name"
                    value={formData.mother_name}
                    onChange={(e) => handleInputChange('mother_name', e.target.value)}
                    className={errors.mother_name ? "border-red-500" : ""}
                    placeholder="Enter mother's name"
                  />
                  {errors.mother_name && <p className="text-sm text-red-600">{errors.mother_name}</p>}
                </div>
              </div>

              {/* Class Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="class">Class/Grade *</Label>
                  <Input
                    id="class"
                    value={formData.class}
                    onChange={(e) => handleInputChange('class', e.target.value)}
                    className={errors.class ? "border-red-500" : ""}
                    placeholder="e.g. Grade 5, Class 10"
                  />
                  {errors.class && <p className="text-sm text-red-600">{errors.class}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => handleInputChange('section', e.target.value)}
                    placeholder="e.g. A, B, C"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="parent_email">Parent's Email</Label>
                  <Input
                    id="parent_email"
                    type="email"
                    value={formData.parent_email}
                    onChange={(e) => handleInputChange('parent_email', e.target.value)}
                    className={errors.parent_email ? "border-red-500" : ""}
                    placeholder="parent@example.com"
                  />
                  {errors.parent_email && <p className="text-sm text-red-600">{errors.parent_email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_whatsapp">Parent's WhatsApp</Label>
                  <Input
                    id="parent_whatsapp"
                    type="tel"
                    value={formData.parent_whatsapp}
                    onChange={(e) => handleInputChange('parent_whatsapp', e.target.value)}
                    placeholder="+919876543210"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  type="tel"
                  value={formData.emergency_contact}
                  onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                  placeholder="Emergency contact number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={errors.address ? "border-red-500" : ""}
                  placeholder="Enter complete address"
                  rows={3}
                />
                {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical_info">Medical Information</Label>
                <Textarea
                  id="medical_info"
                  value={formData.medical_info}
                  onChange={(e) => handleInputChange('medical_info', e.target.value)}
                  placeholder="Any medical conditions, allergies, medications..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous_school">Previous School</Label>
                <Input
                  id="previous_school"
                  value={formData.previous_school}
                  onChange={(e) => handleInputChange('previous_school', e.target.value)}
                  placeholder="Name of previous school (if any)"
                />
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please ensure all information is accurate. The school will verify the details before enrollment.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 text-lg"
              >
                {isSubmitting ? "Submitting Registration..." : "Submit Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
