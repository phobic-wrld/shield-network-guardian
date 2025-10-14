
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string;
  trend: number;
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  trend, 
  isLoading = false 
}) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-28" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            <p className={`text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center transition-colors duration-200`}>
              {trend >= 0 ? <ArrowUp className="h-4 w-4 mr-1 animate-float" /> : <ArrowDown className="h-4 w-4 mr-1 animate-float" />}
              {Math.abs(trend).toFixed(1)}% 
              {trend >= 0 ? 'increase' : 'decrease'}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
