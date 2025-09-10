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
import { User, LogOut, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { getProfile, updateProfile } from '@/app/(main)/actions/profile';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

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

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error(error);
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
              <Input
                id="timezone"
                value={timezone || profile?.timezone || ''}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g., America/New_York, Europe/London"
                className="flex-1"
              />
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
