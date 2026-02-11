const db = require("../config/database");
require("dotenv-safe").config();
const jwt = require("jsonwebtoken");
const moment = require("moment");
const nodemailer = require("nodemailer");


const client = nodemailer.createTransport({
  service: "Gmail",
  auth: {
      user: "pcobranca@grupobagattoli.com.br",
      pass: "dukgjdawhdgsovdr"
  }
});

exports.listaArquivosEntregues = async (req, res) =>{

    const { dta_inicio, dta_fim } = req.body;

    try {
        await db.queryContabil("BEGIN");
        //clientes com arquivos entregues pendentes de aprovaçao
        const clientes = await db.queryContabil(`select distinct a.cod_cliente, a.nom_cliente, a.num_cnpj_cpf, b.ind_status from tab_cliente a
                                          inner join tab_tarefa b on (a.cod_cliente = b.cod_cliente)
                                            where b.ind_status in ('E', 'A', 'R', 'I')
                                            and dta_inicio_tarefa between $1 and $2
                                            AND b.ind_gera_obrigacao_cliente = TRUE`, [dta_inicio, dta_fim]);
  
        const arquivos = await db.queryContabil(`select b.cod_tarefa, 
                                                a.cod_cliente, 
                                                a.nom_cliente, 
                                                a.num_cnpj_cpf, 
                                                b.seq_obrigacao, 
                                                b.des_tarefa, 
                                                b.anexo, 
                                                b.nom_arquivo, 
                                                b.ind_status,
                                                b.dta_inicio_tarefa,
                                                c.frequencia,
                                                c.observacao,
                                                c.cod_obrigacao,
                                                b.dta_ciencia_cliente,
                                                b.ind_gera_obrigacao_cliente,
                                                b.ind_tipo
                                                from tab_cliente a
                                            inner join tab_tarefa b on (a.cod_cliente = b.cod_cliente)
                                            inner join tab_obrigacao_cliente c on (b.seq_obrigacao = c.seq_obrigacao)
                                            where b.ind_status in ('E', 'A', 'R', 'I')
                                            and dta_inicio_tarefa between $1 and $2
                                            AND b.ind_gera_obrigacao_cliente = TRUE`, [dta_inicio, dta_fim]);

        const response =  arquivos.rows.map(row => {
            const { cod_tarefa, cod_cliente, nom_cliente, num_cnpj_cpf, seq_obrigacao, des_tarefa, anexo, nom_arquivo, ind_status, frequencia, observacao, cod_obrigacao, dta_inicio, dta_ciencia_cliente, ind_gera_obrigacao_cliente, ind_tipo  } = row;
            const base64Image = anexo !== null ? anexo.toString() : null;
            
            return {
              cod_tarefa, 
              cod_cliente, 
              nom_cliente, 
              num_cnpj_cpf,
              seq_obrigacao, 
              des_tarefa, 
              nom_arquivo,
              anexo: base64Image,
              ind_status,
              frequencia,
              observacao,
              cod_obrigacao,
              dta_inicio,
              dta_ciencia_cliente,
              ind_gera_obrigacao_cliente,
              ind_tipo
            };
          });

        await db.queryContabil("COMMIT");
      res.status(200).json({
        clientes: clientes.rows,
        arquivos: response
       });
      
    } catch (error) {
        await db.queryContabil("ROLLBACK");
      res.status(500).json({
        message: "Falha em buscar arquivos para aprovação, tente novamente " + error
       });
    }
  
  };

  exports.rejeitarArquivoCliente = async (req, res)=>{

    const { seq_registro, cod_cliente, seq_registro_tarefa, des_rejeicao  } = req.body;
  
    try {
        await db.queryContabil("BEGIN");

  
        await db.queryContabil(`update tab_tarefa 
                                set dta_ciencia_cliente = null, 
                                ind_status = 'P', 
                                ind_precedente_concluida = 'N'
                                where seq_registro = $1`,[seq_registro_tarefa]);

        await db.queryContabil(`update tab_tarefa_anexo_cliente
                                set anexo = null,
                                    des_anexo = null,
                                    dta_upload_anexo = null,
                                    ind_aprovado = 'R',
                                    des_rejeicao = $1
                                where cod_cliente = $2
                                and seq_registro = $3`,[des_rejeicao, cod_cliente, seq_registro]);

        

        await db.queryContabil("COMMIT");
      res.status(200).json({
        message: "Arquivo alterado para rejeitado"
       });
    } catch (error) {
        await db.queryContabil("ROLLBACK");
      res.status(500).json({
        message: "Falha em rejeitar o arquivo" + error
       });
    }
  
  };

  exports.aprovarArquivoCliente = async (req, res)=>{

    const { cod_tarefa, cod_cliente, seq_obrigacao, observacao  } = req.body;
  
    try {
        await db.queryContabil("BEGIN");

  
        await db.queryContabil(`update tab_tarefa 
                                set ind_status = 'F'
                                where cod_tarefa = $1`,[cod_tarefa]);

        await db.queryContabil(`update tab_obrigacao_cliente
                                set ind_status = 'F'
                                where cod_cliente = $1
                                and seq_obrigacao = $2`,[cod_cliente, seq_obrigacao]);

        await db.queryContabil("COMMIT");
      res.status(200).json({
        message: "Arquivo alterado para Aprovado"
       });
    } catch (error) {
        await db.queryContabil("ROLLBACK");
      res.status(500).json({
        message: "Falha em aprovar o arquivo" + error
       });
    }
  
  };

  async function enviarEmails(notificacoes, tipo) {
    if(notificacoes){
      for (const row of notificacoes) {
        try {
          await client.sendMail({
            from: 'pcobranca@grupobagattoli.com.br',
            to: row.des_email,
            subject: 'Notificações - Postos Bagattoli',
            text: `Olá, Prezado Cliente ${row.nom_pessoa} \n
              Este é apenas um LEMBRETE do seu boleto no valor de R$ ${row.val_original} está ${tipo} em ${row.dta_vencimento} \n 
              Caso tenha efetuado o pagamento, desconsidere esta mensagem.\n
              Pague seu boleto em dia e evite o pagamento de juros. \n
              Caso não possua o boleto, por favor nos cantate através dos canais de atendimento abaixo. \n
              - Tel/WhatsApp: (69) 99939-6467\n
              - Email: pcobranca@grupobagattoli.com.br\n\n
              Esta é uma mensagem automática, gerada pelo nosso sistema.\n
              Atenciosamente, Equipe Postos Bagattoli.`,
          });
          console.log(`E-mail enviado para ${row.nom_pessoa} (${tipo}).`);
        } catch (error) {
          console.error(`Erro ao enviar e-mail para ${row.nom_pessoa} (${tipo}):`, error);
        }
      }
    }
  }