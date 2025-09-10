'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
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
  dueDate: string | null;
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
  });

  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', forDate] });
      setNewTodoTitle('');
      setIsAdding(false);
    },
    onError: (error) => {
      toast.error('Failed to create todo');
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Todo> }) => updateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', forDate] });
    },
    onError: (error) => {
      toast.error('Failed to update todo');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', forDate] });
      setDeleteConfirmId(null);
    },
    onError: (error) => {
      toast.error('Failed to delete todo');
      console.error(error);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateTodoToTomorrow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', getTomorrow()] });
      toast.success('Todo duplicated to tomorrow');
    },
    onError: (error) => {
      toast.error('Failed to duplicate todo');
      console.error(error);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderTodos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', forDate] });
    },
    onError: (error) => {
      toast.error('Failed to reorder todos');
      console.error(error);
    },
  });

  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return;
    
    await createMutation.mutateAsync({
      title: newTodoTitle.trim(),
      forDate,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((todo) => todo.id === active.id);
      const newIndex = todos.findIndex((todo) => todo.id === over.id);
      
      const newTodos = arrayMove(todos, oldIndex, newIndex);
      const todoIds = newTodos.map(todo => todo.id);
      
      reorderMutation.mutate(todoIds);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateMutation.mutateAsync(id);
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
                placeholder="Enter new todo..."
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
              Add Todo
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Delete Todo"
        description="Are you sure you want to delete this todo? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}
