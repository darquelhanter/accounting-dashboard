CREATE TABLE `pasta_descricoes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `cliente_id` int NOT NULL,
  `path` varchar(500) NOT NULL,
  `descricao` text,
  `created_at` timestamp DEFAULT (now()),
  CONSTRAINT `pasta_descricoes_pk` PRIMARY KEY(`id`),
  CONSTRAINT `pasta_descricoes_unique` UNIQUE(`cliente_id`, `path`)
);
