import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { School, Download } from "lucide-react";
import { toast } from "react-hot-toast";

export default function StudentIdCard({ student, schoolName, onOpenChange, schoolLogo, instituteType }) {
  if (!student) return null;
  
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(student.student_id)}&scale=3&includetext&height=10`;

  const isSchool = instituteType === 'school';
  const displayClass = isSchool ? student.class : student.course_name;
  const displayFather = isSchool ? student.father_name : student.guardian_name;

  const handleDownload = async () => {
    toast.loading("Generating Professional ID Card...", { id: "download-toast" });

    try {
        const scale = 3;
        const cardWidth = 325;
        const cardHeight = 520;

        const canvas = document.createElement('canvas');
        canvas.width = cardWidth * scale;
        canvas.height = cardHeight * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cardWidth, cardHeight);

        const headerHeight = 150;
        const gradient = ctx.createLinearGradient(0, 0, cardWidth, headerHeight);
        gradient.addColorStop(0, '#4f46e5');
        gradient.addColorStop(1, '#2563eb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, cardWidth, headerHeight);
        
        let schoolLogoImage = null;
        if (schoolLogo) {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('School logo load failed'));
                    img.src = schoolLogo;
                    setTimeout(() => reject(new Error('School logo timeout')), 4000);
                });
                schoolLogoImage = img;
            } catch (e) {
                console.error('Failed to load school logo for download:', e.message);
            }
        }

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';

        if (schoolLogoImage) {
            const logoSize = 40;
            const logoX = (cardWidth - logoSize) / 2;
            const logoY = 20;

            ctx.save();
            ctx.beginPath();
            ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
            ctx.restore();

            ctx.drawImage(schoolLogoImage, logoX, logoY, logoSize, logoSize);
            
            ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
            ctx.fillText(schoolName || 'SmartSchool', cardWidth / 2, logoY + logoSize + 15);
        } else {
            ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
            ctx.fillText(schoolName || 'SmartSchool', cardWidth / 2, 45);
        }

        let studentPhoto = null;
        if (student.student_photo) {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('Photo load failed'));
                    img.src = student.student_photo;
                    setTimeout(() => reject(new Error('Photo timeout')), 4000);
                });
                studentPhoto = img;
            } catch (e) {
                console.error(e.message);
            }
        }
        
        let barcodeImage = null;
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(new Error("Barcode could not be loaded."));
                img.src = barcodeUrl;
                setTimeout(() => reject(new Error('Barcode timeout')), 5000);
            });
            barcodeImage = img;
        } catch (e) {
            console.error(e.message);
            toast.error(e.message, { id: "download-toast" });
            return;
        }
        
        const photoSize = 90;
        const photoY = headerHeight - (photoSize / 2);
        const photoX = (cardWidth - photoSize) / 2;

        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, (photoSize / 2) + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.save();
        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2, true);
        ctx.clip();
        if (studentPhoto) {
            ctx.drawImage(studentPhoto, photoX, photoY, photoSize, photoSize);
        } else {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(photoX, photoY, photoSize, photoSize);
            ctx.fillStyle = '#64748b';
            ctx.font = `bold ${photoSize / 2}px "Segoe UI"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(student.full_name.charAt(0).toUpperCase(), photoX + photoSize / 2, photoY + photoSize / 2);
        }
        ctx.restore();
        
        const contentStartY = photoY + photoSize + 20;
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 22px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText(student.full_name, cardWidth / 2, contentStartY);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '14px "Segoe UI"';
        
        const classText = isSchool 
          ? `Class: ${student.class || 'N/A'} ${student.section ? '- ' + student.section : ''}`
          : `Course: ${student.course_name || 'N/A'}`;
        ctx.fillText(classText, cardWidth / 2, contentStartY + 25);
        
        const fatherText = isSchool 
          ? `Father: ${student.father_name || 'N/A'}`
          : `Guardian: ${student.guardian_name || 'N/A'}`;
        ctx.fillText(fatherText, cardWidth / 2, contentStartY + 45);

        const barcodeSectionY = contentStartY + 100;
        if (barcodeImage) {
            const aspectRatio = barcodeImage.width / barcodeImage.height;
            const barcodeDrawHeight = 45;
            const barcodeDrawWidth = barcodeDrawHeight * aspectRatio;
            ctx.drawImage(barcodeImage, (cardWidth - barcodeDrawWidth) / 2, barcodeSectionY, barcodeDrawWidth, barcodeDrawHeight);
        }

        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px "Segoe UI"';
        ctx.fillText(`Property of ${schoolName || 'School'}`, cardWidth / 2, cardHeight - 25);

        const link = document.createElement('a');
        link.download = `${student.full_name.replace(/\s+/g, '_')}_ID_Card.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        toast.success("Professional ID Card downloaded!", { id: "download-toast" });

    } catch (error) {
        console.error('Error creating ID card:', error);
        toast.error(`Failed to create ID card: ${error.message}`, { id: "download-toast" });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <div id="student-id-card" className="bg-white">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden">
                {schoolLogo ? (
                    <img 
                      src={schoolLogo} 
                      alt="School Logo" 
                      className="w-full h-full object-contain p-1" 
                      onError={(e) => {
                        console.error('School logo failed to load');
                        e.target.style.display = 'none';
                      }}
                    />
                ) : (
                    <School className="w-6 h-6" />
                )}
              </div>
              <h2 className="text-lg font-bold leading-tight">{schoolName || "SmartSchool"}</h2>
            </div>
            
            {/* ✅ FIXED: Better image handling with fallback */}
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white/30 shadow-lg">
              {student.student_photo ? (
                <AvatarImage 
                  src={student.student_photo} 
                  alt={student.full_name}
                  className="object-cover"
                  onError={(e) => {
                    console.error('Student photo failed to load:', student.student_photo);
                    e.target.style.display = 'none';
                  }}
                />
              ) : null}
              <AvatarFallback className="text-2xl font-bold text-slate-700 bg-white">
                {student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'}
              </AvatarFallback>
            </Avatar>
            
            <h3 className="text-xl font-bold mb-1">{student.full_name}</h3>
            <p className="text-blue-200 text-sm">Student</p>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 gap-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">{isSchool ? 'Class:' : 'Course:'}</span>
                <span className="font-semibold text-slate-800">
                  {displayClass || 'N/A'} {isSchool && student.section ? `- ${student.section}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">{isSchool ? 'Father:' : 'Guardian:'}</span>
                <span className="font-semibold text-slate-800">{displayFather || 'N/A'}</span>
              </div>
            </div>
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-slate-500 mb-3">Scan for Attendance</p>
              <div className="bg-white p-2 rounded-lg border border-gray-200 inline-block mb-3 shadow-sm">
                <img 
                  src={barcodeUrl} 
                  alt="Student ID Barcode" 
                  className="h-12 mx-auto"
                  onError={(e) => {
                    console.error('Barcode failed to load');
                    e.target.alt = 'Barcode unavailable';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white border-t flex justify-center gap-3">
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download Professional ID
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}