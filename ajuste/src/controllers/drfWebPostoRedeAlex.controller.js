const axios = require('axios');
const db = require("../config/database");
const moment = require('moment');


exports.empresa = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
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
    await db.query_webpostoRedeAlex("BEGIN");
    await db.query_webpostoRedeAlex("delete from redealex.tab_empresa");

    // Insere os dados na tabela do banco de dados
    for (const item of data.resultados) {
      // Remove . - e / do campo cnpj
      const cleanedCnpj = item.cnpj.replace(/[.\-\/]/g, '');

      const query = `INSERT INTO redealex.tab_empresa ("empresaCodigo", fantasia, num_cnpj) VALUES ($1, $2, $3)`;
      const values = [item.empresaCodigo, item.fantasia, cleanedCnpj];
      await db.query_webpostoRedeAlex(query, values);
    }

    // Encerra a conexão com o banco de dados PostgreSQL
    await db.query_webpostoRedeAlex("COMMIT");

    res.status(200).json({
      message: "Atualizacao Ok",
    });
  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar as empresas",
      error: error.message
    });
  }
};

exports.produtos = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/PRODUTO';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000; // Total de registros que você precisa


  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("produtoCodigo") from redealex.tab_item`);
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      const query = `INSERT INTO redealex.tab_item ("produtoCodigo", nome, "referenciaCodigo", "codigoBarra") VALUES ($1, $2, $3, $4)`;
      const values = [item.produtoCodigo, item.nome, item.referenciaCodigo, item.produtoCodigoBarra[0]?.codigoBarra || null];
      await db.query_webpostoRedeAlex(query, values);
    }

    await db.query_webpostoRedeAlex("COMMIT");

    res.status(200).json({
      message: "Atualizacao Ok",
      totalRecords: allRecords.length
    });
  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar os produtos",
      error: error.message
    });
  }
};

exports.vendaItem = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/VENDA_ITEM';
  const limite = 2000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2025-01-01"
  const dataFinal = moment().format('YYYY-MM-DD');
  //const empresaCodigo = 12064

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("vendaItemCodigo") from redealex.tab_venda_item`);
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

    await db.transaction(async (client) => {

      for (const item of allRecords) {
        const query = `
            INSERT INTO redealex.tab_venda_item (
              "empresaCodigo", "vendaCodigo", "vendaItemCodigo", "dataMovimento", "produtoCodigo",
              "quantidade", "precoCusto", "totalCusto", "precoVenda", "totalVenda",
              "totalDesconto", "totalAcrescimo", "bicoCodigo", "tanqueCodigo", "produtoLmcCodigo",
              "funcionarioCodigo", "produtoKitCodigo", "controleItem", "icmsValor", "icmsBase",
              "icmsAliquota", cfop, cst, "produtoCodigoExterno", "cstPis",
              "aliquotaPis", "basePis", "valorPis", "cstCofins", "aliquotaCofins",
              "baseCofins", "valorCofins", "tributacaoAdRem", "valorTributacaoAdRem",
              codigo, "ultimoCodigo"
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15,
              $16, $17, $18, $19, $20,
              $21, $22, $23, $24, $25,
              $26, $27, $28, $29, $30,
              $31, $32, $33, $34,
              $35, $36
            )
          `;

        const values = [
          item.empresaCodigo,
          item.vendaCodigo,
          item.vendaItemCodigo,
          item.dataMovimento,
          item.produtoCodigo,
          item.quantidade,
          item.precoCusto,
          item.totalCusto,
          item.precoVenda,
          item.totalVenda,
          item.totalDesconto,
          item.totalAcrescimo,
          item.bicoCodigo,
          item.tanqueCodigo,
          item.produtoLmcCodigo,
          item.funcionarioCodigo,
          item.produtoKitCodigo,
          item.controleItem,
          item.icmsValor,
          item.icmsBase,
          item.icmsAliquota,
          item.cfop,
          item.cst,
          item.produtoCodigoExterno,
          item.cstPis,
          item.aliquotaPis,
          item.basePis,
          item.valorPis,
          item.cstCofins,
          item.aliquotaCofins,
          item.baseCofins,
          item.valorCofins,
          item.tributacaoAdRem,
          item.valorTributacaoAdRem,
          item.codigo,
          item.codigo // usado como ultimoCodigo
        ];

        await client.query(query, values);
      }

    })

    // Só responde ao cliente depois que todas as inserções foram concluídas
    res.status(200).json({
      message: "Todos os registros foram inseridos com sucesso",
      totalRecords: allRecords.length,
      ultimoCodigo: allRecords[allRecords.length - 1]?.codigo
    });

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar VENDAS ITEM",
      error: error.message
    });
  }
};

exports.compraItem = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/COMPRA_ITEM';
  const limite = 2000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-01-01"
  const dataFinal = moment().format('YYYY-MM-DD');
  const empresaCodigo = 12064

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("compraCodigo") from redealex.tab_compra_item`);
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
    ////console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      const query = `INSERT INTO redealex.tab_compra_item ("empresaCodigo", "dataEntrada", "compraCodigo", "produtoCodigo", quantidade, "precoCusto", "totalCusto", "precoCompra", "totalCompra") 
                        VALUES 
                        ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
      const values = [item.empresaCodigo, item.dataEntrada, item.compraCodigo, item.produtoCodigo, item.quantide, item.precoCusto, item.totalCusto, item.precoCompra, item.totalCompra];
      await db.query_webpostoRedeAlex(query, values);
    }

    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar os produtos",
      error: error.message
    });
  }
};

exports.funcionario = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/FUNCIONARIO';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-01-01"
  const dataFinal = "2024-05-20"
  const empresaCodigo = 12064

  await db.query_webpostoRedeAlex(`delete from redealex.tab_funcionario`);
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
    //console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      const query = `INSERT INTO redealex.tab_funcionario ("empresaCodigo", "funcionarioCodigo", "nome", "ultimoCodigo", "funcionarioCodigoExterno") 
                        VALUES 
                        ($1, $2, $3, $4, $5)`;
      const values = [item.empresaCodigo, item.funcionarioCodigo, item.nome, item.codigo, item.funcionarioCodigoExterno];
      await db.query_webpostoRedeAlex(query, values);
    }

    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar os produtos",
      error: error.message
    });
  }
};

exports.valeFuncionario = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/VALE_FUNCIONARIO';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_vale_funcionario`)
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
    ////console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      const query = `INSERT INTO redealex.tab_vale_funcionario ("empresaCodigo", "funcionarioCodigo", origem, descricao, data, valor, turno, "ultimoCodigo" ) 
                      VALUES 
                      ($1, $2, $3, $4, $5, $6, $7, $8)`;
      const values = [item.empresaCodigo, item.funcionarioCodigo, item.origem, item.descricao, item.data, item.valor, item.turno, item.codigo];
      await db.query_webpostoRedeAlex(query, values);
    }

    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar os produtos",
      error: error.message
    });
  }
};

exports.notaEntrada = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/COMPRA';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_nota_entrada`)
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
    //console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      const query = `INSERT INTO redealex.tab_nota_entrada (
              "empresaCodigo", "compraCodigo", "dataMovimento", "dataEntrada", "notaNumero",
              "notaSerie", "fornecedorCodigo", "transportadorCodigo", "placaVeiculo", "placaReboque",
              "valorTotal", "valorFrete", "tipoFrete", "chaveDocumento", "modeloDocumento",
              "cteNumero", "cteDataEmissao", "valorTotalProdutos", "bcIcms", "valorIcms",
              "icmsDesonerado", "bcIcmsSt", "valorIcmsSt", "fcpSt", "isento",
              "seguro", "desconto", "outrasDespesasAcessorias", "valorIpi", "observacao",
              "informacaoComplementar", "codigo", "usoConsumo", "finalidade", "ultimoCodigo"
                ) VALUES (
                    $1, $2, $3, $4, $5, 
                    $6, $7, $8, $9, $10, 
                    $11, $12, $13, $14, $15, 
                    $16, $17, $18, $19, $20, 
                    $21, $22, $23, $24, $25, 
                    $26, $27, $28, $29, $30, 
                    $31, $32, $33, $34, $35
                )`;

      const values = [
        item.empresaCodigo, item.compraCodigo, item.dataMovimento, item.dataEntrada, item.notaNumero,
        item.notaSerie, item.fornecedorCodigo, item.transportadorCodigo, item.placaVeiculo, item.placaReboque,
        item.valorTotal, item.valorFrete, item.tipoFrete, item.chaveDocumento, item.modeloDocumento,
        item.cteNumero, item.cteDataEmissao, item.valorTotalProdutos, item.bcIcms, item.valorIcms,
        item.icmsDesonerado, item.bcIcmsSt, item.valorIcmsSt, item.fcpSt, item.isento,
        item.seguro, item.desconto, item.outrasDespesasAcessorias, item.valorIpi, item.observacao,
        item.informacaoComplementar, item.codigo, item.usoConsumo, item.finalidade, item.codigo
      ];

      await db.query_webpostoRedeAlex(query, values);
    }

    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar os as notas de entrada",
      error: error.message
    });
  }
};

exports.tituloReceber = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/TITULO_RECEBER';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_titulo_receber`)
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
    //console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      const query = `INSERT INTO redealex.tab_titulo_receber (
        "empresaCodigo", "tituloCodigo", "dataMovimento", "dataVencimento", 
        "valor", "vendaCodigo", "duplicataCodigo", "tipo", "pendente", 
        "clienteCodigo", "dataPagamento", "planoContaGerencialCodigo", 
        "nomeCliente", "cpfCnpjCliente", "convertido", "documento", 
        "tituloNumero", "codigo", "ultimoCodigo"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        $11, $12, $13, $14, $15, $16, $17, $18, $19
      )`;

      const values = [
        item.empresaCodigo, item.tituloCodigo, item.dataMovimento,
        item.dataVencimento, item.valor, item.vendaCodigo,
        item.duplicataCodigo, item.tipo, item.pendente,
        item.clienteCodigo, item.dataPagamento, item.planoContaGerencialCodigo,
        item.nomeCliente, item.cpfCnpjCliente, item.convertido,
        item.documento, item.tituloNumero, item.codigo, item.codigo
      ];

      await db.query_webpostoRedeAlex(query, values);
    }

    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar titulos a receber",
      error: error.message
    });
  }
};

// exports.tituloPagar = async (req, res) => {
//   const chave = '54f6abd2-dd05-4809-888b-c57926959069';
//   const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/TITULO_PAGAR';
//   const limite = 1000; // Máximo permitido por requisição
//   const totalRegistros = 10000000; // Total de registros que você precisa
//   const dataInicial = "2024-05-01"
//   const dataFinal = moment().format('YYYY-MM-DD');

//   let ultimoCodigoResult  = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_titulo_pagar`)
//   let ultimoCodigo = ultimoCodigoResult.rows[0].max;

//   const getRecords = async (ultimoCodigo) => {
//     const params = {
//       chave,
//       limite,
//       ultimoCodigo,
//       dataInicial,
//       dataFinal,
//       // empresaCodigo
//     };
//     //console.log(baseUrl, { params })
//     const response = await axios.get(baseUrl, { params });
//     return response.data;

//   };

//   const fetchAllRecords = async () => {
//     let allRecords = [];

//     while (allRecords.length < totalRegistros) {
//       const data = await getRecords(ultimoCodigo);
//       const records = data.resultados;
//       allRecords = allRecords.concat(records);

//       // Se a API retornar menos do que o limite, isso significa que não há mais registros
//       if (records.length < limite) {
//         break;
//       }

//       // Atualizar o ultimoCodigo para a próxima requisição
//       ultimoCodigo = records[records.length - 1].codigo;
//     }

//     return allRecords.slice(0, totalRegistros); // Garantir que retornamos exatamente 5000 registros
//   };


//   try {
//     const allRecords = await fetchAllRecords();
//     console.log('Total de registros obtidos:', allRecords.length);

//     res.status(200).json({
//       message: "Insert em andamento",
//       totalRecords: allRecords.length,
//       ultimoCodigo: ultimoCodigo
//     });

//     await db.query_webpostoRedeAlex("BEGIN");

//     for (const item of allRecords) {
//       // Inserção na tabela tab_titulo_pagar
//       const queryTituloPagar = `INSERT INTO redealex.tab_titulo_pagar (
//           "empresaCodigo", "tituloPagarCodigo", "notaEntradaCodigo", "dataMovimento", "vencimento", 
//           "dataPagamento", "situacao", "tipo", "tipoLancamento", "valor", "valorPago", "desconto", 
//           "acrescimo", "cheque", "dinheiro", "troco", "adiantamento", "cartao", "fornecedorCodigo", 
//           "planoContaGerencialCodigo", "descricao", "numeroTitulo", "nomeFornecedor", 
//           "cpfCnpjFornecedor", "numeroRemessa", "planoContaGerencialNivel", 
//           "planoContaGerencialDescricao", "centroCustoCodigo", "centroCustoDescricao", 
//           "parcela", "quantidadeParcelas", "linhaDigitavel", "autorizado", "nossoNumero", 
//           "agenciaFornecedor", "contaFornecedor", "tipoChavePixFornecedor", "chavePixFornecedor", 
//           "qrCodePix", "codigo", "ultimoCodigo"
//       ) VALUES (
//           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
//           $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
//           $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
//           $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
//       )`;

//       const valuesTituloPagar = [
//           item.empresaCodigo, item.tituloPagarCodigo, item.notaEntradaCodigo, item.dataMovimento, item.vencimento,
//           item.dataPagamento, item.situacao, item.tipo, item.tipoLancamento, item.valor, item.valorPago, item.desconto,
//           item.acrescimo, item.cheque, item.dinheiro, item.troco, item.adiantamento, item.cartao, item.fornecedorCodigo,
//           item.planoContaGerencialCodigo, item.descricao, item.numeroTitulo, item.nomeFornecedor,
//           item.cpfCnpjFornecedor, item.numeroRemessa, item.planoContaGerencialNivel,
//           item.planoContaGerencialDescricao, item.centroCustoCodigo, item.centroCustoDescricao,
//           item.parcela, item.quantidadeParcelas, item.linhaDigitavel, item.autorizado, item.nossoNumero,
//           item.agenciaFornecedor, item.contaFornecedor, item.tipoChavePixFornecedor, item.chavePixFornecedor,
//           item.qrCodePix, item.codigo, item.ultimoCodigo
//       ];

//       await db.query_webpostoRedeAlex(queryTituloPagar, valuesTituloPagar);

//       // Iterando sobre os pagamentos para inserção
//       if (Array.isArray(item.pagamento) && item.pagamento.length > 0) {
//           for (const pagamento of item.pagamento) {
//               const queryPagamento = `INSERT INTO redealex.tab_titulo_pagar_pagamento (
//                   "tituloPagarCodigo", "pagamentoCodigo", "tipo", "detalhe", "valor", 
//                   "dataPagamento", "codigoDocumento", "tipoDocumento"
//               ) VALUES (
//                   $1, $2, $3, $4, $5, $6, $7, $8
//               )`;

//               const valuesPagamento = [
//                   item.tituloPagarCodigo, pagamento.pagamentoCodigo, pagamento.tipo, pagamento.detalhe, pagamento.valor,
//                   pagamento.dataPagamento, pagamento.codigoDocumento, pagamento.tipoDocumento
//               ];

//               await db.query_webpostoRedeAlex(queryPagamento, valuesPagamento);
//           }
//       }
//   }

//     await db.query_webpostoRedeAlex("COMMIT");

//   } catch (error) {
//     await db.query_webpostoRedeAlex("ROLLBACK");
//     console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
//     res.status(500).json({
//       message: "Falha ao atualizar titulos a receber",
//       error: error.message
//     });
//   }
// };

exports.tituloPagar = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/TITULO_PAGAR';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 1000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`SELECT MAX("ultimoCodigo") FROM redealex.tab_titulo_pagar`);
  let ultimoCodigo = ultimoCodigoResult.rows[0].max;

  const getRecords = async (ultimoCodigo) => {
    const params = { chave, limite, ultimoCodigo, dataInicial, dataFinal };
    //console.log(baseUrl, { params });
    const response = await axios.get(baseUrl, { params });
    return response.data;
  };

  const fetchAllRecords = async () => {
    let allRecords = [];
    while (allRecords.length < totalRegistros) {
      const data = await getRecords(ultimoCodigo);
      const records = data.resultados;
      allRecords = allRecords.concat(records);

      if (records.length < limite) break;
      ultimoCodigo = records[records.length - 1].codigo;
    }
    return allRecords.slice(0, totalRegistros);
  };

  try {
    const allRecords = await fetchAllRecords();
    console.log('Total de registros obtidos:', allRecords.length);

    res.status(200).json({
      message: "Insert em andamento",
      totalRecords: allRecords.length,
      ultimoCodigo: ultimoCodigo
    });

    // Iniciar transação
    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      try {
        const queryTituloPagar = `INSERT INTO redealex.tab_titulo_pagar (
          "empresaCodigo", "tituloPagarCodigo", "notaEntradaCodigo", "dataMovimento", "vencimento", 
          "dataPagamento", "situacao", "tipo", "tipoLancamento", "valor", "valorPago", "desconto", 
          "acrescimo", "cheque", "dinheiro", "troco", "adiantamento", "cartao", "fornecedorCodigo", 
          "planoContaGerencialCodigo", "descricao", "numeroTitulo", "nomeFornecedor", 
          "cpfCnpjFornecedor", "numeroRemessa", "planoContaGerencialNivel", 
          "planoContaGerencialDescricao", "centroCustoCodigo", "centroCustoDescricao", 
          "parcela", "quantidadeParcelas", "linhaDigitavel", "autorizado", "nossoNumero", 
          "agenciaFornecedor", "contaFornecedor", "tipoChavePixFornecedor", "chavePixFornecedor", 
          "qrCodePix", "codigo", "ultimoCodigo"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41
        )`;

        const valuesTituloPagar = [
          item.empresaCodigo, item.tituloPagarCodigo, item.notaEntradaCodigo, item.dataMovimento, item.vencimento,
          item.dataPagamento, item.situacao, item.tipo, item.tipoLancamento, item.valor, item.valorPago, item.desconto,
          item.acrescimo, item.cheque, item.dinheiro, item.troco, item.adiantamento, item.cartao, item.fornecedorCodigo,
          item.planoContaGerencialCodigo, item.descricao, item.numeroTitulo, item.nomeFornecedor,
          item.cpfCnpjFornecedor, item.numeroRemessa, item.planoContaGerencialNivel,
          item.planoContaGerencialDescricao, item.centroCustoCodigo, item.centroCustoDescricao,
          item.parcela, item.quantidadeParcelas, item.linhaDigitavel, item.autorizado, item.nossoNumero,
          item.agenciaFornecedor, item.contaFornecedor, item.tipoChavePixFornecedor, item.chavePixFornecedor,
          item.qrCodePix, item.codigo, item.codigo
        ];

        await db.query_webpostoRedeAlex(queryTituloPagar, valuesTituloPagar);

        if (Array.isArray(item.pagamento) && item.pagamento.length > 0) {
          const pagamentoQueries = item.pagamento.map(pagamento => {
            const queryPagamento = `INSERT INTO redealex.tab_titulo_pagar_pagamento (
              "tituloPagarCodigo", "pagamentoCodigo", "tipo", "detalhe", "valor", 
              "dataPagamento", "codigoDocumento", "tipoDocumento"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8
            )`;

            const valuesPagamento = [
              item.tituloPagarCodigo, pagamento.pagamentoCodigo, pagamento.tipo, pagamento.detalhe, pagamento.valor,
              pagamento.dataPagamento, pagamento.codigoDocumento, pagamento.tipoDocumento
            ];

            return db.query_webpostoRedeAlex(queryPagamento, valuesPagamento);
          });

          await Promise.all(pagamentoQueries);
        }

      } catch (error) {
        console.error("Erro ao inserir registro:", error.message);
        await db.query_webpostoRedeAlex("ROLLBACK"); // Rollback apenas no erro
        throw error;
      }
    }

    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao processar os registros:', error);
    res.status(500).json({
      message: "Falha ao atualizar titulos a PAGAR",
      error: error.message
    });
  }
};

exports.formaPagto = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/FORMA_PAGAMENTO';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_forma_pagto`)
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
    //console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      const query = `INSERT INTO redealex.tab_forma_pagto (
        "formaPagamentoCodigo", "nome", "diasVencimento", "tipo",
        "ultimoUsuarioAlteracao", "codigo", "ultimoCodigo"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )`;

      const values = [
        item.formaPagamentoCodigo, item.nome, item.diasVencimento,
        item.tipo, item.ultimoUsuarioAlteracao, item.codigo, item.codigo
      ];


      await db.query_webpostoRedeAlex(query, values);
    }

    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar FORMA PAGTO",
      error: error.message
    });
  }
};

exports.lmc = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/LMC';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_lmc`)
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
    //console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      // Inserção na tab_lmc
      const queryLmc = `INSERT INTO redealex.tab_lmc (
          "empresaCodigo", "lmcCodigo", "produtoCodigo", "dataMovimento", "abertura", 
          "entrada", "saida", "perdaSobra", "escritural", "fechamento", "disponivel", 
          "ultimoUsuarioAlteracao", "saldo", "precoCusto", "produtoLmcCodigo", 
          "codigo", "ultimoCodigo"
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17
      )`;

      const valuesLmc = [
        item.empresaCodigo, item.lmcCodigo, item.produtoCodigo[0], item.dataMovimento, item.abertura,
        item.entrada, item.saida, item.perdaSobra, item.escritural, item.fechamento, item.disponivel,
        item.ultimoUsuarioAlteracao, item.saldo, item.precoCusto, item.produtoLmcCodigo,
        item.codigo, item.codigo
      ];

      await db.query_webpostoRedeAlex(queryLmc, valuesLmc);

      // Inserção na tab_lmc_tanque
      if (Array.isArray(item.lmcTanque) && item.lmcTanque.length > 0) {
        for (const tanque of item.lmcTanque) {
          const queryLmcTanque = `INSERT INTO redealex.tab_lmc_tanque (
                  "lmcCodigo", "lmcTanqueCodigo", "tanqueCodigo", "abertura", 
                  "escritural", "fechamento"
              ) VALUES (
                  $1, $2, $3, $4, $5, $6
              )`;

          const valuesLmcTanque = [
            item.lmcCodigo, tanque.lmcTanqueCodigo, tanque.tanqueCodigo, tanque.abertura,
            tanque.escritural, tanque.fechamento
          ];

          await db.query_webpostoRedeAlex(queryLmcTanque, valuesLmcTanque);
        }
      }

      // Inserção na tab_lmc_bico
      if (Array.isArray(item.lmcBico) && item.lmcBico.length > 0) {
        for (const bico of item.lmcBico) {
          const queryLmcBico = `INSERT INTO redealex.tab_lmc_bico (
                  "lmcCodigo", "lmcBicoCodigo", "bicoCodigo", "tanqueCodigo", 
                  "bombaCodigo", "abertura", "fechamento", "afericao", "venda"
              ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9
              )`;

          const valuesLmcBico = [
            item.lmcCodigo, bico.lmcBicoCodigo, bico.bicoCodigo, bico.tanqueCodigo,
            bico.bombaCodigo, bico.abertura, bico.fechamento, bico.afericao, bico.venda
          ];

          await db.query_webpostoRedeAlex(queryLmcBico, valuesLmcBico);
        }
      }

      // Inserção na tab_lmc_compra
      if (Array.isArray(item.lmcCompra) && item.lmcCompra.length > 0) {
        for (const compra of item.lmcCompra) {
          const queryLmcCompra = `INSERT INTO redealex.tab_lmc_nota(
                  "lmcCodigo", "compraCodigo", "numeroNota", "dataEntrada", 
                  "volumeRecebido", "tanqueCodigo"
              ) VALUES (
                  $1, $2, $3, $4, $5, $6
              )`;

          const valuesLmcCompra = [
            item.lmcCodigo, compra.compraCodigo, compra.numeroNota, compra.dataEntrada,
            compra.volumeRecebido, compra.tanqueCodigo
          ];

          await db.query_webpostoRedeAlex(queryLmcCompra, valuesLmcCompra);
        }
      }
    }

    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar LMC",
      error: error.message
    });
  }
};

exports.tanque = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/TANQUE';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_tanque`)
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
    //console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      const queryTanque = `
          INSERT INTO redealex.tab_tanque (
              "empresaCodigo", "tanqueCodigo", "nome", "produtoCodigo", 
              "capacidade", "ultimoUsuarioAlteracao", "lastro", 
              "estoqueEscritural", "produtoLmcCodigo", "dataHoraMedidor", 
              "codigo", "ultimoCodigo"
          ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
      `;

      const valuesTanque = [
        item.empresaCodigo,
        item.tanqueCodigo,
        item.nome,
        item.produtoCodigo,
        item.capacidade,
        item.ultimoUsuarioAlteracao,
        item.lastro,
        item.estoqueEscritural,
        item.produtoLmcCodigo,
        item.dataHoraMedidor,
        item.codigo,
        item.codigo
      ];

      await db.query_webpostoRedeAlex(queryTanque, valuesTanque);
    }


    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar tanques",
      error: error.message
    });
  }
};

exports.bico = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/BICO';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_bico`)
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
    //console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      const queryBico = `
          INSERT INTO redealex.tab_bico (
              "empresaCodigo", "bicoCodigo", "bicoNumero", "tanqueCodigo", 
              "bombaCodigo", "produtoCodigo", "ultimoUsuarioAlteracao", 
              "produtoLmcCodigo", "codigo", "ultimoCodigo"
          ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          )
      `;

      const valuesBico = [
        item.empresaCodigo,
        item.bicoCodigo,
        item.bicoNumero,
        item.tanqueCodigo,
        item.bombaCodigo,
        item.produtoCodigo,
        item.ultimoUsuarioAlteracao,
        item.produtoLmcCodigo,
        item.codigo,
        item.codigo
      ];

      await db.query_webpostoRedeAlex(queryBico, valuesBico);
    }

    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar bicos",
      error: error.message
    });
  }
};

exports.bomba = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/BOMBA';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_bico`)
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
    //console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      const queryBomba = `
          INSERT INTO redealex.tab_bomba (
              "bombaCodigo", "empresaCodigo", "bombaReferencia", "descricao", 
              "quantidadeBicos", "ilha", "serie", "fabricante", 
              "modelo", "tipoMedicaoDigital", "codigo", "ultimoCodigo"
          ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
      `;

      const valuesBomba = [
        item.bombaCodigo,
        item.empresaCodigo,
        item.bombaReferencia,
        item.descricao,
        item.quantidadeBicos,
        item.ilha,
        item.serie,
        item.fabricante,
        item.modelo,
        item.tipoMedicaoDigital,
        item.codigo,
        item.codigo
      ];

      await db.query_webpostoRedeAlex(queryBomba, valuesBomba);
    }


    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar bombas",
      error: error.message
    });
  }
};

exports.abastecimentos = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/ABASTECIMENTO';
  const limite = 2000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_abastecimento`)
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
    //console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {
      const queryAbastecimento = `
          INSERT INTO redealex.tab_abastecimento (
              "dataFiscal", "horaFiscal", "codigoBico", "codigoProduto", 
              "quantidade", "valorUnitario", "valorTotal", "codigoFrentista", 
              "afericao", "vendaItemCodigo", "precoCadastro", "tabelaPrecoA", 
              "tabelaPrecoB", "tabelaPrecoC", "empresaCodigo", "dataHoraAbastecimento", 
              "stringFull", "abastecimentoCodigo", "encerrante", "codigo", "ultimoCodigo"
          ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
          )
      `;

      const valuesAbastecimento = [
        item.dataFiscal,
        item.horaFiscal,
        item.codigoBico,
        item.codigoProduto, // Convertendo para inteiro
        item.quantidade,
        item.valorUnitario,
        item.valorTotal,
        item.codigoFrentista,
        item.afericao,
        item.vendaItemCodigo,
        item.precoCadastro,
        item.tabelaPrecoA,
        item.tabelaPrecoB,
        item.tabelaPrecoC,
        item.empresaCodigo,
        item.dataHoraAbastecimento,
        item.stringFull,
        item.abastecimentoCodigo,
        item.encerrante,
        item.codigo,
        item.codigo
      ];

      await db.query_webpostoRedeAlex(queryAbastecimento, valuesAbastecimento);
    }

    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar abastecimentos",
      error: error.message
    });
  }
};

exports.cliente = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/CLIENTE';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_cliente`)
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
    //console.log(baseUrl, { params })
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
    let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_cliente`)
    let ultimoCodigo = ultimoCodigoResult.rows[0].max;

    const allRecords = await fetchAllRecords(); // Sua função existente para buscar os registros
    console.log('Total de registros obtidos:', allRecords.length);

    // Inicia uma única transação para todas as inserções
    await db.transaction(async (client) => {
      for (const item of allRecords) {
        const query = `
          INSERT INTO redealex.tab_cliente (
            "clienteCodigo", "clienteReferencia", "razao", "fantasia", "cnpjCpf", 
            "dataCadastro", "cidade", "codigoCidade", "bairro", "numero", "logradouro", 
            "tipoLogradouro", "uf", "usaLimiteLitros", "limiteLitros", "usaLimiteReais", 
            "limiteReais", "bloqueado", "ultimoUsuarioAlteracao", "clienteGrupoCodigo", 
            "clienteCodigoExterno", "telefone", "celular", "outroTelefone", "observacoes", 
            "centroCustoVeiculo", "clienteContato", "website", "complemento", "cep", "pais", 
            "inscricaoEstadual", "inscricaoMunicipal", "rg", "codigo", "ultimoCodigo"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
            $31, $32, $33, $34, $35, $36
          )`;

        const values = [
          item.clienteCodigo, item.clienteReferencia, item.razao, item.fantasia, item.cnpjCpf,
          item.dataCadastro, item.cidade, item.codigoCidade, item.bairro, item.numero, item.logradouro,
          item.tipoLogradouro, item.uf, item.usaLimiteLitros, item.limiteLitros, item.usaLimiteReais,
          item.limiteReais, item.bloqueado, item.ultimoUsuarioAlteracao, item.clienteGrupoCodigo,
          item.clienteCodigoExterno, item.telefone, item.celular, item.outroTelefone, item.observacoes,
          JSON.stringify(item.centroCustoVeiculo), JSON.stringify(item.clienteContato), item.website,
          item.complemento, item.cep, item.pais, item.inscricaoEstadual, item.inscricaoMunicipal,
          item.rg, item.codigo, item.codigo
        ];

        await client.query(query, values);
      }
    });

    // Só responde ao cliente depois que todas as inserções foram concluídas
    res.status(200).json({
      message: "Todos os registros foram inseridos com sucesso",
      totalRecords: allRecords.length,
      ultimoCodigo: allRecords[allRecords.length - 1]?.codigo
    });

  } catch (error) {
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar clientes",
      error: error
    });
  }
};


// try {
//   const allRecords = await fetchAllRecords();
//   console.log('Total de registros obtidos:', allRecords.length);

//   res.status(200).json({
//     message: "Insert em andamento",
//     totalRecords: allRecords.length,
//     ultimoCodigo: ultimoCodigo
//   });

//   for (const item of allRecords) {

//     const query = `
//                   INSERT INTO redealex.tab_cliente (
//                       "clienteCodigo", "clienteReferencia", "razao", "fantasia", "cnpjCpf", 
//                       "dataCadastro", "cidade", "codigoCidade", "bairro", "numero", "logradouro", 
//                       "tipoLogradouro", "uf", "usaLimiteLitros", "limiteLitros", "usaLimiteReais", 
//                       "limiteReais", "bloqueado", "ultimoUsuarioAlteracao", "clienteGrupoCodigo", 
//                       "clienteCodigoExterno", "telefone", "celular", "outroTelefone", "observacoes", 
//                       "centroCustoVeiculo", "clienteContato", "website", "complemento", "cep", "pais", 
//                       "inscricaoEstadual", "inscricaoMunicipal", "rg", "codigo", "ultimoCodigo"
//                   ) VALUES (
//                       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
//                       $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, 
//                       $31, $32, $33, $34, $35, $36
//                   )`;

//     const values = [
//         item.clienteCodigo, item.clienteReferencia, item.razao, item.fantasia, item.cnpjCpf, 
//         item.dataCadastro, item.cidade, item.codigoCidade, item.bairro, item.numero, item.logradouro, 
//         item.tipoLogradouro, item.uf, item.usaLimiteLitros, item.limiteLitros, item.usaLimiteReais, 
//         item.limiteReais, item.bloqueado, item.ultimoUsuarioAlteracao, item.clienteGrupoCodigo, 
//         item.clienteCodigoExterno, item.telefone, item.celular, item.outroTelefone, item.observacoes, 
//         JSON.stringify(item.centroCustoVeiculo), JSON.stringify(item.clienteContato), item.website, 
//         item.complemento, item.cep, item.pais, item.inscricaoEstadual, item.inscricaoMunicipal, 
//         item.rg, item.codigo, item.codigo
//     ];

//     await db.transaction(async (client) => {

//       await client.query(query, values);
//     })

//     // Aqui você pode usar sua biblioteca para executar o query com os valores:
//     //await db.query_webpostoRedeAlex(query, values);


// }

// } catch (error) {
//   await db.query_webpostoRedeAlex("ROLLBACK");
//   console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
//   res.status(500).json({
//     message: "Falha ao atualizar clientes",
//     error: error.message
//   });
// }

exports.fornecedor = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/FORNECEDOR';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 1000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_fornecedor`)
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
    //console.log(baseUrl, { params })
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

    await db.transaction(async (client) => {

      for (const item of allRecords) {

        const query = `
        INSERT INTO redealex.tab_fornecedor (
            "fornecedorCodigo", "razao", "fantasia", "cnpjCpf", "logradouro", "tipoLogradouro", 
            "numero", "bairro", "cidade", "telefone", "celular", "observacoes", "codigoMunicipio", 
            "uf", "email", "ultimoUsuarioAlteracao", "website", "complemento", "cep", "pais", 
            "inscricaoEstadual", "inscricaoMunicipal", "contasFornecedor", "fax", "fornecedorReferencia", 
            "tipoPessoa", "contatoEmail", "codigo", "ultimoCodigo"
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
        )`;

        const values = [
          item.fornecedorCodigo, item.razao, item.fantasia, item.cnpjCpf, item.logradouro,
          item.tipoLogradouro, item.numero, item.bairro, item.cidade, item.telefone, item.celular,
          item.observacoes, item.codigoMunicipio, item.uf, item.email, item.ultimoUsuarioAlteracao,
          item.website, item.complemento, item.cep, item.pais, item.inscricaoEstadual,
          item.inscricaoMunicipal, JSON.stringify(item.contasFornecedor), item.fax,
          item.fornecedorReferencia, item.tipoPessoa, item.contatoEmail, item.codigo, item.codigo
        ];

        // Aqui você pode usar sua biblioteca para executar o query com os valores:
        await client.query(query, values);
      }

    })

    // Só responde ao cliente depois que todas as inserções foram concluídas
    res.status(200).json({
      message: "Todos os registros foram inseridos com sucesso",
      totalRecords: allRecords.length,
      ultimoCodigo: allRecords[allRecords.length - 1]?.codigo
    });

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar fornecedor",
      error: error.message
    });
  }
};

exports.contaBanco = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/CONTA';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 10000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_conta_banco`)
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
    //console.log(baseUrl, { params })
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

    await db.query_webpostoRedeAlex("BEGIN");

    for (const item of allRecords) {

      const query = `
      INSERT INTO redealex.tab_conta_banco (
          "empresaCodigo", "contaCodigo", "descricao", "saldoAtual", "ativo", "codigo", "ultimoCodigo"
      ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
      )`;

      const values = [
        item.empresaCodigo, item.contaCodigo, item.descricao, item.saldoAtual, item.ativo, item.codigo, item.codigo
      ];

      // Aqui você pode usar sua biblioteca para executar o query com os valores:
      await db.query_webpostoRedeAlex(query, values);
    }


    await db.query_webpostoRedeAlex("COMMIT");

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar conta banco",
      error: error.message
    });
  }
};

exports.vendas = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/VENDA';
  const limite = 2000;
  const totalRegistros = 1000000;
  const dataInicial = "2025-01-01";
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_vendas`);
  let ultimoCodigo = ultimoCodigoResult.rows[0].max;

  const getRecords = async (ultimoCodigo) => {
    const params = {
      chave,
      limite,
      ultimoCodigo,
      dataInicial,
      dataFinal,
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
      ultimoCodigo = records[records.length - 1].codigo;
    }

    return allRecords.slice(0, totalRegistros); // Garantir que retornamos exatamente 5000 registros
  };


  try {
    const allRecords = await fetchAllRecords();
    console.log('Total de registros obtidos:', allRecords.length);

    await db.transaction(async (client) => {

      for (const item of allRecords) {
        const query = `
          INSERT INTO redealex.tab_vendas (
            "empresaCodigo", "vendaCodigo", "notaCodigo", "funcionarioCodigo", "clienteCodigo",
            "destacaAcrescimoDesconto", "clienteCpfCnpj", "dataHora", "notaNumero", "notaSerie",
            "totalVenda", "caixaCodigo", "notaChave", "modeloDocumento", cancelada,
            "placaVeiculo", "clienteCodigoExterno", "centroCustoCodigo", "centroCustoVeiculo",
            "identificacaoFidelidade", troco, itens, "formaPagamento", codigo, "ultimoCodigo"
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25
          )
        `;

        const values = [
          item.empresaCodigo,
          item.vendaCodigo,
          item.notaCodigo,
          item.funcionarioCodigo,
          item.clienteCodigo,
          item.destacaAcrescimoDesconto,
          item.clienteCpfCnpj,
          item.dataHora,
          item.notaNumero,
          item.notaSerie,
          item.totalVenda,
          item.caixaCodigo,
          item.notaChave,
          item.modeloDocumento,
          item.cancelada,
          item.placaVeiculo,
          item.clienteCodigoExterno,
          item.centroCustoCodigo,
          item.centroCustoVeiculo,
          item.identificacaoFidelidade,
          item.troco,
          item.itens,
          item.formaPagamento,
          item.codigo,
          item.codigo
        ];

        await client.query(query, values);
      }

    })

    // Só responde ao cliente depois que todas as inserções foram concluídas
    res.status(200).json({
      message: "Todos os registros foram inseridos com sucesso",
      totalRecords: allRecords.length,
      ultimoCodigo: allRecords[allRecords.length - 1]?.codigo
    });

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar VENDAS",
      error: error.message
    });
  }
};

exports.vendaFormaPagamento = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/VENDA_FORMA_PAGAMENTO';
  const limite = 2000;
  const totalRegistros = 10000000;
  const dataInicial = "2024-05-01";
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("codigo") from redealex.tab_venda_forma_pagto`);
  let ultimoCodigo = ultimoCodigoResult.rows[0].max;

  const getRecords = async (ultimoCodigo) => {
    const params = {
      chave,
      limite,
      ultimoCodigo,
      dataInicial,
      dataFinal,
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

      if (records.length < limite) {
        break;
      }

      ultimoCodigo = records[records.length - 1].codigo;
    }

    return allRecords.slice(0, totalRegistros);
  };

  try {
    const allRecords = await fetchAllRecords();
    console.log('Total de registros obtidos:', allRecords.length);

    await db.transaction(async (client) => {
      for (const item of allRecords) {
        const query = `
          INSERT INTO redealex.tab_venda_forma_pagto (
            "empresaCodigo", "vendaCodigo", "vendaPrazoCodigo", "dataMovimento", "vencimento",
            "valorPagamento", "taxaPercentual", "formaPagamentoCodigo", "administradoraCodigo",
            "turnoCodigo", "tipoFormaPagamento", "nomeFormaPagamento", "codigo", "ultimoCodigo"
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13, $14
          )
        `;

        const values = [
          item.empresaCodigo, item.vendaCodigo, item.vendaPrazoCodigo, item.dataMovimento, item.vencimento,
          item.valorPagamento, item.taxaPercentual, item.formaPagamentoCodigo, item.administradoraCodigo,
          item.turnoCodigo, item.tipoFormaPagamento, item.nomeFormaPagamento, item.codigo, item.codigo
        ];

        await client.query(query, values);
      }
    });

    res.status(200).json({
      message: "Todos os registros de forma de pagamento foram inseridos com sucesso",
      totalRecords: allRecords.length,
      ultimoCodigo: allRecords[allRecords.length - 1]?.codigo
    });

  } catch (error) {
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar venda_forma_pagto",
      error: error
    });
  }
};

exports.planoContas = async (req, res) => {
  const chave = '54f6abd2-dd05-4809-888b-c57926959069';
  const baseUrl = 'https://web.qualityautomacao.com.br/INTEGRACAO/PLANO_CONTA_GERENCIAL';
  const limite = 1000; // Máximo permitido por requisição
  const totalRegistros = 1000000; // Total de registros que você precisa
  const dataInicial = "2024-05-01"
  const dataFinal = moment().format('YYYY-MM-DD');

  let ultimoCodigoResult = await db.query_webpostoRedeAlex(`select max("ultimoCodigo") from redealex.tab_plano_contas`)
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
    //console.log(baseUrl, { params })
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

    await db.transaction(async (client) => {

      for (const item of allRecords) {

        const query = `
        INSERT INTO redealex.tab_plano_contas (
         "planoContaCodigo", descricao, hierarquia, "apuraDre", natureza, tipo, codigo, "ultimoCodigo"
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
        )`;

        const values = [
          item.planoContaCodigo, item.descricao, item.hierarquia, item.apuraDre, item.natureza,
          item.tipo, item.codigo, item.codigo
        ];

        // Aqui você pode usar sua biblioteca para executar o query com os valores:
        await client.query(query, values);
      }

    })

    // Só responde ao cliente depois que todas as inserções foram concluídas
    res.status(200).json({
      message: "Todos os registros foram inseridos com sucesso",
      totalRecords: allRecords.length,
      ultimoCodigo: allRecords[allRecords.length - 1]?.codigo
    });

  } catch (error) {
    await db.query_webpostoRedeAlex("ROLLBACK");
    console.error('Erro ao fazer a solicitação HTTP ou inserir dados:', error);
    res.status(500).json({
      message: "Falha ao atualizar fornecedor",
      error: error.message
    });
  }
};

exports.verificaRegistros = async (req, res) => {
  const { } = req.body;

  try {
    const queryResult = await db.transaction(async (client) => {
      try {
        // Sua lógica de transação aqui

        const insertQuery = ` 
                            WITH duplicados AS (
                                SELECT 
                                    seq_registro,
                                    ROW_NUMBER() OVER (PARTITION BY codigo ORDER BY seq_registro) AS rn
                                FROM redealex.tab_vendas
                            )
                            DELETE FROM redealex.tab_vendas
                            WHERE seq_registro IN (
                                SELECT seq_registro
                                FROM duplicados
                                WHERE rn > 1
                            );`;

        const insertQuery1 = ` 
                            WITH duplicados AS (
                                SELECT 
                                    seq_registro,
                                    ROW_NUMBER() OVER (PARTITION BY codigo ORDER BY seq_registro) AS rn
                                FROM redealex.tab_venda_item
                            )
                            DELETE FROM redealex.tab_venda_item
                            WHERE seq_registro IN (
                                SELECT seq_registro
                                FROM duplicados
                                WHERE rn > 1
                            );`;

        const values = []

        const result = await client.query(insertQuery, values);
        const result1 = await client.query(insertQuery1, values);

        return {
          rows: result.rows,
          rowCount: result.rowCount
        };
        // Commit implícito se não houve erro
      } catch (innerError) {
        console.error('Erro na transação:', innerError);
        throw innerError; // Força o rollback
      }
    });

    // Se chegou aqui, a transação foi bem-sucedida
    return res.status(200).json({
      success: true,
      message: 'Operação realizada com sucesso',
      data: queryResult
    });
  } catch (error) {
    console.error('Erro na operação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar a requisição',
      details: error.message,
      errorDetails: error.stack
    });
  }
}