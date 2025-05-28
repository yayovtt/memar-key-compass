
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import WidgetCard from '@/components/dashboard/WidgetCard';
import TaskManager from '@/components/tasks/TaskManager';
import ReminderManager from '@/components/reminders/ReminderManager';
import { BarChart2, Users, Settings, ClipboardList, TrendingUp, Activity, UsersRound, ListChecks, Bell, Folders } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDashboardData } from '@/hooks/useDashboardData';

const Index = () => {
  const { clientsCount, filesCount, growthPercentage, activeUsers, openTasks, recentTasks, recentReminders } = useDashboardData();
  const [showTasks, setShowTasks] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <WidgetCard title="ניתוח נתונים" icon={BarChart2} className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <div className="text-3xl font-bold">{growthPercentage}%</div>
              <p className="text-sm text-blue-100">גידול החודש</p>
            </WidgetCard>

            <WidgetCard title="משתמשים פעילים" icon={Users} className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
              <div className="text-3xl font-bold">{activeUsers}</div>
              <p className="text-sm text-green-100">סה"כ משתמשים</p>
            </WidgetCard>

            <WidgetCard title="משימות אחרונות" icon={ClipboardList} className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
              <div className="text-3xl font-bold">{openTasks}</div>
              <p className="text-sm text-yellow-100">משימות פתוחות</p>
              <button 
                onClick={() => setShowTasks(true)}
                className="mt-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors"
              >
                ניהול משימות
              </button>
            </WidgetCard>
            
            <WidgetCard title="הגדרות מערכת" icon={Settings} className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
               <p className="text-sm">ניהול תצורות ופרמטרים של המערכת.</p>
               <button className="mt-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors">
                 עבור להגדרות
               </button>
            </WidgetCard>

            <WidgetCard title="לקוחות" icon={UsersRound} className="bg-gradient-to-br from-sky-500 to-cyan-600 text-white">
              <Link to="/clients" className="block hover:bg-sky-700/50 p-2 -m-2 rounded-md transition-colors">
                <div className="text-3xl font-bold">{clientsCount}</div>
                <p className="text-sm text-sky-100">לקוחות רשומים (לחץ לניהול)</p>
                <p className="text-xs mt-1 text-sky-200">({filesCount} קבצים מועלים)</p>
              </Link>
            </WidgetCard>

            <WidgetCard title="תיקיות לקוחות" icon={Folders} className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Link to="/client-folders" className="block hover:bg-indigo-700/50 p-2 -m-2 rounded-md transition-colors">
                <p className="text-lg font-semibold text-indigo-100">ניהול תיקיות</p>
                <p className="text-sm text-indigo-200 mt-1">צפייה וארגון של כל תיקיות הלקוחות</p>
                <p className="text-xs mt-2 text-indigo-300">({filesCount} קבצים בסך הכל)</p>
              </Link>
            </WidgetCard>

            <WidgetCard title="משימות נוספות" icon={ListChecks} className="bg-gradient-to-br from-lime-500 to-emerald-600 text-white">
              {recentTasks.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {recentTasks.map((task, index) => (
                    <li key={index} className={task.is_completed ? 'line-through opacity-70' : ''}>
                      {task.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">אין משימות חדשות</p>
              )}
              <p className="text-sm text-lime-100 mt-2">{openTasks} משימות פתוחות</p>
              <button 
                onClick={() => setShowTasks(true)}
                className="mt-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors"
              >
                ניהול משימות
              </button>
            </WidgetCard>

            <WidgetCard title="תזכורות" icon={Bell} className="bg-gradient-to-br from-rose-500 to-red-600 text-white">
              {recentReminders.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {recentReminders.map((reminder, index) => (
                    <li key={index} className={reminder.is_completed ? 'line-through opacity-70' : ''}>
                      {reminder.title}
                      {reminder.reminder_time && (
                        <div className="text-xs opacity-80">
                          {new Date(reminder.reminder_time).toLocaleDateString('he-IL')}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">אין תזכורות חדשות</p>
              )}
              <button 
                onClick={() => setShowReminders(true)}
                className="mt-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors"
              >
                ניהול תזכורות
              </button>
            </WidgetCard>

            <WidgetCard title="ביצועים" icon={TrendingUp} className="lg:col-span-2 bg-card text-card-foreground">
              <div className="text-2xl font-semibold">שיפור של {Math.floor(Number(growthPercentage) / 5)}%</div>
              <p className="text-sm text-muted-foreground">ברבעון האחרון, ביחס ליעדים.</p>
            </WidgetCard>

            <WidgetCard title="יומן פעילות" icon={Activity} className="lg:col-span-2 bg-card text-card-foreground">
              <ul className="space-y-2 text-sm">
                <li><span className="font-semibold">לקוחות:</span> {clientsCount} לקוחות רשומים</li>
                <li><span className="font-semibold">קבצים הועלו:</span> {filesCount} קבצים בסך הכל</li>
                <li><span className="font-semibold">משימות פתוחות:</span> {openTasks} משימות ממתינות</li>
                <li><span className="font-semibold">תזכורות:</span> {recentReminders.length} תזכורות אחרונות</li>
              </ul>
            </WidgetCard>
          </div>
        </div>
      </main>

      {/* Tasks Management Modal */}
      <Dialog open={showTasks} onOpenChange={setShowTasks}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ניהול משימות</DialogTitle>
          </DialogHeader>
          <TaskManager />
        </DialogContent>
      </Dialog>

      {/* Reminders Management Modal */}
      <Dialog open={showReminders} onOpenChange={setShowReminders}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ניהול תזכורות</DialogTitle>
          </DialogHeader>
          <ReminderManager />
        </DialogContent>
      </Dialog>

      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} כל הזכויות שמורות. פותח באמצעות Lovable.
      </footer>
    </div>
  );
};

export default Index;
