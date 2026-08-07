/*
   Health Connect functionality has been disabled to comply with Google Play Store
   "Minimum Scope" policies. All health-related functions now return null or false.
*/

export async function isHealthAvailable() {
  return false;
}

export function wasHealthPermitted() {
  return false;
}

export async function requestHealthPermissions() {
  return;
}

export async function getDayActivity() {
  return null;
}

export async function getRecentWorkouts() {
  return [];
}
