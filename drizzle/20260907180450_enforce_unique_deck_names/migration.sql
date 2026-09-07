PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_deck` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_deck`(`id`, `name`, `notes`, `created_at`, `updated_at`) SELECT `id`, `name`, `notes`, `created_at`, `updated_at` FROM `deck`;--> statement-breakpoint
DROP TABLE `deck`;--> statement-breakpoint
ALTER TABLE `__new_deck` RENAME TO `deck`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `deck_updated_at` ON `deck` (`updated_at`);