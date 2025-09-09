import { getUser, getProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TodoList from '@/components/TodoList';
import GoalsSideDrawer from '@/components/GoalsSideDrawer';
import { getToday } from '@/lib/date';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function TodayPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile(user.id);
  const timezone = profile?.timezone || 'UTC';
  const today = getToday(timezone);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's To-Dos</h1>
          <p className="text-sm text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              timeZone: timezone
            })}
          </p>
        </div>
        <GoalsSideDrawer>
          <Button variant="outline" className="flex items-center space-x-2">
            <span>See goals</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </GoalsSideDrawer>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <TodoList forDate={today} />
      </div>
    </div>
  );
}
