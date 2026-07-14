import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  useTasks,
  useComments,
  useCreateComment,
  useDeleteComment,
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment
} from '../hooks/useTasks';
import { taskService } from '../services/tasks';
import {
  ArrowLeft,
  Calendar,
  User,
  MessageSquare,
  Paperclip,
  Trash2,
  Send,
  Loader2,
  FileText,
  AlertTriangle,
  Download,
  Clock,
  Briefcase
} from 'lucide-react';

export default function TaskDetails() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [commentContent, setCommentContent] = useState('');
  const [uploading, setUploading] = useState(false);

  // Queries
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId);
  const { data: comments, isLoading: commentsLoading } = useComments(taskId);
  const { data: attachments, isLoading: attachmentsLoading } = useAttachments(taskId);

  // Mutations
  const createCommentMutation = useCreateComment(taskId);
  const deleteCommentMutation = useDeleteComment(taskId);
  const uploadAttachmentMutation = useUploadAttachment(taskId, user?.id);
  const deleteAttachmentMutation = useDeleteAttachment(taskId);

  // Get specific task from project tasks cache
  const task = useMemo(() => {
    return tasks?.find((t) => t.id === taskId);
  }, [tasks, taskId]);

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    createCommentMutation.mutate(
      {
        content: commentContent,
        userId: user.id,
      },
      {
        onSuccess: () => {
          setCommentContent('');
        },
      }
    );
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB check
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Max size is 10MB.');
      return;
    }

    try {
      setUploading(true);
      await uploadAttachmentMutation.mutateAsync(file);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = (attachmentId, filePath) => {
    if (window.confirm('Are you sure you want to remove this attachment?')) {
      deleteAttachmentMutation.mutate({ attachmentId, filePath });
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (tasksLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
        <div className="space-y-1">
          <p className="text-base font-semibold">Task not found</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            This task might have been deleted, or you don't have access.
          </p>
        </div>
        <Link to={`/project/${projectId}`} className="text-sm text-primary font-semibold hover:underline">
          Back to project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back navigation */}
      <button
        onClick={() => navigate(`/project/${projectId}`)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Project Dashboard</span>
      </button>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details, Description, Comments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl glass-card space-y-6">
            {/* Title & Priority Badge */}
            <div className="space-y-3">
              <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full border ${task.priority === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                {task.priority} Priority
              </span>
              <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
            </div>

            {/* Description */}
            <div className="space-y-2 border-t border-border/40 pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h3>
              <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
                {task.description || 'No description provided for this task.'}
              </p>
            </div>
          </div>

          {/* Discussion / Comments Section */}
          <div className="p-6 rounded-2xl glass-card space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span>Discussion ({comments?.length || 0})</span>
            </h2>

            {/* Comment list */}
            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 items-start group">
                    <div className="w-7 h-7 rounded-full bg-primary/25 flex items-center justify-center font-bold text-xs text-primary uppercase">
                      {comment.user?.full_name ? comment.user.full_name[0] : 'U'}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{comment.user?.full_name || 'Member'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {comment.user_id === user.id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-rose-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 border border-border/20 rounded-xl px-3 py-2">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/60 text-center py-4">No discussions yet. Type below to start.</p>
            )}

            {/* Post comment form */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a message..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              />
              <button
                type="submit"
                disabled={createCommentMutation.isPending || !commentContent.trim()}
                className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Status Panel & Attachments */}
        <div className="space-y-6">
          {/* Metadata Sidebar */}
          <div className="p-6 rounded-2xl glass-card space-y-4 border border-border/40">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/20">Task Attributes</h3>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-4 h-4" /> Status</span>
                <span className="capitalize font-semibold text-foreground px-2 py-0.5 bg-muted border border-border rounded-lg text-xs">
                  {task.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Due Date</span>
                <span className="font-semibold text-foreground">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5"><User className="w-4 h-4" /> Assignee</span>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[10px] text-primary">
                      {task.assignee.full_name[0]}
                    </div>
                    <span className="font-semibold text-foreground text-xs">{task.assignee.full_name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">Unassigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Attachments panel */}
          <div className="p-6 rounded-2xl glass-card space-y-4 border border-border/40">
            <div className="flex items-center justify-between pb-2 border-b border-border/20">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="w-4 h-4" /> Attachments
              </h3>
              
              <label className="p-1 hover:bg-muted text-primary hover:text-primary rounded-lg transition-colors cursor-pointer" title="Add File">
                <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </label>
            </div>

            {attachmentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : attachments && attachments.length > 0 ? (
              <div className="space-y-3">
                {attachments.map((file) => {
                  const url = taskService.getAttachmentUrl(file.file_path);
                  return (
                    <div key={file.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate text-foreground" title={file.file_name}>
                            {file.file_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{formatBytes(file.file_size)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(file.id, file.file_path)}
                          className="p-1 text-muted-foreground hover:text-rose-500 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 text-center py-4">No attachments uploaded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
