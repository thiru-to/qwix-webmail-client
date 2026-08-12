CREATE TABLE `filter_state` (
	`user_id` integer NOT NULL,
	`folder` text NOT NULL,
	`last_uid` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `folder`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `filters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`conditions` text DEFAULT '{}' NOT NULL,
	`actions` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `filters_user_idx` ON `filters` (`user_id`,`position`);--> statement-breakpoint
CREATE TABLE `forward_addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`email` text NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`code_hash` text,
	`expires_at` integer,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `forward_addresses_user_email_idx` ON `forward_addresses` (`user_id`,`email`);--> statement-breakpoint
CREATE TABLE `identities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`label_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identities_user_email_idx` ON `identities` (`user_id`,`email`);--> statement-breakpoint
CREATE TABLE `settings` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`theme` text DEFAULT 'dark' NOT NULL,
	`density` text DEFAULT 'cozy' NOT NULL,
	`threading` integer DEFAULT false NOT NULL,
	`shortcuts_enabled` integer DEFAULT true NOT NULL,
	`remote_senders` text DEFAULT '[]' NOT NULL,
	`shortcut_overrides` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
