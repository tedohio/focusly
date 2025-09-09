'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClientComponentClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, LogOut, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { getProfile, updateProfile } from '@/app/(main)/actions/profile';
import { getLongTermGoals, getFocusAreas, getMonthlyGoals } from '@/app/(main)/actions/goals';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

// Common timezone options
const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
  { value: 'Australia/Melbourne', label: 'Australian Eastern Time (AET)' },
];

interface SettingsPageProps {
  user: {
    id: string;
    email?: string;
  };
}

export default function SettingsPage({ user }: SettingsPageProps) {
  const [timezone, setTimezone] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const { data: longTermGoals } = useQuery({
    queryKey: ['longTermGoals'],
    queryFn: getLongTermGoals,
  });

  const { data: focusAreas } = useQuery({
    queryKey: ['focusAreas'],
    queryFn: getFocusAreas,
  });

  const { data: monthlyGoals } = useQuery({
    queryKey: ['monthlyGoals'],
    queryFn: getMonthlyGoals,
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    onError: (err) => {
      toast.error('Failed to update profile');
      console.error(err);
    },
  });

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      toast.success('Signed out successfully');
    } catch {
      toast.error('Error signing out');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // In a real app, you'd want to implement proper account deletion
      // This would involve deleting all user data and the auth account
      toast.error('Account deletion not implemented in this demo');
      setShowDeleteConfirm(false);
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveTimezone = async () => {
    if (!timezone.trim()) {
      toast.error('Please enter a timezone');
      return;
    }

    await updateProfileMutation.mutateAsync({
      timezone: timezone.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
          <CardDescription>
            Your account details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <div className="flex space-x-2 mt-1">
              <Select
                value={timezone || profile?.timezone || 'UTC'}
                onValueChange={setTimezone}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSaveTimezone}
                disabled={updateProfileMutation.isPending}
              >
                Save
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Used for date-based features. Current: {profile?.timezone || 'UTC'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Your Goals & Focus Areas</span>
          </CardTitle>
          <CardDescription>
            View and manage your long-term goals, focus areas, and monthly goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Long-term Goal */}
          {longTermGoals && longTermGoals.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Long-term Goal</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">{longTermGoals[0].title}</h3>
                {longTermGoals[0].description && (
                  <p className="text-sm text-gray-600 mt-1">{longTermGoals[0].description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Target: {longTermGoals[0].targetYears} years
                </p>
              </div>
            </div>
          )}

          {/* Focus Areas */}
          {focusAreas && focusAreas.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Focus Areas</Label>
              <div className="mt-2 space-y-3">
                {focusAreas.map((area, index) => (
                  <div key={area.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{area.title}</h4>
                        {area.description && (
                          <p className="text-sm text-gray-600 mt-1">{area.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Goals */}
          {monthlyGoals && monthlyGoals.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Current Monthly Goals</Label>
              <div className="mt-2 space-y-3">
                {monthlyGoals.map((goal, index) => (
                  <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {goal.month}/{goal.year} • Status: {goal.status}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!longTermGoals || longTermGoals.length === 0) && (!focusAreas || focusAreas.length === 0) && (!monthlyGoals || monthlyGoals.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>No goals or focus areas found. Complete the onboarding to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5" />
            <span>Account Actions</span>
          </CardTitle>
          <CardDescription>
            Manage your account and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Sign Out</h3>
              <p className="text-sm text-gray-600">Sign out of your account</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <h3 className="font-medium text-red-900">Delete Account</h3>
              <p className="text-sm text-red-700">
                Permanently delete your account and all data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Focusly</CardTitle>
          <CardDescription>
            Application information and version
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Version</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Build</span>
            <span className="text-sm font-medium">MVP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Environment</span>
            <span className="text-sm font-medium">Development</span>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your data including goals, todos, notes, and reflections."
        confirmText="Delete Account"
        confirmVariant="destructive"
      />
    </div>
  );
}
