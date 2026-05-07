CREATE TABLE `checklist_obrigacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clienteId` int NOT NULL,
	`obrigacaoId` int NOT NULL,
	`mes` varchar(10) NOT NULL,
	`ano` int NOT NULL,
	`status` enum('Feito','Pendente','Em Progresso','Bloqueado','N/A') DEFAULT 'Pendente',
	`responsavel` varchar(255),
	`horaInicial` varchar(5),
	`horaFinal` varchar(5),
	`totalHoras` decimal(5,2),
	`dataConlusao` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checklist_obrigacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`regime` enum('Simples','Lucro Presumido','Lucro Real') NOT NULL,
	`setor` enum('Fiscal','Trabalhista','Contábil','Geral') DEFAULT 'Geral',
	`valor` decimal(10,2) NOT NULL,
	`vencimento` int NOT NULL,
	`status` enum('Ativo','Inativo') DEFAULT 'Ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `controle_mensalidades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clienteId` int NOT NULL,
	`mes` varchar(10) NOT NULL,
	`ano` int NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`status` enum('Pago','Pendente','Atrasado') DEFAULT 'Pendente',
	`dataPagamento` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `controle_mensalidades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obrigacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`categoria` enum('Fiscal','Acessória','Trabalhista','Outra') NOT NULL,
	`periodicidade` enum('Mensal','Anual','Contínuo') NOT NULL,
	`vencimento` int,
	`regime` enum('Simples','Todos','Com Funcionários') NOT NULL,
	`descricao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `obrigacoes_id` PRIMARY KEY(`id`)
);
