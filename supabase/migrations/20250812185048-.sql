-- Add client_id column to tasks table to enable direct client-task relationships
ALTER TABLE tasks ADD COLUMN client_id UUID REFERENCES clients(id);