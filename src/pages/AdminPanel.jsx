import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { School, CustomPlanRequest, User, LicenseKey } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, Key, Mail, Calendar, AlertCircle, CheckCircle, Clock, Trash2, History, Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [schools, setSchools] = useState([]);
  const [customRequests, setCustomRequests] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [generatedKey, setGeneratedKey] = useState("");
  const [keyType, setKeyType] = useState("6M");
  const [customDuration, setCustomDuration] = useState(6);
  const [customUnit, setCustomUnit] = useState("M");
  const [deleteSchoolId, setDeleteSchoolId] = useState(null);
  const [licenseKeys, setLicenseKeys] = useState([]);
  const [showLicenseHistory, setShowLicenseHistory] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const user = await User.me();
      if (user.email !== 'edumanege1@gmail.com') {
        toast.error("Access Denied - Super Admin Only");
        navigate(createPageUrl("AdminDashboard"));
        return;
      }
      setCurrentUser(user);
      loadData();
    } catch (error) {
      toast.error("Authentication required");
      navigate(createPageUrl("Homepage"));
    }
  };

  useEffect(() => {
    filterSchools();
  }, [schools, searchTerm, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allSchools, requests, allLicenseKeys] = await Promise.all([
        School.list("-created_date", 500),
        CustomPlanRequest.list("-created_date", 100),
        LicenseKey.list("-created_date", 500)
      ]);
      
      setLicenseKeys(allLicenseKeys);
      
      // Update expired statuses for old schools
      const now = new Date();
      const updatedSchools = await Promise.all(allSchools.map(async (school) => {
        let expiryDate = null;
        if (school.subscription_status === 'trial' && school.trial_ends_at) {
          expiryDate = new Date(school.trial_ends_at);
        } else if (school.subscription_status === 'active' && school.subscription_expires_at) {
          expiryDate = new Date(school.subscription_expires_at);
        }
        
        if (expiryDate && now > expiryDate && school.subscription_status !== 'expired') {
          try {
            await School.update(school.id, { subscription_status: 'expired' });
            return { ...school, subscription_status: 'expired' };
          } catch (e) {
            console.error('Failed to update school status:', e);
            return school;
          }
        }
        return school;
      }));
      
      setSchools(updatedSchools);
      setCustomRequests(requests);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load schools data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!deleteSchoolId) return;
    
    try {
      await School.delete(deleteSchoolId);
      toast.success("School deleted successfully");
      setDeleteSchoolId(null);
      loadData();
    } catch (error) {
      toast.error("Failed to delete school: " + error.message);
    }
  };

  const filterSchools = () => {
    let filtered = schools;

    if (statusFilter !== "all") {
      filtered = filtered.filter(s => s.subscription_status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.principal_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSchools(filtered);
  };

  const getDaysLeft = (school) => {
    if (!school) return 0;
    
    const now = new Date();
    let expiryDate = null;

    if (school.subscription_status === 'trial' && school.trial_ends_at) {
      expiryDate = new Date(school.trial_ends_at);
    } else if (school.subscription_status === 'active' && school.subscription_expires_at) {
      expiryDate = new Date(school.subscription_expires_at);
    }

    if (!expiryDate) return 0;

    const diffTime = expiryDate - now;
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const generateLicenseKey = (type, duration = null, unit = "M") => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    if (type === "CUSTOM" && duration) {
      return `EDU-${duration}${unit}-${randomPart}`;
    }
    return `EDU-${type}-${randomPart}`;
  };

  const handleGenerateKey = (school) => {
    setSelectedSchool(school);
    const key = keyType === "CUSTOM" ? generateLicenseKey(keyType, customDuration, customUnit) : generateLicenseKey(keyType);
    setGeneratedKey(key);
    setShowKeyDialog(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const sendLicenseEmail = async () => {
    if (!selectedSchool || !generatedKey) return;
    
    try {
      const loadingToast = toast.loading("Sending email...");
      
      const duration = keyType === "CUSTOM" ? `${customDuration}${customUnit}` : keyType;
      const planDetails = keyType === "6M" ? "6 Months (₹3,499)" : 
                         keyType === "12M" ? "12 Months (₹5,999)" : 
                         `Custom Plan (${customDuration} ${customUnit === "H" ? "Hours" : customUnit === "D" ? "Days" : "Months"})`;
      
      await base44.integrations.Core.SendEmail({
        to: selectedSchool.principal_email,
        subject: `Your ${selectedSchool.school_name} License Key - Edumanege`,
        body: `Dear ${selectedSchool.principal_name},

Your license key for ${selectedSchool.school_name} has been generated successfully!

License Key: ${generatedKey}
Plan Type: ${planDetails}

To activate your license:
1. Login to your Edumanege dashboard
2. Go to "Activate License" section
3. Enter the license key above
4. Click "Activate License"

Your subscription will be activated immediately after entering the key.

For any questions or support, please contact us at edumanege1@gmail.com

Best regards,
Edumanege Team`
      });
      
      // Save license key record with email sent status
      await LicenseKey.create({
        license_key: generatedKey,
        school_id: selectedSchool.id,
        school_name: selectedSchool.school_name,
        principal_email: selectedSchool.principal_email,
        principal_name: selectedSchool.principal_name,
        duration: duration,
        plan_type: keyType === "CUSTOM" ? "custom" : "regular",
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        is_activated: false
      });
      
      toast.dismiss(loadingToast);
      toast.success(`License key sent to ${selectedSchool.principal_email}!`);
      loadData(); // Refresh to show new key in history
    } catch (error) {
      toast.error("Failed to send email: " + error.message);
    }
  };
  
  const saveLicenseKeyOnly = async () => {
    if (!selectedSchool || !generatedKey) return;
    
    try {
      const duration = keyType === "CUSTOM" ? `${customDuration}${customUnit}` : keyType;
      
      await LicenseKey.create({
        license_key: generatedKey,
        school_id: selectedSchool.id,
        school_name: selectedSchool.school_name,
        principal_email: selectedSchool.principal_email,
        principal_name: selectedSchool.principal_name,
        duration: duration,
        plan_type: keyType === "CUSTOM" ? "custom" : "regular",
        email_sent: false,
        is_activated: false
      });
      
      toast.success("License key saved (not emailed)");
      setShowKeyDialog(false);
      loadData();
    } catch (error) {
      toast.error("Failed to save: " + error.message);
    }
  };

  const getStatusBadge = (school) => {
    const daysLeft = getDaysLeft(school);
    
    if (school.subscription_status === 'trial') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Trial ({daysLeft}d left)
        </Badge>
      );
    } else if (school.subscription_status === 'active') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active ({daysLeft}d left)
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
  };

  const stats = {
    total: schools.length,
    trial: schools.filter(s => s.subscription_status === 'trial').length,
    active: schools.filter(s => s.subscription_status === 'active').length,
    expired: schools.filter(s => s.subscription_status === 'expired').length,
    customRequests: customRequests.filter(r => r.status === 'pending').length
  };

  if (isLoading || !currentUser) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🔐 Admin Panel</h1>
          <p className="text-slate-600">Manage all schools and license keys</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowLicenseHistory(true)} variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100">
            <History className="w-4 h-4 mr-2" />
            License History ({licenseKeys.length})
          </Button>
          <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("all")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-slate-600">Total Schools</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("trial")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.trial}</div>
            <div className="text-sm text-slate-600">On Trial</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("active")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-slate-600">Active Paid</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("expired")}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-sm text-slate-600">Expired</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.customRequests}</div>
            <div className="text-sm text-slate-600">Custom Requests</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by school name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Schools ({filteredSchools.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.school_name}</TableCell>
                    <TableCell>{school.principal_name}</TableCell>
                    <TableCell>{school.principal_email}</TableCell>
                    <TableCell>{getStatusBadge(school)}</TableCell>
                    <TableCell>{getDaysLeft(school)} days</TableCell>
                    <TableCell>
                      {new Date(school.created_date).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleGenerateKey(school)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Key className="w-4 h-4 mr-1" />
                          Generate Key
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteSchoolId(school.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Generate Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate License Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>School</Label>
              <p className="font-semibold">{selectedSchool?.school_name}</p>
              <p className="text-sm text-slate-600">{selectedSchool?.principal_email}</p>
            </div>

            <div className="space-y-2">
              <Label>Plan Type</Label>
              <Select value={keyType} onValueChange={(val) => {
                setKeyType(val);
                if (val === "CUSTOM") {
                  setGeneratedKey(generateLicenseKey(val, customDuration, customUnit));
                } else {
                  setGeneratedKey(generateLicenseKey(val));
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6M">6 Months (₹3,499)</SelectItem>
                  <SelectItem value="12M">12 Months (₹5,999)</SelectItem>
                  <SelectItem value="CUSTOM">Custom Plan (Hours/Days/Months)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {keyType === "CUSTOM" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      type="number"
                      min="1"
                      value={customDuration}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setCustomDuration(val);
                        setGeneratedKey(generateLicenseKey("CUSTOM", val, customUnit));
                      }}
                      placeholder="Enter number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={customUnit} onValueChange={(val) => {
                      setCustomUnit(val);
                      setGeneratedKey(generateLicenseKey("CUSTOM", customDuration, val));
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="H">Hours</SelectItem>
                        <SelectItem value="D">Days</SelectItem>
                        <SelectItem value="M">Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Create custom duration: Hours (H), Days (D), or Months (M)</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Generated License Key</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedKey}
                  readOnly
                  className="font-mono"
                />
                <Button onClick={() => copyToClipboard(generatedKey)}>
                  Copy
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                📧 Send this key to: <strong>{selectedSchool?.principal_email}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                They can activate it from Dashboard → Activate License
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                className="flex-1"
                variant="outline"
                onClick={sendLicenseEmail}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send via Email
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                onClick={saveLicenseKeyOnly}
              >
                Save Only
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  copyToClipboard(generatedKey);
                  setShowKeyDialog(false);
                  toast.success("Key copied!");
                }}
              >
                Copy & Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSchoolId} onOpenChange={() => setDeleteSchoolId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete School?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this school and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSchool} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* License History Dialog */}
      <Dialog open={showLicenseHistory} onOpenChange={setShowLicenseHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              License Key History ({licenseKeys.length} keys generated)
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Email Sent</TableHead>
                  <TableHead>Activated</TableHead>
                  <TableHead>Generated On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenseKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No license keys generated yet
                    </TableCell>
                  </TableRow>
                ) : (
                  licenseKeys.map((key) => {
                    // Check if key is activated by checking school's license_key
                    const schoolWithKey = schools.find(s => s.license_key === key.license_key);
                    const isActivated = !!schoolWithKey;
                    
                    return (
                      <TableRow key={key.id}>
                        <TableCell className="font-mono text-sm">{key.license_key}</TableCell>
                        <TableCell className="font-medium">{key.school_name}</TableCell>
                        <TableCell className="text-sm">{key.principal_email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{key.duration}</Badge>
                        </TableCell>
                        <TableCell>
                          {key.email_sent ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Check className="w-3 h-3 mr-1" />
                              Sent {key.email_sent_at ? new Date(key.email_sent_at).toLocaleDateString('en-IN') : ''}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600">
                              <X className="w-3 h-3 mr-1" />
                              Not Sent
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isActivated ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activated
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {new Date(key.created_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}