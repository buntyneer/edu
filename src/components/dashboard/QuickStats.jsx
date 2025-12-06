import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const colorClasses = {
  blue: "from-blue-500 to-blue-600 text-blue-600",
  green: "from-green-500 to-green-600 text-green-600", 
  purple: "from-purple-500 to-purple-600 text-purple-600",
  orange: "from-orange-500 to-orange-600 text-orange-600"
};

export default function QuickStats({ title, value, icon: Icon, color, trend, isLoading, onClick }) {
  if (isLoading) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 cursor-pointer active:scale-95" 
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
            {trend && (
              <p className={`text-xs font-medium ${colorClasses[color]}`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${colorClasses[color].split(' ')[2]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}