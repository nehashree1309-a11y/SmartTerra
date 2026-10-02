create schema if not exists extensions;

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.app_role as enum ('citizen', 'surveyor', 'officer', 'admin');
create type public.ownership_transfer_type as enum ('original', 'sale', 'inheritance', 'gift', 'court_order');
create type public.application_stage as enum (
  'submitted',
  'document_check',
  'field_verification',
  'officer_review',
  'approved',
  'rejected'
);

create sequence public.certificate_number_seq;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  district text,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now()
);

create table public.parcels (
  id uuid primary key default gen_random_uuid(),
  survey_no text not null,
  sub_division text,
  village text not null,
  taluk text not null,
  district text not null,
  area_sqm numeric(14, 2),
  land_type text,
  owner_id uuid references auth.users (id) on delete set null,
  owner_name text not null,
  status text not null check (status in ('verified', 'pending', 'disputed', 'under_review')),
  fraud_score integer not null default 0 check (fraud_score between 0 and 100),
  parcel_locked boolean not null default false,
  geojson jsonb,
  geom extensions.geometry(Polygon, 4326),
  created_at timestamptz not null default now()
);

create index parcels_geom_gist_idx on public.parcels using gist (geom);
create index parcels_survey_no_idx on public.parcels using btree (survey_no);
create index parcels_owner_name_trgm_idx on public.parcels using gin (owner_name extensions.gin_trgm_ops);
create index parcels_village_trgm_idx on public.parcels using gin (village extensions.gin_trgm_ops);

create table public.ownership_history (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.parcels (id) on delete cascade,
  owner_name text not null,
  transfer_type public.ownership_transfer_type not null,
  from_year integer,
  to_year integer,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.parcels (id) on delete cascade,
  doc_type text not null,
  storage_path text not null,
  file_hash text,
  language text,
  extracted jsonb not null default '{}'::jsonb,
  authenticity_score integer check (authenticity_score between 0 and 100),
  authenticity_flags jsonb not null default '[]'::jsonb,
  verified boolean not null default false,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.encumbrances (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.parcels (id) on delete cascade,
  kind text not null check (kind in ('mortgage', 'litigation', 'acquisition')),
  details jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.tax_records (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.parcels (id) on delete cascade,
  year integer not null,
  amount numeric(14, 2) not null check (amount >= 0),
  paid boolean not null default false,
  paid_on date,
  created_at timestamptz not null default now(),
  unique (parcel_id, year)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references auth.users (id) on delete cascade,
  parcel_id uuid not null references public.parcels (id) on delete cascade,
  app_type text not null check (app_type in ('verification', 'mutation', 'certificate')),
  stage public.application_stage not null default 'submitted',
  current_desk text,
  sla_due date,
  priority text not null default 'normal',
  created_at timestamptz not null default now()
);

create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  stage public.application_stage not null,
  note text,
  actor uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_no text not null unique default (
    'ST-' || to_char(current_timestamp, 'YYYY') || '-' ||
    lpad(nextval('public.certificate_number_seq')::text, 6, '0')
  ),
  parcel_id uuid not null references public.parcels (id) on delete restrict,
  file_hash text not null,
  issued_by uuid references auth.users (id) on delete set null,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  parcel_id uuid references public.parcels (id) on delete cascade,
  kind text not null check (kind in ('search', 'transfer_request', 'objection', 'tax_due', 'dispute')),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.field_verifications (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.parcels (id) on delete cascade,
  surveyor_id uuid not null references auth.users (id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  inside_boundary boolean not null,
  photo_path text,
  detected_land_use text,
  matches_recorded boolean,
  ai_notes text,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.audit_ledger (
  id bigint generated always as identity primary key,
  table_name text not null,
  action text not null,
  record jsonb not null,
  actor uuid,
  previous_hash text not null,
  current_hash text not null,
  created_at timestamptz not null default now()
);

create function public.set_parcel_geom_from_geojson()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  if new.geojson is null then
    new.geom := null;
  else
    new.geom := extensions.st_setsrid(
      extensions.st_geomfromgeojson(new.geojson::text),
      4326
    );
  end if;
  return new;
end;
$$;

create trigger parcels_sync_geom
before insert or update on public.parcels
for each row execute function public.set_parcel_geom_from_geojson();

create function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = _role
  );
$$;

create function public.get_my_district()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select ur.district
  from public.user_roles ur
  where ur.user_id = auth.uid()
    and ur.role in ('officer'::public.app_role, 'admin'::public.app_role)
    and ur.district is not null
  order by case when ur.role = 'officer'::public.app_role then 0 else 1 end
  limit 1;
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'citizen'::public.app_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
 after insert on auth.users
 for each row execute function public.handle_new_user();

create function public.append_ledger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, auth
as $$
declare
  v_record jsonb;
  v_previous_hash text;
  v_created_at timestamptz := clock_timestamp();
  v_action text := tg_op;
begin
  perform pg_advisory_xact_lock(72650421, 1);

  select al.current_hash
  into v_previous_hash
  from public.audit_ledger al
  order by al.id desc
  limit 1;

  v_previous_hash := coalesce(v_previous_hash, 'GENESIS');
  v_record := to_jsonb(case when tg_op = 'DELETE' then old else new end);

  insert into public.audit_ledger (
    table_name,
    action,
    record,
    actor,
    previous_hash,
    current_hash,
    created_at
  )
  values (
    tg_table_name,
    v_action,
    v_record,
    auth.uid(),
    v_previous_hash,
    encode(
      extensions.digest(
        convert_to(
          jsonb_build_array(v_previous_hash, tg_table_name, v_action, v_record, v_created_at)::text,
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    ),
    v_created_at
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger parcels_append_ledger
 after insert or update on public.parcels
 for each row execute function public.append_ledger();
create trigger ownership_history_append_ledger
 after insert or update on public.ownership_history
 for each row execute function public.append_ledger();
create trigger documents_append_ledger
 after insert or update on public.documents
 for each row execute function public.append_ledger();
create trigger applications_append_ledger
 after insert or update on public.applications
 for each row execute function public.append_ledger();
create trigger certificates_append_ledger
 after insert or update on public.certificates
 for each row execute function public.append_ledger();

create function public.verify_ledger()
returns bigint
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions, auth
as $$
declare
  v_entry record;
  v_previous_hash text := 'GENESIS';
  v_expected_hash text;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin role required' using errcode = '42501';
  end if;

  for v_entry in
    select al.id, al.table_name, al.action, al.record, al.created_at,
           al.previous_hash, al.current_hash
    from public.audit_ledger al
    order by al.id
  loop
    if v_entry.previous_hash <> v_previous_hash then
      return v_entry.id;
    end if;

    v_expected_hash := encode(
      extensions.digest(
        convert_to(
          jsonb_build_array(
            v_previous_hash,
            v_entry.table_name,
            v_entry.action,
            v_entry.record,
            v_entry.created_at
          )::text,
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    );

    if v_entry.current_hash <> v_expected_hash then
      return v_entry.id;
    end if;
    v_previous_hash := v_entry.current_hash;
  end loop;

  return null;
end;
$$;

create function public.search_parcels(q text)
returns setof public.parcels
language sql
stable
set search_path = pg_catalog, public, extensions
as $$
  select p.*
  from public.parcels p
  where nullif(btrim(q), '') is not null
    and (
      p.survey_no ilike '%' || btrim(q) || '%'
      or concat_ws('/', p.survey_no, p.sub_division) ilike '%' || btrim(q) || '%'
      or p.owner_name ilike '%' || btrim(q) || '%'
      or p.village ilike '%' || btrim(q) || '%'
      or extensions.similarity(p.owner_name, btrim(q)) >= 0.2
      or extensions.similarity(p.village, btrim(q)) >= 0.2
    )
  order by
    case
      when concat_ws('/', p.survey_no, p.sub_division) ilike btrim(q) then 0
      when p.survey_no ilike btrim(q) then 1
      when p.owner_name ilike btrim(q) then 2
      when p.village ilike btrim(q) then 3
      else 4
    end,
    greatest(
      extensions.similarity(p.owner_name, btrim(q)),
      extensions.similarity(p.village, btrim(q))
    ) desc,
    p.survey_no,
    p.sub_division;
$$;

create function public.find_overlaps(p_parcel_id uuid)
returns table (
  parcel_id uuid,
  survey_no text,
  sub_division text,
  village text,
  overlap_area_sqm double precision
)
language sql
stable
set search_path = pg_catalog, public, extensions
as $$
  select other.id,
         other.survey_no,
         other.sub_division,
         other.village,
         extensions.st_area(
           extensions.st_intersection(target.geom, other.geom)::extensions.geography
         ) as overlap_area_sqm
  from public.parcels target
  join public.parcels other
    on other.id <> target.id
   and other.geom is not null
   and extensions.st_intersects(target.geom, other.geom)
  where target.id = p_parcel_id
    and target.geom is not null
    and extensions.st_area(
      extensions.st_intersection(target.geom, other.geom)::extensions.geography
    ) > 0;
$$;

create function public.parcel_in_boundary(p_parcel_id uuid, lat double precision, lng double precision)
returns boolean
language sql
stable
set search_path = pg_catalog, public, extensions
as $$
  select coalesce(
    (
      select extensions.st_contains(
        p.geom,
        extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)
      )
      from public.parcels p
      where p.id = p_parcel_id
        and p.geom is not null
    ),
    false
  );
$$;

revoke all on sequence public.certificate_number_seq from public, anon, authenticated;
grant usage, select on sequence public.certificate_number_seq to service_role;

grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated, service_role;
grant execute on function public.get_my_district() to authenticated, service_role;
grant execute on function public.verify_ledger() to authenticated, service_role;
grant execute on function public.search_parcels(text) to anon, authenticated, service_role;
grant execute on function public.find_overlaps(uuid) to anon, authenticated, service_role;
grant execute on function public.parcel_in_boundary(uuid, double precision, double precision) to anon, authenticated, service_role;
