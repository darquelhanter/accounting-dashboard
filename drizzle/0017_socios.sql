CREATE TABLE `socios` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `clienteId` int NOT NULL,
  `nome` varchar(255) NOT NULL,
  `cpf` varchar(14),
  `participacao` decimal(5,2),
  `cargo` varchar(100),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `socios_id` PRIMARY KEY(`id`)
);
