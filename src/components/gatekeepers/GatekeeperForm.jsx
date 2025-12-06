
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, Camera } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { toast } from "sonner";
import { compressImage, validateImage } from "@/components/utils/imageCompression";

export default function GatekeeperForm({ gatekeeper, roleName = "Gatekeeper", onSubmit, onCancel }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState(gatekeeper || {
    gatekeeper_photo: "",
    full_name: "",
    address: "",
    father_name: "",
    phone_number: "",
    email: "",
    gate_number: "",
    shift_start: "",
    shift_end: ""
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateImage(file, 10);

      setIsUploading(true);
      toast.loading("Compressing image...", { id: "compress-toast" });

      // AGGRESSIVE: 800x800, 70% quality
      const compressedFile = await compressImage(file, 800, 800, 0.7);

      toast.loading("Uploading compressed image...", { id: "compress-toast" });

      const result = await UploadFile({ file: compressedFile });
      
      handleInputChange('gatekeeper_photo', result.file_url);
      
      const originalSizeKB = (file.size / 1024).toFixed(0);
      const compressedSizeKB = (compressedFile.size / 1024).toFixed(0);
      
      toast.success(
        `Photo uploaded! ${originalSizeKB}KB → ${compressedSizeKB}KB`, 
        { id: "compress-toast" }
      );

    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload photo", { id: "compress-toast" });
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
          <CardTitle>{gatekeeper ? `Edit ${roleName}` : `Add New ${roleName}`}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <div className="relative w-32 h-32 mx-auto mb-4">
                {formData.gatekeeper_photo ? (
                  <img
                    src={formData.gatekeeper_photo}
                    alt={roleName}
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
                  className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
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
                {isUploading ? "Compressing & uploading..." : `Click to upload ${roleName.toLowerCase()} photo`}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ✨ Auto-compressed to ~150KB
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">{roleName} Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father_name">Father's Name</Label>
                <Input
                  id="father_name"
                  value={formData.father_name}
                  onChange={(e) => handleInputChange('father_name', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="+919876543210"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gate_number">{roleName === 'Gatekeeper' ? 'Gate Number/Post' : 'Department'} *</Label>
                <Input
                  id="gate_number"
                  value={formData.gate_number}
                  onChange={(e) => handleInputChange('gate_number', e.target.value)}
                  placeholder={roleName === 'Gatekeeper' ? "e.g., Gate 1, Main Gate" : "e.g., IELTS Department"}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift_start">Shift Start Time *</Label>
                <Input
                  id="shift_start"
                  type="time"
                  value={formData.shift_start}
                  onChange={(e) => handleInputChange('shift_start', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift_end">Shift End Time *</Label>
                <Input
                  id="shift_end"
                  type="time"
                  value={formData.shift_end}
                  onChange={(e) => handleInputChange('shift_end', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {gatekeeper ? `Update ${roleName}` : `Add ${roleName}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
