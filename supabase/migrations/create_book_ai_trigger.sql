-- Enable the pg_net extension for HTTP requests (if not already enabled)
create extension if not exists pg_net with schema extensions;

-- Create function to trigger AI processing
create or replace function trigger_book_ai_processing()
returns trigger
language plpgsql
security definer
as $$
declare
  service_role_key text;
  supabase_url text;
  request_id bigint;
begin
  -- Only process when book is uploaded but not yet analyzed
  if (NEW.processing_status = 'uploaded' AND (OLD.processing_status IS NULL OR OLD.processing_status != 'uploaded')) then
    
    -- Get service role key and URL from vault/config
    -- Note: These should be set as environment variables in Supabase
    service_role_key := current_setting('app.settings.service_role_key', true);
    supabase_url := current_setting('app.settings.supabase_url', true);
    
    -- If not set in config, use hardcoded values (for development only)
    if service_role_key is null then
      service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ3R4ZWptb2Vnd2RwdGNpc3FnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQwMDg1NSwiZXhwIjoyMDc2OTc2ODU1fQ.Vu6l5BOoPEWWHEHXDv_64XTNNbw2A9AC4LIgeR3-vXs';
    end if;
    
    if supabase_url is null then
      supabase_url := 'https://mcgtxejmoegwdptcisqg.supabase.co';
    end if;
    
    -- Update status to 'processing' immediately
    NEW.processing_status := 'analyzing';
    
    -- Make async HTTP request to process-book-ai edge function
    -- Note: This is fire-and-forget, the edge function will update the book status
    select net.http_post(
      url := supabase_url || '/functions/v1/process-book-ai',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'bookId', NEW.id::text,
        'fileUrl', NEW.file_url
      ),
      timeout_milliseconds := 300000 -- 5 minutes timeout
    ) into request_id;
    
    raise notice 'Triggered AI processing for book %, request_id: %', NEW.id, request_id;
  end if;
  
  return NEW;
end;
$$;

-- Drop trigger if exists
drop trigger if exists on_book_upload_trigger on books;

-- Create trigger on books table
create trigger on_book_upload_trigger
  before insert or update on books
  for each row
  execute function trigger_book_ai_processing();

-- Grant necessary permissions
grant usage on schema net to postgres, anon, authenticated, service_role;

-- Add comment
comment on function trigger_book_ai_processing is 'Automatically triggers AI processing when a book is uploaded';
