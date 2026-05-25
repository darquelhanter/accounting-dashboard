CREATE TABLE `acessos_empresas` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `clienteId` int NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `email` varchar(320),
  `senha` varchar(500),
  `telefone` varchar(30),
  `observacao` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `acessos_empresas_id` PRIMARY KEY(`id`)
);
