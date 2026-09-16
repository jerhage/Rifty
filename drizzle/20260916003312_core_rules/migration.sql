CREATE TABLE `core_rule_detail` (
	`rule_number` text NOT NULL,
	`position` integer NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	CONSTRAINT `core_rule_detail_pk` PRIMARY KEY(`rule_number`, `position`),
	CONSTRAINT `fk_core_rule_detail_rule_number_core_rule_number_fk` FOREIGN KEY (`rule_number`) REFERENCES `core_rule`(`number`) ON DELETE CASCADE,
	CONSTRAINT "core_rule_detail_position_not_negative" CHECK("position" >= 0)
);
--> statement-breakpoint
CREATE TABLE `core_rule` (
	`number` text PRIMARY KEY,
	`parent_number` text,
	`position` integer NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	CONSTRAINT `fk_core_rule_parent_number_core_rule_number_fk` FOREIGN KEY (`parent_number`) REFERENCES `core_rule`(`number`) ON DELETE CASCADE,
	CONSTRAINT "core_rule_position_not_negative" CHECK("position" >= 0)
);
--> statement-breakpoint
CREATE TABLE `core_rules_edition` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`published_on` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `core_rule_position` ON `core_rule` (`position`);