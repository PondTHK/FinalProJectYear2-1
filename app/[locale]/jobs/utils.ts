export function getApplicants(j: { applicants: string }): number {
  const match = j.applicants.match(/^(\d+)\s*\/\s*\d+$/);
  return match ? parseInt(match[1], 10) : 0;
}
