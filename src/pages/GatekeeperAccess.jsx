
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Gatekeeper, School } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  UserCheck, 
  LogIn, 
  AlertTriangle,
  School as SchoolIcon,
  Clock
} from "lucide-react";
import { toast } from "sonner";

export default function GatekeeperAccess() {
  const navigate = useNavigate();
  const [gatekeeperId, setGatekeeperId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get gatekeeper ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const linkId = urlParams.get('id');
    
    if (linkId) {
      setGatekeeperId(linkId.toUpperCase());
    }

    // REMOVED localStorage check to prevent automatic redirect
  }, []);

  const handleLogin = async () => {
    if (!gatekeeperId.trim()) {
      setError("Please enter your Gatekeeper ID");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const gatekeepers = await Gatekeeper.filter({ 
        gatekeeper_id: gatekeeperId.trim().toUpperCase() 
      });
      
      if (gatekeepers.length === 0) {
        setError("Gatekeeper ID not found. Please check your ID and try again.");
        setIsLoading(false);
        return;
      }

      const gatekeeper = gatekeepers[0];
      
      if (gatekeeper.status !== 'active') {
        setError("Your account is currently inactive. Please contact the school administrator.");
        setIsLoading(false);
        return;
      }

      const schools = await School.filter({ id: gatekeeper.school_id });
      if (schools.length === 0) {
        setError("School information not found. Please contact the administrator.");
        setIsLoading(false);
        return;
      }

      const school = schools[0];

      const sessionData = {
        id: gatekeeper.id,
        gatekeeper_id: gatekeeper.gatekeeper_id,
        full_name: gatekeeper.full_name,
        gate_number: gatekeeper.gate_number,
        shift_start: gatekeeper.shift_start,
        shift_end: gatekeeper.shift_end,
        school_id: gatekeeper.school_id,
        school_name: school.school_name,
        phone_number: gatekeeper.phone_number,
        email: gatekeeper.email,
        login_time: new Date().toISOString(),
        status: 'active'
      };

      localStorage.setItem("gatekeeper", JSON.stringify(sessionData));

      toast.success(`Welcome ${gatekeeper.full_name}!`);
      
      navigate(createPageUrl("AttendanceInterface"));
      
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed due to a technical error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 overflow-hidden bg-white shadow-2xl border-4 border-blue-100">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c112913d9da1e2ebed8be6/a23e5cb66_Gemini_Generated_Image_p6574bp6574bp657.png" 
              alt="Edumanege Logo" 
              className="w-full h-full object-contain scale-110" 
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Gatekeeper Access</h1>
          <p className="text-slate-600">Enter your ID to access the attendance system</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <SchoolIcon className="w-5 h-5" />
              SmartSchool Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gatekeeperId">Gatekeeper ID</Label>
              <Input
                id="gatekeeperId"
                type="text"
                placeholder="Enter your Gatekeeper ID (e.g., GK-123)"
                value={gatekeeperId}
                onChange={(e) => setGatekeeperId(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className={`text-center font-mono text-lg ${error ? "border-red-500" : ""}`}
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleLogin} 
              disabled={isLoading || !gatekeeperId.trim()} 
              className="w-full h-12 text-lg font-semibold"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {isLoading ? "Verifying..." : "Access Scanner"}
            </Button>
            
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Instructions
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Enter your unique Gatekeeper ID from the link.</li>
                <li>• Bookmark this page for daily access.</li>
                <li>• Contact admin if you face any issues.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Need help? Contact your school administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

