import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Check, LogIn, LogOut, Clock, User, Users } from "lucide-react";

export default function StudentVerification({ student, onConfirm, onCancel }) {
  const [timeLeft, setTimeLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanSkip(true);
    }
  }, [timeLeft]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <Card className="w-full max-w-md bg-white">
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <Avatar className="w-32 h-32 mx-auto border-4 border-blue-200 shadow-lg">
                <AvatarImage src={student.student_photo} alt={student.full_name} />
                <AvatarFallback className="text-4xl text-slate-700 bg-blue-100">
                  {student.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {!canSkip && (
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {timeLeft}
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{student.full_name}</h3>
                <Badge className="bg-blue-100 text-blue-800 text-sm">
                  ID: {student.student_id}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="text-slate-600">Class</span>
                  </div>
                  <p className="font-semibold text-slate-900">{student.class} - {student.section}</p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="text-slate-600">Father</span>
                  </div>
                  <p className="font-semibold text-slate-900">{student.father_name}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-slate-600" />
                  <span className="text-slate-600">Mother</span>
                </div>
                <p className="font-semibold text-slate-900">{student.mother_name}</p>
              </div>

              <div className="flex items-center justify-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {new Date().toLocaleTimeString()} • {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 flex items-center gap-2"
                disabled={!canSkip && timeLeft > 0}
              >
                <X className="w-4 h-4" />
                {canSkip ? "Cancel" : `Wait ${timeLeft}s`}
              </Button>
              
              <Button
                onClick={() => onConfirm(student, false)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Entry
              </Button>
              
              <Button
                onClick={() => onConfirm(student, true)}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Exit
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}