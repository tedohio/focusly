'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical, Plus, Trash2, Copy } from 'lucide-react';
import { getTodos, createTodo, updateTodo, deleteTodo, reorderTodos, duplicateTodoToTomorrow } from '@/app/(main)/actions/todos';
import { getTomorrow } from '@/lib/date';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

interface Todo {
  id: string;
  title: string;
  done: boolean;
  order: number;
  forDate: string;
  dueDate?: string;
}

interface TodoListProps {
  forDate: string;
  showAddButton?: boolean;
}

function SortableTodoItem({ todo, onUpdate, onDelete, onDuplicate }: {
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

export default function TodoList({ forDate, showAddButton = true }: TodoListProps) {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos', forDate],
    queryFn: () => getTodos(forDate),
    // Add staleTime to ensure fresh data when date changes
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: createTodo,
    onMutate: async (newTodo) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos', forDate] });

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData(['todos', forDate]);

      // Create optimistic todo
      const optimisticTodo: Todo = {
        id: `temp-${Date.now()}`, // Temporary ID
        title: newTodo.title,
        done: false,
        order: (previousTodos as Todo[] || []).length * 100,
        forDate: newTodo.forDate,
        dueDate: newTodo.dueDate,
      };

      // Optimistically update to the new value
      queryClient.setQueryData(['todos', forDate], (old: Todo[] = []) => [
        ...old,
        optimisticTodo
      ]);

      // Clear form immediately
      setNewTodoTitle('');
      setIsAdding(false);

      // Return a context object with the snapshotted value
      return { previousTodos, optimisticTodo };
    },
    onSuccess: (newTodo, variables, context) => {
      // Replace the optimistic todo with the real one from server
      queryClient.setQueryData(['todos', forDate], (old: Todo[] = []) =>
        old.map(todo => 
          todo.id === context?.optimisticTodo.id ? newTodo : todo
        )
      );
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos', forDate], context.previousTodos);
      }
      // Reset form state
      setNewTodoTitle(variables.title);
      setIsAdding(true);
      toast.error('Failed to create To-Do');
      console.error(err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ['todos', forDate] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Todo> }) => updateTodo(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos', forDate] });

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData(['todos', forDate]);

      // Optimistically update to the new value
      queryClient.setQueryData(['todos', forDate], (old: Todo[] = []) =>
        old.map(todo => todo.id === id ? { ...todo, ...data } : todo)
      );

      // Return a context object with the snapshotted value
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos', forDate], context.previousTodos);
      }
      toast.error('Failed to update To-Do');
      console.error(err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ['todos', forDate] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos', forDate] });

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData(['todos', forDate]);

      // Optimistically update to the new value
      queryClient.setQueryData(['todos', forDate], (old: Todo[] = []) =>
        old.filter(todo => todo.id !== id)
      );

      // Return a context object with the snapshotted value
      return { previousTodos };
    },
    onSuccess: () => {
      setDeleteConfirmId(null);
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos', forDate], context.previousTodos);
      }
      toast.error('Failed to delete To-Do');
      console.error(err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ['todos', forDate] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateTodoToTomorrow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', getTomorrow()] });
      toast.success('To-Do duplicated to tomorrow');
    },
    onError: (error) => {
      toast.error('Failed to duplicate To-Do');
      console.error(error);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderTodos,
    onMutate: async (todoIds) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos', forDate] });

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData(['todos', forDate]);

      // Optimistically update to the new value
      queryClient.setQueryData(['todos', forDate], (old: Todo[] = []) => {
        const todoMap = new Map(old.map(todo => [todo.id, todo]));
        return todoIds.map(id => todoMap.get(id)).filter(Boolean) as Todo[];
      });

      // Return a context object with the snapshotted value
      return { previousTodos };
    },
    onError: (err, todoIds, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos', forDate], context.previousTodos);
      }
      toast.error('Failed to reorder To-Dos');
      console.error(err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ['todos', forDate] });
    },
  });

  const handleAddTodo = () => {
    if (!newTodoTitle.trim()) return;
    
    createMutation.mutate({
      title: newTodoTitle.trim(),
      forDate,
    });
  };

  const handleDragEnd = (event: { active: { id: string }; over: { id: string } }) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = todos.findIndex((todo) => todo.id === active.id);
      const newIndex = todos.findIndex((todo) => todo.id === over.id);
      
      const newTodos = arrayMove(todos, oldIndex, newIndex);
      const todoIds = newTodos.map(todo => todo.id);
      
      reorderMutation.mutate(todoIds);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={todos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {todos.map((todo) => (
              <SortableTodoItem
                key={todo.id}
                todo={todo}
                onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                onDelete={(id) => setDeleteConfirmId(id)}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {showAddButton && (
        <div className="space-y-2">
          {isAdding ? (
            <div className="flex space-x-2">
              <Input
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                placeholder="Enter new To-Do..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTodo();
                  } else if (e.key === 'Escape') {
                    setIsAdding(false);
                    setNewTodoTitle('');
                  }
                }}
                autoFocus
              />
              <Button
                onClick={handleAddTodo}
                disabled={!newTodoTitle.trim() || createMutation.isPending}
                size="sm"
              >
                Add
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewTodoTitle('');
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsAdding(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add To-Do
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Delete To-Do"
        description="Are you sure you want to delete this To-Do? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}
