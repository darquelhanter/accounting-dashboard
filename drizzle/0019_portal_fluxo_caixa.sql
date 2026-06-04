CREATE TABLE `portal_fluxo_caixa` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `clienteId` int NOT NULL,
  `tipo` enum('entrada','saida') NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `mes` varchar(10) NOT NULL,
  `ano` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
