/* eslint-disable no-unused-vars */
/**
 * arquivo: config/database.js
 * descriçao: arquivo responsavel pela logica do CRUD (API)
 * data: 14/03/2022
 * autor: Renato Filho
 */

const db = require("../config/database");
require("dotenv-safe").config();
const jwt = require("jsonwebtoken");
const moment = require("moment");

exports.buscaAtividadeCliente = async (req, res) =>{

    const { cod_cliente, dta_ciencia_cliente } = req.body;

    console.log(req.body);

    try {
      await db.queryContabil("BEGIN");
      const result = await db.queryContabil(`select a.*
                                        from tab_tarefa_anexo_cliente a
                                        where a.cod_cliente = $1
                                        order BY a.dta_entrega`,[cod_cliente]);

      await db.queryContabil(`update tab_tarefa 
                              set dta_ciencia_cliente = $1 
                              where ind_status in ('A', 'P') 
                              and dta_ciencia_cliente is null
                              and ind_status = 'P'
                              and cod_cliente = $2 `,[dta_ciencia_cliente, cod_cliente]);                                        
  
      await db.queryContabil("COMMIT");

      res.status(200).json({
        message: result.rows
       });
      
    } catch (error) {
      await db.queryContabil("ROLLBACK");
      res.status(500).json({
        message: "Falha em buscar tarefas, tente novamente " + error
       });
    }
  
  };

  exports.enviaArquivoTarefaCliente = async (req, res) => {
    const { seq_registro, des_anexo, ind_aprovado, anexo, dta_upload_anexo, seq_registro_anexo } = req.body;

    hoje = moment().format('YYYY.MM.DD')
  
    console.log(req.body)
    try {
      // Iniciar uma transação
      await db.queryContabil("BEGIN");
  
      // Atualizar tab_obrigacao_cliente
      await db.queryContabil(`UPDATE tab_tarefa_anexo_cliente 
                                SET ind_aprovado = 'E', 
                                    dta_upload_anexo = $1,
                                    des_anexo = $2,
                                    anexo = $3
                                WHERE seq_registro = $4`, [dta_upload_anexo, des_anexo, anexo, seq_registro]);
  
      await db.queryContabil(`update tab_tarefa
                                set ind_status = 'A',
                                    ind_precedente_concluida = 'S'
                                WHERE seq_registro_anexo = $1`,[seq_registro_anexo])                                
      // Commit da transação
      await db.queryContabil("COMMIT");
  
      res.status(200).json({
        message: "Upload Realizado com Sucesso."
      });
    } catch (error) {
      // Em caso de erro, fazer um rollback da transação
      await db.queryContabil("ROLLBACK");
  
      res.status(500).json({
        message: "Falha em executar a transação no banco de dados: " + error
      });
    }
  };
