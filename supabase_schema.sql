-- SQL Schema for SupaFlow Task & Project Management SaaS

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON public.attachments(task_id);

-- RLS Policies
-- Profiles: Users can view all profiles, but can only update their own.
DROP POLICY IF EXISTS "Profiles are viewable by anyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by anyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: Users can view, create, update, and delete projects that they own.
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = owner_id);

-- Tasks: Users can read and write tasks for projects they own.
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON public.tasks;
CREATE POLICY "Users can view tasks in their projects" ON public.tasks FOR SELECT USING (
  exists (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert tasks in their projects" ON public.tasks;
CREATE POLICY "Users can insert tasks in their projects" ON public.tasks FOR INSERT WITH CHECK (
  exists (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update tasks in their projects" ON public.tasks;
CREATE POLICY "Users can update tasks in their projects" ON public.tasks FOR UPDATE USING (
  exists (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete tasks in their projects" ON public.tasks;
CREATE POLICY "Users can delete tasks in their projects" ON public.tasks FOR DELETE USING (
  exists (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.owner_id = auth.uid())
);

-- Comments: Users can comment on tasks in their projects.
DROP POLICY IF EXISTS "Users can view comments for tasks in their projects" ON public.comments;
CREATE POLICY "Users can view comments for tasks in their projects" ON public.comments FOR SELECT USING (
  exists (
    SELECT 1 FROM public.tasks
    JOIN public.projects ON projects.id = tasks.project_id
    WHERE tasks.id = comments.task_id AND projects.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert comments for tasks in their projects" ON public.comments;
CREATE POLICY "Users can insert comments for tasks in their projects" ON public.comments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND exists (
    SELECT 1 FROM public.tasks
    JOIN public.projects ON projects.id = tasks.project_id
    WHERE tasks.id = comments.task_id AND projects.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Attachments: Users can manage attachments on tasks.
DROP POLICY IF EXISTS "Users can view attachments for tasks in their projects" ON public.attachments;
CREATE POLICY "Users can view attachments for tasks in their projects" ON public.attachments FOR SELECT USING (
  exists (
    SELECT 1 FROM public.tasks
    JOIN public.projects ON projects.id = tasks.project_id
    WHERE tasks.id = attachments.task_id AND projects.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert attachments for tasks in their projects" ON public.attachments;
CREATE POLICY "Users can insert attachments for tasks in their projects" ON public.attachments FOR INSERT WITH CHECK (
  auth.uid() = uploaded_by AND exists (
    SELECT 1 FROM public.tasks
    JOIN public.projects ON projects.id = tasks.project_id
    WHERE tasks.id = attachments.task_id AND projects.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete attachments they uploaded" ON public.attachments;
CREATE POLICY "Users can delete attachments they uploaded" ON public.attachments FOR DELETE USING (auth.uid() = uploaded_by);

-- Profile Trigger: Automatically create public profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    'Member'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Allow uploads to attachments bucket" ON storage.objects;
CREATE POLICY "Allow uploads to attachments bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' 
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Allow public read from attachments bucket" ON storage.objects;
CREATE POLICY "Allow public read from attachments bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Allow owners to delete attachments" ON storage.objects;
CREATE POLICY "Allow owners to delete attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments'
  AND auth.uid()::text = owner::text
);
