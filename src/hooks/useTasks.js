import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { taskService } from '../services/tasks';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

// --- Projects Queries & Mutations ---
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => taskService.getProjects(),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ name, description, ownerId }) =>
      taskService.createProject(name, description, ownerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project created successfully!', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to create project', 'error');
    },
  });
}

// --- Members Query ---
export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: () => taskService.getMembers(),
  });
}

// --- Tasks Queries & Mutations with Realtime ---
export function useTasks(projectId) {
  const queryClient = useQueryClient();

  // Setup Postgres Realtime listener
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`tasks-project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // Refetch tasks on change
          queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskService.getTasks(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (taskData) => taskService.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      showToast('Task created successfully!', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to create task', 'error');
    },
  });
}

export function useUpdateTask(projectId) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ taskId, updates }) => taskService.updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['task', projectId] });
      showToast('Task updated successfully!', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update task', 'error');
    },
  });
}

export function useDeleteTask(projectId) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (taskId) => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      showToast('Task deleted successfully!', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to delete task', 'error');
    },
  });
}

// --- Comments Queries & Mutations ---
export function useComments(taskId) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => taskService.getComments(taskId),
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ content, userId }) => taskService.createComment(taskId, content, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      showToast('Comment added!', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to add comment', 'error');
    },
  });
}

export function useDeleteComment(taskId) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (commentId) => taskService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      showToast('Comment deleted!', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to delete comment', 'error');
    },
  });
}

// --- Attachments Queries & Mutations ---
export function useAttachments(taskId) {
  return useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => taskService.getAttachments(taskId),
    enabled: !!taskId,
  });
}

export function useUploadAttachment(taskId, userId) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (file) => taskService.uploadAttachment(taskId, file, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', taskId] });
      showToast('Attachment uploaded successfully!', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to upload attachment', 'error');
    },
  });
}

export function useDeleteAttachment(taskId) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ attachmentId, filePath }) => taskService.deleteAttachment(attachmentId, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', taskId] });
      showToast('Attachment removed!', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to delete attachment', 'error');
    },
  });
}
