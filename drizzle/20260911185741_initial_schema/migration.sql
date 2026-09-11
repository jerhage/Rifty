CREATE TABLE `deck_card` (
	`deck_id` text NOT NULL,
	`section` text NOT NULL,
	`card_id` text NOT NULL,
	`printing_id` text NOT NULL,
	`quantity` integer NOT NULL,
	CONSTRAINT `deck_card_pk` PRIMARY KEY(`deck_id`, `section`, `card_id`, `printing_id`),
	CONSTRAINT `fk_deck_card_deck_id_deck_id_fk` FOREIGN KEY (`deck_id`) REFERENCES `deck`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_deck_card_card_id_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `card`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_deck_card_printing_id_card_printing_id_fk` FOREIGN KEY (`printing_id`) REFERENCES `card_printing`(`id`) ON DELETE RESTRICT,
	CONSTRAINT "deck_card_quantity_positive" CHECK("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE `deck` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`chosen_champion_card_id` text,
	CONSTRAINT `fk_deck_chosen_champion_card_id_card_id_fk` FOREIGN KEY (`chosen_champion_card_id`) REFERENCES `card`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `card_domain` (
	`card_id` text NOT NULL,
	`domain_id` text NOT NULL,
	CONSTRAINT `card_domain_pk` PRIMARY KEY(`card_id`, `domain_id`),
	CONSTRAINT `fk_card_domain_card_id_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `card`(`id`),
	CONSTRAINT `fk_card_domain_domain_id_domain_id_fk` FOREIGN KEY (`domain_id`) REFERENCES `domain`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_image_source` (
	`printing_id` text NOT NULL,
	`url` text NOT NULL,
	`priority` integer NOT NULL,
	CONSTRAINT `card_image_source_pk` PRIMARY KEY(`printing_id`, `url`),
	CONSTRAINT `fk_card_image_source_printing_id_card_printing_id_fk` FOREIGN KEY (`printing_id`) REFERENCES `card_printing`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_marketplace_reference` (
	`printing_id` text NOT NULL,
	`marketplace` text NOT NULL,
	`external_id` text NOT NULL,
	CONSTRAINT `card_marketplace_reference_pk` PRIMARY KEY(`printing_id`, `marketplace`, `external_id`),
	CONSTRAINT `fk_card_marketplace_reference_printing_id_card_printing_id_fk` FOREIGN KEY (`printing_id`) REFERENCES `card_printing`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_media` (
	`printing_id` text PRIMARY KEY,
	`image_file` text DEFAULT '' NOT NULL,
	`artist` text,
	`accessibility_text` text,
	CONSTRAINT `fk_card_media_printing_id_card_printing_id_fk` FOREIGN KEY (`printing_id`) REFERENCES `card_printing`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_printing` (
	`id` text PRIMARY KEY,
	`card_id` text NOT NULL,
	`riftbound_id` text NOT NULL,
	`set_code` text NOT NULL,
	`collector_number` text NOT NULL,
	`pool_code` text,
	`rarity_id` text NOT NULL,
	`printed_name` text NOT NULL,
	`finish` text NOT NULL,
	`flavour_text` text,
	`source_updated_at` text NOT NULL,
	`is_canonical` integer DEFAULT true NOT NULL,
	CONSTRAINT `fk_card_printing_card_id_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `card`(`id`),
	CONSTRAINT `fk_card_printing_set_code_card_set_code_fk` FOREIGN KEY (`set_code`) REFERENCES `card_set`(`code`),
	CONSTRAINT `fk_card_printing_rarity_id_rarity_id_fk` FOREIGN KEY (`rarity_id`) REFERENCES `rarity`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_speed` (
	`card_id` text NOT NULL,
	`speed` text NOT NULL,
	CONSTRAINT `card_speed_pk` PRIMARY KEY(`card_id`, `speed`),
	CONSTRAINT `fk_card_speed_card_id_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `card`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_tag` (
	`card_id` text NOT NULL,
	`tag_id` text NOT NULL,
	CONSTRAINT `card_tag_pk` PRIMARY KEY(`card_id`, `tag_id`),
	CONSTRAINT `fk_card_tag_card_id_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `card`(`id`),
	CONSTRAINT `fk_card_tag_tag_id_tag_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card` (
	`id` text PRIMARY KEY,
	`clean_name` text NOT NULL,
	`energy` integer,
	`might` integer,
	`power` integer,
	`rules_text_rich` text NOT NULL,
	`rules_text_plain` text NOT NULL,
	`orientation` text NOT NULL,
	`type_id` text NOT NULL,
	`supertype_id` text,
	`champion_name` text,
	CONSTRAINT `fk_card_type_id_card_type_id_fk` FOREIGN KEY (`type_id`) REFERENCES `card_type`(`id`),
	CONSTRAINT `fk_card_supertype_id_card_supertype_id_fk` FOREIGN KEY (`supertype_id`) REFERENCES `card_supertype`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_keyword_target` (
	`card_keyword_id` integer NOT NULL,
	`target_kind` text DEFAULT 'self' NOT NULL,
	`target_is_token` integer DEFAULT false NOT NULL,
	`allegiance` text DEFAULT 'unspecified' NOT NULL,
	CONSTRAINT `card_keyword_target_pk` PRIMARY KEY(`card_keyword_id`, `target_kind`, `target_is_token`, `allegiance`),
	CONSTRAINT `fk_card_keyword_target_card_keyword_id_card_keyword_id_fk` FOREIGN KEY (`card_keyword_id`) REFERENCES `card_keyword`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_keyword` (
	`id` integer PRIMARY KEY,
	`card_id` text NOT NULL,
	`keyword_id` text NOT NULL,
	`value` integer,
	`cost` text,
	`reminder` text,
	`source` text DEFAULT 'derived' NOT NULL,
	CONSTRAINT `fk_card_keyword_card_id_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `card`(`id`),
	CONSTRAINT `fk_card_keyword_keyword_id_keyword_id_fk` FOREIGN KEY (`keyword_id`) REFERENCES `keyword`(`id`)
);
--> statement-breakpoint
CREATE TABLE `keyword` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE,
	`reminder_text` text
);
--> statement-breakpoint
CREATE TABLE `catalog_seed_state` (
	`id` text PRIMARY KEY,
	`version` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `card_set` (
	`code` text PRIMARY KEY,
	`name` text NOT NULL,
	`declared_card_count` integer NOT NULL,
	`published_on` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `set_marketplace_reference` (
	`set_code` text NOT NULL,
	`marketplace` text NOT NULL,
	`external_id` text NOT NULL,
	CONSTRAINT `set_marketplace_reference_pk` PRIMARY KEY(`set_code`, `marketplace`, `external_id`),
	CONSTRAINT `fk_set_marketplace_reference_set_code_card_set_code_fk` FOREIGN KEY (`set_code`) REFERENCES `card_set`(`code`)
);
--> statement-breakpoint
CREATE TABLE `card_supertype` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE `card_type` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE `domain` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE `rarity` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE,
	`kind` text DEFAULT 'trait' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `deck_card_copy_limit` ON `deck_card` (`deck_id`,`card_id`);--> statement-breakpoint
CREATE INDEX `deck_updated_at` ON `deck` (`updated_at`);--> statement-breakpoint
CREATE INDEX `card_domain_domain_id` ON `card_domain` (`domain_id`);--> statement-breakpoint
CREATE INDEX `card_marketplace_reference_lookup` ON `card_marketplace_reference` (`marketplace`,`external_id`);--> statement-breakpoint
CREATE INDEX `card_printing_card_id` ON `card_printing` (`card_id`);--> statement-breakpoint
CREATE INDEX `card_printing_set_collector_number` ON `card_printing` (`set_code`,`collector_number`);--> statement-breakpoint
CREATE INDEX `card_printing_riftbound_id` ON `card_printing` (`riftbound_id`);--> statement-breakpoint
CREATE INDEX `card_printing_pool_code` ON `card_printing` (`pool_code`);--> statement-breakpoint
CREATE INDEX `card_printing_rarity_id` ON `card_printing` (`rarity_id`);--> statement-breakpoint
CREATE INDEX `card_tag_tag_id` ON `card_tag` (`tag_id`);--> statement-breakpoint
CREATE INDEX `card_clean_name` ON `card` (`clean_name`);--> statement-breakpoint
CREATE INDEX `card_champion_name` ON `card` (`champion_name`);--> statement-breakpoint
CREATE INDEX `card_type_id` ON `card` (`type_id`);--> statement-breakpoint
CREATE INDEX `card_set_published_on` ON `card_set` (`published_on`);--> statement-breakpoint
CREATE INDEX `set_marketplace_reference_lookup` ON `set_marketplace_reference` (`marketplace`,`external_id`);