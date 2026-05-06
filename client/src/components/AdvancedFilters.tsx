import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Filter } from 'lucide-react';
import { DashboardData } from '@/hooks/useExcelParser';

export interface FilterState {
  clientes: string[];
  statusObrigacoes: string[];
  periodo: { inicio: string; fim: string };
}

interface AdvancedFiltersProps {
  data: DashboardData | null;
  onFilterChange: (filters: FilterState) => void;
}

export default function AdvancedFilters({ data, onFilterChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    clientes: [],
    statusObrigacoes: [],
    periodo: { inicio: '', fim: '' }
  });

  const statusOptions = ['Feito', 'Pendente', 'Em Progresso', 'Bloqueado', 'N/A'];
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const clientesList = data?.clientes.map(c => c.nome) || [];

  const handleClienteToggle = (cliente: string) => {
    setFilters(prev => ({
      ...prev,
      clientes: prev.clientes.includes(cliente)
        ? prev.clientes.filter(c => c !== cliente)
        : [...prev.clientes, cliente]
    }));
  };

  const handleStatusToggle = (status: string) => {
    setFilters(prev => ({
      ...prev,
      statusObrigacoes: prev.statusObrigacoes.includes(status)
        ? prev.statusObrigacoes.filter(s => s !== status)
        : [...prev.statusObrigacoes, status]
    }));
  };

  const handlePeriodoChange = (type: 'inicio' | 'fim', value: string) => {
    setFilters(prev => ({
      ...prev,
      periodo: {
        ...prev.periodo,
        [type]: value
      }
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      clientes: [],
      statusObrigacoes: [],
      periodo: { inicio: '', fim: '' }
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = 
    filters.clientes.length > 0 || 
    filters.statusObrigacoes.length > 0 || 
    filters.periodo.inicio || 
    filters.periodo.fim;

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={hasActiveFilters ? "default" : "outline"}
        className={`gap-2 ${hasActiveFilters ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
      >
        <Filter className="w-4 h-4" />
        Filtros
        {hasActiveFilters && (
          <span className="ml-2 px-2 py-0.5 bg-white text-blue-600 rounded text-xs font-semibold">
            {filters.clientes.length + filters.statusObrigacoes.length + (filters.periodo.inicio ? 1 : 0) + (filters.periodo.fim ? 1 : 0)}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-96 border-blue-200 shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filtros Avançados</CardTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Filtro de Clientes */}
            <div>
              <h3 className="font-semibold text-sm text-slate-900 mb-3">Clientes</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {clientesList.length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum cliente disponível</p>
                ) : (
                  clientesList.map(cliente => (
                    <label key={cliente} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.clientes.includes(cliente)}
                        onChange={() => handleClienteToggle(cliente)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600"
                      />
                      <span className="text-sm text-slate-700">{cliente}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Filtro de Status de Obrigações */}
            <div>
              <h3 className="font-semibold text-sm text-slate-900 mb-3">Status de Obrigações</h3>
              <div className="space-y-2">
                {statusOptions.map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.statusObrigacoes.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro de Período */}
            <div>
              <h3 className="font-semibold text-sm text-slate-900 mb-3">Período</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Mês Inicial</label>
                  <select
                    value={filters.periodo.inicio}
                    onChange={(e) => handlePeriodoChange('inicio', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {meses.map(mes => (
                      <option key={mes} value={mes}>{mes}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Mês Final</label>
                  <select
                    value={filters.periodo.fim}
                    onChange={(e) => handlePeriodoChange('fim', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {meses.map(mes => (
                      <option key={mes} value={mes}>{mes}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <Button
                onClick={handleApplyFilters}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Aplicar Filtros
              </Button>
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="flex-1"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
