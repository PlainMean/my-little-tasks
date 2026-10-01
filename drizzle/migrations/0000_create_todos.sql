CREATE TYPE public.todo_status AS ENUM ('inbox','active','done');
CREATE TABLE public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  status public.todo_status NOT NULL DEFAULT 'inbox',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todos TO authenticated;
GRANT ALL ON public.todos TO service_role;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.todos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.todos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.todos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.todos FOR DELETE TO authenticated USING (auth.uid() = user_id);