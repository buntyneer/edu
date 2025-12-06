import React, { useState } from 'react';
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DeleteInstituteDialog({ open, onOpenChange, instituteName, onDeleteConfirm }) {
  const [confirmationText, setConfirmationText] = useState("");
  const isMatch = confirmationText === instituteName;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the institute
            <strong> "{instituteName}"</strong> and all its associated data, including students,
            attendance, and settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 my-4">
          <p className="text-sm font-medium">To confirm, please type <strong>{instituteName}</strong> below:</p>
          <Input 
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!isMatch}
            onClick={onDeleteConfirm}
          >
            Delete Institute
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}