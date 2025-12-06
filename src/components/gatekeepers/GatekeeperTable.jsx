import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Pencil, Trash2, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Helper function to check if gatekeeper is on duty NOW
const isOnDutyNow = (shiftStart, shiftEnd) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
  
  // Parse shift times (e.g., "07:00" -> 420 minutes)
  const [startHour, startMin] = shiftStart.split(':').map(Number);
  const [endHour, endMin] = shiftEnd.split(':').map(Number);
  
  const shiftStartMinutes = startHour * 60 + startMin;
  const shiftEndMinutes = endHour * 60 + endMin;
  
  // Check if current time is within shift
  return currentTime >= shiftStartMinutes && currentTime <= shiftEndMinutes;
};

export default function GatekeeperTable({ gatekeepers, isLoading, roleName = "Gatekeeper", onEdit, onDelete, onGenerateLink }) {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{roleName}</TableHead>
            <TableHead>{roleName} ID</TableHead>
            <TableHead>{roleName === 'Gatekeeper' ? 'Gate/Post' : 'Department'}</TableHead>
            <TableHead>Shift</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /></div></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{roleName}</TableHead>
          <TableHead>{roleName} ID</TableHead>
          <TableHead>{roleName === 'Gatekeeper' ? 'Gate/Post' : 'Department'}</TableHead>
          <TableHead>Shift</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gatekeepers.map((gatekeeper) => {
          const onDuty = isOnDutyNow(gatekeeper.shift_start, gatekeeper.shift_end);
          const isActive = gatekeeper.status === 'active';
          
          return (
            <TableRow key={gatekeeper.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={gatekeeper.gatekeeper_photo} />
                    <AvatarFallback>{gatekeeper.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900">{gatekeeper.full_name}</p>
                    <p className="text-sm text-slate-500">{gatekeeper.phone_number}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{gatekeeper.gatekeeper_id}</Badge>
              </TableCell>
              <TableCell>{gatekeeper.gate_number}</TableCell>
              <TableCell>{gatekeeper.shift_start} - {gatekeeper.shift_end}</TableCell>
              <TableCell>
                {isActive ? (
                  onDuty ? (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      🟢 On Duty
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 border-slate-300">
                      ⚪ Off Duty
                    </Badge>
                  )
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-300">
                    🔴 Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onEdit(gatekeeper)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => onGenerateLink(gatekeeper)}>
                      <LinkIcon className="w-4 h-4 mr-2" /> Generate Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(gatekeeper.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}