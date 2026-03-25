export interface AgeUnits {
  ageDay: string;
  ageMonth: string;
  ageYear: string;
}

export function calculateAge(birthday: Date, units: AgeUnits): string {
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - birthday.getFullYear()) * 12 +
    (now.getMonth() - birthday.getMonth());

  if (totalMonths < 1) {
    const days = Math.floor(
      (now.getTime() - birthday.getTime()) / 86_400_000
    );
    return `${days}${units.ageDay}`;
  }
  if (totalMonths < 24) {
    return `${totalMonths}${units.ageMonth}`;
  }
  const years = Math.floor(totalMonths / 12);
  const rem = totalMonths % 12;
  return rem > 0
    ? `${years}${units.ageYear} ${rem}${units.ageMonth}`
    : `${years}${units.ageYear}`;
}
