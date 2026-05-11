CREATE TABLE `notificacao_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ativarMensalidades` boolean NOT NULL DEFAULT true,
	`diasAntecedencia` int NOT NULL DEFAULT 3,
	`ativarObrigacoes` boolean NOT NULL DEFAULT true,
	`ativarChecklist` boolean NOT NULL DEFAULT true,
	`horarioEnvio` varchar(5) NOT NULL DEFAULT '09:00',
	`frequencia` enum('Diaria','Semanal','Mensal') NOT NULL DEFAULT 'Diaria',
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificacao_configs_id` PRIMARY KEY(`id`)
);
