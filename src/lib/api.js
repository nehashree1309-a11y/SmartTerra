import { supabase } from './supabase'

function throwIfError(error) {
  if (error) throw error
}

export async function searchParcels(query) {
  const { data, error } = await supabase.rpc('search_parcels', { q: query.trim() })
  throwIfError(error)
  return data ?? []
}

export async function getParcel(identifier) {
  const value = String(identifier ?? '').trim()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

  if (isUuid) {
    const { data, error } = await supabase.from('parcels').select('*').eq('id', value).limit(1).maybeSingle()
    throwIfError(error)
    return data
  }

  const surveyNumber = value.replace(/-/g, '/')
  const { data: exactMatch, error: exactError } = await supabase
    .from('parcels')
    .select('*')
    .eq('survey_no', surveyNumber)
    .limit(1)
    .maybeSingle()
  throwIfError(exactError)
  if (exactMatch) return exactMatch

  const [surveyNo, subDivision] = surveyNumber.split('/')
  if (!subDivision) return null

  const { data, error } = await supabase
    .from('parcels')
    .select('*')
    .eq('survey_no', surveyNo)
    .eq('sub_division', subDivision)
    .limit(1)
    .maybeSingle()
  throwIfError(error)
  return data
}

export async function getOwnershipHistory(parcelId) {
  const { data, error } = await supabase
    .from('ownership_history')
    .select('id, owner_name, transfer_type, from_year, to_year, created_at')
    .eq('parcel_id', parcelId)
    .order('from_year', { ascending: true })
  throwIfError(error)
  return data ?? []
}

export async function getCertificatesForParcel(parcelId) {
  const { data, error } = await supabase
    .from('certificates')
    .select('certificate_no, file_hash, issued_at, issued_by, parcel_id')
    .eq('parcel_id', parcelId)
    .order('issued_at', { ascending: false })
  throwIfError(error)
  return data ?? []
}

export async function getCertificate(certificateNo) {
  const { data, error } = await supabase
    .from('certificates')
    .select('certificate_no, file_hash, issued_at, issued_by, parcel_id')
    .eq('certificate_no', certificateNo.trim())
    .limit(1)
    .maybeSingle()
  throwIfError(error)
  return data
}

export function mapParcelToView(parcel, history = [], certificates = []) {
  const surveyNumber = parcel.survey_no.includes('/')
    ? parcel.survey_no
    : [parcel.survey_no, parcel.sub_division].filter(Boolean).join('/')
  const score = parcel.fraud_score ?? 0

  return {
    id: surveyNumber.replace(/\//g, '-'),
    surveyNumber,
    village: parcel.village,
    taluk: parcel.taluk,
    district: parcel.district,
    area: parcel.area_sqm == null ? 'Not recorded' : `${Number(parcel.area_sqm).toLocaleString()} m²`,
    landType: parcel.land_type ?? 'Not recorded',
    owner: parcel.owner_name,
    status: parcel.status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    trust: score < 35 ? 'High' : score < 70 ? 'Medium' : 'Low',
    riskScore: score,
    certificateId: certificates[0]?.certificate_no ?? '',
    transferHistory: history.map((entry) => ({
      year: entry.to_year ?? entry.from_year ?? new Date(entry.created_at).getFullYear(),
      type: entry.transfer_type.replaceAll('_', ' '),
      owner: entry.owner_name,
      note: entry.to_year ? `${entry.from_year} to ${entry.to_year}` : `Current owner since ${entry.from_year}`,
    })),
    documents: [],
  }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  throwIfError(error)
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  throwIfError(error)
}

export async function getUserRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
  throwIfError(error)

  const priority = ['admin', 'officer', 'surveyor', 'citizen']
  return (data ?? []).map((entry) => entry.role).sort((a, b) => priority.indexOf(a) - priority.indexOf(b))[0] ?? null
}
