CREATE TABLE `documentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clienteId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`tipo` varchar(100) NOT NULL,
	`tamanho` int NOT NULL,
	`conteudo` LONGTEXT NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentos_id` PRIMARY KEY(`id`)
);
