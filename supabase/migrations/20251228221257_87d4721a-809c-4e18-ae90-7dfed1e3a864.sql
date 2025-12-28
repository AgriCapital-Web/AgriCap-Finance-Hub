-- Add notifications table for user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notification policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Add onboarding_status table to track setup progress
CREATE TABLE IF NOT EXISTS public.onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_completed TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  completed_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.onboarding_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage onboarding"
  ON public.onboarding_status FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "All users can view onboarding"
  ON public.onboarding_status FOR SELECT
  USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.validations;