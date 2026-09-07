PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_deck_card` (
	`deck_id` text NOT NULL,
	`section` text NOT NULL,
	`card_riftbound_id` text NOT NULL,
	`quantity` integer NOT NULL,
	CONSTRAINT `deck_card_pk` PRIMARY KEY(`deck_id`, `section`, `card_riftbound_id`),
	CONSTRAINT `fk_deck_card_deck_id_deck_id_fk` FOREIGN KEY (`deck_id`) REFERENCES `deck`(`id`) ON DELETE CASCADE,
	CONSTRAINT "deck_card_quantity_positive" CHECK("quantity" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_deck_card`(`deck_id`, `section`, `card_riftbound_id`, `quantity`) SELECT `deck_id`, `section`, `card_riftbound_id`, `quantity` FROM `deck_card`;--> statement-breakpoint
DROP TABLE `deck_card`;--> statement-breakpoint
ALTER TABLE `__new_deck_card` RENAME TO `deck_card`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `deck_card_riftbound_id` ON `deck_card` (`card_riftbound_id`);