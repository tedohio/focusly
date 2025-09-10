'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Target, Save } from 'lucide-react';
import { getReflection, createReflection } from '@/app/(main)/actions/reflections';
import { toast } from 'sonner';

interface ReflectionFormProps {
  forDate: string;
  onComplete?: () => void;
}

export default function ReflectionForm({ forDate, onComplete }: ReflectionFormProps) {
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatDidntGoWell, setWhatDidntGoWell] = useState('');
  const [improvements, setImprovements] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: reflection, isLoading } = useQuery({
    queryKey: ['reflection', forDate],
    queryFn: () => getReflection(forDate),
  });

  const createReflectionMutation = useMutation({
    mutationFn: createReflection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflection', forDate] });
      queryClient.invalidateQueries({ queryKey: ['reflections'] });
      setIsSaving(false);
      toast.success('Reflection saved');
      onComplete?.();
    },
    onError: (error) => {
      toast.error('Failed to save reflection');
      console.error(error);
      setIsSaving(false);
    },
  });

  useEffect(() => {
    if (reflection) {
      setWhatWentWell(reflection.whatWentWell || '');
      setWhatDidntGoWell(reflection.whatDidntGoWell || '');
      setImprovements(reflection.improvements || '');
    }
  }, [reflection]);

  const handleSave = async () => {
    if (!whatWentWell.trim() && !whatDidntGoWell.trim() && !improvements.trim()) {
      toast.error('Please fill in at least one field');
      return;
    }

    setIsSaving(true);
    await createReflectionMutation.mutateAsync({
      whatWentWell: whatWentWell.trim() || undefined,
      whatDidntGoWell: whatDidntGoWell.trim() || undefined,
      improvements: improvements.trim() || undefined,
      forDate,
      isMonthly: false,
    });
  };

  const hasContent = whatWentWell.trim() || whatDidntGoWell.trim() || improvements.trim();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Target className="h-4 w-4" />
        <span>
          {new Date(forDate).toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What went well today?
          </label>
          <Textarea
            value={whatWentWell}
            onChange={(e) => setWhatWentWell(e.target.value)}
            placeholder="What accomplishments, positive moments, or wins did you have today?"
            className="min-h-[100px] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What didn&apos;t go well?
          </label>
          <Textarea
            value={whatDidntGoWell}
            onChange={(e) => setWhatDidntGoWell(e.target.value)}
            placeholder="What challenges, setbacks, or areas of struggle did you face?"
            className="min-h-[100px] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How can you improve?
          </label>
          <Textarea
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="What specific actions or changes will you make tomorrow or in the future?"
            className="min-h-[100px] resize-none"
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {hasContent ? 'Reflection has content' : 'No content yet'}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setWhatWentWell('');
              setWhatDidntGoWell('');
              setImprovements('');
            }}
            disabled={!hasContent || isSaving}
          >
            Clear All
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasContent || isSaving}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Reflection
              </>
            )}
          </Button>
        </div>
      </div>

      {hasContent && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            ✓ Reflection will be saved when you click &quot;Save Reflection&quot;
          </p>
        </div>
      )}
    </div>
  );
}
