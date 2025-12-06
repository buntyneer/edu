import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, User, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentActivity({ activities, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
          <div className={`p-2 rounded-full ${
            activity.status === 'present' ? 'bg-green-100' :
            activity.status === 'late' ? 'bg-orange-100' : 'bg-slate-100'
          }`}>
            {activity.status === 'present' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : activity.status === 'late' ? (
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            ) : (
              <User className="w-4 h-4 text-slate-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              Student attendance recorded
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={
                activity.status === 'present' ? 'default' :
                activity.status === 'late' ? 'destructive' : 'secondary'
              } className="text-xs">
                {activity.status}
              </Badge>
              <span className="text-xs text-slate-500">
                {new Date(activity.created_date).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  hour12: true,
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}