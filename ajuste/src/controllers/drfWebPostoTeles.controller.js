const axios = require('axios');
const db = require("../config/database");
const moment = require('moment');


exports.empresa = async (req, res) => {
  const chave = '0074c943-1e6d-4f9f-9a1e-62d0e7c02a86';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/EMPRESAS';
  
  try {
      // Faz a solicitação HTTP
      const response = await axios.get(baseUrl, {
          params: { chave }
      });

      // Processa a resposta da API
      const data = response.data;
      console.log('Resposta da API:', data.resultados);

      // Conecta ao banco de dados PostgreSQL
      await db.query_webpostoteles("BEGIN");

      // Insere os dados na tabela do banco de dados
      for (const item of data.resultados) {
          // Remove . - e / do campo cnpj
          const cleanedCnpj = item.cnpj.replace(/[.\-\/]/g, '');

          const query = `INSERT INTO redeteles.tab_empresa ("empresaCodigo", fantasia, num_cnpj) VALUES ($1, $2, $3)`;
          const values = [item.empresaCodigo, item.fantasia, cleanedCnpj];
          await db.query_webpostoteles(query, values);
      }

      // Encerra a conexão com o banco de dados PostgreSQL
      await db.query_webpostoteles("COMMIT");

      res.status(200).json({
          message: "Atualizacao Ok",
      });
  } catch (error) {
      await db.query_webpostoteles("ROLLBACK");
      console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
      res.status(500).json({
          message: "Falha ao atualizar as empresas",
          error: error.message
      });
  }
};

exports.produtos = async (req, res) => {
  const chave = '0074c943-1e6d-4f9f-9a1e-62d0e7c02a86';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/PRODUTO';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000; // Total de registros que você precisa


  let ultimoCodigoResult  = await db.query_webpostoteles(`select max("produtoCodigo") from redeteles.tab_item`);
  let ultimoCodigo = ultimoCodigoResult.rows[0].max;

  const getRecords = async () => {
    const params = {
      chave,
      limite,
      ultimoCodigo
    };
    
    const response = await axios.get(baseUrl, { params });
    return response.data;
  };

  const fetchAllRecords = async () => {
    let allRecords = [];

    while (allRecords.length < totalRegistros) {
      const data = await getRecords(ultimoCodigo);
      const records = data.resultados;
      allRecords = allRecords.concat(records);

      // Se a API retornar menos do que o limite, isso significa que não há mais registros
      if (records.length < limite) {
        break;
      }

      // Atualizar o ultimoCodigo para a próxima requisição
      ultimoCodigo = records[records.length - 1].produtoCodigo;
    }

    return allRecords.slice(0, totalRegistros); // Garantir que retornamos exatamente 5000 registros
  };

  try {
    const allRecords = await fetchAllRecords();
    console.log('Total de registros obtidos:', allRecords.length);

    await db.query_webpostoteles("BEGIN");

    for (const item of allRecords) {
      const query = `INSERT INTO redeteles.tab_item ("produtoCodigo", nome, "referenciaCodigo", "codigoBarra") VALUES ($1, $2, $3, $4)`;
      const values = [item.produtoCodigo, item.nome, item.referenciaCodigo, item.produtoCodigoBarra[0]?.codigoBarra || null];
      await db.query_webpostoteles(query, values);
    }

    await db.query_webpostoteles("COMMIT");

    res.status(200).json({
      message: "Atualizacao Ok",
      totalRecords: allRecords.length
    });
  } catch (error) {
    await db.query_webpostoteles("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar os produtos",
      error: error.message
    });
  }
};

exports.vendaItem = async (req, res) => {
    const chave = '0074c943-1e6d-4f9f-9a1e-62d0e7c02a86';
    const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/VENDA_ITEM';
    const limite = 2000; // Máximo permitido por requisição
    const totalRegistros = 100000000; // Total de registros que você precisa
    const dataInicial = "2024-01-01"
    const dataFinal = moment().format('YYYY-MM-DD');
    //const empresaCodigo = 12064

    let ultimoCodigoResult  = await db.query_webpostoteles(`select max("vendaItemCodigo") from redeteles.tab_venda_item`);
    let ultimoCodigo = ultimoCodigoResult.rows[0].max;
  
    const getRecords = async () => {
      const params = {
        chave,
        limite,
        ultimoCodigo,
        dataInicial,
        dataFinal,
        // empresaCodigo
      };
      console.log(baseUrl, { params })
      const response = await axios.get(baseUrl, { params });
      return response.data;

    };
  
    const fetchAllRecords = async () => {
      let allRecords = [];
  
      while (allRecords.length < totalRegistros) {
        const data = await getRecords(ultimoCodigo);
        const records = data.resultados;
        allRecords = allRecords.concat(records);
  
        // Se a API retornar menos do que o limite, isso significa que não há mais registros
        if (records.length < limite) {
          break;
        }
  
        // Atualizar o ultimoCodigo para a próxima requisição
        ultimoCodigo = records[records.length - 1].vendaItemCodigo;
      }
  
      return allRecords.slice(0, totalRegistros); // Garantir que retornamos exatamente 5000 registros
    };

  
    try {
      const allRecords = await fetchAllRecords();
      console.log('Total de registros obtidos:', allRecords.length);

      res.status(200).json({
        message: "Insert em andamento",
        totalRecords: allRecords.length
      });
  
      await db.query_webpostoteles("BEGIN");
  
      for (const item of allRecords) {
        const query = `INSERT INTO redeteles.tab_venda_item ("empresaCodigo", "dataMovimento", "vendaItemCodigo", "produtoCodigo", quantidade, "precoCusto", "totalCusto", "precoVenda", "totalVenda") 
                        VALUES 
                        ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
        const values = [item.empresaCodigo, item.dataMovimento, item.vendaItemCodigo, item.produtoCodigo, item.quantidade, item.precoCusto, item.totalCusto, item.precoVenda, item.totalVenda];
        await db.query_webpostoteles(query, values);
      }
  
      await db.query_webpostoteles("COMMIT");
  
    } catch (error) {
      await db.query_webpostoteles("ROLLBACK");
      console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
      res.status(500).json({
        message: "Falha ao atualizar os produtos",
        error: error.message
      });
    }
};

exports.compraItem = async (req, res) => {
    const chave = '0074c943-1e6d-4f9f-9a1e-62d0e7c02a86';
    const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/COMPRA_ITEM';
    const limite = 2000; // Máximo permitido por requisição
    const totalRegistros = 10000000; // Total de registros que você precisa
    const dataInicial = "2024-01-01"
    const dataFinal = moment().format('YYYY-MM-DD');
    const empresaCodigo = 12064

    let ultimoCodigoResult  = await db.query_webpostoteles(`select max("compraCodigo") from redeteles.tab_compra_item`);
    let ultimoCodigo = ultimoCodigoResult.rows[0].max;
  
    const getRecords = async () => {
      const params = {
        chave,
        limite,
        ultimoCodigo,
        dataInicial,
        dataFinal,
        // empresaCodigo
      };
      console.log(baseUrl, { params })
      const response = await axios.get(baseUrl, { params });
      return response.data;

    };
  
    const fetchAllRecords = async () => {
      let allRecords = [];
  
      while (allRecords.length < totalRegistros) {
        const data = await getRecords(ultimoCodigo);
        const records = data.resultados;
        allRecords = allRecords.concat(records);
  
        // Se a API retornar menos do que o limite, isso significa que não há mais registros
        if (records.length < limite) {
          break;
        }
  
        // Atualizar o ultimoCodigo para a próxima requisição
        ultimoCodigo = records[records.length - 1].compraCodigo;
      }
  
      return allRecords.slice(0, totalRegistros); // Garantir que retornamos exatamente 5000 registros
    };

  
    try {
      const allRecords = await fetchAllRecords();
      console.log('Total de registros obtidos:', allRecords.length);

      res.status(200).json({
        message: "Insert em andamento",
        totalRecords: allRecords.length
      });
  
      await db.query_webpostoteles("BEGIN");
  
      for (const item of allRecords) {
        const query = `INSERT INTO redeteles.tab_compra_item ("empresaCodigo", "dataEntrada", "compraCodigo", "produtoCodigo", quantidade, "precoCusto", "totalCusto", "precoCompra", "totalCompra") 
                        VALUES 
                        ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
        const values = [item.empresaCodigo, item.dataEntrada, item.compraCodigo, item.produtoCodigo, item.quantide, item.precoCusto, item.totalCusto, item.precoCompra, item.totalCompra];
        await db.query_webpostoteles(query, values);
      }
  
      await db.query_webpostoteles("COMMIT");
  
    } catch (error) {
      await db.query_webpostoteles("ROLLBACK");
      console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
      res.status(500).json({
        message: "Falha ao atualizar os produtos",
        error: error.message
      });
    }
};

exports.funcionario = async (req, res) => {
    const chave = '0074c943-1e6d-4f9f-9a1e-62d0e7c02a86';
    const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/FUNCIONARIO';
    const limite = 1000; // Máximo permitido por requisição
    const totalRegistros = 10000000; // Total de registros que você precisa
    const dataInicial = "2024-01-01"
    const dataFinal = "2024-05-20"
    const empresaCodigo = 12064

    await db.query_webpostoteles(`delete from redeteles.tab_funcionario`);
    let ultimoCodigo = 0;
  
    const getRecords = async () => {
      const params = {
        chave,
        limite,
        ultimoCodigo,
        //dataInicial,
        //dataFinal,
        // empresaCodigo
      };
      console.log(baseUrl, { params })
      const response = await axios.get(baseUrl, { params });
      return response.data;

    };
  
    const fetchAllRecords = async () => {
      let allRecords = [];
  
      while (allRecords.length < totalRegistros) {
        const data = await getRecords(ultimoCodigo);
        const records = data.resultados;
        allRecords = allRecords.concat(records);
  
        // Se a API retornar menos do que o limite, isso significa que não há mais registros
        if (records.length < limite) {
          break;
        }
  
        // Atualizar o ultimoCodigo para a próxima requisição
        ultimoCodigo = records[records.length - 1].codigo;
      }
  
      return allRecords.slice(0, totalRegistros); // Garantir que retornamos exatamente 5000 registros
    };

  
    try {
      const allRecords = await fetchAllRecords();
      console.log('Total de registros obtidos:', allRecords.length);

      res.status(200).json({
        message: "Insert em andamento",
        totalRecords: allRecords.length
      });
  
      await db.query_webpostoteles("BEGIN");
  
      for (const item of allRecords) {
        const query = `INSERT INTO redeteles.tab_funcionario ("empresaCodigo", "funcionarioCodigo", "nome", "ultimoCodigo", "funcionarioCodigoExterno") 
                        VALUES 
                        ($1, $2, $3, $4, $5)`;
        const values = [item.empresaCodigo, item.funcionarioCodigo, item.nome, item.codigo, item.funcionarioCodigoExterno];
        await db.query_webpostoteles(query, values);
      }
  
      await db.query_webpostoteles("COMMIT");
  
    } catch (error) {
      await db.query_webpostoteles("ROLLBACK");
      console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
      res.status(500).json({
        message: "Falha ao atualizar os produtos",
        error: error.message
      });
    }
};

exports.valeFuncionario = async (req, res) => {
  const chave = '0074c943-1e6d-4f9f-9a1e-62d0e7c02a86';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/VALE_FUNCIONARIO';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult  = await db.query_webpostoteles(`select max("ultimoCodigo") from redeteles.tab_vale_funcionario`)
  let ultimoCodigo = ultimoCodigoResult.rows[0].max;

  const getRecords = async (ultimoCodigo) => {
    const params = {
      chave,
      limite,
      ultimoCodigo,
      dataInicial,
      dataFinal,
      // empresaCodigo
    };
    console.log(baseUrl, { params })
    const response = await axios.get(baseUrl, { params });
    return response.data;

  };

  const fetchAllRecords = async () => {
    let allRecords = [];

    while (allRecords.length < totalRegistros) {
      const data = await getRecords(ultimoCodigo);
      const records = data.resultados;
      allRecords = allRecords.concat(records);

      // Se a API retornar menos do que o limite, isso significa que não há mais registros
      if (records.length < limite) {
        break;
      }

      // Atualizar o ultimoCodigo para a próxima requisição
      ultimoCodigo = records[records.length - 1].codigo;
    }

    return allRecords.slice(0, totalRegistros); // Garantir que retornamos exatamente 5000 registros
  };


  try {
    const allRecords = await fetchAllRecords();
    console.log('Total de registros obtidos:', allRecords.length);

    res.status(200).json({
      message: "Insert em andamento",
      totalRecords: allRecords.length,
      ultimoCodigo: ultimoCodigo
    });

    await db.query_webpostoteles("BEGIN");

    for (const item of allRecords) {
      const query = `INSERT INTO redeteles.tab_vale_funcionario ("empresaCodigo", "funcionarioCodigo", origem, descricao, data, valor, turno, "ultimoCodigo" ) 
                      VALUES 
                      ($1, $2, $3, $4, $5, $6, $7, $8)`;
      const values = [item.empresaCodigo, item.funcionarioCodigo, item.origem, item.descricao, item.data, item.valor, item.turno, item.codigo];
      await db.query_webpostoteles(query, values);
    }

    await db.query_webpostoteles("COMMIT");

  } catch (error) {
    await db.query_webpostoteles("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar os produtos",
      error: error.message
    });
  }
};

