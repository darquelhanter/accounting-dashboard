CREATE TABLE `clientes_backup` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320),
	`regime` enum('Simples','Lucro Presumido','Lucro Real','MEI') NOT NULL,
	`setor` enum('Fiscal','Trabalhista','Contábil','Geral') DEFAULT 'Geral',
	`valor` decimal(10,2) NOT NULL,
	`vencimento` int NOT NULL,
	`status` enum('Ativo','Inativo') DEFAULT 'Ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`backupedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clientes_backup_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('cliente','obrigacao','mensalidade','checklist') NOT NULL,
	`entityId` int NOT NULL,
	`action` enum('create','update','delete') NOT NULL,
	`status` enum('pending','synced','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`syncedAt` timestamp,
	CONSTRAINT `sync_log_id` PRIMARY KEY(`id`)
);
