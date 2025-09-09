'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, ArrowRight, Calendar, Plus, Trash2, Copy, Save } from 'lucide-react';
import { createTodo, updateTodo, deleteTodo, reorderTodos, duplicateTodoToTomorrow } from '@/app/(main)/actions/todos';
import { getToday, getTomorrow } from '@/lib/date';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

interface Todo {
  id: string;
  title: string;
  done: boolean;
  order: number;
  forDate: string;
  dueDate?: string | null;
}

interface TomorrowPlannerProps {
  todayTodos: Todo[];
  tomorrowTodos: Todo[];
  onComplete?: () => void;
  timezone?: string;
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
        Move to Tomorrow
      </Button>
    </div>
  );
}

function SortableTomorrowTodoItem({ todo, onUpdate, onDelete, onDuplicate }: {
  todo: Todo;
  onUpdate: (id: string, data: Partial<Todo>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
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
    <div ref={setNodeRef} style={style} className="flex items-center space-x-2 p-2 bg-white rounded border">
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing p-1"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <Checkbox
        checked={todo.done}
        onCheckedChange={(checked) => onUpdate(todo.id, { done: !!checked })}
      />
      
      <div className="flex-1">
        <Input
          value={todo.title}
          onChange={(e) => onUpdate(todo.id, { title: e.target.value })}
          className={`border-0 p-0 h-auto ${todo.done ? 'line-through text-gray-500' : ''}`}
          placeholder="Enter todo..."
        />
      </div>
      
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDuplicate(todo.id)}
          className="h-8 w-8 p-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(todo.id)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function TomorrowPlanner({ todayTodos, tomorrowTodos, onComplete, timezone = 'UTC' }: TomorrowPlannerProps) {
  const [movedTodos, setMovedTodos] = useState<Set<string>>(new Set());
  const [newTodoTitle, setNewTodoTitle] = useState('');
  // const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const today = getToday(timezone);
  const tomorrow = getTomorrow(timezone);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create todo mutation
  const createMutation = useMutation({
    mutationFn: createTodo,
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ['todos', tomorrow] });
      const previousTodos = queryClient.getQueryData(['todos', tomorrow]);
      const optimisticTodo: Todo = {
        id: `temp-${Date.now()}`,
        title: newTodo.title,
        done: false,
        order: (previousTodos as Todo[] || []).length * 100,
        forDate: newTodo.forDate,
        dueDate: newTodo.dueDate,
      };
      queryClient.setQueryData(['todos', tomorrow], (old: Todo[] = []) => [
        ...old,
        optimisticTodo
      ]);
      setNewTodoTitle('');
      return { previousTodos, optimisticTodo };
    },
    onSuccess: (newTodo, variables, context) => {
      queryClient.setQueryData(['todos', tomorrow], (old: Todo[] = []) =>
        old.map(todo =>
          todo.id === context?.optimisticTodo.id ? newTodo : todo
        )
      );
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos', tomorrow], context.previousTodos);
      }
      setNewTodoTitle(variables.title);
      toast.error('Failed to create To-Do');
      console.error(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', tomorrow] });
    },
  });

  // Update todo mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Todo> }) => updateTodo(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['todos', tomorrow] });
      const previousTodos = queryClient.getQueryData(['todos', tomorrow]);
      queryClient.setQueryData(['todos', tomorrow], (old: Todo[] = []) =>
        old.map(todo => todo.id === id ? { ...todo, ...data } : todo)
      );
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos', tomorrow], context.previousTodos);
      }
      toast.error('Failed to update To-Do');
      console.error(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', tomorrow] });
    },
  });

  // Delete todo mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos', tomorrow] });
      const previousTodos = queryClient.getQueryData(['todos', tomorrow]);
      queryClient.setQueryData(['todos', tomorrow], (old: Todo[] = []) =>
        old.filter(todo => todo.id !== id)
      );
      return { previousTodos };
    },
    onSuccess: () => {
      setDeleteConfirmId(null);
    },
    onError: (err, id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos', tomorrow], context.previousTodos);
      }
      toast.error('Failed to delete To-Do');
      console.error(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', tomorrow] });
    },
  });

  // Duplicate todo mutation
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

  // Reorder todos mutation
  const reorderMutation = useMutation({
    mutationFn: reorderTodos,
    onMutate: async (todoIds) => {
      await queryClient.cancelQueries({ queryKey: ['todos', tomorrow] });
      const previousTodos = queryClient.getQueryData(['todos', tomorrow]);
      queryClient.setQueryData(['todos', tomorrow], (old: Todo[] = []) => {
        const todoMap = new Map(old.map(todo => [todo.id, todo]));
        return todoIds.map(id => todoMap.get(id)).filter(Boolean) as Todo[];
      });
      return { previousTodos };
    },
    onError: (err, todoIds, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos', tomorrow], context.previousTodos);
      }
      toast.error('Failed to reorder todos');
      console.error(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', tomorrow] });
    },
  });

  const handleAddTodo = () => {
    if (!newTodoTitle.trim()) return;
    createMutation.mutate({
      title: newTodoTitle.trim(),
      forDate: tomorrow,
    });
  };

  const handleMoveTodo = async (todoId: string) => {
    if (movedTodos.has(todoId)) {
      toast.info('This todo has already been moved');
      return;
    }

    await duplicateMutation.mutateAsync(todoId);
    setMovedTodos(prev => new Set(prev).add(todoId));
  };

  const handleUpdateTodo = (id: string, data: Partial<Todo>) => {
    updateMutation.mutate({ id, data });
  };

  const handleDeleteTodo = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteTodo = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
    }
  };

  const handleDuplicateTodo = (id: string) => {
    duplicateMutation.mutate(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tomorrowTodos.findIndex((todo) => todo.id === active.id);
      const newIndex = tomorrowTodos.findIndex((todo) => todo.id === over.id);
      const newTodos = arrayMove(tomorrowTodos, oldIndex, newIndex);
      const todoIds = newTodos.map(todo => todo.id);
      reorderMutation.mutate(todoIds);
    }
  };

  const handleSaveTodos = async () => {
    if (tomorrowTodos.length === 0) {
      toast.error('No todos to save');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate a brief save operation to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('To-Dos saved');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to save to-dos');
      console.error(error);
    } finally {
      setIsSaving(false);
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
          Plan for {new Date(tomorrow + 'T00:00:00').toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            year: 'numeric',
            timeZone: timezone
          })}
        </span>
      </div>

      {/* Tomorrow's To-Dos Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tomorrow&apos;s To-Dos</CardTitle>
          <CardDescription>
            Plan and organize your tasks for tomorrow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add new todo */}
            <div className="flex space-x-2">
              <Input
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                placeholder="Add a new To-Do for tomorrow..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTodo();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleAddTodo}
                disabled={!newTodoTitle.trim() || createMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Tomorrow's todos list */}
            {tomorrowTodos.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={tomorrowTodos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {tomorrowTodos
                      .sort((a, b) => a.order - b.order)
                      .map((todo) => (
                        <SortableTomorrowTodoItem
                          key={todo.id}
                          todo={todo}
                          onUpdate={handleUpdateTodo}
                          onDelete={handleDeleteTodo}
                          onDuplicate={handleDuplicateTodo}
                        />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No To-Dos planned for tomorrow yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Incomplete Tasks from Today */}
      {hasAvailableTodos && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incomplete Tasks from Today</CardTitle>
            <CardDescription>
              Move these tasks to tomorrow&apos;s list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableTodos.map((todo) => (
                <SortableTodoItem
                  key={todo.id}
                  todo={todo}
                  onMove={handleMoveTodo}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moved tasks confirmation */}
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

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {tomorrowTodos.length > 0 ? `${tomorrowTodos.length} todo${tomorrowTodos.length === 1 ? '' : 's'} planned for tomorrow` : 'No todos planned yet'}
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={handleSaveTodos}
            disabled={tomorrowTodos.length === 0 || isSaving}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save To-Dos
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={confirmDeleteTodo}
        title="Delete To-Do"
        description="Are you sure you want to delete this To-Do? This action cannot be undone."
      />
    </div>
  );
}
