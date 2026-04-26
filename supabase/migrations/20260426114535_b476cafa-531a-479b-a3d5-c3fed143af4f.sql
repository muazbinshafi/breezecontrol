-- Gesture profiles: per-user named sets of gesture settings synced to the cloud.
CREATE TABLE public.gesture_profiles (
  id UUID NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gesture_profiles_user_id ON public.gesture_profiles(user_id);

ALTER TABLE public.gesture_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gesture profiles"
  ON public.gesture_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gesture profiles"
  ON public.gesture_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gesture profiles"
  ON public.gesture_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gesture profiles"
  ON public.gesture_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Reusable timestamp-update function (idempotent).
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_gesture_profiles_updated_at
BEFORE UPDATE ON public.gesture_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();