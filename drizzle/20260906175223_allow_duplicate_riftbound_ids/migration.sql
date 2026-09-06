PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_catalog_card` (
	`id` text PRIMARY KEY,
	`riftbound_id` text NOT NULL,
	`set_code` text NOT NULL,
	`collector_number` integer NOT NULL,
	`name` text NOT NULL,
	`clean_name` text NOT NULL,
	`energy` integer,
	`might` integer,
	`power` integer,
	`rules_text_rich` text NOT NULL,
	`rules_text_plain` text NOT NULL,
	`flavour_text` text,
	`orientation` text NOT NULL,
	`is_alternate_art` integer NOT NULL,
	`is_overnumbered` integer NOT NULL,
	`is_signature` integer NOT NULL,
	`source_updated_at` text NOT NULL,
	CONSTRAINT `fk_catalog_card_set_code_card_set_code_fk` FOREIGN KEY (`set_code`) REFERENCES `card_set`(`code`)
);
--> statement-breakpoint
INSERT INTO `__new_catalog_card`(`id`, `riftbound_id`, `set_code`, `collector_number`, `name`, `clean_name`, `energy`, `might`, `power`, `rules_text_rich`, `rules_text_plain`, `flavour_text`, `orientation`, `is_alternate_art`, `is_overnumbered`, `is_signature`, `source_updated_at`) SELECT `id`, `riftbound_id`, `set_code`, `collector_number`, `name`, `clean_name`, `energy`, `might`, `power`, `rules_text_rich`, `rules_text_plain`, `flavour_text`, `orientation`, `is_alternate_art`, `is_overnumbered`, `is_signature`, `source_updated_at` FROM `catalog_card`;--> statement-breakpoint
DROP TABLE `catalog_card`;--> statement-breakpoint
ALTER TABLE `__new_catalog_card` RENAME TO `catalog_card`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `card_set_collector_number` ON `catalog_card` (`set_code`,`collector_number`);--> statement-breakpoint
CREATE INDEX `card_clean_name` ON `catalog_card` (`clean_name`);