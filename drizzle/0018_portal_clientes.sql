CREATE TABLE `portal_clientes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clienteId` int NOT NULL,
  `cnpj` varchar(18) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `ativo` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `portal_clientes_id` PRIMARY KEY(`id`),
  CONSTRAINT `portal_clientes_clienteId_unique` UNIQUE(`clienteId`)
);
