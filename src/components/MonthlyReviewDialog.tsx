'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { getMonthlyGoals, createMonthlyGoals } from '@/app/(main)/actions/goals';
import { updateProfile } from '@/app/(main)/actions/profile';
import { createReflection } from '@/app/(main)/actions/reflections';
import { getCurrentMonth, getCurrentYear, getNextMonth } from '@/lib/date';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

interface MonthlyGoal {
  id: string;
  title: string;
  month: number;
  year: number;
  order: number;
  status: 'active' | 'done' | 'dropped';
}

interface MonthlyReviewDialogProps {
  userId: string;
  lastReviewDate: string | null;
}

function SortableGoalItem({ goal, onUpdate, onDelete }: {
  goal: MonthlyGoal;
  onUpdate: (id: string, data: Partial<MonthlyGoal>) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center space-x-2 p-3 bg-white rounded border">
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing p-1"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="flex-1">
        <Input
          value={goal.title}
          onChange={(e) => onUpdate(goal.id, { title: e.target.value })}
          className="border-0 p-0 h-auto"
          placeholder="Enter goal..."
        />
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(goal.id)}
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function MonthlyReviewDialog({ }: MonthlyReviewDialogProps) {
  const [open, setOpen] = useState(true);
  const [reflection, setReflection] = useState('');
  const [goals, setGoals] = useState<MonthlyGoal[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const nextMonth = getNextMonth();

  const { data: currentGoals = [], isLoading } = useQuery({
    queryKey: ['monthlyGoals'],
    queryFn: getMonthlyGoals,
  });

  const currentMonthGoals = currentGoals.filter(
    goal => goal.month === currentMonth && goal.year === currentYear && goal.status === 'active'
  );

  useEffect(() => {
    if (currentMonthGoals.length > 0) {
      setGoals(currentMonthGoals);
    }
  }, [currentMonthGoals]);

  const createGoalsMutation = useMutation({
    mutationFn: createMonthlyGoals,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
    onError: (error) => {
      toast.error('Failed to save goals');
      console.error(error);
    },
  });

  const createReflectionMutation = useMutation({
    mutationFn: createReflection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] });
    },
    onError: (error) => {
      toast.error('Failed to save reflection');
      console.error(error);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error(error);
    },
  });

  const handleSubmit = async () => {
    try {
      // Save monthly reflection if provided
      if (reflection.trim()) {
        await createReflectionMutation.mutateAsync({
          whatWentWell: reflection,
          forDate: new Date().toISOString().split('T')[0],
          isMonthly: true,
        });
      }

      // Save next month's goals
      if (goals.length > 0) {
        const goalsWithOrder = goals.map((goal, index) => ({
          title: goal.title,
          month: nextMonth.month,
          year: nextMonth.year,
          order: (index + 1) * 100,
        }));

        await createGoalsMutation.mutateAsync(goalsWithOrder);
      }

      // Update profile with last review date
      await updateProfileMutation.mutateAsync({
        lastMonthlyReviewAt: new Date().toISOString().split('T')[0],
      });

      toast.success('Monthly review completed!');
      setOpen(false);
    } catch (error) {
      toast.error('Failed to complete monthly review');
      console.error(error);
    }
  };

  const handleAddGoal = () => {
    if (goals.length >= 5) {
      toast.error('You can have at most 5 monthly goals');
      return;
    }

    const newGoal: MonthlyGoal = {
      id: `temp-${Date.now()}`,
      title: '',
      month: nextMonth.month,
      year: nextMonth.year,
      order: (goals.length + 1) * 100,
      status: 'active',
    };

    setGoals([...goals, newGoal]);
  };

  const handleUpdateGoal = (id: string, data: Partial<MonthlyGoal>) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, ...data } : goal
    ));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
    setDeleteConfirmId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = goals.findIndex((goal) => goal.id === active.id);
      const newIndex = goals.findIndex((goal) => goal.id === over.id);
      
      setGoals(arrayMove(goals, oldIndex, newIndex));
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Monthly Review</DialogTitle>
            <DialogDescription>
              It&apos;s time to reflect on this month and plan for next month. Here are your current goals and priorities.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Goals */}
            {currentMonthGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Month&apos;s Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentMonthGoals
                      .sort((a, b) => a.order - b.order)
                      .map((goal) => (
                        <div key={goal.id} className="p-3 bg-blue-50 rounded-lg">
                          <h3 className="font-medium text-blue-900">{goal.title}</h3>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly Reflection */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Reflection</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="What went well this month? What didn't go well? What would you like to improve?"
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>

            {/* Next Month's Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Goals for Next Month</CardTitle>
                <p className="text-sm text-gray-600">
                  {new Date(nextMonth.year, nextMonth.month - 1).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={goals.map(goal => goal.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {goals.map((goal) => (
                        <SortableGoalItem
                          key={goal.id}
                          goal={goal}
                          onUpdate={handleUpdateGoal}
                          onDelete={(id) => setDeleteConfirmId(id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {goals.length < 5 && (
                  <Button
                    variant="outline"
                    onClick={handleAddGoal}
                    className="w-full mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Skip for now
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createGoalsMutation.isPending || createReflectionMutation.isPending || updateProfileMutation.isPending}
              >
                Complete Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDeleteGoal(deleteConfirmId)}
        title="Delete Goal"
        description="Are you sure you want to delete this goal?"
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </>
  );
}
