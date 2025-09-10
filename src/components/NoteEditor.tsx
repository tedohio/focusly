'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText, Save } from 'lucide-react';
import { getNote, createNote } from '@/app/(main)/actions/notes';
import { toast } from 'sonner';

interface NoteEditorProps {
  forDate: string;
  onComplete?: () => void;
}

export default function NoteEditor({ forDate, onComplete }: NoteEditorProps) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', forDate],
    queryFn: () => getNote(forDate),
  });

  const createNoteMutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', forDate] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsSaving(false);
      toast.success('Note saved');
      onComplete?.();
    },
    onError: (error) => {
      toast.error('Failed to save note');
      console.error(error);
      setIsSaving(false);
    },
  });

  useEffect(() => {
    if (note) {
      setContent(note.content);
    }
  }, [note]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setIsSaving(true);
    await createNoteMutation.mutateAsync({
      content: content.trim(),
      forDate,
    });
  };

  const handleContentChange = (value: string) => {
    setContent(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <FileText className="h-4 w-4" />
        <span>
          {new Date(forDate).toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>

      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Capture your thoughts, ideas, and observations for today..."
        className="min-h-[200px] resize-none"
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {content.length} characters
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setContent('')}
            disabled={!content.trim() || isSaving}
          >
            Clear
          </Button>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </>
            )}
          </Button>
        </div>
      </div>

      {content.trim() && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            ✓ Note will be automatically saved when you click "Save Note"
          </p>
        </div>
      )}
    </div>
  );
}
