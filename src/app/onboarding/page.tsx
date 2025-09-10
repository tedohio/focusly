'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { createLongTermGoal, createFocusAreas, createMonthlyGoals } from '@/app/(main)/actions/goals';
import { completeOnboarding } from '@/app/(main)/actions/profile';
import { getCurrentMonth, getCurrentYear } from '@/lib/date';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';

interface FocusArea {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface MonthlyGoal {
  id: string;
  title: string;
  order: number;
}

const STEPS = [
  'long-term-goal',
  'focus-areas',
  'monthly-goals',
  'complete'
] as const;


export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [longTermGoal, setLongTermGoal] = useState({ title: '', description: '', targetYears: 3 });
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([
    { id: '1', title: '', description: '', order: 1 },
    { id: '2', title: '', description: '', order: 2 },
    { id: '3', title: '', description: '', order: 3 },
  ]);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([
    { id: '1', title: '', order: 1 },
    { id: '2', title: '', order: 2 },
    { id: '3', title: '', order: 3 },
  ]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createLongTermGoalMutation = useMutation({
    mutationFn: createLongTermGoal,
    onError: (error) => {
      toast.error('Failed to save long-term goal');
      console.error(error);
    },
  });

  const createFocusAreasMutation = useMutation({
    mutationFn: createFocusAreas,
    onError: (error) => {
      toast.error('Failed to save focus areas');
      console.error(error);
    },
  });

  const createMonthlyGoalsMutation = useMutation({
    mutationFn: createMonthlyGoals,
    onError: (error) => {
      toast.error('Failed to save monthly goals');
      console.error(error);
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success('Onboarding completed! Welcome to Focusly!');
      router.push('/');
    },
    onError: (error) => {
      toast.error('Failed to complete onboarding');
      console.error(error);
    },
  });

  const handleNext = async () => {
    const step = STEPS[currentStep];
    
    try {
      switch (step) {
        case 'long-term-goal':
          if (!longTermGoal.title.trim()) {
            toast.error('Please enter a long-term goal');
            return;
          }
          await createLongTermGoalMutation.mutateAsync(longTermGoal);
          break;
          
        case 'focus-areas':
          const validFocusAreas = focusAreas.filter(fa => fa.title.trim());
          if (validFocusAreas.length < 3) {
            toast.error('Please enter at least 3 focus areas');
            return;
          }
          await createFocusAreasMutation.mutateAsync(validFocusAreas);
          break;
          
        case 'monthly-goals':
          const validMonthlyGoals = monthlyGoals.filter(mg => mg.title.trim());
          if (validMonthlyGoals.length < 3) {
            toast.error('Please enter at least 3 monthly goals');
            return;
          }
          const currentMonth = getCurrentMonth();
          const currentYear = getCurrentYear();
          await createMonthlyGoalsMutation.mutateAsync(
            validMonthlyGoals.map(goal => ({
              title: goal.title,
              month: currentMonth,
              year: currentYear,
              order: goal.order,
            }))
          );
          break;
          
        case 'complete':
          await completeOnboardingMutation.mutateAsync();
          return;
      }
      
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Error in handleNext:', error);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
      order: monthlyGoals.length + 1,
    }]);
  };

  const removeFocusArea = (id: string) => {
    if (focusAreas.length <= 3) {
      toast.error('You must have at least 3 focus areas');
      return;
    }
    setFocusAreas(focusAreas.filter(fa => fa.id !== id));
    setDeleteConfirmId(null);
  };

  const removeMonthlyGoal = (id: string) => {
    if (monthlyGoals.length <= 3) {
      toast.error('You must have at least 3 monthly goals');
      return;
    }
    setMonthlyGoals(monthlyGoals.filter(mg => mg.id !== id));
    setDeleteConfirmId(null);
  };

  const handleFocusAreaDragEnd = (event: { active: { id: string }; over: { id: string } }) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = focusAreas.findIndex((fa) => fa.id === active.id);
      const newIndex = focusAreas.findIndex((fa) => fa.id === over.id);
      setFocusAreas(arrayMove(focusAreas, oldIndex, newIndex));
    }
  };

  const handleMonthlyGoalDragEnd = (event: { active: { id: string }; over: { id: string } }) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = monthlyGoals.findIndex((mg) => mg.id === active.id);
      const newIndex = monthlyGoals.findIndex((mg) => mg.id === over.id);
      setMonthlyGoals(arrayMove(monthlyGoals, oldIndex, newIndex));
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep]) {
      case 'long-term-goal':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Let&apos;s talk about you</CardTitle>
              <CardDescription>
                What&apos;s your long-term goal? Be specific about what you want to achieve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">My __-year goal is...</label>
                <Input
                  value={longTermGoal.title}
                  onChange={(e) => setLongTermGoal({ ...longTermGoal, title: e.target.value })}
                  placeholder="e.g., Build a successful tech startup"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target years</label>
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
                  placeholder="Add more details about your goal..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'focus-areas':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Focus Areas</CardTitle>
              <CardDescription>
                Here are the 3-5 most important things I need to do consistently long term
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleFocusAreaDragEnd}
              >
                <SortableContext items={focusAreas.map(fa => fa.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {focusAreas.map((area) => (
                      <SortableFocusArea
                        key={area.id}
                        area={area}
                        onUpdate={(id, data) => {
                          setFocusAreas(focusAreas.map(fa => 
                            fa.id === id ? { ...fa, ...data } : fa
                          ));
                        }}
                        onDelete={(id) => setDeleteConfirmId(id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              
              {focusAreas.length < 5 && (
                <Button variant="outline" onClick={addFocusArea} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Focus Area
                </Button>
              )}
            </CardContent>
          </Card>
        );

      case 'monthly-goals':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Goals</CardTitle>
              <CardDescription>
                This month, I aim to... (3-5 monthly goals) - Drag to prioritize most→least
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        onDelete={(id) => setDeleteConfirmId(id)}
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
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Focusly!</CardTitle>
              <CardDescription>
                You&apos;re all set up. Here&apos;s your daily loop:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">1</div>
                  <div>
                    <h3 className="font-medium">Take Notes</h3>
                    <p className="text-sm text-gray-600">Capture thoughts and ideas throughout the day</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">2</div>
                  <div>
                    <h3 className="font-medium">Reflect</h3>
                    <p className="text-sm text-gray-600">What went well? What didn&apos;t? How can you improve?</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">3</div>
                  <div>
                    <h3 className="font-medium">Create Tomorrow&apos;s To-Dos</h3>
                    <p className="text-sm text-gray-600">Plan your next day by moving incomplete tasks</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">4</div>
                  <div>
                    <h3 className="font-medium">Today&apos;s To-Dos</h3>
                    <p className="text-sm text-gray-600">Execute on your priorities with drag-to-reorder</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const isLoading = createLongTermGoalMutation.isPending || 
                   createFocusAreasMutation.isPending || 
                   createMonthlyGoalsMutation.isPending || 
                   completeOnboardingMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Focusly</h1>
          <p className="mt-2 text-sm text-gray-600">
            Let&apos;s set up your goals and focus areas
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {renderStep()}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isLoading}
          >
            {STEPS[currentStep] === 'complete' ? 'Get Started' : 'Next'}
            {STEPS[currentStep] !== 'complete' && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            if (focusAreas.find(fa => fa.id === deleteConfirmId)) {
              removeFocusArea(deleteConfirmId);
            } else {
              removeMonthlyGoal(deleteConfirmId);
            }
          }
        }}
        title="Delete Item"
        description="Are you sure you want to delete this item?"
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}

// Sortable components
function SortableFocusArea({ area, onUpdate, onDelete }: {
  area: FocusArea;
  onUpdate: (id: string, data: Partial<FocusArea>) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: area.id });

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
      
      <div className="flex-1 space-y-2">
        <Input
          value={area.title}
          onChange={(e) => onUpdate(area.id, { title: e.target.value })}
          placeholder="Focus area title..."
          className="border-0 p-0 h-auto"
        />
        <Input
          value={area.description}
          onChange={(e) => onUpdate(area.id, { description: e.target.value })}
          placeholder="Description (optional)..."
          className="border-0 p-0 h-auto text-sm text-gray-600"
        />
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(area.id)}
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
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
          placeholder="Monthly goal..."
          className="border-0 p-0 h-auto"
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
