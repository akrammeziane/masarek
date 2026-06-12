CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"question_id" text NOT NULL,
	"answer" text NOT NULL,
	"category" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offerings" (
	"id" serial PRIMARY KEY NOT NULL,
	"university_code" text NOT NULL,
	"specialty_code" text NOT NULL,
	"min_priority_1" numeric(5, 2),
	"min_priority_2" numeric(5, 2),
	"min_priority_3" numeric(5, 2),
	"year" integer DEFAULT 2025 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"specialization_id" integer,
	"match_score" numeric(5, 2),
	"reasoning_ar" text,
	"reasoning_fr" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_specializations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"specialization_id" integer NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "specializations" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name_ar" text,
	"name_fr" text NOT NULL,
	"field_ar" text,
	"field_fr" text NOT NULL,
	"required_bac_series" text[],
	"duration_years" integer,
	"description_ar" text,
	"description_fr" text,
	"career_paths_ar" text[],
	"career_paths_fr" text[],
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "specializations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"bac_series" text,
	"bac_score" numeric(5, 2),
	"wilaya" text,
	"preferred_language" text DEFAULT 'ar',
	"interests" text[],
	"strengths" text[],
	"assessment_completed" boolean DEFAULT false,
	"last_assessment_at" timestamp,
	"cached_recommendations" text,
	"recommendations_cached_at" timestamp,
	"xp_points" integer DEFAULT 0,
	"level" integer DEFAULT 1,
	"badges" text[],
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name_ar" text,
	"name_fr" text NOT NULL,
	"wilaya" text,
	"type" text NOT NULL,
	"website" text,
	"description_ar" text,
	"description_fr" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "universities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "offerings_university_idx" ON "offerings" USING btree ("university_code");--> statement-breakpoint
CREATE INDEX "offerings_specialty_idx" ON "offerings" USING btree ("specialty_code");--> statement-breakpoint
CREATE INDEX "specializations_code_idx" ON "specializations" USING btree ("code");--> statement-breakpoint
CREATE INDEX "universities_code_idx" ON "universities" USING btree ("code");