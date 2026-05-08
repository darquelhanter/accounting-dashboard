import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const obrigacoes = [
  {
    nome: 'INSS',
    descricao: 'Contribuição ao Instituto Nacional de Seguridade Social. Obrigação mensal de recolhimento de contribuições patronais e de terceiros.',
    categoria: 'Trabalhista',
    periodicidade: 'Mensal',
    vencimento: 20,
    regimeTributario: 'Todos',
  },
  {
    nome: 'FGTS',
    descricao: 'Fundo de Garantia do Tempo de Serviço. Depósito mensal de 8% sobre a folha de pagamento dos funcionários.',
    categoria: 'Trabalhista',
    periodicidade: 'Mensal',
    vencimento: 7,
    regimeTributario: 'Todos',
  },
  {
    nome: 'eSocial',
    descricao: 'Sistema de Escrituração Fiscal Digital de Informações Sociais, Trabalhistas e Contribuições Sindicais. Envio de informações sobre folha de pagamento.',
    categoria: 'Acessória',
    periodicidade: 'Mensal',
    vencimento: 7,
    regimeTributario: 'Todos',
  },
  {
    nome: 'Folha Mensal',
    descricao: 'Processamento e pagamento da folha de pagamento dos funcionários. Inclui cálculo de salários, descontos e encargos.',
    categoria: 'Trabalhista',
    periodicidade: 'Mensal',
    vencimento: 5,
    regimeTributario: 'Todos',
  },
  {
    nome: 'DCTFWeb',
    descricao: 'Declaração de Débitos e Créditos Tributários Federais. Declaração mensal de impostos federais devidos.',
    categoria: 'Fiscal',
    periodicidade: 'Mensal',
    vencimento: 15,
    regimeTributario: 'Lucro Real',
  },
];

async function seedObrigacoes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'accounting_dashboard',
  });

  try {
    // Get the first user (owner)
    const [users] = await connection.query('SELECT id FROM users LIMIT 1');
    
    if (!users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado. Crie um usuário primeiro.');
      return;
    }

    const userId = users[0].id;

    // Check if obrigações already exist
    const [existing] = await connection.query(
      'SELECT COUNT(*) as count FROM obrigacoes WHERE user_id = ?',
      [userId]
    );

    if (existing[0].count > 0) {
      console.log(`✅ Obrigações já existem para o usuário ${userId}. Pulando seed.`);
      await connection.end();
      return;
    }

    // Insert obrigações
    for (const obrigacao of obrigacoes) {
      await connection.query(
        `INSERT INTO obrigacoes (user_id, nome, descricao, categoria, periodicidade, vencimento, regime_tributario, ativo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())`,
        [
          userId,
          obrigacao.nome,
          obrigacao.descricao,
          obrigacao.categoria,
          obrigacao.periodicidade,
          obrigacao.vencimento,
          obrigacao.regimeTributario,
        ]
      );
    }

    console.log(`✅ ${obrigacoes.length} obrigações criadas com sucesso para o usuário ${userId}`);
  } catch (error) {
    console.error('❌ Erro ao fazer seed de obrigações:', error.message);
  } finally {
    await connection.end();
  }
}

seedObrigacoes();
