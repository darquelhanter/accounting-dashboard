CREATE TABLE `servicos_prestados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clienteId` int NOT NULL,
	`nomeServico` varchar(255) NOT NULL,
	`descricao` text,
	`valor` decimal(10,2) NOT NULL,
	`mes` varchar(20) NOT NULL,
	`ano` int NOT NULL,
	`status` enum('Pago','Pendente','Atrasado') DEFAULT 'Pendente',
	`dataPagamento` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `servicos_prestados_id` PRIMARY KEY(`id`)
);
