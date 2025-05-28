
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';

const TaskManager: React.FC = () => {
  const { tasks, createTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium'
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין כותרת למשימה",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingId) {
        await updateTask.mutateAsync({
          id: editingId,
          ...formData,
          due_date: formData.due_date || undefined
        });
        toast({
          title: "הצלחה",
          description: "המשימה עודכנה בהצלחה"
        });
      } else {
        await createTask.mutateAsync({
          ...formData,
          due_date: formData.due_date || undefined,
          is_completed: false
        });
        toast({
          title: "הצלחה",
          description: "המשימה נוספה בהצלחה"
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשמירת המשימה",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      priority: task.priority
    });
    setEditingId(task.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      toast({
        title: "הצלחה",
        description: "המשימה נמחקה בהצלחה"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת המשימה",
        variant: "destructive"
      });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleTask.mutateAsync(id);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון המשימה",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'גבוהה';
      case 'medium': return 'בינונית';
      case 'low': return 'נמוכה';
      default: return 'בינונית';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">ניהול משימות</h3>
        <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          הוסף משימה
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'עריכת משימה' : 'משימה חדשה'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="כותרת המשימה"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
              <Textarea
                placeholder="תיאור המשימה (אופציונלי)"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
              <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר עדיפות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">נמוכה</SelectItem>
                  <SelectItem value="medium">בינונית</SelectItem>
                  <SelectItem value="high">גבוהה</SelectItem>
                </SelectContent>
              </Select>
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
        {tasks.map((task) => (
          <Card key={task.id} className={task.is_completed ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={task.is_completed}
                    onCheckedChange={() => handleToggle(task.id)}
                  />
                  <div className="flex-1">
                    <h4 className={`font-medium ${task.is_completed ? 'line-through' : ''}`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className={getPriorityColor(task.priority)}>
                        עדיפות: {getPriorityText(task.priority)}
                      </span>
                      {task.due_date && (
                        <span className="text-muted-foreground">
                          תאריך יעד: {new Date(task.due_date).toLocaleDateString('he-IL')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(task)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {tasks.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              אין משימות עדיין. התחל על ידי הוספת משימה חדשה.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
