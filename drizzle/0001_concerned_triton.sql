CREATE TABLE `admin_login_attempts` (
	`client_key` text PRIMARY KEY NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`window_started_at` integer NOT NULL,
	`blocked_until` integer DEFAULT 0 NOT NULL
);
