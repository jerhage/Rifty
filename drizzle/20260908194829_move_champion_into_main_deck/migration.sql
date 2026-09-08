-- The chosen champion used to be a section of its own, holding the copy that started in the
-- champion zone. It is really just a main deck card that the deck names, so each deck's champion
-- row moves into the main deck: its copies join the ones already there, and the card it points at
-- is recorded on the deck.

UPDATE `deck` SET `chosen_champion_riftbound_id` = (
	SELECT `card_riftbound_id` FROM `deck_card`
	WHERE `deck_card`.`deck_id` = `deck`.`id` AND `deck_card`.`section` = 'chosenChampion'
	LIMIT 1
) WHERE `chosen_champion_riftbound_id` IS NULL AND EXISTS (
	SELECT 1 FROM `deck_card`
	WHERE `deck_card`.`deck_id` = `deck`.`id` AND `deck_card`.`section` = 'chosenChampion'
);--> statement-breakpoint
UPDATE `deck_card` SET `quantity` = `quantity` + (
	SELECT `champion`.`quantity` FROM `deck_card` AS `champion`
	WHERE `champion`.`deck_id` = `deck_card`.`deck_id`
		AND `champion`.`section` = 'chosenChampion'
		AND `champion`.`card_riftbound_id` = `deck_card`.`card_riftbound_id`
) WHERE `section` = 'mainDeck' AND EXISTS (
	SELECT 1 FROM `deck_card` AS `champion`
	WHERE `champion`.`deck_id` = `deck_card`.`deck_id`
		AND `champion`.`section` = 'chosenChampion'
		AND `champion`.`card_riftbound_id` = `deck_card`.`card_riftbound_id`
);--> statement-breakpoint
INSERT INTO `deck_card` (`deck_id`, `section`, `card_riftbound_id`, `quantity`)
SELECT `champion`.`deck_id`, 'mainDeck', `champion`.`card_riftbound_id`, `champion`.`quantity`
FROM `deck_card` AS `champion`
WHERE `champion`.`section` = 'chosenChampion' AND NOT EXISTS (
	SELECT 1 FROM `deck_card` AS `main`
	WHERE `main`.`deck_id` = `champion`.`deck_id`
		AND `main`.`section` = 'mainDeck'
		AND `main`.`card_riftbound_id` = `champion`.`card_riftbound_id`
);--> statement-breakpoint
DELETE FROM `deck_card` WHERE `section` = 'chosenChampion';
