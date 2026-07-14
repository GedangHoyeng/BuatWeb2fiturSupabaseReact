import { supabase } from '../lib/supabase';

export const taskService = {
  // --- Projects CRUD ---
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createProject(name, description, ownerId) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, description, owner_id: ownerId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(projectId) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    return true;
  },

  // --- Tasks CRUD ---
  async getTasks(projectId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createTask(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select('*, assignee:profiles!tasks_assignee_id_fkey(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(taskId, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select('*, assignee:profiles!tasks_assignee_id_fkey(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTask(taskId) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    return true;
  },

  // --- Profiles (Members) ---
  async getMembers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data;
  },

  // --- Comments CRUD ---
  async getComments(taskId) {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:profiles(id, full_name, avatar_url)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createComment(taskId, content, userId) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, content, user_id: userId })
      .select('*, user:profiles(id, full_name, avatar_url)')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(commentId) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return true;
  },

  // --- Attachments CRUD & Storage ---
  async getAttachments(taskId) {
    const { data, error } = await supabase
      .from('attachments')
      .select('*, uploader:profiles(id, full_name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async uploadAttachment(taskId, file, userId) {
    // 1. Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${taskId}/${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`;
    
    // 2. Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 3. Create attachment record in DB
    const { data, error: dbError } = await supabase
      .from('attachments')
      .insert({
        task_id: taskId,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        uploaded_by: userId
      })
      .select('*, uploader:profiles(id, full_name)')
      .single();

    if (dbError) {
      // Rollback file upload if DB entry fails
      await supabase.storage.from('attachments').remove([fileName]);
      throw dbError;
    }

    return data;
  },

  async deleteAttachment(attachmentId, filePath) {
    // 1. Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([filePath]);

    if (storageError) throw storageError;

    // 2. Delete database entry
    const { error: dbError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) throw dbError;
    return true;
  },

  // Helper to resolve public URL for attachment file paths
  getAttachmentUrl(filePath) {
    const { data } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);
    return data.publicUrl;
  }
};
