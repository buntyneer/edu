
import React, { useState, useEffect } from 'react';
import { RegistrationLink } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function GenerateLinkDialog({ open, onOpenChange, schoolId }) {
  const [expiry, setExpiry] = useState("7");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    if (!schoolId) {
      toast.error("School information not found. Please ensure you are logged in.");
      return;
    }
    setIsLoading(true);
    try {
      const link_id = Math.random().toString(36).substring(2, 15);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiry));

      await RegistrationLink.create({
        school_id: schoolId,
        link_id: link_id,
        expiry_date: expiryDate.toISOString(),
        is_active: true
      });
      
      // Use current working domain
      const currentDomain = window.location.origin;
      
      const url = `${currentDomain}${createPageUrl(`StudentRegistrationForm?link=${link_id}`)}`;
      setGeneratedLink(url);
      toast.success("Registration link generated successfully!");
    } catch (error) {
      console.error("Error generating link:", error);
      toast.error("Failed to generate link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleShare = () => {
    const message = `Hello! You can register your child for our school using this link: ${generatedLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  useEffect(() => {
    if (!open) {
      setGeneratedLink("");
      setExpiry("7");
      setIsCopied(false);
      setIsLoading(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Student Registration Link</DialogTitle>
          <DialogDescription>
            Create a unique link for parents to register their children.
          </DialogDescription>
        </DialogHeader>
        
        {!generatedLink ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Link Expiration</Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger id="expiry">
                  <SelectValue placeholder="Set expiration period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isLoading || !schoolId} className="w-full">
              {isLoading ? "Generating..." : "Generate Link"}
            </Button>
            {!schoolId && (
                <p className="text-sm text-red-500">School ID is missing. Cannot generate link.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Label>Generated Link</Label>
            <div className="flex items-center gap-2">
              <Input value={generatedLink} readOnly className="flex-1" />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            <Button onClick={handleShare} className="w-full bg-green-600 hover:bg-green-700">
              <Share2 className="w-4 h-4 mr-2" /> Share on WhatsApp
            </Button>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
