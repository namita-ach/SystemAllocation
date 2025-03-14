/*
  # Update GPU system names

  1. Changes
    - Updates existing system names to use simple GPU 1-8 naming
    - Ensures exactly 8 GPUs are available
*/

-- First, delete all existing systems
DELETE FROM systems;

-- Insert 8 GPUs with simple names
INSERT INTO systems (name, description) VALUES
  ('GPU 1', 'GPU System 1'),
  ('GPU 2', 'GPU System 2'),
  ('GPU 3', 'GPU System 3'),
  ('GPU 4', 'GPU System 4'),
  ('GPU 5', 'GPU System 5'),
  ('GPU 6', 'GPU System 6'),
  ('GPU 7', 'GPU System 7'),
  ('GPU 8', 'GPU System 8');