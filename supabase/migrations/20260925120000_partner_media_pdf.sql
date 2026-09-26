-- Allow plan brochure PDFs in the public partner-media bucket (site/ prefix in app).
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','application/pdf']
where id = 'partner-media';
