import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, ArrowUpDown } from "lucide-react";

interface ClienteFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  filterRegime: string;
  onRegimeChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
}

export function ClienteFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterRegime,
  onRegimeChange,
  sortBy,
  onSortChange,
  onClearFilters,
}: ClienteFiltersProps) {
  const hasActiveFilters =
    searchTerm || filterStatus !== "Todos" || filterRegime !== "Todos" || sortBy !== "nome";

  return (
    <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro por Status */}
        <Select value={filterStatus} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro por Regime */}
        <Select value={filterRegime} onValueChange={onRegimeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Regime" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Regimes</SelectItem>
            <SelectItem value="Simples">Simples</SelectItem>
            <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
            <SelectItem value="Lucro Real">Lucro Real</SelectItem>
            <SelectItem value="MEI">MEI</SelectItem>
          </SelectContent>
        </Select>

        {/* Ordenação */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nome">Nome (A-Z)</SelectItem>
            <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
            <SelectItem value="data-asc">Data (Antigos)</SelectItem>
            <SelectItem value="data-desc">Data (Recentes)</SelectItem>
            <SelectItem value="regime">Regime</SelectItem>
          </SelectContent>
        </Select>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      {/* Indicador de Filtros Ativos */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <ArrowUpDown className="w-4 h-4" />
          <span>
            {searchTerm && `Buscando: "${searchTerm}"`}
            {filterStatus !== "Todos" && ` • Status: ${filterStatus}`}
            {filterRegime !== "Todos" && ` • Regime: ${filterRegime}`}
            {sortBy !== "nome" && ` • Ordenado por: ${sortBy}`}
          </span>
        </div>
      )}
    </div>
  );
}
