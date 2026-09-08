CREATE TABLE `card_image_source` (
	`card_id` text NOT NULL,
	`url` text NOT NULL,
	`priority` integer NOT NULL,
	CONSTRAINT `card_image_source_pk` PRIMARY KEY(`card_id`, `url`),
	CONSTRAINT `fk_card_image_source_card_id_catalog_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `catalog_card`(`id`)
);
--> statement-breakpoint
ALTER TABLE `card_media` ADD `image_file` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `card_media` DROP COLUMN `image_asset_id`;--> statement-breakpoint
ALTER TABLE `card_media` DROP COLUMN `image_width`;--> statement-breakpoint
ALTER TABLE `card_media` DROP COLUMN `image_height`;