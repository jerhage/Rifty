ALTER TABLE `card_keyword` ADD `scope` text DEFAULT 'self' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_card_keyword` (
	`card_id` text NOT NULL,
	`keyword_id` text NOT NULL,
	`scope` text DEFAULT 'self' NOT NULL,
	`value` integer,
	`cost` text,
	`reminder` text,
	CONSTRAINT `card_keyword_pk` PRIMARY KEY(`card_id`, `keyword_id`, `scope`),
	CONSTRAINT `fk_card_keyword_card_id_catalog_card_id_fk` FOREIGN KEY (`card_id`) REFERENCES `catalog_card`(`id`),
	CONSTRAINT `fk_card_keyword_keyword_id_keyword_id_fk` FOREIGN KEY (`keyword_id`) REFERENCES `keyword`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_card_keyword`(`card_id`, `keyword_id`, `value`, `cost`, `reminder`) SELECT `card_id`, `keyword_id`, `value`, `cost`, `reminder` FROM `card_keyword`;--> statement-breakpoint
DROP TABLE `card_keyword`;--> statement-breakpoint
ALTER TABLE `__new_card_keyword` RENAME TO `card_keyword`;--> statement-breakpoint
PRAGMA foreign_keys=ON;