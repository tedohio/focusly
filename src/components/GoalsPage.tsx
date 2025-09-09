'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { 
  getLongTermGoals, 
  getFocusAreas, 
  getMonthlyGoals,
  createLongTermGoal,
  updateLongTermGoal,
  createFocusAreas,
  deleteFocusArea,
  createMonthlyGoals
} from '@/app/(main)/actions/goals';
import { getCurrentMonth, getCurrentYear } from '@/lib/date';
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

export default function GoalsPage() {
  const [editingLongTerm, setEditingLongTerm] = useState(false);
  const [editingFocusAreas, setEditingFocusAreas] = useState(false);
  const [editingMonthlyGoals, setEditingMonthlyGoals] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [longTermGoal, setLongTermGoal] = useState({ title: '', description: '', targetYears: 3 });
  const [focusAreas, setFocusAreas] = useState<Array<{ id: string; title: string; description: string; order: number }>>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);

  const queryClient = useQueryClient();
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: longTermGoals = [] } = useQuery({
    queryKey: ['longTermGoals'],
    queryFn: getLongTermGoals,
  });

  const { data: focusAreasData = [] } = useQuery({
    queryKey: ['focusAreas'],
    queryFn: getFocusAreas,
  });

  const { data: monthlyGoalsData = [] } = useQuery({
    queryKey: ['monthlyGoals'],
    queryFn: getMonthlyGoals,
  });

  const activeMonthlyGoals = monthlyGoalsData.filter(
    goal => goal.month === currentMonth && goal.year === currentYear && goal.status === 'active'
  );

  const createLongTermGoalMutation = useMutation({
    mutationFn: createLongTermGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['longTermGoals'] });
      setEditingLongTerm(false);
      toast.success('Long-term goal saved');
    },
    onError: (error) => {
      toast.error('Failed to save long-term goal');
      console.error(error);
    },
  });

  const updateLongTermGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ title: string; description: string; targetYears: number }> }) => updateLongTermGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['longTermGoals'] });
      setEditingLongTerm(false);
      toast.success('Long-term goal updated');
    },
    onError: (error) => {
      toast.error('Failed to update long-term goal');
      console.error(error);
    },
  });

  const createFocusAreasMutation = useMutation({
    mutationFn: createFocusAreas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focusAreas'] });
      setEditingFocusAreas(false);
      toast.success('Focus areas saved');
    },
    onError: (error) => {
      toast.error('Failed to save focus areas');
      console.error(error);
    },
  });

  const deleteFocusAreaMutation = useMutation({
    mutationFn: deleteFocusArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focusAreas'] });
      setDeleteConfirmId(null);
      toast.success('Focus area deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete focus area');
      console.error(error);
    },
  });

  const createMonthlyGoalsMutation = useMutation({
    mutationFn: createMonthlyGoals,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
      setEditingMonthlyGoals(false);
      toast.success('Monthly goals saved');
    },
    onError: (error) => {
      toast.error('Failed to save monthly goals');
      console.error(error);
    },
  });


  const handleEditLongTerm = () => {
    if (longTermGoals.length > 0) {
      const goal = longTermGoals[0];
      setLongTermGoal({
        title: goal.title,
        description: goal.description || '',
        targetYears: goal.targetYears,
      });
    }
    setEditingLongTerm(true);
  };

  const handleSaveLongTerm = async () => {
    if (!longTermGoal.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (longTermGoals.length > 0) {
      await updateLongTermGoalMutation.mutateAsync({
        id: longTermGoals[0].id,
        data: longTermGoal,
      });
    } else {
      await createLongTermGoalMutation.mutateAsync(longTermGoal);
    }
  };

  const handleEditFocusAreas = () => {
    setFocusAreas(focusAreasData.map(fa => ({
      id: fa.id,
      title: fa.title,
      description: fa.description || '',
      order: fa.order,
    })));
    setEditingFocusAreas(true);
  };

  const handleSaveFocusAreas = async () => {
    const validAreas = focusAreas.filter(fa => fa.title.trim());
    if (validAreas.length < 3) {
      toast.error('Please enter at least 3 focus areas');
      return;
    }
    await createFocusAreasMutation.mutateAsync(validAreas);
  };

  const handleEditMonthlyGoals = () => {
    setMonthlyGoals(activeMonthlyGoals);
    setEditingMonthlyGoals(true);
  };

  const handleSaveMonthlyGoals = async () => {
    const validGoals = monthlyGoals.filter(mg => mg.title.trim());
    if (validGoals.length < 3) {
      toast.error('Please enter at least 3 monthly goals');
      return;
    }
    
    const goalsWithOrder = validGoals.map((goal, index) => ({
      title: goal.title,
      month: currentMonth,
      year: currentYear,
      order: (index + 1) * 100,
    }));

    await createMonthlyGoalsMutation.mutateAsync(goalsWithOrder);
  };

  const handleMonthlyGoalDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = monthlyGoals.findIndex((goal) => goal.id === active.id);
      const newIndex = monthlyGoals.findIndex((goal) => goal.id === over.id);
      setMonthlyGoals(arrayMove(monthlyGoals, oldIndex, newIndex));
    }
  };

  const addFocusArea = () => {
    if (focusAreas.length >= 5) {
      toast.error('You can have at most 5 focus areas');
      return;
    }
    setFocusAreas([...focusAreas, {
      id: Date.now().toString(),
      title: '',
      description: '',
      order: focusAreas.length + 1,
    }]);
  };

  const addMonthlyGoal = () => {
    if (monthlyGoals.length >= 5) {
      toast.error('You can have at most 5 monthly goals');
      return;
    }
    setMonthlyGoals([...monthlyGoals, {
      id: Date.now().toString(),
      title: '',
      month: currentMonth,
      year: currentYear,
      order: monthlyGoals.length + 1,
      status: 'active' as const,
    }]);
  };

  const removeFocusArea = (id: string) => {
    if (focusAreas.length <= 3) {
      toast.error('You must have at least 3 focus areas');
      return;
    }
    setFocusAreas(focusAreas.filter(fa => fa.id !== id));
  };

  const removeMonthlyGoal = (id: string) => {
    if (monthlyGoals.length <= 3) {
      toast.error('You must have at least 3 monthly goals');
      return;
    }
    setMonthlyGoals(monthlyGoals.filter(mg => mg.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Goals & Focus Areas</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your long-term goals, focus areas, and monthly objectives
        </p>
      </div>

      {/* Long-term Goal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Long-term Goal</CardTitle>
              <CardDescription>
                Your primary long-term objective
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={editingLongTerm ? handleSaveLongTerm : handleEditLongTerm}
              disabled={createLongTermGoalMutation.isPending || updateLongTermGoalMutation.isPending}
            >
              {editingLongTerm ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editingLongTerm ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={longTermGoal.title}
                  onChange={(e) => setLongTermGoal({ ...longTermGoal, title: e.target.value })}
                  placeholder="Enter your long-term goal..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Years</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={longTermGoal.targetYears}
                  onChange={(e) => setLongTermGoal({ ...longTermGoal, targetYears: parseInt(e.target.value) || 3 })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  value={longTermGoal.description}
                  onChange={(e) => setLongTermGoal({ ...longTermGoal, description: e.target.value })}
                  placeholder="Add more details..."
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveLongTerm} disabled={createLongTermGoalMutation.isPending || updateLongTermGoalMutation.isPending}>
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditingLongTerm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {longTermGoals.length > 0 ? (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">{longTermGoals[0].title}</h3>
                  {longTermGoals[0].description && (
                    <p className="text-sm text-blue-700 mt-1">{longTermGoals[0].description}</p>
                  )}
                  <Badge variant="secondary" className="mt-2">
                    {longTermGoals[0].targetYears} year{longTermGoals[0].targetYears > 1 ? 's' : ''}
                  </Badge>
                </div>
              ) : (
                <p className="text-gray-500">No long-term goal set</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Focus Areas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Focus Areas</CardTitle>
              <CardDescription>
                The 3-5 most important things you need to do consistently
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={editingFocusAreas ? handleSaveFocusAreas : handleEditFocusAreas}
              disabled={createFocusAreasMutation.isPending}
            >
              {editingFocusAreas ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editingFocusAreas ? (
            <div className="space-y-4">
              <div className="space-y-2">
                {focusAreas.map((area) => (
                  <div key={area.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded border">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={area.title}
                        onChange={(e) => {
                          setFocusAreas(focusAreas.map(fa => 
                            fa.id === area.id ? { ...fa, title: e.target.value } : fa
                          ));
                        }}
                        placeholder="Focus area title..."
                        className="border-0 p-0 h-auto bg-transparent"
                      />
                      <Input
                        value={area.description}
                        onChange={(e) => {
                          setFocusAreas(focusAreas.map(fa => 
                            fa.id === area.id ? { ...fa, description: e.target.value } : fa
                          ));
                        }}
                        placeholder="Description (optional)..."
                        className="border-0 p-0 h-auto bg-transparent text-sm text-gray-600"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFocusArea(area.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {focusAreas.length < 5 && (
                <Button variant="outline" onClick={addFocusArea} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Focus Area
                </Button>
              )}
              
              <div className="flex space-x-2">
                <Button onClick={handleSaveFocusAreas} disabled={createFocusAreasMutation.isPending}>
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditingFocusAreas(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {focusAreasData.length > 0 ? (
                focusAreasData
                  .sort((a, b) => a.order - b.order)
                  .map((area) => (
                    <div key={area.id} className="p-3 bg-green-50 rounded-lg">
                      <h3 className="font-medium text-green-900">{area.title}</h3>
                      {area.description && (
                        <p className="text-sm text-green-700 mt-1">{area.description}</p>
                      )}
                    </div>
                  ))
              ) : (
                <p className="text-gray-500">No focus areas set</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>This Month&apos;s Goals</CardTitle>
              <CardDescription>
                {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={editingMonthlyGoals ? handleSaveMonthlyGoals : handleEditMonthlyGoals}
              disabled={createMonthlyGoalsMutation.isPending}
            >
              {editingMonthlyGoals ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editingMonthlyGoals ? (
            <div className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleMonthlyGoalDragEnd}
              >
                <SortableContext items={monthlyGoals.map(mg => mg.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {monthlyGoals.map((goal) => (
                      <SortableMonthlyGoal
                        key={goal.id}
                        goal={goal}
                        onUpdate={(id, data) => {
                          setMonthlyGoals(monthlyGoals.map(mg => 
                            mg.id === id ? { ...mg, ...data } : mg
                          ));
                        }}
                        onDelete={removeMonthlyGoal}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              
              {monthlyGoals.length < 5 && (
                <Button variant="outline" onClick={addMonthlyGoal} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Monthly Goal
                </Button>
              )}
              
              <div className="flex space-x-2">
                <Button onClick={handleSaveMonthlyGoals} disabled={createMonthlyGoalsMutation.isPending}>
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditingMonthlyGoals(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {activeMonthlyGoals.length > 0 ? (
                activeMonthlyGoals
                  .sort((a, b) => a.order - b.order)
                  .map((goal) => (
                    <div key={goal.id} className="p-3 bg-purple-50 rounded-lg">
                      <h3 className="font-medium text-purple-900">{goal.title}</h3>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500">No monthly goals set</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteFocusAreaMutation.mutate(deleteConfirmId);
          }
        }}
        title="Delete Focus Area"
        description="Are you sure you want to delete this focus area?"
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}

function SortableMonthlyGoal({ goal, onUpdate, onDelete }: {
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
    <div ref={setNodeRef} style={style} className="flex items-center space-x-2 p-3 bg-gray-50 rounded border">
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
          placeholder="Monthly goal..."
          className="border-0 p-0 h-auto bg-transparent"
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
