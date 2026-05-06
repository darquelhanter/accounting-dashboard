import { useMemo } from 'react';
import { DashboardData } from './useExcelParser';
import { FilterState } from '@/components/AdvancedFilters';

export const useFilteredData = (data: DashboardData | null, filters: FilterState) => {
  return useMemo(() => {
    if (!data) return null;

    // Filtrar clientes
    let filteredClientes = data.clientes;
    if (filters.clientes.length > 0) {
      filteredClientes = filteredClientes.filter(c => 
        filters.clientes.includes(c.nome)
      );
    }

    // Filtrar checklist por cliente e status
    let filteredChecklist = data.checklist;
    if (filters.clientes.length > 0) {
      filteredChecklist = filteredChecklist.filter(c => 
        filters.clientes.includes(c.cliente)
      );
    }

    // Aplicar filtro de período ao checklist
    if (filters.periodo.inicio || filters.periodo.fim) {
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const inicioIndex = filters.periodo.inicio ? meses.indexOf(filters.periodo.inicio) : 0;
      const fimIndex = filters.periodo.fim ? meses.indexOf(filters.periodo.fim) : 11;

      filteredChecklist = filteredChecklist.map(item => {
        const filteredMeses: { [key: string]: string } = {};
        meses.forEach((mes, index) => {
          if (index >= inicioIndex && index <= fimIndex) {
            filteredMeses[mes] = item.meses[mes] || '';
          }
        });
        return { ...item, meses: filteredMeses };
      });
    }

    // Filtrar por status de obrigações
    if (filters.statusObrigacoes.length > 0) {
      filteredChecklist = filteredChecklist.filter(item => {
        const hasStatus = Object.values(item.meses).some(status =>
          filters.statusObrigacoes.includes(status)
        );
        return hasStatus;
      });
    }

    // Filtrar mensalidades
    let filteredMensalidades = data.mensalidades;
    if (filters.clientes.length > 0) {
      filteredMensalidades = filteredMensalidades.filter(m => 
        filters.clientes.includes(m.cliente)
      );
    }

    return {
      clientes: filteredClientes,
      obrigacoes: data.obrigacoes,
      checklist: filteredChecklist,
      mensalidades: filteredMensalidades
    };
  }, [data, filters]);
};

// Hook para calcular estatísticas filtradas
export const useFilteredStats = (filteredData: ReturnType<typeof useFilteredData>) => {
  return useMemo(() => {
    if (!filteredData) {
      return {
        totalClientes: 0,
        receitaTotal: 0,
        vencimento10: 0,
        vencimento20: 0,
        statusRecebimento: [
          { name: "Pago", value: 0, fill: "#10b981" },
          { name: "Pendente", value: 0, fill: "#f59e0b" },
          { name: "Atrasado", value: 0, fill: "#ef4444" }
        ],
        statusObrigacoes: [
          { status: "Feito", quantidade: 0, fill: "#10b981" },
          { status: "Pendente", quantidade: 0, fill: "#f59e0b" },
          { status: "Em Progresso", quantidade: 0, fill: "#3b82f6" },
          { status: "Bloqueado", quantidade: 0, fill: "#ef4444" }
        ]
      };
    }

    const totalClientes = filteredData.clientes.length;
    const receitaTotal = filteredData.clientes.reduce((sum, c) => sum + c.valor, 0);
    const vencimento10 = filteredData.clientes.filter(c => c.vencimento === 10).length;
    const vencimento20 = filteredData.clientes.filter(c => c.vencimento === 20).length;

    // Calcular status de recebimento
    let pago = 0, pendente = 0, atrasado = 0;
    filteredData.mensalidades.forEach(m => {
      Object.values(m.meses).forEach(status => {
        if (status === 'Pago') pago++;
        else if (status === 'Pendente') pendente++;
        else if (status === 'Atrasado') atrasado++;
      });
    });

    // Calcular status de obrigações
    let feito = 0, pendentOb = 0, emProgresso = 0, bloqueado = 0;
    filteredData.checklist.forEach(item => {
      Object.values(item.meses).forEach(status => {
        if (status === 'Feito') feito++;
        else if (status === 'Pendente') pendentOb++;
        else if (status === 'Em Progresso') emProgresso++;
        else if (status === 'Bloqueado') bloqueado++;
      });
    });

    return {
      totalClientes,
      receitaTotal,
      vencimento10,
      vencimento20,
      statusRecebimento: [
        { name: "Pago", value: pago, fill: "#10b981" },
        { name: "Pendente", value: pendente, fill: "#f59e0b" },
        { name: "Atrasado", value: atrasado, fill: "#ef4444" }
      ],
      statusObrigacoes: [
        { status: "Feito", quantidade: feito, fill: "#10b981" },
        { status: "Pendente", quantidade: pendentOb, fill: "#f59e0b" },
        { status: "Em Progresso", quantidade: emProgresso, fill: "#3b82f6" },
        { status: "Bloqueado", quantidade: bloqueado, fill: "#ef4444" }
      ]
    };
  }, [filteredData]);
};
