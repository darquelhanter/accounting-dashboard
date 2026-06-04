ALTER TABLE `portal_clientes`
  ADD COLUMN `mostrarMensalidades` boolean NOT NULL DEFAULT false,
  ADD COLUMN `mostrarServicos` boolean NOT NULL DEFAULT false;
