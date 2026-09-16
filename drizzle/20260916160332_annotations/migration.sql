CREATE TABLE `bookmark` (
	`subject_kind` text NOT NULL,
	`subject_id` text NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT `bookmark_pk` PRIMARY KEY(`subject_kind`, `subject_id`)
);
--> statement-breakpoint
CREATE TABLE `note` (
	`id` text PRIMARY KEY,
	`subject_kind` text,
	`subject_id` text,
	`title` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "note_subject_pair_complete" CHECK(("subject_kind" is null) = ("subject_id" is null))
);
--> statement-breakpoint
CREATE INDEX `note_subject` ON `note` (`subject_kind`,`subject_id`);