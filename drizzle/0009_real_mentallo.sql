CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clienteId` int NOT NULL,
	`action` enum('view','create','update','delete','share','unshare') NOT NULL,
	`entityType` enum('cliente','obrigacao','mensalidade','checklist') NOT NULL,
	`entityId` int,
	`description` text,
	`changes` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
