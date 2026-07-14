import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useMembers,
  useProjects
} from '../hooks/useTasks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import Dialog from '../components/ui/Dialog';
import { BoardSkeleton, ListSkeleton } from '../components/ui/Skeleton';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Kanban,
  List as ListIcon,
  Calendar,
  User,
  Trash2,
  Edit2,
  FolderPlus,
  TrendingUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().optional().nullable(),
  assignee_id: z.string().optional().nullable(),
});

export default function Dashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at'); // 'due_date' | 'created_at' | 'priority'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Pagination for List View
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // DB queries
  const { data: projects } = useProjects();
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId);
  const { data: members } = useMembers();

  // Mutations
  const createTaskMutation = useCreateTask(projectId);
  const updateTaskMutation = useUpdateTask(projectId);
  const deleteTaskMutation = useDeleteTask(projectId);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'todo',
      priority: 'medium',
    },
  });

  // Fetch current project info
  const currentProject = useMemo(() => {
    return projects?.find((p) => p.id === projectId);
  }, [projects, projectId]);

  // Statistics
  const stats = useMemo(() => {
    if (!tasks) return { todo: 0, inProgress: 0, done: 0, completion: 0 };
    const total = tasks.length;
    if (total === 0) return { todo: 0, inProgress: 0, done: 0, completion: 0 };
    
    const todo = tasks.filter((t) => t.status === 'todo' || t.status === 'backlog').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const completion = Math.round((done / total) * 100);

    return { todo, inProgress, done, completion };
  }, [tasks]);

  // Priority mapping for sorting
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  // Filtered & Sorted Tasks
  const processedTasks = useMemo(() => {
    if (!tasks) return [];
    
    let result = [...tasks];

    // Search
    if (searchQuery) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Priority Filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        comparison = new Date(a.due_date) - new Date(b.due_date);
      } else if (sortBy === 'priority') {
        comparison = priorityWeight[b.priority] - priorityWeight[a.priority];
      } else {
        comparison = new Date(a.created_at) - new Date(b.created_at);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy, sortOrder]);

  // Paginated tasks for List View
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [processedTasks, currentPage]);

  const totalPages = Math.ceil(processedTasks.length / itemsPerPage);

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setValue('title', task.title);
    setValue('description', task.description || '');
    setValue('status', task.status);
    setValue('priority', task.priority);
    setValue('due_date', task.due_date || '');
    setValue('assignee_id', task.assignee_id || '');
  };

  const handleCreateTaskSubmit = (data) => {
    createTaskMutation.mutate(
      {
        ...data,
        project_id: projectId,
        created_by: user.id,
      },
      {
        onSuccess: () => {
          setIsNewTaskOpen(false);
          reset();
        },
      }
    );
  };

  const handleEditTaskSubmit = (data) => {
    if (!editingTask) return;
    updateTaskMutation.mutate(
      {
        taskId: editingTask.id,
        updates: data,
      },
      {
        onSuccess: () => {
          setEditingTask(null);
          reset();
        },
      }
    );
  };

  const handleQuickStatusChange = (taskId, newStatus) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus },
    });
  };

  const handleDeleteTask = (taskId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  // --- RENDERING ROOT VIEW (ALL PROJECTS LIST) ---
  if (!projectId) {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="p-8 rounded-2xl glass-panel relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-4 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome to your workspace, {profile?.full_name || 'Member'}!
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Create projects, assign tasks, upload documents, and track progress using Kanban and List views. Select a project from the sidebar or click below to start.
            </p>
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Your Projects</h2>
            <button
              onClick={() => {
                const sidebarPlusBtn = document.querySelector('[title="Create Project"]');
                if (sidebarPlusBtn) sidebarPlusBtn.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:opacity-90 transition-opacity"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="p-6 rounded-2xl glass-card hover:glow-primary flex flex-col justify-between h-48 group border border-border/40"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4 text-xs text-muted-foreground">
                    <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                      Open Dashboard <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border border-border border-dashed rounded-2xl text-center space-y-4">
              <FolderPlus className="w-12 h-12 text-muted-foreground/60 animate-bounce" />
              <div className="space-y-1">
                <p className="text-base font-semibold">No projects found</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create your first project to start tracking your tasks and collaborate.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDERING PROJECT DASHBOARD VIEW ---
  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">{currentProject?.name || 'Project Dashboard'}</h1>
          <p className="text-sm text-muted-foreground">{currentProject?.description || 'Workspace overview.'}</p>
        </div>

        <button
          onClick={() => {
            reset();
            setIsNewTaskOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass-card border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">Progress Rate</span>
            <p className="text-3xl font-extrabold">{stats.completion}%</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">To-Do / Backlog</span>
            <p className="text-3xl font-extrabold">{stats.todo}</p>
          </div>
          <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl border border-violet-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">Active In-Progress</span>
            <p className="text-3xl font-extrabold">{stats.inProgress}</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">Completed Tasks</span>
            <p className="text-3xl font-extrabold">{stats.done}</p>
          </div>
          <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl border border-teal-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar: Views + Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-6">
        {/* Left Side: View Toggle */}
        <div className="flex p-1 rounded-xl bg-muted/40 border border-border/80 self-start">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Kanban className="w-4 h-4" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ListIcon className="w-4 h-4" />
            <span>List Table</span>
          </button>
        </div>

        {/* Right Side: Filters, Search, Sorting */}
        <div className="flex flex-col sm:flex-row flex-1 lg:justify-end gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4.5 h-4.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1 border border-border rounded-xl px-2.5 bg-card/40">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-xs py-2 text-muted-foreground font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1 border border-border rounded-xl px-2.5 bg-card/40">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by);
                setSortOrder(order);
              }}
              className="bg-transparent focus:outline-none text-xs py-2 text-muted-foreground font-medium"
            >
              <option value="created_at-desc">Created (Newest)</option>
              <option value="created_at-asc">Created (Oldest)</option>
              <option value="due_date-asc">Due Date (Soonest)</option>
              <option value="priority-desc">Priority (High-Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Task List / Board */}
      {tasksLoading ? (
        viewMode === 'kanban' ? <BoardSkeleton /> : <ListSkeleton />
      ) : processedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-border/80 text-center space-y-4">
          <Kanban className="w-12 h-12 text-muted-foreground/60" />
          <div className="space-y-1">
            <p className="text-base font-semibold">No tasks found</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Try modifying your search query or filters, or add a new task to this project.
            </p>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[500px]">
          {['backlog', 'todo', 'in_progress', 'done'].map((columnStatus) => {
            const columnTasks = processedTasks.filter((t) => t.status === columnStatus);
            return (
              <div
                key={columnStatus}
                className="flex flex-col gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40 min-h-[400px]"
              >
                {/* Column Header */}
                <div className="flex justify-between items-center pb-2 border-b border-border/20">
                  <span className="text-sm font-semibold capitalize tracking-wide text-foreground/80 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${columnStatus === 'backlog' && 'bg-slate-500'} ${columnStatus === 'todo' && 'bg-violet-500'} ${columnStatus === 'in_progress' && 'bg-amber-500'} ${columnStatus === 'done' && 'bg-emerald-500'}`} />
                    {columnStatus.replace('_', ' ')}
                  </span>
                  <span className="text-xs bg-muted border border-border text-muted-foreground rounded-full px-2 py-0.5 font-bold">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                  {columnTasks.map((task) => (
                    <motion.div
                      layoutId={task.id}
                      key={task.id}
                      onClick={() => navigate(`/project/${projectId}/task/${task.id}`)}
                      className="p-4 rounded-xl glass-card cursor-pointer border border-border/40 hover:glow-primary group"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${task.priority === 'high' && 'bg-rose-500/10 text-rose-500 border border-rose-500/20'} ${task.priority === 'medium' && 'bg-amber-500/10 text-amber-500 border border-amber-500/20'} ${task.priority === 'low' && 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                          {task.priority}
                        </span>

                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(task);
                            }}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-border/20 text-[10px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                        </span>
                        
                        {task.assignee ? (
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px] text-primary" title={task.assignee.full_name}>
                            {task.assignee.full_name[0]}
                          </div>
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST TABLE VIEW */
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/40 overflow-hidden bg-card/30 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="p-4">Task Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Assignee</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-sm">
                {paginatedTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => navigate(`/project/${projectId}/task/${task.id}`)}
                    className="hover:bg-muted/10 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-semibold text-foreground max-w-xs truncate">
                      {task.title}
                    </td>
                    <td className="p-4">
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                        className="bg-muted border border-border text-xs rounded-lg px-2 py-1 text-foreground focus:outline-none"
                      >
                        <option value="backlog">Backlog</option>
                        <option value="todo">To-Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${task.priority === 'high' && 'bg-rose-500/10 text-rose-500 border border-rose-500/20'} ${task.priority === 'medium' && 'bg-amber-500/10 text-amber-500 border border-amber-500/20'} ${task.priority === 'low' && 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px] text-primary">
                            {task.assignee.full_name[0]}
                          </div>
                          <span className="text-xs truncate">{task.assignee.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTask(task.id, e)}
                          className="p-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/40 pt-4 text-sm text-muted-foreground">
              <span>Showing Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((c) => c - 1)}
                  className="p-2 border border-border hover:bg-muted rounded-xl transition-colors disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((c) => c + 1)}
                  className="p-2 border border-border hover:bg-muted rounded-xl transition-colors disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE TASK DIALOG */}
      <Dialog isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} title="Create New Task">
        <form onSubmit={handleSubmit(handleCreateTaskSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Task Title</label>
            <input
              type="text"
              placeholder="e.g. Design homepage hero section"
              {...register('title')}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
            />
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Description</label>
            <textarea
              placeholder="Provide context and requirements..."
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To-Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Priority</label>
              <select
                {...register('priority')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Due Date</label>
              <input
                type="date"
                {...register('due_date')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Assignee</label>
              <select
                {...register('assignee_id')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              >
                <option value="">Unassigned</option>
                {members?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(false)}
              className="px-4 py-2 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition-all"
            >
              Create Task
            </button>
          </div>
        </form>
      </Dialog>

      {/* EDIT TASK DIALOG */}
      <Dialog isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task Properties">
        <form onSubmit={handleSubmit(handleEditTaskSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Task Title</label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
            />
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To-Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Priority</label>
              <select
                {...register('priority')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Due Date</label>
              <input
                type="date"
                {...register('due_date')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Assignee</label>
              <select
                {...register('assignee_id')}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              >
                <option value="">Unassigned</option>
                {members?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setEditingTask(null)}
              className="px-4 py-2 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTaskMutation.isPending}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
