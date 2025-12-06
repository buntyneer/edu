import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CustomPlanRequest } from "@/api/entities";

const ADDITIONAL_FEATURES = [
  "Bus Tracking (GPS)",
  "Fee Management System",
  "Online Learning Portal",
  "Exam Management",
  "Achievement Tracker",
  "Advanced Analytics (AI)",
];

export default function CustomPlanDialog({ open, onOpenChange }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    institute_name: "",
    institute_type: "",
    contact_person: "",
    email: "",
    phone: "",
    student_count: "",
    duration_months: "",
    additional_features: [],
    current_challenges: "",
    budget_range: "",
    special_requirements: "",
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureToggle = (feature, checked) => {
    setFormData(prev => ({
      ...prev,
      additional_features: checked
        ? [...prev.additional_features, feature]
        : prev.additional_features.filter(f => f !== feature)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.institute_name || !formData.contact_person || !formData.email || !formData.phone || !formData.student_count) {
      toast.error("Please fill all required fields marked with *");
      return;
    }

    setIsSubmitting(true);

    try {
      await CustomPlanRequest.create({
        ...formData,
        status: "pending",
        requested_at: new Date().toISOString(),
      });

      toast.success("Request submitted successfully! We'll contact you within 24 hours.");
      onOpenChange(false);
      
      // Reset form
      setFormData({
        institute_name: "",
        institute_type: "",
        contact_person: "",
        email: "",
        phone: "",
        student_count: "",
        duration_months: "",
        additional_features: [],
        current_challenges: "",
        budget_range: "",
        special_requirements: "",
      });
    } catch (error) {
      console.error("Error submitting custom plan request:", error);
      toast.error("Failed to submit request. Please try again or contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">📝 Custom Plan Request</DialogTitle>
          <p className="text-slate-600 text-sm">Fill in your requirements and we'll create a perfect plan for you</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Institute Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Institute Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="institute_name">Institute Name *</Label>
                <Input
                  id="institute_name"
                  value={formData.institute_name}
                  onChange={(e) => handleInputChange("institute_name", e.target.value)}
                  placeholder="ABC Public School"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Institute Type *</Label>
                <Select value={formData.institute_type} onValueChange={(value) => handleInputChange("institute_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="ielts_center">IELTS/PTE Center</SelectItem>
                    <SelectItem value="computer_center">Computer Training Center</SelectItem>
                    <SelectItem value="tuition_center">Tuition Center</SelectItem>
                    <SelectItem value="coaching_center">Coaching Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_count">How Many Students? *</Label>
              <Select value={formData.student_count} onValueChange={(value) => handleInputChange("student_count", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="200-500">200 - 500 students</SelectItem>
                  <SelectItem value="500-1000">500 - 1000 students</SelectItem>
                  <SelectItem value="1000-2000">1000 - 2000 students</SelectItem>
                  <SelectItem value="2000+">2000+ students</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person Name *</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange("contact_person", e.target.value)}
                placeholder="Principal / Director Name"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="principal@school.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+919876543210"
                  required
                />
              </div>
            </div>
          </div>

          {/* Plan Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Plan Details</h3>
            
            <div className="space-y-2">
              <Label>Preferred Duration</Label>
              <Select value={formData.duration_months} onValueChange={(value) => handleInputChange("duration_months", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months (Best Value)</SelectItem>
                  <SelectItem value="24">24 Months (Maximum Savings)</SelectItem>
                  <SelectItem value="flexible">Flexible / Discuss</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional Features Needed</Label>
              <div className="grid md:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg">
                {ADDITIONAL_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={formData.additional_features.includes(feature)}
                      onCheckedChange={(checked) => handleFeatureToggle(feature, checked)}
                    />
                    <Label htmlFor={feature} className="text-sm cursor-pointer">
                      {feature}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_range">Budget Range (Optional)</Label>
              <Select value={formData.budget_range} onValueChange={(value) => handleInputChange("budget_range", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-10k">Under ₹10,000</SelectItem>
                  <SelectItem value="10k-25k">₹10,000 - ₹25,000</SelectItem>
                  <SelectItem value="25k-50k">₹25,000 - ₹50,000</SelectItem>
                  <SelectItem value="50k+">₹50,000+</SelectItem>
                  <SelectItem value="flexible">Flexible / Open to Discuss</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Additional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="current_challenges">What Challenges Are You Facing Currently?</Label>
              <Textarea
                id="current_challenges"
                value={formData.current_challenges}
                onChange={(e) => handleInputChange("current_challenges", e.target.value)}
                placeholder="E.g., Manual attendance is time-consuming, no proper parent communication system..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_requirements">Any Special Requirements?</Label>
              <Textarea
                id="special_requirements"
                value={formData.special_requirements}
                onChange={(e) => handleInputChange("special_requirements", e.target.value)}
                placeholder="E.g., Multiple branches, custom reports, integration with existing system..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}