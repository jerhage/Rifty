CREATE TABLE `card_speed` (
	`card_id` text NOT NULL,
	`speed` text NOT NULL,
	CONSTRAINT `card_speed_pk` PRIMARY KEY(`card_id`, `speed`),
	CONSTRAINT `fk_card_speed_card_id_catalog_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `catalog_card`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_keyword` (
	`card_id` text NOT NULL,
	`keyword_id` text NOT NULL,
	`value` integer,
	`cost` text,
	`reminder` text,
	CONSTRAINT `card_keyword_pk` PRIMARY KEY(`card_id`, `keyword_id`),
	CONSTRAINT `fk_card_keyword_card_id_catalog_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `catalog_card`(`id`),
	CONSTRAINT `fk_card_keyword_keyword_id_keyword_id_fk` FOREIGN KEY (`keyword_id`) REFERENCES `keyword`(`id`)
);
--> statement-breakpoint
CREATE TABLE `keyword` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE,
	`reminder_text` text
);
--> statement-breakpoint
ALTER TABLE `catalog_card` ADD `pool_code` text;--> statement-breakpoint
ALTER TABLE `catalog_card` ADD `champion_name` text;--> statement-breakpoint
ALTER TABLE `catalog_card` ADD `is_canonical` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `tag` ADD `kind` text DEFAULT 'trait' NOT NULL;--> statement-breakpoint
CREATE INDEX `catalog_card_champion_name` ON `catalog_card` (`champion_name`);--> statement-breakpoint
CREATE INDEX `catalog_card_pool_code` ON `catalog_card` (`pool_code`);