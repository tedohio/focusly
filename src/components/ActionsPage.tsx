'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Target, Calendar } from 'lucide-react';
import { getNote } from '@/app/(main)/actions/notes';
import { getReflection } from '@/app/(main)/actions/reflections';
import { getTodos } from '@/app/(main)/actions/todos';
import { getToday, getTomorrow } from '@/lib/date';
import NoteEditor from './NoteEditor';
import ReflectionForm from './ReflectionForm';
import TomorrowPlanner from './TomorrowPlanner';

interface ActionsPageProps {
  timezone?: string;
}

export default function ActionsPage({ timezone = 'UTC' }: ActionsPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  // const queryClient = useQueryClient();
  const today = getToday(timezone);
  const tomorrow = getTomorrow(timezone);

  const { data: todayNote } = useQuery({
    queryKey: ['note', today],
    queryFn: () => getNote(today),
  });

  const { data: todayReflection } = useQuery({
    queryKey: ['reflection', today],
    queryFn: () => getReflection(today),
  });

  const { data: todayTodos = [] } = useQuery({
    queryKey: ['todos', today],
    queryFn: () => getTodos(today),
  });

  const { data: tomorrowTodos = [] } = useQuery({
    queryKey: ['todos', tomorrow],
    queryFn: () => getTodos(tomorrow),
  });

  const incompleteTodayTodos = todayTodos.filter(todo => !todo.done);

  const steps = [
    {
      id: 'notes',
      title: 'Take Notes',
      description: 'Capture thoughts and ideas throughout the day',
      icon: FileText,
      completed: !!todayNote?.content,
    },
    {
      id: 'reflect',
      title: 'Reflect',
      description: 'What went well? What didn&apos;t? How can you improve?',
      icon: Target,
      completed: !!(todayReflection?.whatWentWell || todayReflection?.whatDidntGoWell || todayReflection?.improvements),
    },
    {
      id: 'tomorrow',
      title: 'Create Tomorrow&apos;s To-Dos',
      description: 'Plan your next day by moving incomplete tasks',
      icon: Calendar,
      completed: incompleteTodayTodos.length === 0 || tomorrowTodos.length > 0,
    },
  ];

  const handleStepComplete = (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1 && stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'notes':
        return (
          <div className="space-y-4">
            <NoteEditor forDate={today} onComplete={() => handleStepComplete('notes')} timezone={timezone} />
          </div>
        );
        
      case 'reflect':
        return (
          <div className="space-y-4">
            <ReflectionForm forDate={today} onComplete={() => handleStepComplete('reflect')} timezone={timezone} />
          </div>
        );
        
      case 'tomorrow':
        return (
          <div className="space-y-4">
            <TomorrowPlanner 
              todayTodos={incompleteTodayTodos}
              tomorrowTodos={tomorrowTodos}
              onComplete={() => handleStepComplete('tomorrow')}
              timezone={timezone}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Actions</h1>
        <p className="text-sm text-gray-600 mt-1">
          Your daily loop: Take Notes → Reflect → Create Tomorrow&apos;s To-Dos
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = step.completed;
          const isPast = index < currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : isCompleted || isPast
                      ? 'border-green-600 bg-green-600 text-white hover:bg-green-700'
                      : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400 hover:text-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
                <div className="mt-2 text-center">
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={`text-xs font-medium transition-colors ${
                      isActive ? 'text-blue-600' : isCompleted || isPast ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'
                    }`}
                  >
                    {step.title}
                  </button>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  isPast || isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {(() => {
              const Icon = steps[currentStep].icon;
              return <Icon className="h-5 w-5" />;
            })()}
            <span>{steps[currentStep].title}</span>
          </CardTitle>
          <CardDescription>
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <Button
              key={index}
              variant={index === currentStep ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentStep(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>
        
        <Button
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
