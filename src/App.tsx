import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Sparkles, CheckSquare, Filter, ArrowUpDown, Clock, Calendar, Edit2, ListTree, Square, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Priority = 'low' | 'medium' | 'high';
type Status = 'todo' | 'in_progress' | 'done';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  due_date?: string;
  subtasks?: Subtask[];
  created_at: string;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAIBreakdown, setIsAIBreakdown] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newSubtasks, setNewSubtasks] = useState<Subtask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [aiGoal, setAiGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'priority_desc' | 'priority_asc'>('date_desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'priority'>('none');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskPriority('medium');
    setNewTaskDueDate('');
    setNewSubtasks([]);
    setSubtaskInput('');
    setIsAdding(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description || '');
    setNewTaskPriority(task.priority);
    setNewTaskDueDate(task.due_date || '');
    setNewSubtasks(task.subtasks || []);
    setSubtaskInput('');
    setIsAdding(true);
  };

  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    setNewSubtasks([...newSubtasks, { id: Date.now().toString(), title: subtaskInput.trim(), completed: false }]);
    setSubtaskInput('');
  };

  const removeSubtask = (id: string) => {
    setNewSubtasks(newSubtasks.filter(st => st.id !== id));
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

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

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
            subtasks: newSubtasks
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
            subtasks: newSubtasks
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
      setNewSubtasks([]);
      setSubtaskInput('');
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
    if (!aiGoal.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: aiGoal })
      });
      const newTasks = await res.json();
      if (Array.isArray(newTasks)) {
        setTasks([...newTasks, ...tasks]);
      }
      setIsAIBreakdown(false);
      setAiGoal('');
    } catch (error) {
      console.error('Failed to generate AI tasks', error);
      alert('Có lỗi xảy ra khi tạo công việc bằng AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700'
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
      className={`bg-white p-4 rounded-2xl shadow-sm border flex flex-col gap-3 ${task.status === 'in_progress' ? 'border-blue-200 bg-blue-50/30' : task.status === 'done' ? 'border-gray-100 bg-gray-50/50 opacity-75' : 'border-gray-100'}`}
    >
      <div className="flex gap-3 items-start">
        <button 
          onClick={() => cycleTaskStatus(task)}
          className={`mt-0.5 transition-colors ${
            task.status === 'in_progress' ? 'text-blue-500' : task.status === 'done' ? 'text-emerald-500' : 'text-gray-300 hover:text-indigo-600'
          }`}
        >
          {task.status === 'in_progress' ? <Clock size={24} /> : task.status === 'done' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`text-xs px-2 py-1 rounded-md font-medium ${priorityColors[task.priority]}`}>
              {priorityLabels[task.priority]}
            </span>
            {task.status === 'in_progress' && (
              <span className="text-xs px-2 py-1 rounded-md font-medium bg-blue-100 text-blue-700">
                Đang làm
              </span>
            )}
            {task.due_date && (
              <span className={`text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1 ${isOverdue(task.due_date) && task.status !== 'done' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-600'}`}>
                <Calendar size={12} />
                {formatDate(task.due_date)}
              </span>
            )}
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-md font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                <ListTree size={12} />
                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => openEditModal(task)}
            className="text-gray-400 hover:text-indigo-600 p-1"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={() => deleteTask(task.id)}
            className="text-gray-400 hover:text-red-500 p-1"
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
                className="text-gray-400 hover:text-indigo-600 transition-colors"
              >
                {st.completed ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
              </button>
              <span className={`text-sm ${st.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {st.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      {/* Header */}
      <header className="bg-white px-6 pt-12 pb-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Công việc của tôi</h1>
            <p className="text-sm text-gray-500 mt-1">
              {tasks.filter(t => t.status === 'todo').length} chưa làm • {tasks.filter(t => t.status === 'in_progress').length} đang làm • {tasks.filter(t => t.status === 'done').length} đã xong
            </p>
          </div>
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <CheckSquare size={20} />
          </div>
        </div>
        
        {/* Controls */}
        <div className="max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Filter size={14} className="text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} className="text-gray-400" />
                      </div>
                      <h3 className="text-gray-900 font-medium">Tuyệt vời!</h3>
                      <p className="text-gray-500 text-sm mt-1">Bạn không có công việc nào đang chờ.</p>
                    </div>
                  )}
                </div>

                {processedTasks.filter(t => t.status === 'done').length > 0 && (
                  <div className="pt-6 border-t border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Đã hoàn thành</h2>
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
                      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        {status === 'todo' ? <Circle size={16} /> : status === 'in_progress' ? <Clock size={16} className="text-blue-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
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
                      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
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
          </div>
        )}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-20">
        <button
          onClick={() => setIsAIBreakdown(true)}
          className="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Tạo bằng AI"
        >
          <Sparkles size={24} />
        </button>
        <button
          onClick={openAddModal}
          className="w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Thêm công việc"
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
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">{editingTask ? 'Sửa công việc' : 'Thêm công việc mới'}</h2>
              <form onSubmit={submitTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên công việc</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="VD: Mua thức ăn cho mèo..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (không bắt buộc)</label>
                  <textarea
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-24"
                    placeholder="Chi tiết công việc..."
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ ưu tiên</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as Priority[]).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewTaskPriority(p)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                            newTaskPriority === p 
                              ? (p === 'high' ? 'bg-red-50 border-red-200 text-red-700' : p === 'medium' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-blue-50 border-blue-200 text-blue-700')
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {priorityLabels[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hạn chót</label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-gray-700"
                    />
                  </div>
                </div>

                {/* Subtasks Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Công việc con</label>
                  <div className="space-y-2 mb-3">
                    {newSubtasks.map(st => (
                      <div key={st.id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <span className="flex-1 text-sm text-gray-700">{st.title}</span>
                        <button 
                          type="button" 
                          onClick={() => removeSubtask(st.id)}
                          className="text-gray-400 hover:text-red-500"
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
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                      placeholder="Thêm việc con..."
                    />
                    <button
                      type="button"
                      onClick={addSubtask}
                      disabled={!subtaskInput.trim()}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="flex-1 py-3 rounded-xl font-medium text-white bg-gray-900 hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {editingTask ? 'Cập nhật' : 'Lưu công việc'}
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
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 shadow-2xl overflow-hidden"
            >
              {/* Decorative background */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-100 to-indigo-50 -z-10" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Chia nhỏ bằng AI</h2>
                  <p className="text-sm text-gray-500">Nhập mục tiêu, AI sẽ tạo danh sách việc cần làm</p>
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none h-32 bg-white/80 backdrop-blur-sm"
                    placeholder="VD: Tổ chức tiệc sinh nhật cho mẹ vào cuối tuần này..."
                  />
                </div>
                
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAIBreakdown(false)}
                    disabled={isGenerating}
                    className="flex-1 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!aiGoal.trim() || isGenerating}
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
