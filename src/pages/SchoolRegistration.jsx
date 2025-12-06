import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { School } from "@/api/entities"; // Assuming 'School' entity can represent any 'Institute' now, or needs renaming on backend.
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, CheckCircle, School as SchoolIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const FACILITIES = [
  "Library", "Computer Lab", "Science Lab", "Sports Complex",
  "Auditorium", "Cafeteria", "Medical Room", "Playground",
  "Art Room", "Music Room", "Transportation", "Hostel"
];

const INSTITUTE_FACILITIES = {
  school: ["Library", "Computer Lab", "Science Lab", "Sports Complex", "Auditorium", "Cafeteria", "Medical Room", "Playground", "Art Room", "Music Room", "Transportation", "Hostel"],
  ielts_center: ["Computer Lab", "Library", "Audio/Video Room", "Mock Test Room", "Student Lounge", "Wi-Fi", "Parking"],
  computer_center: ["Computer Lab", "High-Speed Internet", "Projectors", "AC Classrooms", "Student Lounge", "Parking"],
  tuition_center: ["Classrooms", "Library", "Study Hall", "AC Rooms", "Parking", "Student Area"],
  coaching_center: ["Smart Classrooms", "Library", "Test Series Hall", "Doubt Session Room", "Student Lounge", "Parking"]
};

export default function SchoolRegistration() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formData, setFormData] = useState({
    // Institute Information
    school_name: "", // Renamed in UI to be dynamic, but kept as school_name for data consistency
    institute_type: "", // New field
    school_address: "",
    zipcode: "",
    school_type: "", // Only for school type institute
    establishment_year: "",
    registration_number: "",

    // Director/Principal Information
    principal_name: "", // Renamed in UI to be dynamic, but kept as principal_name for data consistency
    principal_dob: "",
    principal_email: "",
    principal_phone: "",
    principal_qualifications: "",
    principal_experience: "",

    // Administrative Details
    school_start_time: "08:00",
    school_end_time: "15:00",
    academic_year_start: "",
    max_capacity: "",
    facilities: []
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newState = { ...prev, [field]: value };

      // Special handling for institute_type change
      if (field === "institute_type") {
        // Reset facilities when institute type changes, so only relevant ones can be selected
        newState.facilities = [];
        // If switching from 'school' to something else, clear school_type
        if (prev.institute_type === 'school' && value !== 'school') {
            newState.school_type = "";
        }
      }
      return newState;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFacilityChange = (facility, checked) => {
    setFormData(prev => ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, facility]
        : prev.facilities.filter(f => f !== facility)
    }));
  };

  const getInstituteTitle = () => {
    const titles = {
      school: "School",
      ielts_center: "IELTS Center",
      computer_center: "Computer Center",
      tuition_center: "Tuition Center",
      coaching_center: "Coaching Center"
    };
    return titles[formData.institute_type] || "Institute";
  };

  const getDirectorTitle = () => {
    const titles = {
      school: "Principal",
      ielts_center: "Center Director",
      computer_center: "Center Head",
      tuition_center: "Director",
      coaching_center: "Director"
    };
    return titles[formData.institute_type] || "Director";
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validations
    if (!formData.institute_type) newErrors.institute_type = "Institute type is required";
    if (!formData.school_name.trim()) newErrors.school_name = `${getInstituteTitle()} name is required`;
    if (!formData.school_address.trim()) newErrors.school_address = "Address is required";
    if (!formData.zipcode.trim()) newErrors.zipcode = "Zipcode is required";
    if (formData.institute_type === 'school' && !formData.school_type) newErrors.school_type = "School type is required";
    if (!formData.establishment_year) newErrors.establishment_year = "Establishment year is required";
    if (!formData.principal_name.trim()) newErrors.principal_name = `${getDirectorTitle()} name is required`;
    if (!formData.principal_email.trim()) newErrors.principal_email = "Email is required";
    if (formData.principal_email && !/\S+@\S+\.\S+/.test(formData.principal_email)) {
      newErrors.principal_email = "Invalid email format";
    }
    if (!formData.principal_phone.trim()) newErrors.principal_phone = "Phone number is required";
    if (!formData.max_capacity || formData.max_capacity < 1) {
      newErrors.max_capacity = "Valid capacity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Clean data before submitting - remove empty fields that cause issues
      const cleanFormData = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          // Don't include empty arrays
          if (Array.isArray(value) && value.length === 0) return;
          cleanFormData[key] = value;
        }
      });

      // Add 3-day trial period
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);
      
      cleanFormData.trial_ends_at = trialEndsAt.toISOString();
      cleanFormData.subscription_status = 'trial';
      
      // Create the school and get its ID
      const newSchool = await School.create(cleanFormData);
      
      // Safely link the new school to the current user's account
      try {
        const { User } = await import('@/api/entities');
        const currentUser = await User.me(); // Get current user first
        if (currentUser && currentUser.id) {
          await User.updateMyUserData({ school_id: newSchool.id });
        }
      } catch (userError) {
        console.warn("Could not link school to user:", userError);
        // Continue anyway - school is created
      }

      setRegistrationSuccess(true);
      toast.success(`${getInstituteTitle()} registered successfully!`);
    } catch (error) {
      console.error("Error creating institute:", error);
      // Better error handling
      if (error.message?.includes('duplicate') || (error.response?.data?.message?.includes('duplicate') || error.response?.data?.message?.includes('already exists'))) {
        toast.error("An institute with this name or registration number already exists. Please choose a different name or check the registration number.");
      } else if (error.message?.includes('validation') || (error.response?.data?.message?.includes('validation') || error.response?.data?.message?.includes('required'))) {
        toast.error("Please fill all required fields correctly.");
      } else {
        toast.error("Registration failed. Please check your internet connection and try again. " + (error.response?.data?.message || error.message));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
            <p className="text-slate-600 mb-6">
              Your {getInstituteTitle().toLowerCase()} has been successfully registered with a <strong className="text-blue-600">3-day free trial</strong>! You can now access the admin dashboard.
            </p>
            <Button
              onClick={() => navigate(createPageUrl("AdminDashboard"))}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Homepage"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Institute Registration</h1>
          <p className="text-slate-600">Fill in all the details to register your educational institute</p>
        </div>

        {/* Single Form */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Institute Type Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <SchoolIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Institute Type</h3>
                </div>

                <div className="space-y-2">
                  <Label>Select Institute Type *</Label>
                  <Select value={formData.institute_type} onValueChange={(value) => handleInputChange("institute_type", value)}>
                    <SelectTrigger className={errors.institute_type ? "border-red-500" : ""}>
                      <SelectValue placeholder="Choose your institute type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">School (Classes, Grades, Regular Education)</SelectItem>
                      <SelectItem value="ielts_center">IELTS/PTE/Language Center</SelectItem>
                      <SelectItem value="computer_center">Computer Training Center</SelectItem>
                      <SelectItem value="tuition_center">Tuition Center (Subject-wise Classes)</SelectItem>
                      <SelectItem value="coaching_center">Coaching Center (Competitive Exams)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.institute_type && <p className="text-sm text-red-600">{errors.institute_type}</p>}
                </div>
              </div>

              {/* Institute Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <SchoolIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">{getInstituteTitle()} Information</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school_name">{getInstituteTitle()} Name *</Label>
                    <Input
                      id="school_name"
                      value={formData.school_name}
                      onChange={(e) => handleInputChange("school_name", e.target.value)}
                      placeholder={`Enter ${getInstituteTitle().toLowerCase()} name`}
                      className={errors.school_name ? "border-red-500" : ""}
                    />
                    {errors.school_name && <p className="text-sm text-red-600">{errors.school_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration_number">Registration Number</Label>
                    <Input
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => handleInputChange("registration_number", e.target.value)}
                      placeholder="Official registration number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school_address">{getInstituteTitle()} Address *</Label>
                  <Textarea
                    id="school_address"
                    value={formData.school_address}
                    onChange={(e) => handleInputChange("school_address", e.target.value)}
                    placeholder="Enter complete address"
                    rows={3}
                    className={errors.school_address ? "border-red-500" : ""}
                  />
                  {errors.school_address && <p className="text-sm text-red-600">{errors.school_address}</p>}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipcode">Zipcode *</Label>
                    <Input
                      id="zipcode"
                      value={formData.zipcode}
                      onChange={(e) => handleInputChange("zipcode", e.target.value)}
                      placeholder="12345"
                      className={errors.zipcode ? "border-red-500" : ""}
                    />
                    {errors.zipcode && <p className="text-sm text-red-600">{errors.zipcode}</p>}
                  </div>

                  {formData.institute_type === 'school' && (
                    <div className="space-y-2">
                      <Label>School Type *</Label>
                      <Select value={formData.school_type} onValueChange={(value) => handleInputChange("school_type", value)}>
                        <SelectTrigger className={errors.school_type ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public School</SelectItem>
                          <SelectItem value="private">Private School</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.school_type && <p className="text-sm text-red-600">{errors.school_type}</p>}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="establishment_year">Establishment Year *</Label>
                    <Input
                      id="establishment_year"
                      type="number"
                      value={formData.establishment_year}
                      onChange={(e) => handleInputChange("establishment_year", parseInt(e.target.value) || "")}
                      placeholder="2020"
                      className={errors.establishment_year ? "border-red-500" : ""}
                    />
                    {errors.establishment_year && <p className="text-sm text-red-600">{errors.establishment_year}</p>}
                  </div>
                </div>
              </div>

              {/* Director Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <SchoolIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">{getDirectorTitle()} Information</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal_name">{getDirectorTitle()}'s Full Name *</Label>
                    <Input
                      id="principal_name"
                      value={formData.principal_name}
                      onChange={(e) => handleInputChange("principal_name", e.target.value)}
                      placeholder={`Enter ${getDirectorTitle().toLowerCase()}'s name`}
                      className={errors.principal_name ? "border-red-500" : ""}
                    />
                    {errors.principal_name && <p className="text-sm text-red-600">{errors.principal_name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="principal_dob">Date of Birth</Label>
                    <Input
                      id="principal_dob"
                      type="date"
                      value={formData.principal_dob}
                      onChange={(e) => handleInputChange("principal_dob", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal_email">Official Email *</Label>
                    <Input
                      id="principal_email"
                      type="email"
                      value={formData.principal_email}
                      onChange={(e) => handleInputChange("principal_email", e.target.value)}
                      placeholder={`${getDirectorTitle().toLowerCase()}@institute.com`}
                      className={errors.principal_email ? "border-red-500" : ""}
                    />
                    {errors.principal_email && <p className="text-sm text-red-600">{errors.principal_email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="principal_phone">Phone Number *</Label>
                    <Input
                      id="principal_phone"
                      type="tel"
                      value={formData.principal_phone}
                      onChange={(e) => handleInputChange("principal_phone", e.target.value)}
                      placeholder="+919876543210"
                      className={errors.principal_phone ? "border-red-500" : ""}
                    />
                    {errors.principal_phone && <p className="text-sm text-red-600">{errors.principal_phone}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal_qualifications">Educational Qualifications</Label>
                    <Textarea
                      id="principal_qualifications"
                      value={formData.principal_qualifications}
                      onChange={(e) => handleInputChange("principal_qualifications", e.target.value)}
                      placeholder="M.Ed, B.Ed, PhD in Education..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="principal_experience">Years of Experience</Label>
                    <Input
                      id="principal_experience"
                      type="number"
                      value={formData.principal_experience}
                      onChange={(e) => handleInputChange("principal_experience", parseInt(e.target.value) || "")}
                      placeholder="15"
                    />
                  </div>
                </div>
              </div>

              {/* Administrative Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <SchoolIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Administrative Details</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school_start_time">Institute Start Time</Label>
                    <Input
                      id="school_start_time"
                      type="time"
                      value={formData.school_start_time}
                      onChange={(e) => handleInputChange("school_start_time", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school_end_time">Institute End Time</Label>
                    <Input
                      id="school_end_time"
                      type="time"
                      value={formData.school_end_time}
                      onChange={(e) => handleInputChange("school_end_time", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="academic_year_start">Academic/Session Year Start</Label>
                    <Input
                      id="academic_year_start"
                      type="date"
                      value={formData.academic_year_start}
                      onChange={(e) => handleInputChange("academic_year_start", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_capacity">Maximum Student Capacity *</Label>
                    <Input
                      id="max_capacity"
                      type="number"
                      value={formData.max_capacity}
                      onChange={(e) => handleInputChange("max_capacity", parseInt(e.target.value) || "")}
                      placeholder="500"
                      className={errors.max_capacity ? "border-red-500" : ""}
                    />
                    {errors.max_capacity && <p className="text-sm text-red-600">{errors.max_capacity}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Available Facilities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(INSTITUTE_FACILITIES[formData.institute_type] || FACILITIES).map((facility) => (
                      <div key={facility} className="flex items-center space-x-2">
                        <Checkbox
                          id={facility}
                          checked={formData.facilities.includes(facility)}
                          onCheckedChange={(checked) => handleFacilityChange(facility, checked)}
                        />
                        <Label htmlFor={facility} className="text-sm font-medium cursor-pointer">
                          {facility}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {errors.submit && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 text-lg"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSubmitting ? "Registering Institute..." : "Complete Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}