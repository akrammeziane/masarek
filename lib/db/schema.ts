
import { pgTable, text, timestamp, boolean, serial, decimal, integer, index } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- Masarek App Tables ----------------------------------------------------

export const studentProfiles = pgTable('student_profiles', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  bacSeries: text('bac_series'),
  bacScore: decimal('bac_score', { precision: 5, scale: 2 }),
  wilaya: text('wilaya'),
  preferredLanguage: text('preferred_language').default('ar'),
  interests: text('interests').array(),
  strengths: text('strengths').array(),
  assessmentCompleted: boolean('assessment_completed').default(false),
  lastAssessmentAt: timestamp('last_assessment_at'),
  // FIX: Track rolling 24-hour assessment count for the 2-per-day limit.
  assessmentCount: integer('assessment_count').default(0).notNull(),
  cachedRecommendations: text('cached_recommendations'),
  recommendationsCachedAt: timestamp('recommendations_cached_at'),
  xpPoints: integer('xp_points').default(0),
  level: integer('level').default(1),
  badges: text('badges').array(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// ⬇️ NEW: `code` column added — official MESRS establishment code (e.g. "U12", "C16", "P73").
export const universities = pgTable('universities', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  nameAr: text('name_ar'),
  nameFr: text('name_fr').notNull(),
  wilaya: text('wilaya'),
  type: text('type').notNull(), // UNIV | ECOLE | AUTRE
  website: text('website'),
  descriptionAr: text('description_ar'),
  descriptionFr: text('description_fr'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, t => ({ codeIdx: index('universities_code_idx').on(t.code) }))

// ⬇️ NEW: `code` column added — official MESRS filière code (e.g. "P01MAL01").
export const specializations = pgTable('specializations', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  nameAr: text('name_ar'),
  nameFr: text('name_fr').notNull(),
  fieldAr: text('field_ar'),
  fieldFr: text('field_fr').notNull(),
  requiredBacSeries: text('required_bac_series').array(),
  durationYears: integer('duration_years'),
  descriptionAr: text('description_ar'),
  descriptionFr: text('description_fr'),
  careerPathsAr: text('career_paths_ar').array(),
  careerPathsFr: text('career_paths_fr').array(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, t => ({ codeIdx: index('specializations_code_idx').on(t.code) }))

// 🆕 NEW TABLE: university × specialty × min averages by priority (1/2/3).
// One row per offering line in the BAC 2025 minimum-averages PDF (4 719 rows).
export const offerings = pgTable('offerings', {
  id: serial('id').primaryKey(),
  universityCode:  text('university_code').notNull(),
  specialtyCode:   text('specialty_code').notNull(),
  minPriority1:    decimal('min_priority_1', { precision: 5, scale: 2 }),
  minPriority2:    decimal('min_priority_2', { precision: 5, scale: 2 }),
  minPriority3:    decimal('min_priority_3', { precision: 5, scale: 2 }),
  year:            integer('year').notNull().default(2025),
  createdAt:       timestamp('createdAt').notNull().defaultNow(),
}, t => ({
  uniIdx:  index('offerings_university_idx').on(t.universityCode),
  specIdx: index('offerings_specialty_idx').on(t.specialtyCode),
}))

export const assessmentResponses = pgTable('assessment_responses', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  questionId: text('question_id').notNull(),
  answer: text('answer').notNull(),
  category: text('category'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const recommendations = pgTable('recommendations', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  specializationId: integer('specialization_id'),
  matchScore: decimal('match_score', { precision: 5, scale: 2 }),
  reasoningAr: text('reasoning_ar'),
  reasoningFr: text('reasoning_fr'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const savedSpecializations = pgTable('saved_specializations', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  specializationId: integer('specialization_id').notNull(),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
