CREATE TABLE `games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`sequence` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_games_status` ON `games` (`status`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` integer NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`settlements` integer DEFAULT 0 NOT NULL,
	`cities` integer DEFAULT 0 NOT NULL,
	`roads` integer DEFAULT 0 NOT NULL,
	`armies` integer DEFAULT 0 NOT NULL,
	`additional_points` integer DEFAULT 0 NOT NULL,
	`created_order` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_players_game_color` ON `players` (`game_id`,`color`);--> statement-breakpoint
CREATE INDEX `idx_players_game` ON `players` (`game_id`);--> statement-breakpoint
CREATE TABLE `score_milestones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	`category` text NOT NULL,
	`value` integer NOT NULL,
	`reached_order` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_milestones_player_category_value` ON `score_milestones` (`player_id`,`category`,`value`);--> statement-breakpoint
CREATE INDEX `idx_milestones_game_category_value` ON `score_milestones` (`game_id`,`category`,`value`);--> statement-breakpoint
PRAGMA optimize;
