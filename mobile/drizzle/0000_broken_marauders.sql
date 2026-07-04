CREATE TABLE `activity_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`date` text NOT NULL,
	`steps` integer DEFAULT 0 NOT NULL,
	`active_minutes` integer DEFAULT 0 NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`source` text DEFAULT 'health_connect',
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `body_measurement` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real NOT NULL,
	`bmi` real,
	`body_fat_pct` real,
	`waist_cm` real,
	`chest_cm` real,
	`arm_cm` real,
	`accuracy` text NOT NULL,
	`source` text DEFAULT 'manual',
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `calorie_checkin` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`date` text NOT NULL,
	`calories_consumed` integer NOT NULL,
	`protein_g` integer,
	`target_snapshot_kcal` integer NOT NULL,
	`source` text DEFAULT 'manual',
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exercise` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`primary_muscle` text NOT NULL,
	`secondary_muscles` text DEFAULT '[]',
	`movement_pattern` text NOT NULL,
	`equipment` text NOT NULL,
	`difficulty` text NOT NULL,
	`instructions` text DEFAULT '',
	`media_url` text,
	`source_attribution` text DEFAULT 'seed'
);
--> statement-breakpoint
CREATE TABLE `health_screening` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`parq_answers` text NOT NULL,
	`any_flag` integer NOT NULL,
	`conditions` text,
	`medications` text,
	`cleared_by_physician` integer DEFAULT false,
	`screenedAt` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `logged_set` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`program_exercise_id` text,
	`set_index` integer NOT NULL,
	`reps` integer NOT NULL,
	`weight_kg` real NOT NULL,
	`rpe` real,
	`is_warmup` integer DEFAULT false NOT NULL,
	`completed_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`session_id`) REFERENCES `workout_session`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`program_exercise_id`) REFERENCES `program_exercise`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`sex` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`height_cm` real NOT NULL,
	`goal` text NOT NULL,
	`experience_level` text NOT NULL,
	`activity_level` text NOT NULL,
	`training_days` text NOT NULL,
	`session_length_min` integer NOT NULL,
	`preferred_time` text NOT NULL,
	`preferred_time_specific` text,
	`equipment_access` text NOT NULL,
	`injuries` text DEFAULT '[]',
	`target_weight_kg` real,
	`dietary_pattern` text,
	`allergies` text,
	`cal_checkin_enabled` integer DEFAULT false,
	`bmr_kcal` integer,
	`tdee_kcal` integer,
	`calorie_target_kcal` integer,
	`protein_g` integer,
	`fat_g` integer,
	`carb_g` integer,
	`targets_computed_at` text,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	`updatedAt` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `program` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`goal` text NOT NULL,
	`days_per_week` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`origin` text NOT NULL,
	`generated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `program_day` (
	`id` text PRIMARY KEY NOT NULL,
	`program_id` text NOT NULL,
	`weekday` integer,
	`order_index` integer NOT NULL,
	`label` text NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `program`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `program_exercise` (
	`id` text PRIMARY KEY NOT NULL,
	`program_day_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`target_sets` integer NOT NULL,
	`target_rep_min` integer NOT NULL,
	`target_rep_max` integer NOT NULL,
	`target_rpe` real,
	`notes` text,
	FOREIGN KEY (`program_day_id`) REFERENCES `program_day`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workout_session` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`program_day_id` text,
	`date` text NOT NULL,
	`started_at` text,
	`completed_at` text,
	`status` text DEFAULT 'in_progress' NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`program_day_id`) REFERENCES `program_day`(`id`) ON UPDATE no action ON DELETE no action
);
