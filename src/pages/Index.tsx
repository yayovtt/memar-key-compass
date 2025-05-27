import React from 'react';
import Header from '@/components/layout/Header';
import WidgetCard from '@/components/dashboard/WidgetCard';
import { BarChart2, Users, Settings, ClipboardList, TrendingUp, Activity, UsersRound, ListChecks, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <WidgetCard title="ניתוח נתונים" icon={BarChart2} className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <div className="text-3xl font-bold">75.4%</div>
              <p className="text-sm text-blue-100">גידול החודש</p>
            </WidgetCard>

            <WidgetCard title="משתמשים פעילים" icon={Users} className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
              <div className="text-3xl font-bold">1,234</div>
              <p className="text-sm text-green-100">סה"כ משתמשים</p>
            </WidgetCard>

            <WidgetCard title="משימות אחרונות" icon={ClipboardList} className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
              <div className="text-3xl font-bold">28</div>
              <p className="text-sm text-yellow-100">משימות פתוחות</p>
            </WidgetCard>
            
            <WidgetCard title="הגדרות מערכת" icon={Settings} className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
               <p className="text-sm">ניהול תצורות ופרמטרים של המערכת.</p>
               <button className="mt-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors">
                 עבור להגדרות
               </button>
            </WidgetCard>

            <WidgetCard title="לקוחות" icon={UsersRound} className="bg-gradient-to-br from-sky-500 to-cyan-600 text-white">
              <Link to="/clients" className="block hover:bg-sky-700/50 p-2 -m-2 rounded-md transition-colors">
                <div className="text-3xl font-bold">150</div>
                <p className="text-sm text-sky-100">לקוחות רשומים (לחץ לניהול)</p>
                <p className="text-xs mt-1 text-sky-200">(דורש חיבור Supabase ואימות משתמש)</p>
              </Link>
            </WidgetCard>

            <WidgetCard title="משימות נוספות" icon={ListChecks} className="bg-gradient-to-br from-lime-500 to-emerald-600 text-white">
              <ul className="space-y-1 text-sm">
                <li>אישור הצעת מחיר לפרויקט X</li>
                <li>פגישת מעקב עם לקוח Y</li>
                <li>סיום משימת עיצוב Z</li>
              </ul>
              <p className="text-sm text-lime-100 mt-2">3 משימות ממתינות</p>
            </WidgetCard>

            <WidgetCard title="תזכורות" icon={Bell} className="bg-gradient-to-br from-rose-500 to-red-600 text-white">
              <ul className="space-y-1 text-sm">
                <li>פגישה עם צוות פיתוח - 10:00</li>
                <li>לתזכר את רוני לגבי חשבונית - מחר</li>
                <li>יום הולדת לשירה - 29.05</li>
              </ul>
               <button className="mt-2 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors">
                 הצג הכל
               </button>
            </WidgetCard>

            <WidgetCard title="ביצועים" icon={TrendingUp} className="lg:col-span-2 bg-card text-card-foreground">
              <div className="text-2xl font-semibold">שיפור של 15%</div>
              <p className="text-sm text-muted-foreground">ברבעון האחרון, ביחס ליעדים.</p>
            </WidgetCard>

            <WidgetCard title="יומן פעילות" icon={Activity} className="lg:col-span-2 bg-card text-card-foreground">
              <ul className="space-y-2 text-sm">
                <li><span className="font-semibold">משתמש חדש נרשם:</span> אבי כהן</li>
                <li><span className="font-semibold">עדכון פרופיל:</span> שרה לוי</li>
                <li><span className="font-semibold">משימה הושלמה:</span> עיצוב דף נחיתה</li>
              </ul>
            </WidgetCard>

          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} כל הזכויות שמורות. פותח באמצעות Lovable.
      </footer>
    </div>
  );
};

export default Index;
