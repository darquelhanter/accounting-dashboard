import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useExcelParser, DashboardData } from '@/hooks/useExcelParser';
import { toast } from 'sonner';

interface ExcelUploadProps {
  onDataLoaded: (data: DashboardData) => void;
}

export default function ExcelUpload({ onDataLoaded }: ExcelUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parseExcelFile } = useExcelParser();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      setUploadStatus('error');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);
    setUploadStatus('idle');

    try {
      const data = await parseExcelFile(file);
      
      // Validar se os dados foram carregados
      if (data.clientes.length === 0 && data.obrigacoes.length === 0) {
        toast.warning('Nenhum dado foi encontrado na planilha. Verifique o formato.');
        setUploadStatus('error');
      } else {
        onDataLoaded(data);
        setUploadStatus('success');
        toast.success(`Planilha carregada com sucesso! ${data.clientes.length} clientes encontrados.`);
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar o arquivo. Verifique o formato.');
      setUploadStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50', 'border-blue-400');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        handleFileSelect({ target: fileInputRef.current } as any);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-blue-400 hover:bg-blue-50"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          {isLoading ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-slate-600">Processando arquivo...</p>
            </>
          ) : uploadStatus === 'success' ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-600" />
              <p className="text-sm font-medium text-green-600">Arquivo carregado com sucesso!</p>
              <p className="text-xs text-slate-500">{fileName}</p>
            </>
          ) : uploadStatus === 'error' ? (
            <>
              <AlertCircle className="w-12 h-12 text-red-600" />
              <p className="text-sm font-medium text-red-600">Erro ao carregar arquivo</p>
              <p className="text-xs text-slate-500">Tente novamente</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900">Arraste sua planilha aqui</p>
                <p className="text-xs text-slate-500 mt-1">ou clique para selecionar</p>
              </div>
              <p className="text-xs text-slate-400 mt-2">Formatos aceitos: .xlsx, .xls</p>
            </>
          )}
        </div>
      </div>

      {fileName && uploadStatus !== 'success' && (
        <p className="text-xs text-slate-500 mt-3 text-center">Arquivo selecionado: {fileName}</p>
      )}
    </div>
  );
}
