'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, ArrowRight, Calendar } from 'lucide-react';
import { duplicateTodoToTomorrow } from '@/app/(main)/actions/todos';
import { getToday, getTomorrow } from '@/lib/date';
import { toast } from 'sonner';

interface Todo {
  id: string;
  title: string;
  done: boolean;
  order: number;
  forDate: string;
}

interface TomorrowPlannerProps {
  todayTodos: Todo[];
  tomorrowTodos: Todo[];
  onComplete?: () => void;
}

function SortableTodoItem({ todo, onMove }: {
  todo: Todo;
  onMove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

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
        <span className="text-sm text-gray-900">{todo.title}</span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onMove(todo.id)}
        className="h-8 px-2"
      >
        <ArrowRight className="h-4 w-4 mr-1" />
        Move
      </Button>
    </div>
  );
}

export default function TomorrowPlanner({ todayTodos, tomorrowTodos, onComplete }: TomorrowPlannerProps) {
  const [movedTodos, setMovedTodos] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const today = getToday();
  const tomorrow = getTomorrow();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const duplicateMutation = useMutation({
    mutationFn: duplicateTodoToTomorrow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', today] });
      queryClient.invalidateQueries({ queryKey: ['todos', tomorrow] });
      toast.success('Todo moved to tomorrow');
    },
    onError: (error) => {
      toast.error('Failed to move todo');
      console.error(error);
    },
  });

  const handleMoveTodo = async (todoId: string) => {
    if (movedTodos.has(todoId)) {
      toast.info('This todo has already been moved');
      return;
    }

    await duplicateMutation.mutateAsync(todoId);
    setMovedTodos(prev => new Set(prev).add(todoId));
  };

  const handleDragEnd = (event: { active: { id: string }; over: { id: string } }) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      // Handle reordering of tomorrow's todos if needed
      // For now, we'll just show the moved state
    }
  };

  const availableTodos = todayTodos.filter(todo => !movedTodos.has(todo.id));
  const hasMovedTodos = movedTodos.size > 0;
  const hasAvailableTodos = availableTodos.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Calendar className="h-4 w-4" />
        <span>
          Plan for {new Date(tomorrow).toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>

      {hasAvailableTodos ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Incomplete Tasks from Today</CardTitle>
              <CardDescription>
                Drag or click &quot;Move&quot; to add these tasks to tomorrow&apos;s list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={availableTodos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {availableTodos.map((todo) => (
                      <SortableTodoItem
                        key={todo.id}
                        todo={todo}
                        onMove={handleMoveTodo}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>

          {hasMovedTodos && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-700">✓ Tasks Moved to Tomorrow</CardTitle>
                <CardDescription>
                  These tasks have been added to tomorrow&apos;s to-do list
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todayTodos
                    .filter(todo => movedTodos.has(todo.id))
                    .map((todo) => (
                      <div key={todo.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-sm text-green-800">{todo.title}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="space-y-2">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
              <p className="text-sm text-gray-500">
                {todayTodos.length === 0 
                  ? "You don't have any incomplete tasks from today."
                  : "All of today's tasks have been moved to tomorrow or completed."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {tomorrowTodos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tomorrow&apos;s To-Dos</CardTitle>
            <CardDescription>
              Tasks already planned for tomorrow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tomorrowTodos
                .sort((a, b) => a.order - b.order)
                .map((todo) => (
                  <div key={todo.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm text-blue-800">{todo.title}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onComplete}
          disabled={!hasMovedTodos && hasAvailableTodos}
        >
          {hasMovedTodos ? 'Continue to Today\'s To-Dos' : 'Skip Planning'}
        </Button>
      </div>
    </div>
  );
}
