CREATE TABLE `chips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`status` enum('active','paused','offline','error') NOT NULL DEFAULT 'offline',
	`dailyLimit` int NOT NULL DEFAULT 100,
	`totalLimit` int NOT NULL DEFAULT 1000,
	`riskScore` int NOT NULL DEFAULT 0,
	`messagesSentToday` int NOT NULL DEFAULT 0,
	`messagesSentTotal` int NOT NULL DEFAULT 0,
	`lastMessageAt` timestamp,
	`qrCode` text,
	`isConnected` boolean NOT NULL DEFAULT false,
	`lastConnectedAt` timestamp,
	`pausedReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chips_id` PRIMARY KEY(`id`),
	CONSTRAINT `chips_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chipId` int NOT NULL,
	`userId` int NOT NULL,
	`contactNumber` varchar(20) NOT NULL,
	`contactName` varchar(255),
	`messageContent` text NOT NULL,
	`messageType` enum('text','image','video','document','audio') NOT NULL DEFAULT 'text',
	`isFromMe` boolean NOT NULL DEFAULT false,
	`messageId` varchar(255),
	`timestamp` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversations_messageId_unique` UNIQUE(`messageId`)
);
--> statement-breakpoint
CREATE TABLE `messageHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chipId` int NOT NULL,
	`userId` int NOT NULL,
	`recipientNumber` varchar(20) NOT NULL,
	`recipientName` varchar(255),
	`messageContent` text NOT NULL,
	`messageType` enum('text','image','video','document','audio') NOT NULL DEFAULT 'text',
	`status` enum('pending','sent','delivered','read','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageHistory_id` PRIMARY KEY(`id`)
);
