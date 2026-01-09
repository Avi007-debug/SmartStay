-- ============================================
-- Q&A (Questions & Answers) Table
-- ============================================
-- This table stores questions asked by users about PG listings
-- and answers provided by property owners

CREATE TABLE IF NOT EXISTS public.qna (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pg_id UUID NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT qna_question_not_empty CHECK (LENGTH(TRIM(question)) > 0),
  CONSTRAINT qna_answer_not_empty CHECK (answer IS NULL OR LENGTH(TRIM(answer)) > 0)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_qna_pg_id ON public.qna(pg_id);
CREATE INDEX IF NOT EXISTS idx_qna_user_id ON public.qna(user_id);
CREATE INDEX IF NOT EXISTS idx_qna_answered_by ON public.qna(answered_by);
CREATE INDEX IF NOT EXISTS idx_qna_created_at ON public.qna(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE public.qna ENABLE ROW LEVEL SECURITY;

-- Anyone can view Q&A for a listing
CREATE POLICY "Anyone can view Q&A"
  ON public.qna
  FOR SELECT
  USING (true);

-- Authenticated users can ask questions
CREATE POLICY "Authenticated users can ask questions"
  ON public.qna
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own questions (only if not answered yet)
CREATE POLICY "Users can update their own unanswered questions"
  ON public.qna
  FOR UPDATE
  USING (auth.uid() = user_id AND answer IS NULL)
  WITH CHECK (auth.uid() = user_id AND answer IS NULL);

-- Users can delete their own unanswered questions
CREATE POLICY "Users can delete their own unanswered questions"
  ON public.qna
  FOR DELETE
  USING (auth.uid() = user_id AND answer IS NULL);

-- Property owners can answer questions on their listings
CREATE POLICY "Property owners can answer questions"
  ON public.qna
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE pg_listings.id = qna.pg_id
      AND pg_listings.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE pg_listings.id = qna.pg_id
      AND pg_listings.owner_id = auth.uid()
    )
    AND answered_by = auth.uid()
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.qna IS 'Stores questions and answers about PG listings';
COMMENT ON COLUMN public.qna.pg_id IS 'Reference to the PG listing';
COMMENT ON COLUMN public.qna.user_id IS 'User who asked the question';
COMMENT ON COLUMN public.qna.question IS 'The question text';
COMMENT ON COLUMN public.qna.answer IS 'The answer text (NULL if unanswered)';
COMMENT ON COLUMN public.qna.answered_by IS 'User who answered (typically the property owner)';
COMMENT ON COLUMN public.qna.created_at IS 'When the question was asked';
COMMENT ON COLUMN public.qna.answered_at IS 'When the question was answered';

-- ============================================
-- TRIGGERS
-- ============================================
-- Auto-set answered_at when answer is provided
CREATE OR REPLACE FUNCTION set_answered_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.answer IS NOT NULL AND OLD.answer IS NULL THEN
    NEW.answered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_answered_at_trigger
  BEFORE UPDATE ON qna
  FOR EACH ROW
  EXECUTE FUNCTION set_answered_at();
