const db = require("../config/database");
require("dotenv-safe").config();
const jwt = require("jsonwebtoken");
const moment = require("moment");
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');


exports.buscaTarefasPainel = async (req, res) => {
  const { depFiltro, userFiltro } = req.body;

  try {
    // Inicia a transação
    await db.queryContabil("BEGIN");

    // Protege contra SQL Injection usando placeholders
    const tarefasQuery = `
      SELECT a.*, b.num_cnpj_cpf, b.nom_cliente
      FROM tab_tarefa a
      LEFT JOIN tab_cliente b ON (a.cod_cliente = b.cod_cliente)
      WHERE a.ind_status IN ('P', 'A', 'I')
        AND (a.cod_usuario_1 IN (${userFiltro}))`; //OR a.cod_usuario_2 IN (${userFiltro}))

    const tarefas = await db.queryContabil(tarefasQuery);

    // Busca tarefas adicionais para cada cliente
    const tarefasAdicionais = [];
    for (const tarefa of tarefas.rows) {
      const adicionais = await db.queryContabil(
        `SELECT a.* FROM tab_tarefa_anexo_cliente a 
          LEFT JOIN tab_tarefa b on (a.seq_registro_anexo = b.seq_registro_anexo)
        WHERE a.seq_registro_anexo = $1`,[tarefa.seq_registro_anexo]
      );
      tarefasAdicionais.push(...adicionais.rows);
    }

    // Prepara a resposta das tarefas adicionais
    const response = tarefasAdicionais.map((row) => {
      const {
        seq_registro,
        seq_registro_anexo,
        des_tarefa_adicional,
        dta_entrega,
        cod_tarefa_cliente,
        des_tarefa_cliente,
        cod_tarefa_originaria,
        des_tarefa_originaria,
        anexo,
        des_anexo,
        cod_cliente,
        dta_upload_anexo,
        ind_aprovado
      } = row;

      return {
        seq_registro,
        seq_registro_anexo,
        des_tarefa_adicional,
        dta_entrega,
        cod_tarefa_cliente,
        des_tarefa_cliente,
        cod_tarefa_originaria,
        des_tarefa_originaria,
        anexo: anexo ? anexo.toString() : null, // Converte anexo para Base64 (se não nulo)
        des_anexo,
        cod_cliente,
        dta_upload_anexo,
        ind_aprovado
      };
    });

    // Finaliza a transação com sucesso
    await db.queryContabil("COMMIT");

    // Retorna os dados em JSON
    res.status(200).json({
      tarefas: tarefas.rows,
      tarefasAdcCli: response,
    });
  } catch (error) {
    // Desfaz a transação em caso de erro
    await db.queryContabil("ROLLBACK");
    console.error("Erro ao buscar tarefas do painel:", error);

    res.status(500).json({
      message: `Falha em buscar arquivos, tente novamente. Erro: ${error.message}`,
    });
  }
};

exports.buscaTarefasTv = async (req, res) =>{

  try {

  await db.queryContabil("BEGIN");
   const result =  await db.queryContabil(`SELECT a.*, b.num_cnpj_cpf, b.nom_cliente
                                FROM tab_tarefa a
                              LEFT JOIN tab_cliente b ON (a.cod_cliente = b.cod_cliente
                              )`);
    await db.queryContabil("COMMIT");
   res.status(200).json({
       message: result.rows
    });
      
  } catch (error) {
    await db.queryContabil("ROLLBACK");
      res.status(500).json({
          message: "Falha em buscar tarefas, tente novamente" + error
        });
  }

};

  exports.buscaTarefasFiltroUser = async (req, res) =>{

    const { depFiltro, userFiltro } = req.body;

    try {
        await db.queryContabil("BEGIN");

        if(userFiltro.length == 0){
          await db.queryContabil("BEGIN");

          // Protege contra SQL Injection usando placeholders
          const tarefasQuery = `
            SELECT a.*, b.num_cnpj_cpf, b.nom_cliente
            FROM tab_tarefa a
            LEFT JOIN tab_cliente b ON (a.cod_cliente = b.cod_cliente)
            WHERE a.ind_status IN ('P', 'A', 'I')
            AND (a.cod_departamento IN (${depFiltro}))`;
      
          const tarefas = await db.queryContabil(tarefasQuery);
      
          // Busca tarefas adicionais para cada cliente
          const tarefasAdicionais = [];
          for (const tarefa of tarefas.rows) {
            const adicionais = await db.queryContabil(
              `SELECT a.* FROM tab_tarefa_anexo_cliente a 
                LEFT JOIN tab_tarefa b on (a.seq_registro_anexo = b.seq_registro_anexo)
              WHERE a.seq_registro_anexo = $1`,[tarefa.seq_registro_anexo]
            );
            tarefasAdicionais.push(...adicionais.rows);
          }
      
          // Prepara a resposta das tarefas adicionais
          const response = tarefasAdicionais.map((row) => {
            const {
              seq_registro,
              seq_registro_anexo,
              des_tarefa_adicional,
              dta_entrega,
              cod_tarefa_cliente,
              des_tarefa_cliente,
              cod_tarefa_originaria,
              des_tarefa_originaria,
              anexo,
              des_anexo,
              cod_cliente,
              dta_upload_anexo,
              ind_aprovado
            } = row;
      
            return {
              seq_registro,
              seq_registro_anexo,
              des_tarefa_adicional,
              dta_entrega,
              cod_tarefa_cliente,
              des_tarefa_cliente,
              cod_tarefa_originaria,
              des_tarefa_originaria,
              anexo: anexo ? anexo.toString() : null, // Converte anexo para Base64 (se não nulo)
              des_anexo,
              cod_cliente,
              dta_upload_anexo,
              ind_aprovado
            };
          });
      
          // Finaliza a transação com sucesso
          await db.queryContabil("COMMIT");
      
          // Retorna os dados em JSON
          res.status(200).json({
            tarefas: tarefas.rows,
            tarefasAdcCli: response,
          });
        }else{

          const tarefasQuery = `
            SELECT a.*, b.num_cnpj_cpf, b.nom_cliente
            FROM tab_tarefa a
            LEFT JOIN tab_cliente b ON (a.cod_cliente = b.cod_cliente)
            WHERE a.ind_status IN ('P', 'A', 'I')
            AND (a.cod_usuario_1 IN (${userFiltro}) OR a.cod_usuario_2 IN (${userFiltro}))`;
      
          const tarefas = await db.queryContabil(tarefasQuery);
      
          // Busca tarefas adicionais para cada cliente
          const tarefasAdicionais = [];
          for (const tarefa of tarefas.rows) {
            const adicionais = await db.queryContabil(
              `SELECT a.* FROM tab_tarefa_anexo_cliente a 
                LEFT JOIN tab_tarefa b on (a.seq_registro_anexo = b.seq_registro_anexo)
              WHERE a.seq_registro_anexo = $1`,[tarefa.seq_registro_anexo]
            );
            tarefasAdicionais.push(...adicionais.rows);
          }
      
          // Prepara a resposta das tarefas adicionais
          const response = tarefasAdicionais.map((row) => {
            const {
              seq_registro,
              seq_registro_anexo,
              des_tarefa_adicional,
              dta_entrega,
              cod_tarefa_cliente,
              des_tarefa_cliente,
              cod_tarefa_originaria,
              des_tarefa_originaria,
              anexo,
              des_anexo,
              cod_cliente,
              dta_upload_anexo,
              ind_aprovado
            } = row;
      
            return {
              seq_registro,
              seq_registro_anexo,
              des_tarefa_adicional,
              dta_entrega,
              cod_tarefa_cliente,
              des_tarefa_cliente,
              cod_tarefa_originaria,
              des_tarefa_originaria,
              anexo: anexo ? anexo.toString() : null, // Converte anexo para Base64 (se não nulo)
              des_anexo,
              cod_cliente,
              dta_upload_anexo,
              ind_aprovado
            };
          });
      
          // Finaliza a transação com sucesso
          await db.queryContabil("COMMIT");
      
          // Retorna os dados em JSON
          res.status(200).json({
            tarefas: tarefas.rows,
            tarefasAdcCli: response,
          });

        }

      
    } catch (error) {
        await db.queryContabil("ROLLBACK");
      res.status(500).json({
        message: "Falha em buscar arquivos, tente novamente " + error
       });
    }
  
  };

  // exports.incluiNovaTarefa = async (req, res) => {
  //   const { tarefa, cliente } = req.body;

  
  //   const dataAtual = moment().format("YYYY.MM.DD"); // Certifique-se de que `moment` está importado

  //   let registros
  
  //   try {
  //     await db.queryContabil("BEGIN"); // Inicia a transação
  
  //     for (const row of cliente) {

  //       if(row === undefined){
  //         res.status(500).json({ message: "Falha ao incluir a tarefa: Cliente nao especificado"});
  //         return;
  //       }

  //     registros =   await db.queryContabil(
  //         `INSERT INTO tab_tarefa (
  //           cod_tarefa_grupo, des_tarefa_grupo, cod_tarefa_precedente, des_tarefa_precedente,
  //           cod_usuario_1, des_usuario_1, cod_usuario_2, des_usuario_2, ind_precede_tarefa_cliente,
  //           dta_tarefa, tempo_estimado, prioridade, frequencia, cod_grupo_cliente, sistema_cliente,
  //           dta_limite_tarefa, dta_inicio_tarefa, dta_fim_tarefa, cod_departamento, dta_ciencia_cliente,
  //           seq_registro_anexo, des_grupo_cliente, des_departamento, cod_cliente, ind_status,
  //           ind_precedente_concluida, des_observacao_tarefa, ind_necessita_reajuste
  //         ) VALUES (
  //           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
  //           $21, $22, $23, $24, $25, $26, $27, $28
  //         ) RETURNING cod_cliente, seq_registro`,
  //         [
  //           tarefa.cod_tarefa_grupo,
  //           tarefa.des_tarefa_grupo,
  //           tarefa.cod_tarefa_precedente,
  //           tarefa.des_tarefa_precedente,
  //           tarefa.cod_usuario_1,
  //           tarefa.des_usuario_1,
  //           tarefa.cod_usuario_2,
  //           tarefa.des_usuario_2,
  //           false,
  //           tarefa.dta_tarefa || dataAtual, // Se não houver data, usa a atual
  //           tarefa.tempo_estimado,
  //           tarefa.prioridade,
  //           tarefa.frequencia,
  //           row.cod_grupo_cliente,
  //           tarefa.sistema_cliente,
  //           tarefa.dta_limite_tarefa,
  //           tarefa.dta_inicio_tarefa,
  //           tarefa.dta_fim_tarefa,
  //           tarefa.cod_departamento,
  //           tarefa.dta_ciencia_cliente,
  //           null, // Se for verdadeiro, usa o código
  //           row.des_grupo_cliente,
  //           tarefa.des_departamento,
  //           row.cod_cliente,
  //           tarefa.ind_precede_tarefa_cliente ? 'P' : 'A', // 'P' se precede tarefa, senão 'A'
  //           null, // 'N' se tem precedente
  //           tarefa.des_observacao_tarefa,
  //           false
  //         ]
  //       );
        
  //     }
      
  //     await db.queryContabil("COMMIT");
  
  //     res.status(200).json({
  //       message: "Tarefas incluídas com sucesso!",
  //       message2: registros.rows
  //     });
  //   } catch (error) {
  //     await db.queryContabil("ROLLBACK"); // Desfaz a transação em caso de erro
  //     console.error("🚨 Erro geral ao inserir tarefas:", error);
  //     res.status(500).json({ message: "Falha ao incluir a tarefa: " + error.message });
  //   }
  // };
  
  exports.incluiNovaTarefa = async (req, res) => {
    const { tarefa, cliente } = req.body;

    // Validações iniciais
    if (!tarefa || !cliente || !Array.isArray(cliente)) {
        return res.status(400).json({ message: "Dados de entrada inválidos" });
    }

    const dataAtual = moment().format("YYYY.MM.DD");
    const registros = []; // Array para armazenar todos os registros inseridos

    try {
        await db.queryContabil("BEGIN");

        for (const row of cliente) {
            try {
                if (!row || row.cod_cliente === undefined) {
                    throw new Error("Cliente não especificado");
                }

                // Valida campos obrigatórios
                if (!tarefa.cod_tarefa_grupo || !tarefa.des_tarefa_grupo) {
                    throw new Error("Campos da tarefa obrigatórios não informados");
                }

                const resultado = await db.queryContabil(
                    `INSERT INTO tab_tarefa (
                        cod_tarefa_grupo, des_tarefa_grupo, cod_tarefa_precedente, des_tarefa_precedente,
                        cod_usuario_1, des_usuario_1, cod_usuario_2, des_usuario_2, ind_precede_tarefa_cliente,
                        dta_tarefa, tempo_estimado, prioridade, frequencia, cod_grupo_cliente, sistema_cliente,
                        dta_limite_tarefa, dta_inicio_tarefa, dta_fim_tarefa, cod_departamento, dta_ciencia_cliente,
                        seq_registro_anexo, des_grupo_cliente, des_departamento, cod_cliente, ind_status,
                        ind_precedente_concluida, des_observacao_tarefa, ind_necessita_reajuste
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
                        $21, $22, $23, $24, $25, $26, $27, $28
                    ) RETURNING cod_cliente, seq_registro`,
                   [
                    tarefa.cod_tarefa_grupo,
                    tarefa.des_tarefa_grupo,
                    tarefa.cod_tarefa_precedente,
                    tarefa.des_tarefa_precedente,
                    tarefa.cod_usuario_1,
                    tarefa.des_usuario_1,
                    tarefa.cod_usuario_2,
                    tarefa.des_usuario_2,
                    false,
                    tarefa.dta_tarefa || dataAtual, // Se não houver data, usa a atual
                    tarefa.tempo_estimado,
                    tarefa.prioridade,
                    tarefa.frequencia,
                    row.cod_grupo_cliente,
                    tarefa.sistema_cliente,
                    tarefa.dta_limite_tarefa,
                    tarefa.dta_inicio_tarefa,
                    tarefa.dta_fim_tarefa,
                    tarefa.cod_departamento,
                    tarefa.dta_ciencia_cliente,
                    null, // Se for verdadeiro, usa o código
                    row.des_grupo_cliente,
                    tarefa.des_departamento,
                    row.cod_cliente,
                    tarefa.ind_precede_tarefa_cliente ? 'P' : 'A', // 'P' se precede tarefa, senão 'A'
                    null, // 'N' se tem precedente
                    tarefa.des_observacao_tarefa,
                    false
                   ]
                );

                registros.push(resultado.rows[0]);
            } catch (error) {
                await db.queryContabil("ROLLBACK");
                console.error(`Erro ao inserir tarefa para cliente ${row.cod_cliente}:`, error);
                return res.status(500).json({ 
                    message: `Falha ao incluir tarefa para cliente ${row.cod_cliente}: ${error.message}` 
                });
            }
        }

        await db.queryContabil("COMMIT");
        res.status(200).json({
            message: "Tarefas incluídas com sucesso!",
            registros: registros,
            message2: registros
        });
    } catch (error) {
        console.error("Erro geral na transação:", error);
        res.status(500).json({ message: "Falha na transação: " + error.message });
    }
};

  exports.alteraFuncionarioTarefa = async (req, res) =>{

    const { cod_usuario, cod_tarefa } = req.body;
    try {

        await db.queryContabil("update tab_tarefa set cod_usuario = $1 where cod_tarefa = $2",[cod_usuario, cod_tarefa]);
        res.status(200).json({
            message: "Alteração Realizada com Sucesso"
           });
        
    } catch (error) {
        res.status(500).json({
            message: "Falha em alterar funcionario da tarefa, tente novamente" + error
          });
    }

  };

  
  exports.deletaTarefa = async (req, res) =>{

    const { cod_tarefa } = req.body;

    try {
        await db.queryContabil("BEGIN"); 

        await db.queryContabil("update tab_tarefa set ind_status = 'X' where cod_tarefa = $1",[ cod_tarefa]);
        const result = await db.queryContabil("select seq_obrigacao from tab_tarefa where cod_tarefa = $1",[cod_tarefa]);
        await db.queryContabil("update tab_obrigacao_cliente set ind_status = 'X' where seq_obrigacao = $1",[result.rows[0].seq_obrigacao]);

        await db.queryContabil("COMMIT"); // Confirma a transação
        res.status(200).json({
            message: "Tarefa Excluída com Sucesso"
        });
        
    } catch (error) {
      await db.queryContabil("ROLLBACK"); // Desfaz a transação em caso de erro
        res.status(500).json({
            message: "Falha em excluir tarefa, tente novamente" + error
          });
    }

  };

  exports.alterarTarefa = async (req, res) =>{

    const { observacao, cod_tarefa } = req.body;

    try {

        await db.queryContabil("update tab_tarefa set observacao = observacao||' '|| $1 ||';' where cod_tarefa = $2",[observacao, cod_tarefa]);
        res.status(200).json({
            message: "Tarefa Editada com Sucesso"
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Falha em editar tarefa, tente novamente" + error
          });
    }

  };

  exports.iniciaTarefa = async (req, res) =>{

    const { dta_inicio, cod_usuario, seq_registro } = req.body;

    try {

      await db.queryContabil("BEGIN"); 

      const result = await db.queryContabil("select * from tab_tarefa where dta_inicio_tarefa is null and seq_registro = $1", [seq_registro])

      if(result.rowCount > 0){

        await db.queryContabil("update tab_tarefa set dta_inicio_tarefa = $1, cod_usuario_iniciador = $2, ind_status = 'I', ind_situacao_tarefa = 'I', dta_pausa_tarefa = null where seq_registro = $3 ",[dta_inicio, cod_usuario, seq_registro]);

        await db.queryContabil(`insert into tab_tempo_tarefa 
          (dta_evento, tipo_evento, seq_registro_tarefa)
          values
          ($1, $2, $3)`,[dta_inicio, 'I', seq_registro])

      }else{

        await db.queryContabil("update tab_tarefa set ind_status = 'I', ind_situacao_tarefa = 'I', dta_pausa_tarefa = null where seq_registro = $1 ",[seq_registro]);
        
        await db.queryContabil(`insert into tab_tempo_tarefa 
          (dta_evento, tipo_evento, seq_registro_tarefa)
          values
          ($1, $2, $3)`,[dta_inicio, 'I', seq_registro])
      }

        await db.queryContabil("COMMIT"); 

        res.status(200).json({
          message: "Tarefa Iniciada com Sucesso"
        });
    } catch (error) {
      await db.queryContabil("ROLLBACK"); 
        res.status(500).json({
            message: "Falha em iniciar tarefa, tente novamente" + error
          });
    }

  };

  exports.verificaTarefaIniciada = async (req, res) =>{

    const { cod_usuario} = req.body;

    try {

      await db.queryContabil("BEGIN"); 

      const result = await db.queryContabil("select * from tab_tarefa where cod_usuario_1 = $1 and ind_situacao_tarefa = 'I'", [cod_usuario])

      if(result.rowCount > 0){

        res.status(200).json({
          message: result.rows
        });

      }else{

        res.status(200).json({
          message: result.rows
        });
      }

        await db.queryContabil("COMMIT"); 

    } catch (error) {
      await db.queryContabil("ROLLBACK"); 
        res.status(500).json({
            message: "Falha em verificar tarefa iniciada, tente novamente" + error
          });
    }

  };

  exports.pausarTarefa = async (req, res) =>{

    const { dta_pausa, cod_usuario, seq_registro } = req.body;


    try {

      await db.queryContabil("BEGIN"); 

        await db.queryContabil("update tab_tarefa set dta_pausa_tarefa = $1, ind_situacao_tarefa = 'P'  where seq_registro = $2 ",[dta_pausa, seq_registro]);


        await db.queryContabil(`insert into tab_tempo_tarefa 
                                (dta_evento, tipo_evento, seq_registro_tarefa)
                                values
                                ($1, $2, $3)`,[dta_pausa, 'P', seq_registro])

        await db.queryContabil("COMMIT");

        res.status(200).json({
          message: "Tarefa Pausada com Sucesso"
        });
    } catch (error) {
      await db.queryContabil("ROLLBACK"); 
        res.status(500).json({
            message: "Falha em iniciar tarefa, tente novamente" + error
          });
    }

  };

  
  exports.finalizaTarefa = async (req, res) =>{

    const { seq_registro, tempo_decorrido, anexo_finalizacao, des_anexo_finalizacao, dta_fim_tarefa, seq_registro_anexo, justificativa, cod_tarefa_grupo, ind_necessita_reajuste, cod_cliente } = req.body;

    try {

      await db.queryContabil("BEGIN"); // 🔹 Inicia transação

        await db.queryContabil(`update tab_tarefa 
                                set dta_fim_tarefa = $1, 
                                    anexo_finalizacao = $2, 
                                    des_anexo_finalizacao = $3,
                                    ind_status = 'F',
                                    ind_situacao_tarefa = 'F', 
                                    tempo_decorrido = $4,
                                    justificativa_atraso = $5,
                                    ind_necessita_reajuste = $6
                                    where seq_registro = $7`,[dta_fim_tarefa, anexo_finalizacao, des_anexo_finalizacao, tempo_decorrido, justificativa, ind_necessita_reajuste, seq_registro]);

        await db.queryContabil(`UPDATE tab_tarefa
                                SET ind_precedente_concluida = 'S'
                                WHERE cod_tarefa_precedente IN (
                                    SELECT cod_tarefa_grupo 
                                    FROM tab_tarefa 
                                    WHERE cod_cliente = $1 AND cod_tarefa_grupo = $2
                                );`,[cod_cliente, cod_tarefa_grupo,])

        await db.queryContabil(`update tab_tarefa_anexo_cliente
                                  set dta_conclusao_booker = $1,
                                      ind_aprovado = 'F'
                                  where seq_registro_anexo = $2`, [dta_fim_tarefa, seq_registro_anexo])


        await db.queryContabil("COMMIT"); // 🔹 Commit se tudo deu certo

        res.status(200).json({
            message: "Tarefa Finalizada com Sucesso"
        });
        
    } catch (error) {
      await db.queryContabil("COMMIT"); // 🔹 Rollback em caso de erro
        res.status(500).json({
            message: "Falha em finalizar tarefa, tente novamente" + error
          });
    }

  };

  exports.alteraDataTarefa = async (req, res) =>{

    const { cod_tarefa, dta_inicio, dta_fim } = req.body;

    try {

        await db.queryContabil(`update tab_tarefa 
                                set 
                                dta_inicio_tarefa = $1, 
                                dta_fim_tarefa = $2
                                where seq_registro = $3`,[dta_inicio, dta_fim, cod_tarefa]);
        res.status(200).json({
            message: "Data Alterada com Sucesso"
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Falha em altera data da tarefa, tente novamente" + error
          });
    }

  };

  exports.recriaTarefa = async (req, res) =>{

    const { cod_tarefa, dta_inicio, dta_fim, ind_gera_obrigacao_cliente, seq_obrigacao, cod_cliente, cod_obrigacao, cod_departamento } = req.body;
    let newSeqObrigacao = null;

    try {

      if (ind_gera_obrigacao_cliente === true) {

          await db.queryContabil(`INSERT INTO tab_obrigacao_cliente (cod_cliente, observacao, frequencia, dta_entrega, ind_status, cod_departamento, cod_obrigacao)
                          VALUES (
                                 (select cod_cliente from tab_obrigacao_cliente where seq_obrigacao = $1), 
                                 (select observacao from tab_obrigacao_cliente where seq_obrigacao = $1), 
                                 (select frequencia from tab_obrigacao_cliente where seq_obrigacao = $1), 
                                 $2, 
                                 'A', 
                                 (select cod_departamento from tab_obrigacao_cliente where seq_obrigacao = $1), 
                                 (select cod_obrigacao from tab_obrigacao_cliente where seq_obrigacao = $1)
                               )`,[seq_obrigacao, dta_inicio]);
          const result = await db.queryContabil(`select 
                                            max(seq_obrigacao) as seq_obrigacao 
                                            from tab_obrigacao_cliente 
                                            where cod_cliente = $1
                                            and cod_obrigacao = $2
                                            and cod_departamento =  $3
                                            and ind_status = 'A'`,[cod_cliente, cod_obrigacao, cod_departamento]);
          newSeqObrigacao = result.rows[0].seq_obrigacao;
      }

        await db.queryContabil(`insert into tab_tarefa (
                                                des_tarefa, 
                                                cod_usuario,
                                                dta_inicio,
                                                dta_fim,
                                                cod_cliente,
                                                frequencia,
                                                ind_concluido,
                                                ind_status,
                                                cod_departamento,
                                                ind_tipo,
                                                ind_gera_obrigacao_cliente,
                                                seq_obrigacao
                                                ) values (
                                                (select des_tarefa from tab_tarefa where cod_tarefa = $1),
                                                (select cod_usuario from tab_tarefa where cod_tarefa = $1),
                                                $2,
                                                $3,
                                                (select cod_cliente from tab_tarefa where cod_tarefa = $1),
                                                (select frequencia from tab_tarefa where cod_tarefa = $1),
                                                false,
                                                'A',
                                                (select cod_departamento from tab_tarefa where cod_tarefa = $1),
                                                (select ind_tipo from tab_tarefa where cod_tarefa = $1),
                                                (select ind_gera_obrigacao_cliente from tab_tarefa where cod_tarefa = $1),
                                                $4
                                                )
            `,[cod_tarefa, dta_inicio, dta_fim, newSeqObrigacao]);

        res.status(200).json({
            message: "Registro Recriado com sucesso"
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Falha em recriar registro, tente novamente" + error
          });
    }

  };

  exports.incluirLembrete = async (req, res) =>{

    const { des_lembrete, dta_lembrete, ind_recorrente, dta_fim_lembrete } = req.body;

    try {

        await db.query(`insert into tab_lembrete_agenda 
                                        ( des_lembrete, dta_lembrete, ind_recorrente, dta_fim_lembrete )
                                        values
                                        ($1, $2, $3, $4)`,[des_lembrete, dta_lembrete, ind_recorrente, dta_fim_lembrete]);

        res.status(200).json({
            message: "Lembrete incluso com sucesso"
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Falha em incluir lembretes, tente novamente" + error
          });
    }

  };

  
  exports.excluirLembrete = async (req, res) =>{

    const { seq_lembrete } = req.body;

    try {

        await db.query("delete from tab_lembrete_agenda where seq_lembrete = $1",[seq_lembrete]);

        res.status(200).json({
            message: "Lembrete Excluído com Sucesso."
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Falha em excluir lembrete, tente novamente" + error
          });
    }

  };

  exports.buscaLembrete = async (req, res) =>{

    try {

        const result = await db.queryContabil("select * from tab_lembrete_agenda");

        
        res.status(200).json({
            message: result.rows
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Falha buscar lembretes, tente novamente" + error
          });
    }

  };


  exports.buscaTarefaFinalizada = async (req, res) =>{
    
    const { cod_usuario, dta_inicio, dta_fim } = req.body;

    try {
        await db.queryContabil("BEGIN");
        const arquivos = await db.queryContabil(`SELECT a.*, b.*
                                                  FROM tab_tarefa a
                                                  LEFT JOIN tab_cliente b ON (a.cod_cliente = b.cod_cliente)
                                                  WHERE a.ind_status = 'F'
                                                    AND (a.cod_usuario_1 IN ($1) OR a.cod_usuario_2 IN ($1)) -- Agrupando o OR
                                                    AND a.dta_inicio_tarefa > $2
                                                    AND a.dta_fim_tarefa < $3;
                                                  `,[cod_usuario, dta_inicio, dta_fim]);

        await db.queryContabil("COMMIT");
      res.status(200).json({
        results: arquivos.rows
       });
      
    } catch (error) {
        await db.queryContabil("ROLLBACK");
      res.status(500).json({
        message: "Falha em buscar arquivos, tente novamente " + error
       });
    }
  };

  exports.buscaTodaTarefaFinalizada = async (req, res) => {
    console.time('Tempo total da função'); // Inicia o timer geral
    
    const ultimos30dias = moment().subtract(30, 'days').format();

    try {
        console.time('Tempo da transação');
        await db.queryContabil("BEGIN");
        console.timeEnd('Tempo da transação');

        console.time('Tempo da consulta SQL');
        const arquivos = await db.queryContabil(`SELECT a.*, b.*
                                              FROM tab_tarefa a
                                              LEFT JOIN tab_cliente b ON (a.cod_cliente = b.cod_cliente)
                                              WHERE a.ind_status = 'F'
                                              and a.dta_fim_tarefa >= $1
                                              ORDER BY SEQ_REGISTRO DESC
                                              `,[ultimos30dias]);
        console.timeEnd('Tempo da consulta SQL');
        console.log(`Número de registros encontrados: ${arquivos.rows.length}`);

        console.time('Tempo do commit');
        await db.queryContabil("COMMIT");
        console.timeEnd('Tempo do commit');

        console.timeEnd('Tempo total da função'); // Finaliza o timer geral
        
        res.status(200).json({
            results: arquivos.rows
        });
      
    } catch (error) {
        console.time('Tempo do rollback');
        await db.queryContabil("ROLLBACK");
        console.timeEnd('Tempo do rollback');

        console.timeEnd('Tempo total da função'); // Garante que o timer geral é finalizado mesmo em caso de erro
        console.error('Erro na busca:', error);

        res.status(500).json({
            message: "Falha em buscar arquivos, tente novamente " + error
        });
    }
};


  exports.buscaHoraTarefa = async (req, res) =>{

    const { seq_registro } =  req.body;

    try {

        const result = await db.queryContabil("select * from tab_tempo_tarefa where seq_registro_tarefa = $1 order by seq_registro",[seq_registro]);
        
        res.status(200).json({
            message: result.rows
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Falha buscar horas da tarefa, tente novamente" + error
          });
    }

  };

  exports.horasDeTarefas = async (req, res) =>{

    const { cod_usuario } =  req.body;

    try {

      const result = await db.queryContabil(
        `SELECT tempo_decorrido 
          FROM tab_tarefa 
          WHERE (cod_usuario_1 IN ($1) OR cod_usuario_2 IN ($1)) 
          and ind_situacao_tarefa = 'F' 
          and dta_fim_tarefa > '${moment().subtract(1, 'days').format('YYYY.MM.DD')}'
          and dta_fim_tarefa < '${moment().add(1, 'days').format('YYYY.MM.DD')}'`,
        [cod_usuario]
      );
      
      let totalSeconds = 0;

      // Iterando sobre a lista de tempos no formato HH:mm:ss
      result.rows.forEach(row => {
        const duration = moment.duration(row.tempo_decorrido); // Usando moment.duration para converter
        totalSeconds += duration.asSeconds(); // Convertendo para segundos e somando
      });
    
      // Criando uma duração total e convertendo de volta para HH:mm:ss
      const totalDuration = moment.duration(totalSeconds, 'seconds');
      const hours = totalDuration.hours();
      const minutes = totalDuration.minutes();
      const seconds = totalDuration.seconds();
    
      // Retornando o tempo somado no formato HH:mm:ss
      const tempo = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        res.status(200).json({
            message: tempo
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Falha buscar horasDeTarefas, tente novamente" + error
          });
    }

  };


  exports.reabrirTarefa = async (req, res) =>{

    const { seq_registro, des_motivo_reabertura } =  req.body;

    try {

       await db.queryContabil(`update tab_tarefa 
                                set dta_fim_tarefa = null, 
                                ind_status = 'A', 
                                anexo_finalizacao = null, 
                                des_anexo_finalizacao = null, 
                                des_motivo_reabertura = $1 
                                where seq_registro = $2`,[des_motivo_reabertura, seq_registro]);
        
        res.status(200).json({
            message: 'Tarefa Reaberta com Sucesso'
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Falha em reabrir tarefa, tente novamente" + error
          });
    }

  };

  cron.schedule('0 19 * * *', () => {
    pausaTarafaAutomatica();
  });

  function escreverLog(mensagem) {
    const logPath = path.join(__dirname, 'log-pausa-automatica.txt');
    const dataHora = moment().format('YYYY-MM-DD HH:mm:ss');
    const log = `[${dataHora}] ${mensagem}\n`;
  
    fs.appendFileSync(logPath, log, 'utf8');
  }

  async function pausaTarafaAutomatica() {
    const dta_pausa = moment().format();
  
    try {
      await db.queryContabil("BEGIN");
  
      // Adicione .rows para acessar o array de resultados
      const result = await db.queryContabil(`SELECT * FROM tab_tarefa WHERE ind_situacao_tarefa = 'I'`);
      const rows = result.rows; // Acessa as linhas do resultado
  
      for (const row of rows) { // Agora iteramos sobre .rows
        await db.queryContabil(
          "UPDATE tab_tarefa SET dta_pausa_tarefa = $1, ind_situacao_tarefa = 'P' WHERE seq_registro = $2",
          [dta_pausa, row.seq_registro]
        );
  
        await db.queryContabil(
          `INSERT INTO tab_tempo_tarefa (dta_evento, tipo_evento, seq_registro_tarefa)
           VALUES ($1, $2, $3)`,
          [dta_pausa, 'P', row.seq_registro]
        );
  
        escreverLog(`Tarefa ${row.seq_registro} pausada com sucesso.`);
      }
  
      await db.queryContabil("COMMIT");
  
      const sucessoMsg = `Pausa automática concluída com sucesso às ${dta_pausa}`;
      escreverLog(sucessoMsg);
    } catch (error) {
      await db.queryContabil("ROLLBACK");
  
      const erroMsg = `Erro ao executar pausa automática: ${error.message}`;
      console.error(erroMsg);
      escreverLog(erroMsg);
    }
  }
  

  exports.ajustaDataTarefa = async (req, res) =>{

    const { seq_registro, nova_dta_inicio_tarefa, nova_dta_fim_tarefa, tempo_decorrido } =  req.body;

    try {

      await db.queryContabil('delete from tab_tempo_tarefa where seq_registro_tarefa = $1',[seq_registro])

      await db.queryContabil(`insert into tab_tempo_tarefa 
        (dta_evento, tipo_evento, seq_registro_tarefa)
        values
        ($1, $2, $3)`,[nova_dta_inicio_tarefa, 'I', seq_registro])

       await db.queryContabil(`update tab_tarefa 
                                set dta_inicio_tarefa = $1, 
                                    dta_fim_tarefa = $2,
                                    tempo_decorrido = $3,
                                    ind_reajustado = $4
                                where seq_registro = $5`,[nova_dta_inicio_tarefa, nova_dta_fim_tarefa, tempo_decorrido, true, seq_registro]);
        
        res.status(200).json({
            message: 'Tempo de Tarefa Reajustado com Sucesso'
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Falha em reajustar tempo de tarefa, tente novamente" + error
          });
    }

  };

  
