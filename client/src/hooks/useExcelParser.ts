import * as XLSX from 'xlsx';

export interface ClienteData {
  nome: string;
  cnpj: string;
  regime: string;
  setor: string;
  valor: number;
  vencimento: number;
  status: string;
}

export interface ObrigacaoData {
  nome: string;
  categoria: string;
  periodicidade: string;
  vencimento: string;
  regime: string;
  descricao: string;
}

export interface ChecklistData {
  cliente: string;
  obrigacao: string;
  setor: string;
  responsavel: string;
  horaInicial: string;
  horaFinal: string;
  meses: { [key: string]: string };
}

export interface MensalidadeData {
  cliente: string;
  vencimento: number;
  valor: number;
  setor: string;
  meses: { [key: string]: string };
}

export interface DashboardData {
  clientes: ClienteData[];
  obrigacoes: ObrigacaoData[];
  checklist: ChecklistData[];
  mensalidades: MensalidadeData[];
}

export const useExcelParser = () => {
  const parseExcelFile = (file: File): Promise<DashboardData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          const result: DashboardData = {
            clientes: [],
            obrigacoes: [],
            checklist: [],
            mensalidades: []
          };

          // Processar aba de Clientes
          if (workbook.SheetNames.includes('2. Cadastro Clientes')) {
            const clientesSheet = workbook.Sheets['2. Cadastro Clientes'];
            const clientesData = XLSX.utils.sheet_to_json(clientesSheet, { header: 1 });
            
            // Pular cabeçalho
            for (let i = 1; i < clientesData.length; i++) {
              const row = clientesData[i] as any[];
              if (row[1]) { // Se tem nome
                result.clientes.push({
                  nome: row[1]?.toString() || '',
                  cnpj: row[2]?.toString() || '',
                  regime: row[3]?.toString() || '',
                  setor: row[4]?.toString() || '',
                  valor: parseFloat(row[5]) || 0,
                  vencimento: parseInt(row[6]) || 10,
                  status: row[7]?.toString() || 'Ativo'
                });
              }
            }
          }

          // Processar aba de Obrigações
          if (workbook.SheetNames.includes('3. Obrigações')) {
            const obrigSheet = workbook.Sheets['3. Obrigações'];
            const obrigData = XLSX.utils.sheet_to_json(obrigSheet, { header: 1 });
            
            // Pular cabeçalho (linha 4)
            for (let i = 4; i < obrigData.length; i++) {
              const row = obrigData[i] as any[];
              if (row[1] && !row[1].toString().includes('📌')) {
                result.obrigacoes.push({
                  nome: row[1]?.toString() || '',
                  categoria: row[0]?.toString() || '',
                  periodicidade: row[2]?.toString() || '',
                  vencimento: row[3]?.toString() || '',
                  regime: row[4]?.toString() || '',
                  descricao: row[5]?.toString() || ''
                });
              }
            }
          }

          // Processar aba de Checklist
          if (workbook.SheetNames.includes('4. Checklist Obrigações')) {
            const checklistSheet = workbook.Sheets['4. Checklist Obrigações'];
            const checklistData = XLSX.utils.sheet_to_json(checklistSheet, { header: 1 });
            
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            
            for (let i = 1; i < checklistData.length; i++) {
              const row = checklistData[i] as any[];
              if (row[0]) { // Se tem cliente
                const mesesData: { [key: string]: string } = {};
                for (let j = 0; j < meses.length; j++) {
                  mesesData[meses[j]] = row[7 + j]?.toString() || '';
                }
                
                result.checklist.push({
                  cliente: row[0]?.toString() || '',
                  obrigacao: row[1]?.toString() || '',
                  setor: row[2]?.toString() || '',
                  responsavel: row[3]?.toString() || '',
                  horaInicial: row[4]?.toString() || '',
                  horaFinal: row[5]?.toString() || '',
                  meses: mesesData
                });
              }
            }
          }

          // Processar aba de Mensalidades
          if (workbook.SheetNames.includes('5. Controle Mensalidades')) {
            const mensalSheet = workbook.Sheets['5. Controle Mensalidades'];
            const mensalData = XLSX.utils.sheet_to_json(mensalSheet, { header: 1 });
            
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            
            for (let i = 1; i < mensalData.length; i++) {
              const row = mensalData[i] as any[];
              if (row[0]) { // Se tem cliente
                const mesesData: { [key: string]: string } = {};
                for (let j = 0; j < meses.length; j++) {
                  mesesData[meses[j]] = row[4 + j]?.toString() || '';
                }
                
                result.mensalidades.push({
                  cliente: row[0]?.toString() || '',
                  vencimento: parseInt(row[1]) || 10,
                  valor: parseFloat(row[2]) || 0,
                  setor: row[3]?.toString() || '',
                  meses: mesesData
                });
              }
            }
          }

          resolve(result);
        } catch (error) {
          reject(new Error(`Erro ao processar arquivo: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };

      reader.readAsBinaryString(file);
    });
  };

  return { parseExcelFile };
};
