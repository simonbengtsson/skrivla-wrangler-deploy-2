CREATE TABLE `pages` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`creator_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
