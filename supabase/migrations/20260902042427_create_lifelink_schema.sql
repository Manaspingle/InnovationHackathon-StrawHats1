/*
# LifeLink Database Schema

Creates the complete schema for the LifeLink Blood & Organ Donor Network platform.

## Tables Created
- `profiles` - User role information (individual or hospital), linked to auth.users
- `donors` - Individual donor profiles with blood group, pledged organs, gamification data, location
- `hospitals` - Hospital profiles with location, contact info, and mock inventory
- `requests` - Emergency blood/organ requests from hospitals with urgency and status tracking
- `allocations` - Matched donor-request pairs with SHA-256 verification hashes for transparency
- `donations` - Blood donation and organ pledge logs for gamification point tracking
- `notifications` - User notification feed (match alerts, badge unlocks, level-ups)
- `transfers` - Cross-hospital organ/blood transfer requests

## Security
- RLS enabled on all tables
- SELECT policies: authenticated users can read shared platform data (donors, hospitals, requests, allocations, donations, transfers)
- INSERT/UPDATE/DELETE: ownership enforced via auth.uid() checks
- Notifications are private — only the owning donor can read their own notifications
- Hospital-scoped tables (requests, allocations) check ownership through the hospitals table join

## Indexes
- Indexes on city, blood_group, user_id, hospital_id, donor_id, and status for query performance
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles table: stores user role (individual or hospital)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('individual', 'hospital')),
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Donors table: individual donor profiles
CREATE TABLE IF NOT EXISTS donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  age int,
  blood_group text NOT NULL,
  city text NOT NULL,
  phone text,
  organs text[] DEFAULT '{}',
  emergency_contact text,
  consent boolean DEFAULT false,
  available boolean DEFAULT true,
  donor_level text DEFAULT 'Bronze',
  donor_points int DEFAULT 0,
  blood_donations int DEFAULT 0,
  medical_allergies text DEFAULT '',
  medical_conditions text DEFAULT '',
  lat float8 DEFAULT 0,
  lng float8 DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Hospitals table: hospital profiles
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  hospital_name text NOT NULL,
  registration_id text,
  city text NOT NULL,
  address text,
  contact_person text,
  phone text,
  verified boolean DEFAULT false,
  lat float8 DEFAULT 0,
  lng float8 DEFAULT 0,
  inventory jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Requests table: emergency blood/organ requests
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('blood', 'organ')),
  specific_type text NOT NULL,
  urgency text NOT NULL CHECK (urgency IN ('Critical', 'High', 'Moderate')),
  patient_age int,
  patient_city text NOT NULL,
  required_by timestamptz,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Matched', 'Dispatched', 'Completed', 'Cancelled')),
  matched_donor_id uuid REFERENCES donors(id),
  match_score float8,
  created_at timestamptz DEFAULT now()
);

-- Allocations table: matched donor-request pairs with verification hashes
CREATE TABLE IF NOT EXISTS allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  donor_id uuid REFERENCES donors(id) ON DELETE CASCADE,
  score float8 NOT NULL,
  verification_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Donations table: blood donation and organ pledge logs
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES donors(id) ON DELETE CASCADE,
  donation_type text NOT NULL CHECK (donation_type IN ('blood', 'organ_pledge')),
  donation_date date NOT NULL,
  points_earned int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Notifications table: user notification feed
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES donors(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Transfers table: cross-hospital transfer requests
CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  to_hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  organ_type text,
  blood_type text,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Profiles policies (owner-scoped)
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Donors policies (shared read, owner write)
DROP POLICY IF EXISTS "select_donors" ON donors;
CREATE POLICY "select_donors" ON donors FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_donor" ON donors;
CREATE POLICY "insert_own_donor" ON donors FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_donor" ON donors;
CREATE POLICY "update_own_donor" ON donors FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_donor" ON donors;
CREATE POLICY "delete_own_donor" ON donors FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Hospitals policies (shared read, owner write)
DROP POLICY IF EXISTS "select_hospitals" ON hospitals;
CREATE POLICY "select_hospitals" ON hospitals FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_hospital" ON hospitals;
CREATE POLICY "insert_own_hospital" ON hospitals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_hospital" ON hospitals;
CREATE POLICY "update_own_hospital" ON hospitals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_hospital" ON hospitals;
CREATE POLICY "delete_own_hospital" ON hospitals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Requests policies (shared read, hospital-owner write)
DROP POLICY IF EXISTS "select_requests" ON requests;
CREATE POLICY "select_requests" ON requests FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_requests" ON requests;
CREATE POLICY "insert_own_requests" ON requests FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM hospitals WHERE hospitals.id = requests.hospital_id AND hospitals.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_requests" ON requests;
CREATE POLICY "update_own_requests" ON requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM hospitals WHERE hospitals.id = requests.hospital_id AND hospitals.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM hospitals WHERE hospitals.id = requests.hospital_id AND hospitals.user_id = auth.uid())
  );

-- Allocations policies (shared read, hospital-owner insert)
DROP POLICY IF EXISTS "select_allocations" ON allocations;
CREATE POLICY "select_allocations" ON allocations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_allocations" ON allocations;
CREATE POLICY "insert_own_allocations" ON allocations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests r
      JOIN hospitals h ON h.id = r.hospital_id
      WHERE r.id = allocations.request_id AND h.user_id = auth.uid()
    )
  );

-- Donations policies (shared read, donor-owner insert)
DROP POLICY IF EXISTS "select_donations" ON donations;
CREATE POLICY "select_donations" ON donations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_donations" ON donations;
CREATE POLICY "insert_own_donations" ON donations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM donors WHERE donors.id = donations.donor_id AND donors.user_id = auth.uid())
  );

-- Notifications policies (private, donor-owner only)
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM donors WHERE donors.id = notifications.donor_id AND donors.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM donors WHERE donors.id = notifications.donor_id AND donors.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM donors WHERE donors.id = notifications.donor_id AND donors.user_id = auth.uid())
  );

-- Transfers policies (shared read, hospital-owner insert)
DROP POLICY IF EXISTS "select_transfers" ON transfers;
CREATE POLICY "select_transfers" ON transfers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_transfers" ON transfers;
CREATE POLICY "insert_own_transfers" ON transfers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM hospitals WHERE hospitals.id = transfers.from_hospital_id AND hospitals.user_id = auth.uid())
  );

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_donors_city ON donors(city);
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_user_id ON donors(user_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_city ON hospitals(city);
CREATE INDEX IF NOT EXISTS idx_hospitals_user_id ON hospitals(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_hospital_id ON requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_allocations_request_id ON allocations(request_id);
CREATE INDEX IF NOT EXISTS idx_allocations_donor_id ON allocations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_donor_id ON notifications(donor_id);