CREATE TABLE `card_classification` (
	`card_id` text PRIMARY KEY,
	`type_id` text NOT NULL,
	`supertype_id` text,
	`rarity_id` text NOT NULL,
	CONSTRAINT `fk_card_classification_card_id_catalog_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `catalog_card`(`id`),
	CONSTRAINT `fk_card_classification_type_id_card_type_id_fk` FOREIGN KEY (`type_id`) REFERENCES `card_type`(`id`),
	CONSTRAINT `fk_card_classification_supertype_id_card_supertype_id_fk` FOREIGN KEY (`supertype_id`) REFERENCES `card_supertype`(`id`),
	CONSTRAINT `fk_card_classification_rarity_id_rarity_id_fk` FOREIGN KEY (`rarity_id`) REFERENCES `rarity`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_domain` (
	`card_id` text NOT NULL,
	`domain_id` text NOT NULL,
	CONSTRAINT `card_domain_pk` PRIMARY KEY(`card_id`, `domain_id`),
	CONSTRAINT `fk_card_domain_card_id_catalog_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `catalog_card`(`id`),
	CONSTRAINT `fk_card_domain_domain_id_domain_id_fk` FOREIGN KEY (`domain_id`) REFERENCES `domain`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_marketplace_reference` (
	`card_id` text NOT NULL,
	`marketplace` text NOT NULL,
	`external_id` text NOT NULL,
	CONSTRAINT `card_marketplace_reference_pk` PRIMARY KEY(`card_id`, `marketplace`, `external_id`),
	CONSTRAINT `fk_card_marketplace_reference_card_id_catalog_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `catalog_card`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_media` (
	`card_id` text PRIMARY KEY,
	`image_asset_id` text NOT NULL,
	`artist` text,
	`accessibility_text` text,
	CONSTRAINT `fk_card_media_card_id_catalog_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `catalog_card`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_set` (
	`code` text PRIMARY KEY,
	`source_id` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`declared_card_count` integer NOT NULL,
	`published_on` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `card_supertype` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE `card_tag` (
	`card_id` text NOT NULL,
	`tag_id` text NOT NULL,
	CONSTRAINT `card_tag_pk` PRIMARY KEY(`card_id`, `tag_id`),
	CONSTRAINT `fk_card_tag_card_id_catalog_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `catalog_card`(`id`),
	CONSTRAINT `fk_card_tag_tag_id_tag_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`)
);
--> statement-breakpoint
CREATE TABLE `card_type` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE `catalog_card` (
	`id` text PRIMARY KEY,
	`riftbound_id` text NOT NULL UNIQUE,
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
CREATE TABLE `set_marketplace_reference` (
	`set_code` text NOT NULL,
	`marketplace` text NOT NULL,
	`external_id` text NOT NULL,
	CONSTRAINT `set_marketplace_reference_pk` PRIMARY KEY(`set_code`, `marketplace`, `external_id`),
	CONSTRAINT `fk_set_marketplace_reference_set_code_card_set_code_fk` FOREIGN KEY (`set_code`) REFERENCES `card_set`(`code`)
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE INDEX `card_classification_type_rarity` ON `card_classification` (`type_id`,`rarity_id`);--> statement-breakpoint
CREATE INDEX `card_domain_domain_id` ON `card_domain` (`domain_id`);--> statement-breakpoint
CREATE INDEX `card_marketplace_reference_lookup` ON `card_marketplace_reference` (`marketplace`,`external_id`);--> statement-breakpoint
CREATE INDEX `card_set_published_on` ON `card_set` (`published_on`);--> statement-breakpoint
CREATE INDEX `card_tag_tag_id` ON `card_tag` (`tag_id`);--> statement-breakpoint
CREATE INDEX `card_set_collector_number` ON `catalog_card` (`set_code`,`collector_number`);--> statement-breakpoint
CREATE INDEX `card_clean_name` ON `catalog_card` (`clean_name`);--> statement-breakpoint
CREATE INDEX `set_marketplace_reference_lookup` ON `set_marketplace_reference` (`marketplace`,`external_id`);