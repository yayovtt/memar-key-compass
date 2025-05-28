
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit, Bell } from 'lucide-react';
import { useReminders, Reminder } from '@/hooks/useReminders';
import { useToast } from '@/hooks/use-toast';

const ReminderManager: React.FC = () => {
  const { reminders, createReminder, updateReminder, deleteReminder, toggleReminder } = useReminders();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_time: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      reminder_time: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין כותרת לתזכורת",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingId) {
        await updateReminder.mutateAsync({
          id: editingId,
          ...formData,
          reminder_time: formData.reminder_time || undefined
        });
        toast({
          title: "הצלחה",
          description: "התזכורת עודכנה בהצלחה"
        });
      } else {
        await createReminder.mutateAsync({
          ...formData,
          reminder_time: formData.reminder_time || undefined,
          is_completed: false
        });
        toast({
          title: "הצלחה",
          description: "התזכורת נוספה בהצלחה"
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשמירת התזכורת",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      reminder_time: reminder.reminder_time ? new Date(reminder.reminder_time).toISOString().slice(0, 16) : ''
    });
    setEditingId(reminder.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder.mutateAsync(id);
      toast({
        title: "הצלחה",
        description: "התזכורת נמחקה בהצלחה"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת התזכורת",
        variant: "destructive"
      });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleReminder.mutateAsync(id);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון התזכורת",
        variant: "destructive"
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">ניהול תזכורות</h3>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          הוסף תזכורת
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'עריכת תזכורת' : 'תזכורת חדשה'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="כותרת התזכורת"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
              <Textarea
                placeholder="תיאור התזכורת (אופציונלי)"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <Input
                type="datetime-local"
                value={formData.reminder_time}
                onChange={(e) => setFormData({...formData, reminder_time: e.target.value})}
              />
              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'עדכן' : 'הוסף'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  ביטול
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {reminders.map((reminder) => (
          <Card key={reminder.id} className={reminder.is_completed ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={reminder.is_completed}
                    onCheckedChange={() => handleToggle(reminder.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-orange-500" />
                      <h4 className={`font-medium ${reminder.is_completed ? 'line-through' : ''}`}>
                        {reminder.title}
                      </h4>
                    </div>
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                    )}
                    {reminder.reminder_time && (
                      <p className="text-sm text-blue-600 mt-2">
                        תזכורת: {formatDateTime(reminder.reminder_time)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(reminder)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(reminder.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {reminders.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              אין תזכורות עדיין. התחל על ידי הוספת תזכורת חדשה.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReminderManager;
