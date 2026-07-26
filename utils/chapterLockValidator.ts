// Chapter lock validation for specialty-specific ICD-10 constraints
// Reference: CLAUDE.md §2

interface ChapterLock {
  specialties: string[];
  allowedChapters: string[];
  description: string;
}

const CHAPTER_LOCKS: ChapterLock[] = [
  {
    specialties: ['Ophthalmology', 'Cataract', 'Eye'],
    allowedChapters: ['H'], // H - Diseases of the eye and ear
    description: 'Ophthalmology/Cataract cases limited to Chapter H (Eye diseases)'
  },
  {
    specialties: ['Maternity', 'LSCS', 'Obstetrics', 'OB'],
    allowedChapters: ['O', 'Z'], // O - Pregnancy, childbirth, Z - Factors influencing health
    description: 'Maternity/LSCS limited to Chapter O (Pregnancy) or Z (Factors)'
  },
  {
    specialties: ['Gynecology', 'Hysterectomy', 'Gyne'],
    allowedChapters: ['D', 'N', 'Z'], // D - Benign neoplasms, N - Genitourinary, Z - Factors
    description: 'Gynecology/Hysterectomy limited to Chapters D, N, or Z'
  },
  {
    specialties: ['Orthopedics', 'TKR', 'Ortho', 'Joint replacement'],
    allowedChapters: ['M'], // M - Diseases of the musculoskeletal system
    description: 'Orthopedics/TKR limited to Chapter M (Musculoskeletal diseases)'
  }
];

export function detectSpecialty(chiefComplaint: string): string | null {
  if (!chiefComplaint) return null;
  const text = chiefComplaint.toLowerCase();

  for (const lock of CHAPTER_LOCKS) {
    for (const specialty of lock.specialties) {
      if (text.includes(specialty.toLowerCase())) {
        return specialty;
      }
    }
  }

  return null;
}

export function getChapterFromCode(code: string): string {
  if (!code || code.length < 1) return '';
  return code.charAt(0).toUpperCase();
}

export function validateCodeAgainstLock(
  code: string,
  chiefComplaint: string
): { isValid: boolean; warning?: string } {
  const specialty = detectSpecialty(chiefComplaint);
  if (!specialty) {
    return { isValid: true }; // No specialty detected, no lock applies
  }

  const lock = CHAPTER_LOCKS.find(l => l.specialties.includes(specialty));
  if (!lock) {
    return { isValid: true };
  }

  const chapter = getChapterFromCode(code);
  if (!chapter) {
    return { isValid: false, warning: 'Invalid ICD-10 code format' };
  }

  const isAllowed = lock.allowedChapters.includes(chapter);

  if (!isAllowed) {
    return {
      isValid: false,
      warning: `⚠️ Code ${code} (Chapter ${chapter}) not allowed for ${specialty}. ${lock.description}`
    };
  }

  return { isValid: true };
}

export function getChapterLockDescription(specialty: string): string {
  const lock = CHAPTER_LOCKS.find(l => l.specialties.includes(specialty));
  return lock ? lock.description : '';
}
