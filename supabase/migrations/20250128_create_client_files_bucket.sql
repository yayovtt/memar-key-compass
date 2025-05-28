
-- Create the client_files_bucket for storing client files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client_files_bucket', 'client_files_bucket', false);
