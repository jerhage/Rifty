CREATE TABLE `deck_card` (
	`deck_id` text NOT NULL,
	`section` text NOT NULL,
	`card_riftbound_id` text NOT NULL,
	`quantity` integer NOT NULL,
	CONSTRAINT `deck_card_pk` PRIMARY KEY(`deck_id`, `section`, `card_riftbound_id`),
	CONSTRAINT `fk_deck_card_deck_id_deck_id_fk` FOREIGN KEY (`deck_id`) REFERENCES `deck`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `deck` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `catalog_card_riftbound_id` ON `catalog_card` (`riftbound_id`);--> statement-breakpoint
CREATE INDEX `deck_card_riftbound_id` ON `deck_card` (`card_riftbound_id`);--> statement-breakpoint
CREATE INDEX `deck_updated_at` ON `deck` (`updated_at`);