-- =====================================================================
-- Fleet Hub — JDL Contractors LTD
-- Supabase schema: tables, security policies, and seed data
-- Run this whole file once in: Supabase Dashboard > SQL Editor > New query
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. VEHICLES — the editable fleet register (Admin tab)
-- ---------------------------------------------------------------------
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_reg text unique not null,
  vehicle_type text,
  service_due date,
  mot_due date,
  current_driver text,
  spare_keys boolean default false,
  lock_type text,              -- 'Disc Lock' / 'Stop Lock' / 'None'
  seat_covers boolean default false,
  first_aid_fire_ext boolean default false,
  tracking_system boolean default false,
  last_vehicle_check date,
  fuel_card boolean default false,
  notes text,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- 2. SAFETY_CHECKS — submissions from the driver weekly check sheet
-- ---------------------------------------------------------------------
create table if not exists safety_checks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  check_date date not null default current_date,
  driver_name text not null,
  vehicle_reg text not null,
  responses jsonb not null default '{}'::jsonb,
  has_defects boolean default false,
  reviewed boolean default false,
  reviewed_by text,
  reviewed_at timestamptz
);

create index if not exists idx_safety_checks_reg on safety_checks (vehicle_reg);
create index if not exists idx_safety_checks_date on safety_checks (check_date desc);

-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
--    - Drivers (no login / "anon" key) can SUBMIT a safety check and
--      look up vehicle regs, but cannot edit the fleet register.
--    - Only signed-in admins (Stephen, Jamie, Craig) can manage the
--      fleet register and view/action submitted checks.
-- ---------------------------------------------------------------------
alter table vehicles enable row level security;
alter table safety_checks enable row level security;

-- Vehicles: anyone can read (needed so the driver form can confirm a
-- van reg exists), only signed-in admins can write.
create policy "Public can view vehicles"
  on vehicles for select
  to anon, authenticated
  using (true);

create policy "Admins can insert vehicles"
  on vehicles for insert
  to authenticated
  with check (true);

create policy "Admins can update vehicles"
  on vehicles for update
  to authenticated
  using (true);

create policy "Admins can delete vehicles"
  on vehicles for delete
  to authenticated
  using (true);

-- Safety checks: anyone can submit (no login for drivers), only
-- signed-in admins can read or manage submissions.
create policy "Anyone can submit a safety check"
  on safety_checks for insert
  to anon, authenticated
  with check (true);

create policy "Admins can view safety checks"
  on safety_checks for select
  to authenticated
  using (true);

create policy "Admins can update safety checks"
  on safety_checks for update
  to authenticated
  using (true);

create policy "Admins can delete safety checks"
  on safety_checks for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- 4. SEED DATA — taken from the uploaded vehicle register photo
--    Some driver names on the original sheet were crossed out /
--    rewritten and not legible — those are left blank below so they
--    show up clearly in the Admin > Vehicle Register tab to be filled in.
-- ---------------------------------------------------------------------
insert into vehicles (vehicle_reg, vehicle_type, service_due, mot_due, current_driver, spare_keys, lock_type, seat_covers, first_aid_fire_ext, tracking_system, last_vehicle_check, fuel_card, notes) values
('J6 YYG',   null,                   null,         null,         null,               true, null,        true, true, true, null,         false, 'Reg only listed on original sheet — details to confirm'),
('AD19 EKX', 'Ford Transit Custom',  '2026-12-11', '2026-12-11', null,               true, 'Disc Lock', true, true, true, null,         false, 'Driver name illegible on original sheet'),
('SN69 KLU', 'Ford Transit Tipper',  '2026-12-07', '2026-12-07', null,               true, 'Disc Lock', true, true, true, null,         false, null),
('BJ70 FPA', 'Ford Transit Connect', '2026-11-30', '2026-11-30', null,               true, 'Disc Lock', true, true, true, null,         false, null),
('NX69 KHR', 'Ford Transit Connect', '2026-11-13', '2026-11-13', null,               true, 'Disc Lock', true, true, true, '2025-09-02', false, null),
('WU67 YLT', 'Ford Transit Luton',   '2026-11-06', '2026-11-06', null,               true, 'Disc Lock', true, true, true, null,         false, 'Driver name illegible on original sheet'),
('NX69 KKN', 'Ford Transit Connect', '2026-11-03', '2026-11-03', null,               true, 'Disc Lock', true, true, true, null,         false, 'Driver name illegible on original sheet'),
('FE67 BKV', 'Ford Transit Custom',  '2026-10-31', '2026-10-31', null,               true, 'Disc Lock', true, true, true, '2025-11-17', false, 'Driver name illegible on original sheet'),
('CV13 BLJ', 'Ford Fiesta',          '2026-10-01', '2026-10-01', 'Connor Pedley',    true, 'Stop Lock', true, true, true, null,         false, null),
('FD05 JWW', 'Vauxhall Astra',       '2026-09-30', '2026-09-30', 'Dan Newman',       true, null,        true, true, true, '2025-09-02', false, null),
('FL69 LCT', 'Ford Transit Tipper',  '2026-09-01', '2026-09-01', null,               true, 'Stop Lock', true, true, true, '2025-08-27', false, 'Driver name illegible on original sheet'),
('MX60 GWG', 'Ford Transit Connect', '2026-09-03', '2026-07-29', null,               true, 'Stop Lock', true, true, true, '2025-08-27', false, null),
('AK17 YEB', 'Ford Transit Custom',  '2026-06-25', '2026-06-25', 'Matthew Coleman',  true, 'Disc Lock', true, true, true, null,         false, null),
('BK15 TEU', 'Ford Transit Luton',   '2026-05-07', '2026-05-07', null,               true, 'Disc Lock', true, true, true, '2025-11-17', false, 'Driver name illegible on original sheet'),
('YG68 TSY', 'Ford Transit Courier', '2026-04-24', '2026-04-24', null,               true, 'Disc Lock', true, true, true, '2025-11-17', false, null),
('VX60 LSO', 'Ford Transit Connect', '2026-04-23', '2026-04-23', null,               true, 'Stop Lock', true, true, true, null,         false, null),
('BN17 OLH', 'Ford Transit Connect', '2026-04-05', '2026-04-05', null,               true, 'Disc Lock', true, true, true, null,         false, 'Driver name illegible on original sheet'),
('EA61 KOE', 'Ford Fiesta',          '2026-03-05', '2026-03-05', null,               true, 'Stop Lock', true, true, true, '2025-08-28', false, 'Driver name illegible on original sheet'),
('BX19 OZU', 'Ford Transit Courier', '2026-03-02', '2026-03-02', null,               true, 'Disc Lock', true, true, true, '2025-08-27', false, null),
('BP19 ELW', 'Ford Transit Courier', '2026-02-20', '2026-02-20', null,               true, 'Disc Lock', true, true, true, null,         false, null),
('HT18 ZRN', 'Ford Transit Courier', '2026-02-20', '2026-02-20', null,               true, 'Disc Lock', true, true, true, '2025-08-28', false, null),
('YH64 UVU', 'Ford Fiesta',          '2026-02-19', '2026-02-19', 'Matt Green',       true, 'Stop Lock', true, true, true, '2025-08-29', false, null),
('NG14 PZV', 'Ford Fiesta',          '2027-02-18', '2027-02-18', 'Daniel Wilkes',    true, 'Disc Lock', true, true, true, null,         false, null),
('SK70 SVA', 'Ford Transit Connect', '2027-01-18', '2027-01-18', 'Craig Jackson',    true, 'Disc Lock', true, true, true, null,         false, null),
('BL21 LSC', 'Ford Transit Connect', '2027-01-15', '2027-01-15', 'Ben Langslow',     true, 'Disc Lock', true, true, true, null,         false, null)
on conflict (vehicle_reg) do nothing;

-- A couple of vehicles noted by hand at the top of the original sheet
-- (new keys / new vans) — added as drafts, flagged for you to verify.
insert into vehicles (vehicle_reg, vehicle_type, notes) values
('YC20 EZY', 'Ford Transit Connect', 'Added from handwritten note on original sheet — please verify details'),
('HK20 JOU', 'Ford Transit Custom',  'Added from handwritten note on original sheet — please verify details')
on conflict (vehicle_reg) do nothing;
