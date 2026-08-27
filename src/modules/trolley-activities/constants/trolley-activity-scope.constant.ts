// Warehouse/Operator are line staff — they only get to see their own
// history/stats, not everyone's. Every other role (Super Admin, and any
// future admin-ish role) keeps the full audit view. Never trust the client
// to say which scope it wants — this is derived purely from the requesting
// user's own role.
export const OWN_ACTIVITIES_ONLY_ROLES = ['Warehouse', 'Operator'];
