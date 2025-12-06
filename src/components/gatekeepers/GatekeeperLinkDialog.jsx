import React, { useState } from 'react';
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function GatekeeperLinkDialog({ gatekeeper, onOpenChange }) {
  const [isCopied, setIsCopied] = useState(false);
  
  // Create stable, permanent link
  const baseUrl = window.location.origin;
  const linkPath = createPageUrl("GatekeeperAccess");
  const stableUrl = `${baseUrl}${linkPath}?id=${gatekeeper.gatekeeper_id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(stableUrl);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleShare = () => {
    const message = `🏫 *SmartSchool Access Link*\n\nHello ${gatekeeper.full_name},\n\nYour gatekeeper access link is ready:\n${stableUrl}\n\n🆔 Your ID: ${gatekeeper.gatekeeper_id}\n🚪 Gate: ${gatekeeper.gate_number}\n⏰ Shift: ${gatekeeper.shift_start} - ${gatekeeper.shift_end}\n\n📱 Save this link for daily attendance scanning.\n\n*This link will never expire and is permanently assigned to you.*`;
    
    const whatsappUrl = `https://wa.me/${gatekeeper.phone_number}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.info("Opening WhatsApp...", {
      description: "Share the permanent access link"
    });
  };

  const testLink = () => {
    window.open(stableUrl, '_blank');
    toast.info("Testing link in new tab...");
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Permanent Gatekeeper Access
          </DialogTitle>
          <DialogDescription>
            This is a permanent link for {gatekeeper.full_name}. It will never expire and can be used daily.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Link Display */}
          <div className="space-y-2">
            <Label>Permanent Access Link</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={stableUrl} 
                readOnly 
                className="flex-1 bg-slate-50 border-2" 
              />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Gatekeeper Details */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-blue-900">Gatekeeper Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">ID:</span> {gatekeeper.gatekeeper_id}</div>
              <div><span className="font-medium">Gate:</span> {gatekeeper.gate_number}</div>
              <div><span className="font-medium">Shift:</span> {gatekeeper.shift_start} - {gatekeeper.shift_end}</div>
              <div><span className="font-medium">Status:</span> <span className="text-green-600 font-medium">Active</span></div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-amber-800">Instructions:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• This link is permanent and will never expire</li>
                  <li>• Gatekeeper can bookmark it for daily use</li>
                  <li>• Works on any mobile device or computer</li>
                  <li>• No need to generate new links</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleShare} 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Share2 className="w-4 h-4 mr-2" /> 
              Share on WhatsApp
            </Button>
            <Button 
              onClick={testLink} 
              variant="outline"
              className="px-6"
            >
              Test Link
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}