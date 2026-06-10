CREATE TABLE `vehicle_info` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int,
	`plate` varchar(20),
	`model` varchar(100),
	`year` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicle_info_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicle_info_quoteId_unique` UNIQUE(`quoteId`)
);
