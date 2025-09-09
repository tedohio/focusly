'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLongTermGoals, getFocusAreas, getMonthlyGoals } from '@/app/(main)/actions/goals';
import { getCurrentMonth, getCurrentYear } from '@/lib/date';

interface GoalsSideDrawerProps {
  children: React.ReactNode;
}

export default function GoalsSideDrawer({ children }: GoalsSideDrawerProps) {
  const [open, setOpen] = useState(false);

  const { data: longTermGoals = [] } = useQuery({
    queryKey: ['longTermGoals'],
    queryFn: getLongTermGoals,
  });

  const { data: focusAreas = [] } = useQuery({
    queryKey: ['focusAreas'],
    queryFn: getFocusAreas,
  });

  const { data: monthlyGoals = [] } = useQuery({
    queryKey: ['monthlyGoals'],
    queryFn: getMonthlyGoals,
  });

  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const activeMonthlyGoals = monthlyGoals.filter(
    goal => goal.month === currentMonth && goal.year === currentYear && goal.status === 'active'
  );

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Goals & Focus Areas</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Long-term Goal */}
            {longTermGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Long-term Goal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {longTermGoals.map((goal) => (
                      <div key={goal.id} className="p-3 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-900">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-sm text-blue-700 mt-1">{goal.description}</p>
                        )}
                        <Badge variant="secondary" className="mt-2">
                          {goal.targetYears} year{goal.targetYears > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Focus Areas */}
            {focusAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Focus Areas</CardTitle>
                  <CardDescription>
                    The 3-5 most important things you need to do consistently
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {focusAreas
                      .sort((a, b) => a.order - b.order)
                      .map((area) => (
                        <div key={area.id} className="p-3 bg-green-50 rounded-lg">
                          <h3 className="font-medium text-green-900">{area.title}</h3>
                          {area.description && (
                            <p className="text-sm text-green-700 mt-1">{area.description}</p>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly Goals */}
            {activeMonthlyGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">This Month&apos;s Goals</CardTitle>
                  <CardDescription>
                    {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activeMonthlyGoals
                      .sort((a, b) => a.order - b.order)
                      .map((goal) => (
                        <div key={goal.id} className="p-3 bg-purple-50 rounded-lg">
                          <h3 className="font-medium text-purple-900">{goal.title}</h3>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {longTermGoals.length === 0 && focusAreas.length === 0 && activeMonthlyGoals.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No goals set yet. Complete onboarding to get started!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
