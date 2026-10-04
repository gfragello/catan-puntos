ALTER TABLE `players` ADD `display_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `players` SET `display_order` = `created_order` WHERE `display_order` = 0;
