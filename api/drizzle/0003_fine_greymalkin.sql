CREATE TABLE `upstream_errors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` integer NOT NULL,
	`signature` text NOT NULL,
	`method` text NOT NULL,
	`path` text NOT NULL,
	`status` integer NOT NULL,
	`email` text,
	`host` text,
	`message` text NOT NULL,
	`notified_at` integer
);
--> statement-breakpoint
CREATE INDEX `upstream_errors_sig_idx` ON `upstream_errors` (`signature`,`at`);--> statement-breakpoint
CREATE INDEX `upstream_errors_at_idx` ON `upstream_errors` (`at`);