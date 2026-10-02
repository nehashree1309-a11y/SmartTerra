alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.parcels enable row level security;
alter table public.ownership_history enable row level security;
alter table public.documents enable row level security;
alter table public.encumbrances enable row level security;
alter table public.tax_records enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.certificates enable row level security;
alter table public.alerts enable row level security;
alter table public.field_verifications enable row level security;
alter table public.audit_ledger enable row level security;

revoke all on table public.user_roles from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.parcels from anon, authenticated;
revoke all on table public.ownership_history from anon, authenticated;
revoke all on table public.documents from anon, authenticated;
revoke all on table public.encumbrances from anon, authenticated;
revoke all on table public.tax_records from anon, authenticated;
revoke all on table public.applications from anon, authenticated;
revoke all on table public.application_events from anon, authenticated;
revoke all on table public.certificates from anon, authenticated;
revoke all on table public.alerts from anon, authenticated;
revoke all on table public.field_verifications from anon, authenticated;
revoke all on table public.audit_ledger from anon, authenticated;

-- Users can read only their own role assignments; role changes stay on trusted server paths.
create policy user_roles_read_own
on public.user_roles for select to authenticated
using (user_id = (select auth.uid()));

-- A user can read their own profile.
create policy profiles_read_own
on public.profiles for select to authenticated
using (id = (select auth.uid()));

-- A user can create only their own profile.
create policy profiles_insert_own
on public.profiles for insert to authenticated
with check (id = (select auth.uid()));

-- A user can update only their own profile.
create policy profiles_update_own
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Parcel records are publicly readable.
create policy parcels_public_read
on public.parcels for select to anon, authenticated
using (true);

-- Officers can create parcels in their assigned district; admins can create parcels anywhere.
create policy parcels_officer_admin_insert
on public.parcels for insert to authenticated
with check (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or (
    public.has_role((select auth.uid()), 'officer'::public.app_role)
    and district = (select public.get_my_district())
  )
);

-- Officers can update parcels in their assigned district; admins can update any parcel.
create policy parcels_officer_admin_update
on public.parcels for update to authenticated
using (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or (
    public.has_role((select auth.uid()), 'officer'::public.app_role)
    and district = (select public.get_my_district())
  )
)
with check (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or (
    public.has_role((select auth.uid()), 'officer'::public.app_role)
    and district = (select public.get_my_district())
  )
);

-- Officers can delete parcels in their assigned district; admins can delete any parcel.
create policy parcels_officer_admin_delete
on public.parcels for delete to authenticated
using (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or (
    public.has_role((select auth.uid()), 'officer'::public.app_role)
    and district = (select public.get_my_district())
  )
);

-- Ownership history is publicly readable.
create policy ownership_history_public_read
on public.ownership_history for select to anon, authenticated
using (true);

-- Officers manage ownership history only for parcels in their district; admins manage all.
create policy ownership_history_officer_admin_manage
on public.ownership_history for all to authenticated
using (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or (
    public.has_role((select auth.uid()), 'officer'::public.app_role)
    and exists (
      select 1 from public.parcels p
      where p.id = ownership_history.parcel_id
        and p.district = (select public.get_my_district())
    )
  )
)
with check (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or (
    public.has_role((select auth.uid()), 'officer'::public.app_role)
    and exists (
      select 1 from public.parcels p
      where p.id = ownership_history.parcel_id
        and p.district = (select public.get_my_district())
    )
  )
);

-- Public users can read only verified documents.
create policy documents_public_read_verified
on public.documents for select to anon, authenticated
using (verified = true);

-- Uploaders can read their own documents, including unverified uploads.
create policy documents_uploader_read_own
on public.documents for select to authenticated
using (uploaded_by = (select auth.uid()));

-- Officers and admins can read every document for review.
create policy documents_officer_admin_read_all
on public.documents for select to authenticated
using (
  public.has_role((select auth.uid()), 'officer'::public.app_role)
  or public.has_role((select auth.uid()), 'admin'::public.app_role)
);

-- Authenticated users can insert documents only as themselves.
create policy documents_insert_as_uploader
on public.documents for insert to authenticated
with check (uploaded_by = (select auth.uid()));

-- Encumbrances are publicly readable.
create policy encumbrances_public_read
on public.encumbrances for select to anon, authenticated
using (true);

-- Officers manage encumbrances only for parcels in their district; admins manage all.
create policy encumbrances_officer_admin_manage
on public.encumbrances for all to authenticated
using (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or (
    public.has_role((select auth.uid()), 'officer'::public.app_role)
    and exists (
      select 1 from public.parcels p
      where p.id = encumbrances.parcel_id
        and p.district = (select public.get_my_district())
    )
  )
)
with check (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or (
    public.has_role((select auth.uid()), 'officer'::public.app_role)
    and exists (
      select 1 from public.parcels p
      where p.id = encumbrances.parcel_id
        and p.district = (select public.get_my_district())
    )
  )
);

-- Tax records are publicly readable.
create policy tax_records_public_read
on public.tax_records for select to anon, authenticated
using (true);

-- Officers manage tax records only for parcels in their district; admins manage all.
create policy tax_records_officer_admin_manage
on public.tax_records for all to authenticated
using (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or (
    public.has_role((select auth.uid()), 'officer'::public.app_role)
    and exists (
      select 1 from public.parcels p
      where p.id = tax_records.parcel_id
        and p.district = (select public.get_my_district())
    )
  )
)
with check (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  or (
    public.has_role((select auth.uid()), 'officer'::public.app_role)
    and exists (
      select 1 from public.parcels p
      where p.id = tax_records.parcel_id
        and p.district = (select public.get_my_district())
    )
  )
);

-- Citizens can read only their own applications.
create policy applications_citizen_read_own
on public.applications for select to authenticated
using (
  applicant_id = (select auth.uid())
  and public.has_role((select auth.uid()), 'citizen'::public.app_role)
);

-- Citizens can submit applications only for themselves.
create policy applications_citizen_insert_own
on public.applications for insert to authenticated
with check (
  applicant_id = (select auth.uid())
  and public.has_role((select auth.uid()), 'citizen'::public.app_role)
);

-- Officers can read applications for parcels in their assigned district.
create policy applications_officer_read_district
on public.applications for select to authenticated
using (
  public.has_role((select auth.uid()), 'officer'::public.app_role)
  and exists (
    select 1 from public.parcels p
    where p.id = applications.parcel_id
      and p.district = (select public.get_my_district())
  )
);

-- Officers can update applications for parcels in their assigned district.
create policy applications_officer_update_district
on public.applications for update to authenticated
using (
  public.has_role((select auth.uid()), 'officer'::public.app_role)
  and exists (
    select 1 from public.parcels p
    where p.id = applications.parcel_id
      and p.district = (select public.get_my_district())
  )
)
with check (
  public.has_role((select auth.uid()), 'officer'::public.app_role)
  and exists (
    select 1 from public.parcels p
    where p.id = applications.parcel_id
      and p.district = (select public.get_my_district())
  )
);

-- Admins can manage applications across all districts.
create policy applications_admin_manage_all
on public.applications for all to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role))
with check (public.has_role((select auth.uid()), 'admin'::public.app_role));

-- Citizens can read events belonging to their own applications.
create policy application_events_citizen_read_own
on public.application_events for select to authenticated
using (
  public.has_role((select auth.uid()), 'citizen'::public.app_role)
  and exists (
    select 1 from public.applications a
    where a.id = application_events.application_id
      and a.applicant_id = (select auth.uid())
  )
);

-- Citizens can add events only to their own applications and as themselves.
create policy application_events_citizen_insert_own
on public.application_events for insert to authenticated
with check (
  actor = (select auth.uid())
  and public.has_role((select auth.uid()), 'citizen'::public.app_role)
  and exists (
    select 1 from public.applications a
    where a.id = application_events.application_id
      and a.applicant_id = (select auth.uid())
  )
);

-- Officers can read events for applications in their assigned district.
create policy application_events_officer_read_district
on public.application_events for select to authenticated
using (
  public.has_role((select auth.uid()), 'officer'::public.app_role)
  and exists (
    select 1
    from public.applications a
    join public.parcels p on p.id = a.parcel_id
    where a.id = application_events.application_id
      and p.district = (select public.get_my_district())
  )
);

-- Officers can update events for applications in their assigned district.
create policy application_events_officer_update_district
on public.application_events for update to authenticated
using (
  public.has_role((select auth.uid()), 'officer'::public.app_role)
  and exists (
    select 1
    from public.applications a
    join public.parcels p on p.id = a.parcel_id
    where a.id = application_events.application_id
      and p.district = (select public.get_my_district())
  )
)
with check (
  public.has_role((select auth.uid()), 'officer'::public.app_role)
  and exists (
    select 1
    from public.applications a
    join public.parcels p on p.id = a.parcel_id
    where a.id = application_events.application_id
      and p.district = (select public.get_my_district())
  )
);

-- Admins can manage all application events.
create policy application_events_admin_manage_all
on public.application_events for all to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role))
with check (public.has_role((select auth.uid()), 'admin'::public.app_role));

-- Certificates can be read publicly for QR verification; column grants limit exposed data.
create policy certificates_public_read
on public.certificates for select to anon, authenticated
using (true);

-- Users can read only their own alerts.
create policy alerts_read_own
on public.alerts for select to authenticated
using (user_id = (select auth.uid()));

-- Users can update only their own alerts and cannot transfer an alert to another user.
create policy alerts_update_own
on public.alerts for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- Surveyors can read only field verifications they submitted.
create policy field_verifications_surveyor_read_own
on public.field_verifications for select to authenticated
using (
  surveyor_id = (select auth.uid())
  and public.has_role((select auth.uid()), 'surveyor'::public.app_role)
);

-- Surveyors can submit field verifications only as themselves.
create policy field_verifications_surveyor_insert_own
on public.field_verifications for insert to authenticated
with check (
  surveyor_id = (select auth.uid())
  and public.has_role((select auth.uid()), 'surveyor'::public.app_role)
);

-- Officers and admins can read all field verifications.
create policy field_verifications_officer_admin_read_all
on public.field_verifications for select to authenticated
using (
  public.has_role((select auth.uid()), 'officer'::public.app_role)
  or public.has_role((select auth.uid()), 'admin'::public.app_role)
);

-- Only admins can read the audit ledger.
create policy audit_ledger_admin_read
on public.audit_ledger for select to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role));

revoke all on table public.user_roles from anon, authenticated;
grant select on table public.user_roles to authenticated;

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

revoke all on table public.parcels from anon, authenticated;
grant select on table public.parcels to anon, authenticated;
grant insert, update, delete on table public.parcels to authenticated;

revoke all on table public.ownership_history from anon, authenticated;
grant select on table public.ownership_history to anon, authenticated;
grant insert, update, delete on table public.ownership_history to authenticated;

revoke all on table public.documents from anon, authenticated;
grant select on table public.documents to anon, authenticated;
grant insert on table public.documents to authenticated;

revoke all on table public.encumbrances from anon, authenticated;
grant select on table public.encumbrances to anon, authenticated;
grant insert, update, delete on table public.encumbrances to authenticated;

revoke all on table public.tax_records from anon, authenticated;
grant select on table public.tax_records to anon, authenticated;
grant insert, update, delete on table public.tax_records to authenticated;

revoke all on table public.applications from anon, authenticated;
grant select, insert, update, delete on table public.applications to authenticated;

revoke all on table public.application_events from anon, authenticated;
grant select, insert, update, delete on table public.application_events to authenticated;

revoke all on table public.certificates from anon, authenticated;
grant select (certificate_no, file_hash, issued_at, issued_by, parcel_id)
on table public.certificates to anon, authenticated;

revoke all on table public.alerts from anon, authenticated;
grant select, update on table public.alerts to authenticated;

revoke all on table public.field_verifications from anon, authenticated;
grant select, insert on table public.field_verifications to authenticated;

revoke all on table public.audit_ledger from anon, authenticated;
grant select on table public.audit_ledger to authenticated;
revoke insert, update, delete, truncate on table public.audit_ledger from anon, authenticated;
