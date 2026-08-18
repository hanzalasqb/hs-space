CREATE TABLE `userSessions` (
	`tokenHash` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`expiresAt` int NOT NULL,
	`revokedAt` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userSessions_tokenHash` PRIMARY KEY(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(80);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);