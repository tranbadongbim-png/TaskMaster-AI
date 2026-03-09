import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Plus, CircleCheck, Circle, Trash2, Sparkles, SquareCheck, Filter, ArrowUpDown, Clock, Calendar, Pencil, ListTree, Square, X, StickyNote, Moon, Sun, Tag as TagIcon, Settings, CircleHelp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-red-100 dark:border-red-900/30">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Đã có lỗi xảy ra</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Ứng dụng không thể khởi động. Vui lòng thử tải lại trang hoặc kiểm tra kết nối mạng.
            </p>
            <div className="text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-6 overflow-auto max-h-32">
              <code className="text-xs text-red-500 dark:text-red-400">
                {this.state.error?.toString()}
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-black dark:hover:bg-gray-100 transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

type Priority = 'low' | 'medium' | 'high';
type Status = 'todo' | 'in_progress' | 'done';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  due_date?: string;
  assignee?: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  due_date?: string;
  subtasks?: Subtask[];
  notes?: string;
  tag_id?: number;
  created_at: string;
}

const TaskSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3 animate-pulse">
    <div className="flex gap-3 items-start">
      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 mt-0.5 shrink-0"></div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="flex gap-2 mt-3">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
      </div>
    </div>
  </div>
);

const TagGroupSkeleton = () => (
  <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse mb-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
    <div className="space-y-3">
      <TaskSkeleton />
      <TaskSkeleton />
    </div>
  </div>
);

const SectionSkeleton = () => (
  <div className="space-y-4 mb-8 animate-pulse">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
    </div>
    <div className="space-y-3">
      <TaskSkeleton />
      <TaskSkeleton />
    </div>
  </div>
);

export default function App() {
  useEffect(() => {
    console.log("TaskMaster AI App mounted");
  }, []);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAIBreakdown, setIsAIBreakdown] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskTagId, setNewTaskTagId] = useState<number | ''>('');
  const [newSubtasks, setNewSubtasks] = useState<Subtask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [aiGoal, setAiGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'priority_desc' | 'priority_asc'>('date_desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'priority' | 'tag'>('tag');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Tag management states
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#64748b');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [newTagDueDate, setNewTagDueDate] = useState('');
  const [newTagAssignee, setNewTagAssignee] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchTags()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      console.log('Fetched tasks:', data);
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        console.error('Tasks data is not an array:', data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json();
      console.log('Fetched tags:', data);
      if (Array.isArray(data)) {
        setTags(data);
      } else {
        console.error('Tags data is not an array:', data);
      }
    } catch (error) {
      console.error('Failed to fetch tags', error);
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskPriority('medium');
    setNewTaskDueDate('');
    setNewTaskTagId('');
    setNewSubtasks([]);
    setSubtaskInput('');
    setNewTaskNotes('');
    setIsAdding(true);
  };

  const openAddModalWithTag = (tagId: number | '') => {
    openAddModal();
    setNewTaskTagId(tagId);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title || '');
    setNewTaskDesc(task.description || '');
    setNewTaskPriority(task.priority);
    setNewTaskDueDate(task.due_date || '');
    setNewTaskTagId(task.tag_id || '');
    setNewSubtasks(task.subtasks || []);
    setSubtaskInput('');
    setNewTaskNotes(task.notes || '');
    setIsAdding(true);
  };

  const addSubtask = () => {
    if (!(subtaskInput || '').trim()) return;
    setNewSubtasks([...newSubtasks, { id: Date.now().toString(), title: (subtaskInput || '').trim(), completed: false }]);
    setSubtaskInput('');
  };

  const removeSubtask = (id: string) => {
    setNewSubtasks(newSubtasks.filter(st => st.id !== id));
  };

  const updateSubtaskTitle = (id: string, newTitle: string) => {
    setNewSubtasks(newSubtasks.map(st => st.id === id ? { ...st, title: newTitle } : st));
  };

  const toggleSubtask = async (taskId: number, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedSubtasks = (task.subtasks || []).map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });
    } catch (error) {
      console.error('Failed to update subtask', error);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: task.subtasks } : t));
    }
  };

  const deleteSubtaskDirectly = async (taskId: number, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
    
    setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });
    } catch (error) {
      console.error('Failed to delete subtask', error);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: task.subtasks } : t));
    }
  };

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(newTaskTitle || '').trim()) return;

    try {
      if (editingTask) {
        // Update existing task
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTaskTitle,
            description: newTaskDesc,
            priority: newTaskPriority,
            due_date: newTaskDueDate || null,
            subtasks: newSubtasks,
            notes: newTaskNotes,
            tag_id: newTaskTagId === '' ? null : newTaskTagId
          })
        });
        const updatedTask = await res.json();
        setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      } else {
        // Create new task
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTaskTitle,
            description: newTaskDesc,
            priority: newTaskPriority,
            due_date: newTaskDueDate || null,
            subtasks: newSubtasks,
            notes: newTaskNotes,
            tag_id: newTaskTagId === '' ? null : newTaskTagId
          })
        });
        const newTask = await res.json();
        setTasks([newTask, ...tasks]);
      }
      
      setIsAdding(false);
      setEditingTask(null);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
      setNewTaskTagId('');
      setNewSubtasks([]);
      setSubtaskInput('');
      setNewTaskNotes('');
    } catch (error) {
      console.error('Failed to save task', error);
    }
  };

  const cycleTaskStatus = async (task: Task) => {
    const statusOrder: Status[] = ['todo', 'in_progress', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    const newStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error('Failed to update task', error);
      // Revert on failure
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const deleteTask = async (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete task', error);
      fetchTasks(); // Refetch to sync
    }
  };

  const generateAITasks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(aiGoal || '').trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: aiGoal })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTasks([...data, ...tasks]);
        setIsAIBreakdown(false);
        setAiGoal('');
      } else {
        console.error('Server error:', data);
        
        // Extract error message cleanly
        let errorMessage = 'Không thể tạo công việc';
        if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (data.error && typeof data.error === 'object') {
          // If the error is a nested object (like the one in the screenshot)
          try {
            const parsedError = typeof data.error === 'string' ? JSON.parse(data.error) : data.error;
            if (parsedError.error && parsedError.error.message) {
              errorMessage = parsedError.error.message;
            } else if (parsedError.message) {
              errorMessage = parsedError.message;
            }
          } catch (e) {
            errorMessage = JSON.stringify(data.error);
          }
        }
        
        // Translate common errors
        if (errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE")) {
          errorMessage = "Hệ thống AI hiện đang quá tải. Vui lòng thử lại sau ít phút.";
        } else if (errorMessage.includes("429") || errorMessage.includes("Quota exceeded") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
          errorMessage = "Bạn đã vượt quá giới hạn số lần sử dụng AI. Vui lòng đợi một lát rồi thử lại.";
        }
        
        alert(`Lỗi AI: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Failed to generate AI tasks', error);
      alert('Có lỗi xảy ra khi kết nối tới máy chủ.');
    } finally {
      setIsGenerating(false);
    }
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
  };

  const priorityLabels = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao'
  };

  const priorityWeight = {
    high: 3,
    medium: 2,
    low: 1
  };

  const submitTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(newTagName || '').trim()) return;

    try {
      const payload = {
        name: newTagName,
        color: newTagColor,
        description: newTagDescription,
        due_date: newTagDueDate,
        assignee: newTagAssignee
      };

      if (editingTag) {
        const res = await fetch(`/api/tags/${editingTag.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        let data;
        try {
          data = await res.json();
        } catch (e) {
          const text = await res.text();
          throw new Error(`Server error (${res.status}): ${text.substring(0, 100)}`);
        }
        
        if (!res.ok) {
          throw new Error(data.error || `Failed to update tag (Status ${res.status})`);
        }
        
        setTags(tags.map(t => t.id === editingTag.id ? data : t));
      } else {
        const res = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        let data;
        try {
          data = await res.json();
        } catch (e) {
          const text = await res.text();
          throw new Error(`Server error (${res.status}): ${text.substring(0, 100)}`);
        }
        
        if (!res.ok) {
          throw new Error(data.error || `Failed to create tag (Status ${res.status})`);
        }
        
        console.log('New tag created:', data);
        setTags([...tags, data]);
        setNewTaskTagId(data.id); // Tự động chọn thẻ mới tạo
      }
      setNewTagName('');
      setNewTagColor('#64748b');
      setNewTagDescription('');
      setNewTagDueDate('');
      setNewTagAssignee('');
      setEditingTag(null);
      // Keep modal open to allow adding more tags
      if (editingTag) {
        setIsManagingTags(false);
      }
    } catch (error: any) {
      console.error('Failed to save tag', error);
      alert(error.message || 'Không thể lưu thẻ. Vui lòng thử lại.');
    }
  };

  const deleteTag = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thẻ này? Các công việc thuộc thẻ này sẽ không bị xóa.')) return;
    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTags(tags.filter(t => t.id !== id));
        // Update tasks locally to remove the deleted tag_id
        setTasks(tasks.map(t => t.tag_id === id ? { ...t, tag_id: undefined } : t));
        // Reset selected tag if it was the one deleted
        if (newTaskTagId === id) {
          setNewTaskTagId('');
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Không thể xóa thẻ');
      }
    } catch (error) {
      console.error('Failed to delete tag', error);
    }
  };

  const openTagManager = () => {
    setIsManagingTags(true);
    setNewTagName('');
    setNewTagColor('#64748b');
    setNewTagDescription('');
    setNewTagDueDate('');
    setNewTagAssignee('');
    setEditingTag(null);
  };

  let processedTasks = [...tasks];

  // Filter
  if (filterStatus !== 'all') {
    processedTasks = processedTasks.filter(t => t.status === filterStatus);
  }

  // Sort
  processedTasks.sort((a, b) => {
    if (sortBy === 'priority_desc') {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    if (sortBy === 'priority_asc') {
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    }
    if (sortBy === 'date_asc') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    // date_desc
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    return dueDate < today;
  };

  const renderTask = (task: Task) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border flex flex-col gap-3 ${task.status === 'in_progress' ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10' : task.status === 'done' ? 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 opacity-75' : 'border-gray-100 dark:border-gray-700'}`}
    >
      <div className="flex gap-3 items-start">
        <button 
          onClick={() => cycleTaskStatus(task)}
          className={`mt-0.5 transition-colors ${
            task.status === 'in_progress' ? 'text-blue-500' : task.status === 'done' ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400'
          }`}
        >
          {task.status === 'in_progress' ? <Clock size={24} /> : task.status === 'done' ? <CircleCheck size={24} /> : <Circle size={24} />}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate ${task.status === 'done' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`text-xs px-2 py-1 rounded-md font-medium ${priorityColors[task.priority]}`}>
              {priorityLabels[task.priority]}
            </span>
            {task.status === 'in_progress' && (
              <span className="text-xs px-2 py-1 rounded-md font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Đang làm
              </span>
            )}
            {task.due_date && (
              <span className={`text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1 ${isOverdue(task.due_date) && task.status !== 'done' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                <Calendar size={12} />
                {formatDate(task.due_date)}
              </span>
            )}
            {task.tag_id && (
              (() => {
                const tag = Array.isArray(tags) ? tags.find(t => t.id === task.tag_id) : null;
                if (!tag) return null;
                const getValidColor = (color: string | undefined | null) => {
                  if (color && color.startsWith('#')) return color;
                  // Fallback for old 'gray' or other non-hex values
                  return '#64748b';
                };
                const validColor = getValidColor(tag.color);
                return (
                  <span 
                    className="text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1.5"
                    style={{ 
                      backgroundColor: `${validColor}15`,
                      color: validColor,
                      border: `1px solid ${validColor}30`
                    }}
                  >
                    <span 
                      className="w-2 h-2 rounded-full shadow-sm" 
                      style={{ backgroundColor: validColor }} 
                    />
                    {tag.name}
                  </span>
                );
              })()
            )}
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-md font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <ListTree size={12} />
                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => openEditModal(task)}
            className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
          >
            <Pencil size={18} />
          </button>
          <button 
            onClick={() => deleteTask(task.id)}
            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      {/* Subtasks List */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="pl-9 space-y-2 mt-1">
          {task.subtasks.map(st => (
            <div key={st.id} className="flex items-center gap-2 group">
              <button 
                onClick={() => toggleSubtask(task.id, st.id)}
                className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
              >
                {st.completed ? <SquareCheck size={16} className="text-indigo-600 dark:text-indigo-400" /> : <Square size={16} />}
              </button>
              <span className={`text-sm flex-1 ${st.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                {st.title}
              </span>
              <button
                onClick={() => deleteSubtaskDirectly(task.id, st.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-opacity p-1 shrink-0"
                title="Xóa việc con"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notes Section */}
      {task.notes && (
        <div className="ml-9 mt-1 p-3 bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          <div className="flex items-center gap-1.5 mb-1 text-yellow-700 dark:text-yellow-500 font-medium text-xs uppercase tracking-wider">
            <StickyNote size={12} />
            Ghi chú
          </div>
          {task.notes}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans pb-24 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 px-6 pt-12 pb-4 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-md mx-auto flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Công việc của tôi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {tasks.filter(t => t.status === 'todo').length} chưa làm • {tasks.filter(t => t.status === 'in_progress').length} đang làm • {tasks.filter(t => t.status === 'done').length} đã xong
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {}}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Hướng dẫn"
              title="Hướng dẫn"
            >
              <CircleHelp size={20} />
            </button>
            <button
              onClick={toggleTheme}
              className="tour-theme-btn w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <SquareCheck size={20} />
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="tour-filters max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Filter size={14} className="text-gray-400 dark:text-gray-500" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full pl-8 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="todo">Chưa làm</option>
              <option value="in_progress">Đang làm</option>
              <option value="done">Đã xong</option>
            </select>
          </div>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <ArrowUpDown size={14} className="text-gray-400" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="date_desc">Mới nhất</option>
              <option value="date_asc">Cũ nhất</option>
              <option value="priority_desc">Ưu tiên cao</option>
              <option value="priority_asc">Ưu tiên thấp</option>
            </select>
          </div>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <ListTree size={14} className="text-gray-400" />
            </div>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="none">Không nhóm</option>
              <option value="status">Theo trạng thái</option>
              <option value="priority">Theo ưu tiên</option>
              <option value="tag">Theo thẻ</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            {groupBy === 'tag' ? (
              <>
                <TagGroupSkeleton />
                <TagGroupSkeleton />
              </>
            ) : groupBy === 'status' || groupBy === 'priority' ? (
              <>
                <SectionSkeleton />
                <SectionSkeleton />
              </>
            ) : (
              <div className="space-y-3">
                <TaskSkeleton />
                <TaskSkeleton />
                <TaskSkeleton />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupBy === 'none' && (
              <>
                <div className="space-y-3">
                  <AnimatePresence>
                    {processedTasks.filter(t => t.status !== 'done').map(renderTask)}
                  </AnimatePresence>
                  
                  {processedTasks.filter(t => t.status !== 'done').length === 0 && !loading && (
                    <div className="text-center py-12 px-4">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CircleCheck size={32} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-gray-900 dark:text-white font-medium">Tuyệt vời!</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Bạn không có công việc nào đang chờ.</p>
                    </div>
                  )}
                </div>

                {processedTasks.filter(t => t.status === 'done').length > 0 && (
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Đã hoàn thành</h2>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {processedTasks.filter(t => t.status === 'done').map(renderTask)}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </>
            )}

            {groupBy === 'status' && (
              <div className="space-y-8">
                {['todo', 'in_progress', 'done'].map(status => {
                  const statusTasks = processedTasks.filter(t => t.status === status);
                  if (statusTasks.length === 0) return null;
                  
                  const title = status === 'todo' ? 'Chưa làm' : status === 'in_progress' ? 'Đang làm' : 'Đã xong';
                  
                  return (
                    <div key={status}>
                      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        {status === 'todo' ? <Circle size={16} /> : status === 'in_progress' ? <Clock size={16} className="text-blue-500" /> : <CircleCheck size={16} className="text-emerald-500" />}
                        {title} ({statusTasks.length})
                      </h2>
                      <div className="space-y-3">
                        <AnimatePresence>
                          {statusTasks.map(renderTask)}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {groupBy === 'priority' && (
              <div className="space-y-8">
                {['high', 'medium', 'low'].map(priority => {
                  const priorityTasks = processedTasks.filter(t => t.priority === priority);
                  if (priorityTasks.length === 0) return null;
                  
                  return (
                    <div key={priority}>
                      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                        Ưu tiên {priorityLabels[priority as Priority]} ({priorityTasks.length})
                      </h2>
                      <div className="space-y-3">
                        <AnimatePresence>
                          {priorityTasks.map(renderTask)}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {groupBy === 'tag' && (
              <div className="space-y-8">
                {[...tags, { id: -1, name: 'Không có thẻ', color: 'gray' }].map(tag => {
                  const tagTasks = processedTasks.filter(t => tag.id === -1 ? !t.tag_id : t.tag_id === tag.id);
                  if (tag.id === -1 && tagTasks.length === 0) return null;
                  
                  return (
                    <div key={tag.id} className="group bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ 
                                  backgroundColor: tag.id === -1 ? '#9ca3af' : (tag.color && tag.color.startsWith('#') ? tag.color : '#64748b') 
                                }} 
                              />
                              {tag.name}
                              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({tagTasks.length})</span>
                            </h2>
                            {tag.id !== -1 && (
                              <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingTag(tag as Tag);
                                    setNewTagName(tag.name || '');
                                    setNewTagColor(tag.color && tag.color.startsWith('#') ? tag.color : '#64748b');
                                    setNewTagDescription((tag as Tag).description || '');
                                    setNewTagDueDate((tag as Tag).due_date || '');
                                    setNewTagAssignee((tag as Tag).assignee || '');
                                    setIsManagingTags(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                  title="Sửa thẻ"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => deleteTag(tag.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Xóa thẻ"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          {tag.id !== -1 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-2">
                              {(tag as Tag).description && (
                                <p className="w-full text-gray-600 dark:text-gray-300 mb-1">{(tag as Tag).description}</p>
                              )}
                              {(tag as Tag).due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  <span>{new Date((tag as Tag).due_date!).toLocaleDateString('vi-VN')}</span>
                                </div>
                              )}
                              {(tag as Tag).assignee && (
                                <div className="flex items-center gap-1">
                                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                                    {(tag as Tag).assignee!.charAt(0).toUpperCase()}
                                  </div>
                                  <span>{(tag as Tag).assignee}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => openAddModalWithTag(tag.id === -1 ? '' : tag.id)}
                          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                        >
                          <Plus size={14} />
                          Thêm việc
                        </button>
                      </div>
                      <div className="space-y-3">
                        <AnimatePresence>
                          {tagTasks.map(renderTask)}
                        </AnimatePresence>
                        {tagTasks.length === 0 && (
                          <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                            <p className="text-sm text-gray-400 dark:text-gray-500">Chưa có công việc nào trong thẻ này.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                <button
                  onClick={() => {
                    setEditingTag(null);
                    setNewTagName('');
                    setNewTagColor('#6366f1');
                    setIsManagingTags(true);
                  }}
                  className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus size={20} />
                  Thêm thẻ mới
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-20">
        <button
          onClick={() => setIsAIBreakdown(true)}
          className="tour-ai-btn w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Tạo bằng AI"
          title="Tạo bằng AI"
        >
          <Sparkles size={24} />
        </button>
        <button
          onClick={() => {
            setEditingTag(null);
            setNewTagName('');
            setNewTagColor('#6366f1');
            setIsManagingTags(true);
          }}
          className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Thêm thẻ"
          title="Thêm thẻ"
        >
          <TagIcon size={24} />
        </button>
        <button
          onClick={openAddModal}
          className="tour-add-task-btn w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Thêm công việc"
          title="Thêm công việc"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAdding(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{editingTask ? 'Sửa công việc' : 'Thêm công việc mới'}</h2>
              <form onSubmit={submitTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên công việc</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="VD: Mua thức ăn cho mèo..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả (không bắt buộc)</label>
                  <textarea
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-24"
                    placeholder="Chi tiết công việc..."
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mức độ ưu tiên</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as Priority[]).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewTaskPriority(p)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                            newTaskPriority === p 
                              ? (p === 'high' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : p === 'medium' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400')
                              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {priorityLabels[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hạn chót</label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Tag Selection */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thẻ (Tag)</label>
                    <button
                      type="button"
                      onClick={openTagManager}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Settings size={12} />
                      Quản lý thẻ
                    </button>
                  </div>
                  <select
                    value={newTaskTagId}
                    onChange={(e) => setNewTaskTagId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  >
                    <option value="">Không có thẻ</option>
                    {tags.map(tag => (
                      <option key={tag.id} value={tag.id}>
                        ● {tag.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subtasks Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Công việc con</label>
                  <div className="space-y-2 mb-3">
                    {newSubtasks.map(st => (
                      <div key={st.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) => updateSubtaskTitle(st.id, e.target.value)}
                          className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-transparent outline-none"
                          placeholder="Nhập tên việc con..."
                        />
                        <button 
                          type="button" 
                          onClick={() => removeSubtask(st.id)}
                          className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Xóa việc con"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={subtaskInput}
                      onChange={(e) => setSubtaskInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSubtask();
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      placeholder="Thêm việc con..."
                    />
                    <button
                      type="button"
                      onClick={addSubtask}
                      disabled={!(subtaskInput || '').trim()}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú chi tiết (Links, đính kèm...)</label>
                  <textarea
                    value={newTaskNotes}
                    onChange={(e) => setNewTaskNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-24"
                    placeholder="Thêm thông tin chi tiết, đường dẫn, ghi chú..."
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!(newTaskTitle || '').trim()}
                    className="flex-1 py-3 rounded-xl font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {editingTask ? 'Cập nhật' : 'Lưu công việc'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tag Manager Modal */}
      <AnimatePresence>
        {isManagingTags && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsManagingTags(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quản lý thẻ</h2>
                <button onClick={() => setIsManagingTags(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {tags.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">Chưa có thẻ nào.</p>
                ) : (
                  tags.map(tag => (
                    <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color && tag.color.startsWith('#') ? tag.color : '#64748b' }} />
                        <span className="font-medium text-gray-900 dark:text-white">{tag.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingTag(tag);
                            setNewTagName(tag.name || '');
                            setNewTagColor(tag.color && tag.color.startsWith('#') ? tag.color : '#64748b');
                            setNewTagDescription(tag.description || '');
                            setNewTagDueDate(tag.due_date || '');
                            setNewTagAssignee(tag.assignee || '');
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => deleteTag(tag.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={submitTag} className="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="font-medium text-gray-900 dark:text-white">{editingTag ? 'Sửa thẻ' : 'Thêm thẻ mới'}</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên thẻ</label>
                  <input
                    type="text"
                    required
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    placeholder="VD: Công việc, Cá nhân..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả ngắn</label>
                  <input
                    type="text"
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    placeholder="VD: Dự án phát triển web..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hết hạn</label>
                    <input
                      type="date"
                      value={newTagDueDate}
                      onChange={(e) => setNewTagDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Người được giao</label>
                    <input
                      type="text"
                      value={newTagAssignee}
                      onChange={(e) => setNewTagAssignee(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Màu sắc</label>
                  <div className="flex flex-wrap gap-2">
                    {['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewTagColor(color)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${newTagColor === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                      >
                        {newTagColor === color && <CircleCheck size={14} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex gap-3">
                  {editingTag && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTag(null);
                        setNewTagName('');
                        setNewTagColor('#64748b');
                        setNewTagDescription('');
                        setNewTagDueDate('');
                        setNewTagAssignee('');
                      }}
                      className="flex-1 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                      Hủy sửa
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!(newTagName || '').trim()}
                    className="flex-1 py-2.5 rounded-xl font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm"
                  >
                    {editingTag ? 'Cập nhật thẻ' : 'Thêm thẻ'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Breakdown Modal */}
      <AnimatePresence>
        {isAIBreakdown && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !isGenerating && setIsAIBreakdown(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 shadow-2xl overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-100 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/10 -z-10" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chia nhỏ bằng AI</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nhập mục tiêu, AI sẽ tạo danh sách việc cần làm</p>
                </div>
              </div>

              <form onSubmit={generateAITasks} className="space-y-4">
                <div>
                  <textarea
                    required
                    autoFocus
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none h-32 backdrop-blur-sm"
                    placeholder="VD: Tổ chức tiệc sinh nhật cho mẹ vào cuối tuần này..."
                  />
                </div>
                
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAIBreakdown(false)}
                    disabled={isGenerating}
                    className="flex-1 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!(aiGoal || '').trim() || isGenerating}
                    className="flex-1 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-md shadow-purple-500/20"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Tạo công việc</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
