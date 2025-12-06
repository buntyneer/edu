
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { School, User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useAppData } from "../layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  School as SchoolIcon,
  Settings,
  Palette,
  BookOpen,
  Trash2,
  Save,
  AlertTriangle,
  Upload,
  Camera,
  LogOut,
  X,
  Users,
  Clock,
  CalendarDays,
  UserCheck,
  Building2,
  GraduationCap,
  Crown
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import DeleteInstituteDialog from "../components/settings/DeleteInstituteDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compressImage, validateImage } from "@/components/utils/imageCompression";

// New Tabs Component
const Tabs = ({ children }) => <div className="flex border-b overflow-x-auto">{children}</div>;
const Tab = ({ label, active, onClick, icon: Icon }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${active ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
    {Icon && <Icon className="w-4 h-4" />}
    {label}
  </button>
);

export default function SchoolSettings() {
  const { school, user, loading } = useAppData() || {};
  const navigate = useNavigate();
  const logoInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [formData, setFormData] = useState(school || {});
  const [newClass, setNewClass] = useState("");
  const [newSection, setNewSection] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Auto-detect user's timezone
  const getUserTimezone = useCallback(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      return 'UTC'; // Fallback to UTC if detection fails
    }
  }, []);

  // Update local state if school data from context changes
  useEffect(() => {
    if (school) {
      const updatedFormData = { ...school };
      // Auto-set timezone if not already set
      if (!updatedFormData.time_zone) {
        updatedFormData.time_zone = getUserTimezone();
      }
      setFormData(updatedFormData);
    }
  }, [school, getUserTimezone]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateImage(file, 10); // Max initial size 10MB

      setIsUploadingLogo(true);
      toast.loading("Compressing logo...", { id: "logo-toast" });

      // ✅ Logo smaller: 512x512 max, 85% quality = ~50KB
      const compressedFile = await compressImage(file, 512, 512, 0.85);

      toast.loading("Uploading compressed logo...", { id: "logo-toast" });

      const result = await UploadFile({ file: compressedFile });

      handleInputChange('logo_url', result.file_url);

      const originalSizeKB = (file.size / 1024).toFixed(0);
      const compressedSizeKB = (compressedFile.size / 1024).toFixed(0);

      toast.success(
        `Logo uploaded! ${originalSizeKB}KB → ${compressedSizeKB}KB`,
        { id: "logo-toast" }
      );

    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Failed to upload logo", { id: "logo-toast" });
    } finally {
      setIsUploadingLogo(false);
      // Clear the file input value so that selecting the same file again triggers onChange
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!school) return;
    setIsSaving(true);
    try {
      await School.update(school.id, formData);
      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.href = createPageUrl("Homepage");
  };

  const handleDeleteInstitute = async () => {
    try {
      await School.delete(school.id);
      toast.success("Institute deleted successfully.");
      await handleLogout();
    } catch (error) {
      toast.error("Failed to delete institute.");
    }
  };

  const handleAddListItem = (field, value) => {
    if (!value) return;
    const currentList = formData[field] || [];
    if (!currentList.includes(value)) {
        handleInputChange(field, [...currentList, value]);
    }
  };

  const handleRemoveListItem = (field, value) => {
    const currentList = formData[field] || [];
    handleInputChange(field, currentList.filter(item => item !== value));
  };

  if (loading) return <div className="p-6 text-center">Loading settings...</div>;
  if (!school) return <div className="p-6 text-center">Please register your institute first.</div>;

  // Use formData.institute_type here to reflect potential unsaved changes
  const isSchoolType = formData.institute_type === 'school';

  return (
    <>
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚙️ Master Settings Control Panel</h1>
          <p className="text-slate-600 mt-1">Complete management system for {school.school_name}</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />{isSaving ? "Saving..." : "Save All Changes"}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
        </div>
      </div>

      <Tabs>
        <Tab label="Institute Info" icon={Building2} active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
        <Tab label="Branding" icon={Palette} active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} />
        <Tab label="Academics" icon={GraduationCap} active={activeTab === 'academics'} onClick={() => setActiveTab('academics')} />
        <Tab label="Admin & Staff" icon={Users} active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
        <Tab label="Time & Schedule" icon={Clock} active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
        <Tab label="Advanced" icon={Settings} active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} />
        <Tab label="Danger Zone" icon={AlertTriangle} active={activeTab === 'danger'} onClick={() => setActiveTab('danger')} />
      </Tabs>

      <div className="mt-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 />Institute Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Institute Name</Label><Input value={formData.school_name || ""} onChange={e => handleInputChange("school_name", e.target.value)} /></div>

                <div>
                  <Label>Website Display Name</Label>
                  <Input
                    value={formData.display_name || ""}
                    onChange={e => handleInputChange("display_name", e.target.value)}
                    placeholder="e.g., Edumanege.com, SmartSchool Manager"
                  />
                  <p className="text-xs text-slate-500 mt-1">This name will appear in the header next to your logo</p>
                </div>

                <div>
                  <Label>Institute Type</Label>
                  <Select value={formData.institute_type || ""} onValueChange={(value) => handleInputChange("institute_type", value)}>
                    <SelectTrigger>
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
                </div>

                <div><Label>Address</Label><Textarea value={formData.school_address || ""} onChange={e => handleInputChange("school_address", e.target.value)} /></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Contact Phone</Label><Input value={formData.principal_phone || ""} onChange={e => handleInputChange("principal_phone", e.target.value)} /></div>
                  <div><Label>Contact Email</Label><Input type="email" value={formData.principal_email || ""} onChange={e => handleInputChange("principal_email", e.target.value)} /></div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Opening Time</Label><Input type="time" value={formData.school_start_time || ""} onChange={e => handleInputChange("school_start_time", e.target.value)} /></div>
                  <div><Label>Closing Time</Label><Input type="time" value={formData.school_end_time || ""} onChange={e => handleInputChange("school_end_time", e.target.value)} /></div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Max Capacity</Label><Input type="number" value={formData.max_capacity || ""} onChange={e => handleInputChange("max_capacity", parseInt(e.target.value))} /></div>
                  <div><Label>Establishment Year</Label><Input type="number" value={formData.establishment_year || ""} onChange={e => handleInputChange("establishment_year", parseInt(e.target.value))} /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'branding' && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette />Branding & Logo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <Label>Institute Logo</Label>
                <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                        {formData.logo_url ? (
                          <img 
                            src={formData.logo_url} 
                            alt="Logo" 
                            className="w-full h-full object-contain p-1"
                            loading="lazy"
                          />
                        ) : (
                          <div className="bg-slate-100 h-full w-full flex items-center justify-center">
                            <Camera className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                    </div>
                    <div>
                      <Button type="button" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo}>
                        <Upload className="w-4 h-4 mr-2" />{isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                      <p className="text-xs text-slate-400 mt-2">✨ Auto-compressed to ~50KB</p>
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Primary Brand Color</Label><Input type="color" value={formData.primary_color || "#3B82F6"} onChange={e => handleInputChange("primary_color", e.target.value)} /></div>
                  <div><Label>Secondary Brand Color</Label><Input type="color" value={formData.secondary_color || "#6B7280"} onChange={e => handleInputChange("secondary_color", e.target.value)} /></div>
                </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'academics' && (
          <div className="space-y-6">
            {isSchoolType ? (
              <>
                <Card>
                  <CardHeader><CardTitle>Classes & Sections Management</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Classes Offered (LKG to 12th)</Label>
                      <div className="flex gap-2 mb-2">
                        <Input value={newClass} onChange={e => setNewClass(e.target.value)} placeholder="e.g., LKG, 1st, 10th" />
                        <Button onClick={() => { handleAddListItem('classes_offered', newClass); setNewClass(""); }}>Add Class</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">{formData.classes_offered?.map(c => <Badge key={c} variant="secondary">{c} <button onClick={() => handleRemoveListItem('classes_offered', c)} className="ml-2 hover:text-red-600"><X size={12} /></button></Badge>)}</div>
                    </div>
                     <div>
                      <Label>Default Sections (A, B, C, D, E...)</Label>
                      <div className="flex gap-2 mb-2">
                        <Input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="e.g., A, B, C" />
                        <Button onClick={() => { handleAddListItem('default_sections', newSection); setNewClass(""); }}>Add Section</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">{formData.default_sections?.map(s => <Badge key={s} variant="outline">{s} <button onClick={() => handleRemoveListItem('default_sections', s)} className="ml-2 hover:text-red-600"><X size={12} /></button></Badge>)}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Timetable Structure</CardTitle></CardHeader>
                  <CardContent className="grid md:grid-cols-3 gap-4">
                     <div><Label>Periods per Day</Label><Input type="number" value={formData.periods_per_day || ''} onChange={e => handleInputChange('periods_per_day', parseInt(e.target.value))} /></div>
                     <div><Label>Period Duration (minutes)</Label><Input type="number" value={formData.period_duration || ''} onChange={e => handleInputChange('period_duration', parseInt(e.target.value))} /></div>
                     <div><Label>Working Days</Label><Input value="Monday to Saturday" disabled className="bg-gray-100" /></div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader><CardTitle>Batch Management System</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-slate-600 mb-4">Create and manage multiple batches with different timings, assign students to batches.</p>
                    <Button onClick={() => navigate(createPageUrl('Batches'))}>
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Manage Batches
                    </Button>
                </CardContent>
              </Card>
            )}

            <Card>
                <CardHeader><CardTitle>Holiday Calendar</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-slate-600 mb-4">Set up your institute's holiday calendar and working days.</p>
                    <Button onClick={() => navigate(createPageUrl('Holidays'))}>
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Manage Holidays
                    </Button>
                </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Staff & Access Management</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 mb-4">Manage {isSchoolType ? 'Gatekeepers' : 'Incharges'}, create access links, and control permissions.</p>
                <Button onClick={() => navigate(createPageUrl('Gatekeepers'))}>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Manage {isSchoolType ? 'Gatekeepers' : 'Incharges'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Student Management</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 mb-4">Complete student database with advanced search, filters, and bulk operations.</p>
                <Button onClick={() => navigate(createPageUrl('Students'))}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Students
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Working Hours & Schedule</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div><Label>Institute Opening Time</Label><Input type="time" value={formData.school_start_time || "08:00"} onChange={e => handleInputChange("school_start_time", e.target.value)} /></div>
                <div><Label>Institute Closing Time</Label><Input type="time" value={formData.school_end_time || "16:00"} onChange={e => handleInputChange("school_end_time", e.target.value)} /></div>
                <div><Label>Academic Year Start</Label><Input type="date" value={formData.academic_year_start || ""} onChange={e => handleInputChange("academic_year_start", e.target.value)} /></div>
                <div>
                  <Label>Time Zone (Auto-detected)</Label>
                  <Input
                    value={formData.time_zone || getUserTimezone()}
                    onChange={e => handleInputChange("time_zone", e.target.value)}
                    placeholder="Auto-detecting timezone..."
                  />
                  <p className="text-xs text-slate-500 mt-1">Timezone automatically detected from your device</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Attendance & Reports</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 mb-4">View comprehensive attendance reports and analytics.</p>
                <Button onClick={() => navigate(createPageUrl('AttendanceReports'))}>
                  <Clock className="w-4 h-4 mr-2" />
                  View Attendance Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {/* License & Subscription Card */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Crown className="w-5 h-5" />
                  License & Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-blue-900">Subscription Status</Label>
                    <div className="mt-2">
                      {formData.subscription_status === 'active' ? (
                        <Badge className="bg-green-100 text-green-800 text-base px-4 py-2">
                          ✅ Active
                        </Badge>
                      ) : formData.subscription_status === 'trial' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 text-base px-4 py-2">
                          🔔 Trial Period
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 text-base px-4 py-2">
                          ⚠️ Expired
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-blue-900">Subscription Plan</Label>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-base px-4 py-2">
                        {formData.subscription_plan === 'custom' ? '💎 Custom Plan' : '⭐ Regular Plan'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {formData.subscription_expires_at && (
                  <div>
                    <Label className="text-blue-900">Expires On</Label>
                    <Input
                      value={new Date(formData.subscription_expires_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                      disabled
                      className="bg-white mt-2"
                    />
                  </div>
                )}

                {formData.license_key && (
                  <div>
                    <Label className="text-blue-900">Active License Key</Label>
                    <Input
                      value={formData.license_key}
                      disabled
                      className="bg-white font-mono mt-2"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-blue-900">Student Limit</Label>
                  <Input
                    value={formData.student_limit === 999999 ? 'Unlimited' : formData.student_limit || '200'}
                    disabled
                    className="bg-white mt-2"
                  />
                </div>

                <div className="pt-4 border-t border-blue-200">
                  <Button
                    onClick={() => navigate(createPageUrl("LicenseActivation"))}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {formData.license_key ? 'Update License' : 'Activate License'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Advanced Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Default Language</Label><Input value={formData.default_language || "en"} onChange={e => handleInputChange("default_language", e.target.value)} /></div>
                <div><Label>Registration Number</Label><Input value={formData.registration_number || ""} onChange={e => handleInputChange("registration_number", e.target.value)} /></div>
                <div><Label>Institute Status</Label><Input value={formData.status || "active"} disabled className="bg-gray-100" /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Communication & Messaging</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 mb-4">Manage parent-teacher communication and broadcast messages.</p>
                <Button onClick={() => navigate(createPageUrl('Messages'))}>
                  <Users className="w-4 h-4 mr-2" />
                  Messaging System
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'danger' && (
            <Card className="border-red-500">
                <CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><AlertTriangle />Danger Zone</CardTitle></CardHeader>
                <CardContent>
                    <h3 className="font-semibold text-lg text-slate-800">Delete this Institute</h3>
                    <p className="text-slate-600 my-2">⚠️ Once you delete the institute, there is no going back. All data including students, attendance, messages will be permanently deleted.</p>
                    <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}><Trash2 className="w-4 h-4 mr-2" />Delete Institute</Button>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
    <DeleteInstituteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        instituteName={school.school_name}
        onDeleteConfirm={handleDeleteInstitute}
    />
    </>
  );
}
