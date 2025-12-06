import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, Share2, Check, Smartphone, MessageCircle, Globe } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function ParentAppLink({ student, schoolName, open, onOpenChange }) {
  const [isCopied, setIsCopied] = useState(false);
  
  if (!student) return null;
  
  // Use the actual working domain - the one that currently loads the app
  const currentDomain = window.location.origin;
  
  // FIXED: Direct link to ParentChat without going through Homepage
  const parentLink = `${currentDomain}${createPageUrl(`ParentChat?student=${student.student_id}`)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(parentLink);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleWhatsAppShare = () => {
    const message = `📱 *${schoolName} - Parent App*

Hello! Your child ${student.full_name} is enrolled in ${schoolName}.

🎯 Get our Parent App to:
✅ Chat with teachers directly  
✅ Get attendance notifications
✅ Receive important updates
✅ View your child's progress

📲 *Click this link to get the app:*
${parentLink}

📝 *How to use:*
1. Click the link above
2. It will open the chat directly
3. You can "Add to Home Screen" to make it an app like WhatsApp!

Thank you,
${schoolName} Management`;

    const whatsappUrl = `https://wa.me/${student.parent_whatsapp?.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success("WhatsApp opened with parent app link!");
  };
  
  const handleSMSShare = () => {
    const smsMessage = `${schoolName}: Get our Parent App for ${student.full_name}. Direct chat link: ${parentLink}`;
    const smsUrl = `sms:${student.parent_whatsapp}?body=${encodeURIComponent(smsMessage)}`;
    window.open(smsUrl);
    toast.success("SMS app opened with parent link!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            Share Parent App - {student.full_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          
          {/* App Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="text-center">
              <Smartphone className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-900">{schoolName} Parent App</h3>
              <p className="text-sm text-slate-600 mt-1">
                Direct chat with teachers • Attendance alerts • School updates
              </p>
            </div>
          </div>

          {/* Student Info */}
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Student:</strong> {student.full_name}</div>
              <div><strong>Class:</strong> {student.class || 'N/A'}</div>
              <div><strong>ID:</strong> {student.student_id}</div>
              <div><strong>Parent Phone:</strong> {student.parent_whatsapp || 'Not provided'}</div>
            </div>
          </div>

          {/* Generated Link */}
          <div>
            <label className="text-sm font-medium text-slate-700">Parent App Link (Direct Chat Access)</label>
            <div className="flex items-center gap-2 mt-2">
              <Input 
                value={parentLink} 
                readOnly 
                className="flex-1 text-xs bg-slate-50" 
              />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Show Working Domain Info */}
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs text-green-700 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                ✅ FIXED: Direct chat link (no homepage redirect): <strong>{currentDomain}</strong>
              </p>
              <p className="text-xs text-green-600 mt-1">
                This link will open chat directly without going to homepage.
              </p>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Share with Parent:</p>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={handleWhatsAppShare}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={!student.parent_whatsapp}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send via WhatsApp
              </Button>
              
              <Button 
                onClick={handleSMSShare}
                variant="outline"
                className="w-full"
                disabled={!student.parent_whatsapp}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Send via SMS
              </Button>
            </div>
            
            {!student.parent_whatsapp && (
              <p className="text-xs text-orange-600 text-center">
                ⚠️ Parent phone number not available. Please add it in student details first.
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-900 mb-2">📋 FIXED - Parent Instructions:</h4>
            <ol className="text-xs text-green-800 space-y-1">
              <li>1. ✅ Parent will click the link you send</li>
              <li>2. ✅ Chat will open directly (no homepage redirect)</li>
              <li>3. ✅ They can "Add to Home Screen" to make it an app</li>
              <li>4. ✅ They'll be able to chat directly with you!</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}