CREATE TABLE `notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailEnabled` boolean NOT NULL DEFAULT false,
	`emailAddress` varchar(320),
	`smtpHost` varchar(255),
	`smtpPort` int,
	`smtpUser` varchar(255),
	`smtpPassword` varchar(255),
	`telegramEnabled` boolean NOT NULL DEFAULT false,
	`telegramChatId` varchar(100),
	`telegramBotToken` varchar(255),
	`notifyOnChipPaused` boolean NOT NULL DEFAULT true,
	`notifyOnHighRisk` boolean NOT NULL DEFAULT true,
	`notifyOnDailyReport` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`messageTemplate` text NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('pending','running','completed','cancelled','failed') NOT NULL DEFAULT 'pending',
	`followUpCadence` varchar(100),
	`currentFollowUpStep` int NOT NULL DEFAULT 0,
	`contacts` text NOT NULL,
	`sentCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `scheduled_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warmup_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chipId` int NOT NULL,
	`userId` int NOT NULL,
	`senderChipId` int NOT NULL,
	`recipientNumber` varchar(20) NOT NULL,
	`messageContent` text NOT NULL,
	`status` enum('sent','failed') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	`warmupPhase` int NOT NULL,
	`warmupDay` int NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `warmup_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warmup_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`warmupDurationDays` int NOT NULL DEFAULT 14,
	`phase1MessagesPerDay` int NOT NULL DEFAULT 15,
	`phase2MessagesPerDay` int NOT NULL DEFAULT 40,
	`phase3MessagesPerDay` int NOT NULL DEFAULT 75,
	`phase1Duration` int NOT NULL DEFAULT 3,
	`phase2Duration` int NOT NULL DEFAULT 4,
	`phase3Duration` int NOT NULL DEFAULT 7,
	`blockUnwarmedChips` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warmup_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `warmup_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `chips` ADD `warmupStatus` enum('not_started','in_progress','completed','skipped') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `chips` ADD `warmupStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `chips` ADD `warmupEndDate` timestamp;--> statement-breakpoint
ALTER TABLE `chips` ADD `warmupCurrentDay` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `chips` ADD `warmupMessagesToday` int DEFAULT 0 NOT NULL;