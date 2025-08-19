-- Add branding fields to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS footer_message TEXT;

-- Add PDF URL field to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Create invoices_pdfs storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices_pdfs',
  'invoices_pdfs',
  false,
  5242880, -- 5MB limit
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create business_assets storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business_assets',
  'business_assets',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for invoices_pdfs bucket
CREATE POLICY "Users can view their own invoice PDFs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'invoices_pdfs' AND
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id::text = split_part(name, '_', 2)
    AND invoices.owner_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can upload their own invoice PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'invoices_pdfs' AND
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id::text = split_part(name, '_', 2)
    AND invoices.owner_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can update their own invoice PDFs" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'invoices_pdfs' AND
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id::text = split_part(name, '_', 2)
    AND invoices.owner_id::text = auth.uid()::text
  )
);

CREATE POLICY "Users can delete their own invoice PDFs" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'invoices_pdfs' AND
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id::text = split_part(name, '_', 2)
    AND invoices.owner_id::text = auth.uid()::text
  )
);

-- RLS policies for business_assets bucket
CREATE POLICY "Anyone can view business assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'business_assets');

CREATE POLICY "Users can upload their own business assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'business_assets' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own business assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'business_assets' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own business assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'business_assets' AND
  auth.uid() IS NOT NULL
);