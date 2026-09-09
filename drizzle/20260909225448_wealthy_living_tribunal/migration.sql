CREATE TABLE `card_keyword_target` (
	`card_keyword_id` integer NOT NULL,
	`target_kind` text DEFAULT 'self' NOT NULL,
	`target_is_token` integer DEFAULT false NOT NULL,
	`allegiance` text DEFAULT 'unspecified' NOT NULL,
	CONSTRAINT `card_keyword_target_pk` PRIMARY KEY(`card_keyword_id`, `target_kind`, `target_is_token`, `allegiance`),
	CONSTRAINT `fk_card_keyword_target_card_keyword_id_card_keyword_id_fk` FOREIGN KEY (`card_keyword_id`) REFERENCES `card_keyword`(`id`)
);
--> statement-breakpoint
ALTER TABLE `card_keyword` ADD `id` integer;--> statement-breakpoint
ALTER TABLE `card_keyword` ADD `source` text DEFAULT 'derived' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_card_keyword` (
	`id` integer PRIMARY KEY,
	`card_id` text NOT NULL,
	`keyword_id` text NOT NULL,
	`value` integer,
	`cost` text,
	`reminder` text,
	`source` text DEFAULT 'derived' NOT NULL,
	CONSTRAINT `fk_card_keyword_card_id_catalog_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `catalog_card`(`id`),
	CONSTRAINT `fk_card_keyword_keyword_id_keyword_id_fk` FOREIGN KEY (`keyword_id`) REFERENCES `keyword`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_card_keyword`(`card_id`, `keyword_id`, `value`, `cost`, `reminder`) SELECT `card_id`, `keyword_id`, `value`, `cost`, `reminder` FROM `card_keyword`;--> statement-breakpoint
DROP TABLE `card_keyword`;--> statement-breakpoint
ALTER TABLE `__new_card_keyword` RENAME TO `card_keyword`;--> statement-breakpoint
PRAGMA foreign_keys=ON;