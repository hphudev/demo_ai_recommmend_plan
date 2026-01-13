'use client'

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  LayoutList,
  Loader2,
  Plus,
  Sparkles,
  Trash2
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Define the Todo type
type Todo = {
  id: string;
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  description?: string;
  time_recommend?: string;
  completed: boolean;
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    High: "bg-red-500/10 text-red-500 border-red-500/20",
    Medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[priority as keyof typeof colors]}`}>
      {priority.toUpperCase()}
    </span>
  );
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const autoId = useRef(Date.now());

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_todos');
    if (saved) {
      setTodos(JSON.parse(saved));
    }
    setIsMounted(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('ai_todos', JSON.stringify(todos));
    }
  }, [todos, isMounted]);

  async function applyRecommendation(currentTodos: Todo[]) {
    if (currentTodos.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todos: currentTodos }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get recommendation');
      }

      const data = await response.json();
      const recommendations = (Array.isArray(data) ? data : []) as { id: string | number, time_recommend: string }[];

      setTodos(prev => {
        if (!Array.isArray(recommendations) || recommendations.length === 0) return prev;

        const updated = prev.map(todo => {
          // So khớp ID (ép kiểu về string để tránh sai lệch)
          const rec = recommendations.find(r =>
            r && typeof r === 'object' && String(r.id) === String(todo.id)
          );

          if (rec && rec.time_recommend) {
            return { ...todo, time_recommend: rec.time_recommend };
          }
          return todo;
        });

        // Sắp xếp lại danh sách theo thời gian khuyến nghị
        return [...updated].sort((a, b) => {
          const aTime = a.time_recommend && a.time_recommend !== '---' ? a.time_recommend : '99:99';
          const bTime = b.time_recommend && b.time_recommend !== '---' ? b.time_recommend : '99:99';
          return aTime.localeCompare(bTime);
        });
      });
    } catch (error: any) {
      console.error("Client Error:", error);
      const message = error instanceof Error ? error.message : 'An error occurred';
      alert(message.includes('Quota') ? message : 'Failed to get recommendations. Please check your API key or try again later.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    if (!name.trim()) return;

    const newTodo: Todo = {
      id: (Date.now()).toString(),
      name,
      priority: formData.get('priority') as 'High' | 'Medium' | 'Low',
      description: (formData.get('description') as string) || '',
      time_recommend: '---',
      completed: false
    };

    const nextTodos = [newTodo, ...todos];
    setTodos(nextTodos);
    form.reset();

    // Tự động sắp xếp sau khi add
    applyRecommendation(nextTodos);
  }

  function handleDelete(id: string) {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }

  function toggleComplete(id: string) {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }

  function handleClearAll() {
    if (window.confirm('Delete all tasks and start fresh?')) {
      setTodos([]);
    }
  }

  async function handleRecommendPlan() {
    applyRecommendation(todos);
  }

  if (!isMounted) return null;

  return (
    <main className="min-h-screen pb-20 px-4 md:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <nav className="flex items-center justify-between py-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutList className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">PlanAI</h1>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium opacity-60">
          <a href="#" className="hover:opacity-100 transition-opacity">Dashboard</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Schedule</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Settings</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mt-8 mb-12 text-center md:text-start">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4"
        >
          Master your time with <span className="text-blue-600">AI</span>.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg opacity-60 max-w-2xl"
        >
          Add your daily tasks and let our AI optimize your schedule for maximum productivity and balance.
          Start your day right at 6:00 AM.
        </motion.p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar / Form */}
        <div className="lg:col-span-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-6 rounded-3xl sticky top-8 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-6 text-blue-600">
              <Plus className="w-5 h-5" />
              <h3 className="font-bold">Add New Task</h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider opacity-50 ml-1">Task Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Gym Session"
                  className="w-full bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:opacity-30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider opacity-50 ml-1">Priority</label>
                <select
                  name="priority"
                  defaultValue="Medium"
                  className="w-full bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider opacity-50 ml-1">Description (Optional)</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Details about the task..."
                  className="w-full bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:opacity-30 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-2"
              >
                <Plus className="w-5 h-5" />
                Add to List
              </button>

              <div className="pt-4 border-t border-black/5 dark:border-white/5 mt-2">
                <button
                  type="button"
                  onClick={handleRecommendPlan}
                  disabled={loading || todos.length === 0}
                  className="w-full glass hover:bg-white/90 dark:hover:bg-white/10 text-blue-600 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                  {loading ? 'Analyzing...' : 'Optimize Schedule'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Content / List */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="text-blue-600" />
                Today's Timeline
              </h3>
              <p className="text-sm opacity-50">Sorted by AI recommended time</p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleClearAll}
                  className="text-[10px] font-bold uppercase tracking-wider opacity-30 hover:opacity-100 hover:text-red-500 transition-all"
                >
                  Clear All
                </button>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-blue-600">{todos.length}</span>
                  <span className="text-sm opacity-50 block uppercase tracking-widest font-bold">Planned</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {todos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 glass rounded-3xl"
                >
                  <p className="opacity-40 italic">No tasks planned yet. Add one to get started!</p>
                </motion.div>
              ) : (
                todos.map((todo, index) => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`group glass rounded-3xl p-5 md:p-6 transition-all border-l-4 ${todo.completed ? 'opacity-50 border-emerald-500 shadow-none' :
                      todo.priority === 'High' ? 'border-red-500 shadow-xl' :
                        todo.priority === 'Medium' ? 'border-amber-500 shadow-lg' :
                          'border-blue-500 shadow-md'
                      } card-shine`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleComplete(todo.id)}
                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-black/10 dark:border-white/10 hover:border-blue-500'
                          }`}
                      >
                        {todo.completed && <CheckCircle className="w-4 h-4" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <PriorityBadge priority={todo.priority} />
                          <h4 className={`font-bold text-lg ${todo.completed ? 'line-through text-black/50 dark:text-white/50' : ''}`}>
                            {todo.name}
                          </h4>
                        </div>

                        {todo.description && (
                          <p className="text-sm opacity-50 mb-4">{todo.description}</p>
                        )}

                        <div className="flex items-center gap-6 mt-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold opacity-60">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Recommended: <span className="text-blue-600">{todo.time_recommend === '---' ? 'Unscheduled' : todo.time_recommend}</span></span>
                          </div>
                          {todo.completed && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {todos.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12 p-8 border-2 border-dashed border-blue-500/20 rounded-3xl flex flex-col items-center text-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Sparkles className="text-blue-600 w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-lg">Ready for an optimized day?</h5>
                <p className="text-sm opacity-50 max-w-sm">Our AI will analyze your tasks and suggest the best possible sequence and timing.</p>
              </div>
              <button
                onClick={handleRecommendPlan}
                className="flex items-center gap-2 text-blue-600 font-bold hover:gap-4 transition-all"
              >
                Let AI arrange it <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
