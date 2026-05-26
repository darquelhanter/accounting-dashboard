CREATE TABLE `responsaveis` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `nome` varchar(255) NOT NULL,
  `email` varchar(320),
  `telefone` varchar(20),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `responsaveis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clientes` ADD COLUMN `telefone` varchar(20) NULL;
--> statement-breakpoint
ALTER TABLE `clientes` ADD COLUMN `responsavelId` int NULL;
