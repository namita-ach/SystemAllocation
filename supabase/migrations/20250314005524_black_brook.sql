/*
  # GPU Lab Reservation System Schema

  1. New Tables
    - `systems` - Available GPU systems in the lab
      - `id` (uuid, primary key)
      - `name` (text) - System name/identifier
      - `description` (text) - System specifications
      - `created_at` (timestamp)
    
    - `reservations` - System reservations
      - `id` (uuid, primary key)
      - `system_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `date` (date) - Reservation date
      - `time_slot` (integer) - Time slot number (0-11)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can read all systems
    - Users can only read their own reservations
    - Users can create reservations if slot is available
    - Users can delete their own reservations
*/

-- Create systems table
CREATE TABLE systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create reservations table
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid REFERENCES systems(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  time_slot integer NOT NULL CHECK (time_slot >= 0 AND time_slot < 12),
  created_at timestamptz DEFAULT now(),
  UNIQUE(system_id, date, time_slot)
);

-- Enable RLS
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Systems policies
CREATE POLICY "Anyone can read systems"
  ON systems
  FOR SELECT
  TO authenticated
  USING (true);

-- Reservations policies
CREATE POLICY "Users can read own reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
  ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reservations"
  ON reservations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert some sample systems
INSERT INTO systems (name, description) VALUES
  ('GPU-01', 'NVIDIA RTX 4090, 64GB RAM, AMD Ryzen 9 7950X'),
  ('GPU-02', 'NVIDIA RTX 4090, 64GB RAM, AMD Ryzen 9 7950X'),
  ('GPU-03', 'NVIDIA RTX 4080, 32GB RAM, Intel i9-13900K'),
  ('GPU-04', 'NVIDIA RTX 4080, 32GB RAM, Intel i9-13900K');