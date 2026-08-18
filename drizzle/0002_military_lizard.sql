CREATE TABLE `adminSessions` (
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` int NOT NULL,
	`revokedAt` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminSessions_tokenHash` PRIMARY KEY(`tokenHash`)
);
