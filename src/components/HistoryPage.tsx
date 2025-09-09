'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getReflections } from '@/app/(main)/actions/reflections';
import { getNotes } from '@/app/(main)/actions/notes';
import { getTodos } from '@/app/(main)/actions/all-todos';
import { getLongTermGoals, getFocusAreas, getMonthlyGoals } from '@/app/(main)/actions/goals';

interface HistoryPageProps {
  timezone?: string;
}

export default function HistoryPage({ timezone = 'UTC' }: HistoryPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTab, setCurrentTab] = useState('reflections');
  const itemsPerPage = 10;

  const { data: reflections = [] } = useQuery({
    queryKey: ['reflections'],
    queryFn: getReflections,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: getNotes,
  });

  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  });

  const { data: longTermGoals = [] } = useQuery({
    queryKey: ['longTermGoals'],
    queryFn: getLongTermGoals,
  });

  const { data: focusAreas = [] } = useQuery({
    queryKey: ['focusAreas'],
    queryFn: getFocusAreas,
  });

  const { data: monthlyGoals = [] } = useQuery({
    queryKey: ['monthlyGoals'],
    queryFn: getMonthlyGoals,
  });

  const monthlyReflections = reflections.filter(r => r.isMonthly);
  const dailyReflections = reflections.filter(r => !r.isMonthly);

  const paginatedReflections = dailyReflections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedNotes = notes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(
    currentTab === 'reflections' ? dailyReflections.length : notes.length
  ) / itemsPerPage;

  const handlePreviousPage = () => {
    setCurrentPage(Math.max(1, currentPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(totalPages, currentPage + 1));
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-sm text-gray-600 mt-1">
          View your past notes, reflections, and goals
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reflections">Reflections</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="todos">Previous To-Dos</TabsTrigger>
          <TabsTrigger value="notes">My Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="reflections" className="space-y-4">
          <div className="grid gap-4">
            {/* Monthly Reflections */}
            {monthlyReflections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Reflections</CardTitle>
                  <CardDescription>
                    Your monthly review reflections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyReflections.map((reflection) => (
                      <div key={reflection.id} className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-blue-900">
                            {new Date(reflection.forDate + 'T00:00:00').toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric',
                              timeZone: timezone
                            })}
                          </h3>
                          <Badge variant="secondary">Monthly</Badge>
                        </div>
                        {reflection.whatWentWell && (
                          <div className="text-sm text-blue-700">
                            <strong>What went well:</strong> {reflection.whatWentWell}
                          </div>
                        )}
                        {reflection.whatDidntGoWell && (
                          <div className="text-sm text-blue-700 mt-1">
                            <strong>What didn't go well:</strong> {reflection.whatDidntGoWell}
                          </div>
                        )}
                        {reflection.improvements && (
                          <div className="text-sm text-blue-700 mt-1">
                            <strong>Improvements:</strong> {reflection.improvements}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Reflections */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Reflections</CardTitle>
                <CardDescription>
                  Your daily reflection entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paginatedReflections.length > 0 ? (
                  <div className="space-y-4">
                    {paginatedReflections.map((reflection) => (
                      <div key={reflection.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">
                            {new Date(reflection.forDate + 'T00:00:00').toLocaleDateString('en-US', { 
                              weekday: 'long',
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric',
                              timeZone: timezone
                            })}
                          </h3>
                        </div>
                        {reflection.whatWentWell && (
                          <div className="text-sm text-gray-700">
                            <strong>What went well:</strong> {reflection.whatWentWell}
                          </div>
                        )}
                        {reflection.whatDidntGoWell && (
                          <div className="text-sm text-gray-700 mt-1">
                            <strong>What didn't go well:</strong> {reflection.whatDidntGoWell}
                          </div>
                        )}
                        {reflection.improvements && (
                          <div className="text-sm text-gray-700 mt-1">
                            <strong>Improvements:</strong> {reflection.improvements}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No daily reflections yet</p>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4">
            {/* Long-term Goals */}
            {longTermGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Long-term Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {longTermGoals.map((goal) => (
                      <div key={goal.id} className="p-3 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-900">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-sm text-blue-700 mt-1">{goal.description}</p>
                        )}
                        <Badge variant="secondary" className="mt-2">
                          {goal.targetYears} year{goal.targetYears > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Focus Areas */}
            {focusAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Focus Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {focusAreas
                      .sort((a, b) => a.order - b.order)
                      .map((area) => (
                        <div key={area.id} className="p-3 bg-green-50 rounded-lg">
                          <h3 className="font-medium text-green-900">{area.title}</h3>
                          {area.description && (
                            <p className="text-sm text-green-700 mt-1">{area.description}</p>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly Goals */}
            {monthlyGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Goals History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyGoals
                      .sort((a, b) => b.year - a.year || b.month - a.month)
                      .map((goal) => (
                        <div key={goal.id} className="p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-purple-900">{goal.title}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">
                                {new Date(goal.year, goal.month - 1).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </Badge>
                              <Badge 
                                variant={goal.status === 'done' ? 'default' : goal.status === 'dropped' ? 'destructive' : 'secondary'}
                              >
                                {goal.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {longTermGoals.length === 0 && focusAreas.length === 0 && monthlyGoals.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No goals set yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="todos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Previous To-Dos</CardTitle>
              <CardDescription>
                Your completed and incomplete tasks by date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todos.length > 0 ? (
                <div className="space-y-4">
                  {todos
                    .sort((a, b) => new Date(b.forDate + 'T00:00:00').getTime() - new Date(a.forDate + 'T00:00:00').getTime())
                    .map((todo) => (
                      <div key={todo.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${todo.done ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`text-sm ${todo.done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {todo.title}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(todo.forDate + 'T00:00:00').toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              timeZone: timezone
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No todos yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Notes</CardTitle>
              <CardDescription>
                Your daily notes and thoughts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedNotes.length > 0 ? (
                <div className="space-y-4">
                  {paginatedNotes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          {new Date(note.forDate + 'T00:00:00').toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric',
                            timeZone: timezone
                          })}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No notes yet</p>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
