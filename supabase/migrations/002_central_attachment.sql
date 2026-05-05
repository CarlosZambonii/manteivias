-- Add attachment support to central table
ALTER TABLE central ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Allow uploads to ticket-attachments'
    AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow uploads to ticket-attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'ticket-attachments');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Allow public read of ticket-attachments'
    AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow public read of ticket-attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ticket-attachments');
  END IF;
END $$;
