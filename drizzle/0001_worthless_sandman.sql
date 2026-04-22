CREATE TABLE `payment_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`active` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`productCode` varchar(60) NOT NULL,
	`productName` varchar(300) NOT NULL,
	`productReference` varchar(120),
	`quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
	`unitPrice` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalPrice` decimal(12,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quote_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(20) NOT NULL,
	`userId` int NOT NULL,
	`customerName` varchar(200),
	`customerPhone` varchar(30),
	`paymentMethodId` int,
	`observations` text,
	`status` enum('draft','sent','approved','rejected') NOT NULL DEFAULT 'draft',
	`totalAmount` decimal(12,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotes_number_unique` UNIQUE(`number`)
);
