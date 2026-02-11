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
const crypto = require('crypto');
const database = require("../config/database");


//=> metodo responsavel por listar os usuarios por ID
exports.fazerLogin = async (req, res) => {
  let clientesDoGrupo = [];
  let departamento = [];
  let usuariosAdministrados = [];

  const { usuario, senha } = req.body;

  try {

    await db.queryContabil("BEGIN");

    const user = await db.queryContabil(`select 
                                  tu.cod_usuario, 
                                  tu.nom_usuario, 
                                  tu.cod_cliente, 
                                  tu.cod_grupo, 
                                  tu.cod_perfil, 
                                  tp.cod_departamento_visualizacao, 
                                  tp.cod_departamento_atuacao,
                                  tgu.usuarios_dependentes
                                  from tab_usuario tu
                                  inner join tab_perfil tp on ( tu.cod_perfil = tp.cod_perfil )
                                  left join tab_gerencia_usuario tgu on ( tu.cod_usuario = tgu.cod_usuario )
                                  where tu.nom_usuario = $1
                                  and tu.des_senha = $2
                                  and tu.ind_ativo = true`, [usuario, senha]);

    if (user.rowCount !== 0) {

      const acessos = await db.queryContabil(`SELECT 
                                              b.cod_funcao, 
                                              b.cod_usuario
                                          FROM 
                                              tab_acesso_usuario b
                                          WHERE 
                                              b.cod_usuario = $1`, [user.rows[0].cod_usuario]);

      if (user.rows[0].cod_cliente === 0) { // clientes do grupo vinculado ao cadastro

        clientesDoGrupo = await db.queryContabil(`select 
                                              a.cod_cliente, 
                                              a.nom_cliente, 
                                              a.num_cnpj_cpf 
                                              from tab_cliente a
                                              inner join tab_grupo_cliente b on (a.cod_grupo_cliente = b.cod_grupo_cliente)
                                              where b.cod_grupo_cliente = $1`, [user.rows[0].cod_grupo]);
      } else { //cliente do usuario
        clientesDoGrupo = await db.queryContabil(`select 
                                              a.cod_cliente, 
                                              a.nom_cliente, 
                                              a.num_cnpj_cpf 
                                              from tab_cliente a
                                              where a.cod_cliente = $1`, [user.rows[0].cod_cliente]);
      }

      if (user.rows[0].cod_departamento_visualizacao !== null) {
        departamento = await db.queryContabil(`select cod_departamento, des_departamento from tab_departamento where cod_departamento in (${user.rows[0].cod_departamento_visualizacao}) `);
      }

      if (user.rows[0].usuarios_dependentes !== null) {
        usuariosAdministrados = await db.queryContabil(`select cod_usuario, nom_usuario from tab_usuario where cod_usuario in (${user.rows[0].usuarios_dependentes}) `);
      }

      const id = (user.rows[0].cod_usuario * 100) / 5;

      const token = jwt.sign({ id }, process.env.SECRET, {
        expiresIn: 6000, // 1h de prazo para expirar a sessao.
      });
      res.status(200).json({
        authDRFContabil: true,
        token: token,
        user: user.rows,
        acessos: acessos.rows,
        dep: departamento.rows,
        userAdmin: usuariosAdministrados.rows,
        clientes: clientesDoGrupo.rows,
        status: "ok",
        perfil: user.rows[0].cod_perfil
      });
      //Se existir usuario e senha, abre a sessão com um token.

      await db.queryContabil("COMMIT"); // Confirma a transação
    } else {
      await db.queryContabil("ROLLBACK"); // Confirma a transação
      res.status(400).json({
        message: "Usuário e Senha inválidos ou não existentes.",
        status: "no"
      });
    }

  } catch (error) {
    res.status(500).json({
      message: "Falha em realizar o login, tente novamente" + error
    });
  }

};

exports.registraLog = async (req, res) => {

  const { des_log, tela, usuario } = req.body;

  try {

    const result = await db.queryContabil(`insert into tab_log 
                                               ( des_log, tela, usuario )
                                               values
                                               ($1,$2,$3)
                                               `, [des_log, tela, usuario]);

    res.status(200).json({
      message: "Log criado com sucesso"
    });
  } catch (error) {
    res.status(500).json({
      message: "Falha em registrar o log de alterações" + error
    });
  }

};

exports.cadastroTributacaoCliente = async (req, res) => {

  const { des_tributacao, ind_ativo } = req.body;

  try {

    await db.queryContabil(`insert into tab_tributacao_cliente
                                               ( des_tributacao, ind_ativo )
                                               values
                                               ($1,$2)
                                               `, [des_tributacao, ind_ativo]);



    res.status(200).json({
      message: "Tributacao criada com sucesso",
      data: req.body
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em criar tributacao, tente novamente " + error
    });
  }
};

exports.buscaTributacaoCliente = async (req, res) => {

  try {

    const result = await db.queryContabil("select seq_tributacao, des_tributacao, ind_ativo from tab_tributacao_cliente order by 1");

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar tributacoes, tente novamente " + error
    });
  }

};

exports.alteraTributacaoCliente = async (req, res) => {

  const { seq_tributacao, des_tributacao } = req.body;

  try {

    await db.queryContabil(`update tab_tributacao_cliente
                      set des_tributacao = $1
                      where seq_tributacao = $2`, [des_tributacao, seq_tributacao]);

    res.status(200).json({
      message: "Registro alterado com sucesso."
    });

  } catch (error) {

    res.status(200).json({
      message: "Falha em alterar o registro, tente novamente " + error
    });
  }

};

exports.removeTributacaoCliente = async (req, res) => {

  const { seq_tributacao } = req.body;

  try {

    const result = await db.queryContabil(`select cod_cliente, nom_cliente from tab_cliente 
                                    where seq_tributacao = $1`, [seq_tributacao]);

    if (result.rowCount > 0) {
      res.status(200).json({
        message: "Existem vinculos a clientes",
        data: result.rows
      });
    } else {
      await db.queryContabil(`update tab_tributacao_cliente
                      set ind_ativo = 'N'
                      where seq_tributacao = $1`, [seq_tributacao]);

      res.status(200).json({
        message: "Registro inativado com sucesso."
      });
    }

  } catch (error) {

    res.status(200).json({
      message: "Falha em remover o registro, tente novamente " + error
    });
  }

};

exports.cadastroGrupoCliente = async (req, res) => {

  const { des_grupo, observacao } = req.body;

  try {

    const result = await db.queryContabil(`insert into tab_grupo_cliente 
                                               ( des_grupo, observacao )
                                               values
                                               ($1,$2)
                                               `, [des_grupo, observacao]);



    res.status(200).json({
      message: "Grupo criado com sucesso",
      data: req.body
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em criar o grupo de clientes, tente novamente " + error
    });
  }
};

exports.buscaGrupoCliente = async (req, res) => {

  try {

    const result = await db.queryContabil("select cod_grupo_cliente, des_grupo, observacao from tab_grupo_cliente order by 1");

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar grupo de clientes, tente novamente " + error
    });
  }

};

exports.alteraGrupoCliente = async (req, res) => {

  const { cod_grupo_cliente, des_grupo, observacao } = req.body;

  try {

    await db.queryContabil(`update tab_grupo_cliente
                      set des_grupo = $1,
                          observacao = $2
                      where cod_grupo_cliente = $3`, [des_grupo, observacao, cod_grupo_cliente]);

    res.status(200).json({
      message: "Registro alterado com sucesso."
    });

  } catch (error) {

    res.status(200).json({
      message: "Falha em alterar o registro, tente novamente " + error
    });
  }

};

exports.removeCadastroGrupoCliente = async (req, res) => {

  const { cod_grupo_cliente } = req.body;

  try {

    const result = await db.queryContabil(`select cod_cliente, nom_cliente from tab_cliente 
                                    where cod_grupo_cliente = $1`, [cod_grupo_cliente]);

    if (result.rowCount > 0) {
      res.status(200).json({
        message: "Existem vinculos a clientes",
        data: result.rows
      });
    } else {
      await db.queryContabil(`delete from tab_grupo_cliente
                      where cod_grupo_cliente = $1`, [cod_grupo_cliente]);

      res.status(200).json({
        message: "Registro removido com sucesso."
      });
    }

  } catch (error) {

    res.status(200).json({
      message: "Falha em remover o registro, tente novamente " + error
    });
  }

};


exports.buscaObrigacao = async (req, res) => {

  try {

    const result = await db.queryContabil(`select 
                                    a.cod_obrigacao, 
                                    a.des_obrigacao, 
                                    a.observacao, 
                                    false as checked, 
                                    a.cod_departamento, 
                                    b.des_departamento 
                                    from tab_obrigacoes a  
                                    inner join tab_departamento b on (a.cod_departamento = b.cod_departamento)
                                    where a.ind_sistema <> TRUE 
                                    order by 1`);

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar obrigações, tente novamente " + error
    });
  }

};

exports.alteraObrigacao = async (req, res) => {

  const { cod_obrigacao, des_obrigacao, observacao, cod_departamento } = req.body;

  console.log(req.body);

  try {

    await db.queryContabil(`update tab_obrigacoes
                      set des_obrigacao = $1,
                          observacao = $2,
                          cod_departamento = $3
                      where cod_obrigacao = $4`, [des_obrigacao, observacao, cod_departamento, cod_obrigacao]);

    res.status(200).json({
      message: "Registro alterado com sucesso."
    });

  } catch (error) {

    res.status(200).json({
      message: "Falha em alterar o registro, tente novamente " + error
    });
  }

};

exports.cadastroObrigacao = async (req, res) => {

  const { des_obrigacao, observacao, cod_departamento } = req.body;

  try {

    const result = await db.queryContabil(`insert into tab_obrigacoes 
                                               ( des_obrigacao, observacao, cod_departamento, ind_sistema )
                                               values
                                               ($1,$2, $3, FALSE)
                                               `, [des_obrigacao, observacao, cod_departamento]);



    res.status(200).json({
      message: "Obrigação criado com sucesso",
      data: req.body
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em criar o obrigação, tente novamente " + error
    });
  }
};

exports.removeObrigacao = async (req, res) => {

  const { cod_obrigacao } = req.body;

  try {

    const result = await db.queryContabil(`select * from tab_obrigacao_cliente 
                                    where cod_obrigacao = $1`, [cod_obrigacao]);

    if (result.rowCount > 0) {
      res.status(200).json({
        message: "Existem vinculos a clientes",
        data: result.rows
      });
    } else {
      await db.queryContabil(`delete from tab_obrigacoes
                      where cod_obrigacao = $1`, [cod_obrigacao]);

      res.status(200).json({
        message: "Registro removido com sucesso."
      });
    }

  } catch (error) {

    res.status(200).json({
      message: "Falha em remover o registro, tente novamente " + error
    });
  }

};

exports.buscaRamoAtividade = async (req, res) => {

  try {

    const result = await db.queryContabil("select cod_ramo_atividade, des_ramo_atividade, observacao from tab_ramo_atividade order by 1");

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar ramos atividade, tente novamente " + error
    });
  }

};

exports.alteraRamoAtividade = async (req, res) => {

  const { cod_ramo_atividade, des_ramo_atividade, observacao } = req.body;

  try {

    await db.queryContabil(`update tab_ramo_atividade
                      set des_ramo_atividade = $1,
                          observacao = $2
                      where cod_ramo_atividade = $3`, [des_ramo_atividade, observacao, cod_ramo_atividade]);

    res.status(200).json({
      message: "Registro alterado com sucesso."
    });

  } catch (error) {

    res.status(200).json({
      message: "Falha em alterar o registro, tente novamente " + error
    });
  }

};

exports.cadastroRamoAtividade = async (req, res) => {

  const { des_ramo_atividade, observacao } = req.body;

  try {

    const result = await db.queryContabil(`insert into tab_ramo_atividade 
                                               ( des_ramo_atividade, observacao )
                                               values
                                               ($1,$2)
                                               `, [des_ramo_atividade, observacao]);



    res.status(200).json({
      message: "Ramo Atividade criado com sucesso",
      data: req.body
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em criar o obrigação, tente novamente " + error
    });
  }
};

exports.removeRamoAtividade = async (req, res) => {

  const { cod_ramo_atividade } = req.body;

  try {

    const result = await db.queryContabil(`select cod_cliente, nom_cliente from tab_cliente 
                                    where cod_ramo_atividade = $1`, [cod_ramo_atividade]);

    if (result.rowCount > 0) {
      res.status(200).json({
        message: "Existem vinculos a clientes",
        data: result.rows
      });
    } else {
      await db.queryContabil(`delete from tab_ramo_atividade
                      where cod_ramo_atividade = $1`, [cod_ramo_atividade]);

      res.status(200).json({
        message: "Registro removido com sucesso."
      });
    }

  } catch (error) {

    res.status(200).json({
      message: "Falha em remover o registro, tente novamente " + error
    });
  }

};

exports.buscaRegimeTributario = async (req, res) => {

  try {

    const result = await db.queryContabil("select cod_regime, des_regime from tab_regime_trib order by 1");

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar regimes tributários, tente novamente " + error
    });
  }

};

exports.cadastroCliente = async (req, res) => {

  const { ind_natureza, num_cnpj_cpf, nom_cliente, cod_regime, cod_ramo_atividade, num_cep, des_logradouro, des_complemento, nom_bairro, des_cidade, des_uf, cod_grupo_cliente, observacao, ind_ativo, seq_tributacao, cod_usuario_padrao } = req.body;

  try {

    const result = await db.queryContabil(`insert into tab_cliente
                                               ( ind_natureza, num_cnpj_cpf, nom_cliente, cod_regime, cod_ramo_atividade, num_cep, des_logradouro, des_complemento, nom_bairro, des_cidade, des_uf, cod_grupo_cliente, observacao, ind_ativo, seq_tributacao, cod_usuario_padrao, ind_configurado )
                                               values
                                               ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
                                               `, [ind_natureza, num_cnpj_cpf, nom_cliente, cod_regime, cod_ramo_atividade, num_cep, des_logradouro, des_complemento, nom_bairro, des_cidade, des_uf, cod_grupo_cliente, observacao, ind_ativo, seq_tributacao, cod_usuario_padrao, 'N']);



    res.status(200).json({
      message: "Cadastro de cliente criado com sucesso",
      data: req.body
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em registrar cliente, tente novamente " + error
    });
  }
};

exports.buscaCadastroCliente = async (req, res) => {

  try {

    const result = await db.queryContabil(`select a.*, false as ind_selecionado, b.des_grupo from tab_cliente a 
                                              left join tab_grupo_cliente b on (a.cod_grupo_cliente = b.cod_grupo_cliente)
                                            order by nom_cliente`);

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar clientes, tente novamente " + error
    });
  }

};

exports.alteraCadastroCliente = async (req, res) => {

  const { cod_cliente, ind_natureza, num_cnpj_cpf, nom_cliente, cod_regime, cod_ramo_atividade, num_cep, des_logradouro, des_complemento, nom_bairro, des_cidade, des_uf, cod_grupo_cliente, observacao, ind_ativo, seq_tributacao, cod_usuario_padrao } = req.body;

  try {

    const result = await db.queryContabil(`update tab_cliente 
                                               set ind_natureza = $2,
                                                   num_cnpj_cpf = $3,
                                                   nom_cliente = $4,
                                                   cod_regime = $5,
                                                   cod_ramo_atividade = $6,
                                                   num_cep = $7,
                                                   des_logradouro = $8,
                                                   des_complemento = $9,
                                                   nom_bairro = $10,
                                                   des_cidade = $11,
                                                   des_uf = $12,
                                                   cod_grupo_cliente = $13,
                                                   observacao = $14,
                                                   ind_ativo = $15,
                                                   seq_tributacao = $16,
                                                   cod_usuario_padrao = $17
                                                where cod_cliente = $1
                                               `, [cod_cliente, ind_natureza, num_cnpj_cpf, nom_cliente, cod_regime, cod_ramo_atividade, num_cep, des_logradouro, des_complemento, nom_bairro, des_cidade, des_uf, cod_grupo_cliente, observacao, ind_ativo, seq_tributacao, cod_usuario_padrao]);

    res.status(200).json({
      message: "Cadastro alterado com sucesso",
      data: req.body
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em alterar cliente, tente novamente " + error
    });
  }
};

exports.salvaClienteObrigacao = async (req, res) => {
  const { dadosClienteObrigacao, clientes, usuario } = req.body;

  console.log(req.body);

  try {
    await db.queryContabil("BEGIN"); // Inicia uma transação

    // Exclui todas as associações existentes
    for (const row of clientes) {
      await db.queryContabil("DELETE FROM tab_obrigacao_cliente WHERE cod_cliente = $1 AND ind_status = 'A'", [row.cod_cliente]);
      await db.queryContabil("INSERT INTO tab_log (des_log, tela, usuario) VALUES ($1, $2, $3)", [`Remoção de associação: ${row.cod_cliente}`, "Obrigacao X Cliente", usuario]);
    }

    // Insere novas associações
    const insertqueryContabil = `
      INSERT INTO tab_obrigacao_cliente (cod_cliente, observacao, cod_obrigacao, frequencia, dta_entrega, ind_status, cod_departamento)
      VALUES ($1, $2, $3, $4, $5, 'A', (select cod_departamento from tab_obrigacoes where cod_obrigacao = $3))
    `;

    for (const row of dadosClienteObrigacao) {
      await db.queryContabil(insertqueryContabil, [row.cod_cliente, row.observacao, row.cod_obrigacao, row.frequencia, row.dta_entrega]);

      // Registra a ação no log
      await db.queryContabil("INSERT INTO tab_log (des_log, tela, usuario) VALUES ($1, $2, $3)", [`Adicionou associação: ${row.cod_cliente}`, "Obrigacao X Cliente", usuario]);
    }

    for (const row of dadosClienteObrigacao) {
      await db.queryContabil(`insert into tab_tarefa 
                                  ( cod_cliente, 
                                    dta_inicio_tarefa,
                                    dta_fim,
                                    cod_usuario,
                                    seq_obrigacao,
                                    cod_obrigacao,
                                    des_tarefa,
                                    ind_concluido,
                                    ind_status,
                                    frequencia,
                                    cod_departamento,
                                    ind_tipo,
                                    ind_gera_obrigacao_cliente
                                   ) values (
                                    $1,
                                    $2,
                                    $2,
                                    0,
                                    (select max(seq_obrigacao) as seq_obrigacao from tab_obrigacao_cliente
                                                                          where cod_cliente = ${row.cod_cliente}
                                                                          and cod_obrigacao = ${row.cod_obrigacao}),
                                    $3,
                                    (select des_obrigacao from tab_obrigacoes
                                      where cod_obrigacao = ${row.cod_obrigacao}),
                                    false,
                                    'A',
                                    $4,
                                    (select cod_departamento from tab_obrigacoes where cod_obrigacao = $3),
                                    'O',
                                    TRUE
                                   )`, [row.cod_cliente, row.dta_entrega, row.cod_obrigacao, row.frequencia]);
      //await db.queryContabil("DELETE FROM tab_tarefa WHERE cod_cliente = $1 AND  cod_obrigacao = $2 AND ind_status = 'A'", [row.cod_cliente ,row.cod_obrigacao]);
      await db.queryContabil("INSERT INTO tab_log (des_log, tela, usuario) VALUES ($1, $2, $3)", [`Inclusao de tafefa: ${row.cod_cliente}`, "Obrigacao X Cliente", usuario]);
    }

    await db.queryContabil("COMMIT"); // Confirma a transação
    res.status(200).json({
      message: "Associação realizada com sucesso"
    });
  } catch (error) {
    await db.queryContabil("ROLLBACK"); // Desfaz a transação em caso de erro
    console.error("Erro ao realizar associação:", error);
    res.status(500).json({
      message: "Falha em realizar a associação, tente novamente"
    });
  }
};

exports.buscaPerfilUsuario = async (req, res) => {

  try {

    const result = await db.queryContabil("select cod_perfil, des_perfil, ind_tipo, cod_departamento_visualizacao, cod_departamento_atuacao, ind_tipo from tab_perfil order by cod_perfil");

    // Mapeando os resultados para transformar o campo em um array, considerando valores nulos
    const modifiedResult = result.rows.map(row => {
      const codDepartamentoVisualizacao = row.cod_departamento_visualizacao
        ? row.cod_departamento_visualizacao.split(",").map(Number)
        : [];

      // const codDepartamentoAtuacao = row.cod_departamento_atuacao
      //   ? row.cod_departamento_atuacao.split(",").map(Number)
      //   : [];

      return {
        ...row,
        cod_departamento_visualizacao: codDepartamentoVisualizacao
        // cod_departamento_atuacao: codDepartamentoAtuacao
      };
    });

    res.status(200).json({
      message: modifiedResult
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar perfis, tente novamente " + error
    });
  }

};

exports.buscaUsuario = async (req, res) => {

  try {

    const result = await db.queryContabil(`select a.cod_usuario, a.nom_usuario, a.des_senha, a.des_email, a.ind_ativo, 
                                                  a.cod_cliente, a.cod_grupo, a.cod_perfil, b.des_perfil, b.ind_tipo,
                                                  b.cod_departamento_atuacao
                                            from tab_usuario a
                                            inner join tab_perfil b on (a.cod_perfil = b.cod_perfil)
                                            order by a.nom_usuario`);

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar perfis, tente novamente " + error
    });
  }

};


exports.altaraCadastroUsuario = async (req, res) => {
  const { cod_usuario, nom_usuario, des_senha, des_email, ind_ativo, cod_cliente, cod_grupo, cod_perfil } = req.body;
  let tasksResult = null; // Inicializa a variável tasksResult fora do bloco try

  try {
    await db.queryContabil("BEGIN"); // Inicia a transação

    if (ind_ativo === false) {
      tasksResult = await db.queryContabil("SELECT * FROM tab_tarefa WHERE cod_usuario_1 = $1 AND ind_status <> 'F'", [cod_usuario]);
    }

    await db.queryContabil(`
          UPDATE tab_usuario 
          SET nom_usuario = $1,
              des_senha = $2,
              des_email = $3,
              ind_ativo = $4,
              cod_cliente = $5,
              cod_grupo = $6,
              cod_perfil = $7
          WHERE cod_usuario = $8
      `, [nom_usuario, des_senha, des_email, ind_ativo, cod_cliente, cod_grupo, cod_perfil, cod_usuario]);

    await db.queryContabil("COMMIT"); // Confirma a transação

    if (ind_ativo === false && tasksResult && tasksResult.rowCount > 0) {
      res.status(200).json({
        status: 'tarefaPendente',
        message: "Existem tarefas pendentes de finalização no usuário e devem ser designadas para um novo usuário"
      });
    } else {
      res.status(200).json({
        message: "Registro alterado com sucesso"
      });
    }
  } catch (error) {
    await db.queryContabil("ROLLBACK"); // Desfaz a transação em caso de erro

    res.status(500).json({
      message: "Falha em alterar cadastro, tente novamente" + error
    });
  }
};

exports.vinculaTarefaUsuarioInativado = async (req, res) => {
  const { cod_usuario_ativo, cod_usuario_inativo } = req.body;

  try {
    await db.queryContabil("BEGIN"); // Inicia a transação

    await db.queryContabil("UPDATE tab_tarefa SET cod_usuario_1 = $1 WHERE cod_usuario_1 = $2 AND ind_status <> 'F'", [cod_usuario_ativo, cod_usuario_inativo]);


    res.status(200).json({
      message: "Tarefas vinculadas com sucesso ao novo usuário"
    });

    await db.queryContabil("COMMIT")

  } catch (error) {
    await db.queryContabil("ROLLBACK"); // Desfaz a transação em caso de erro

    res.status(500).json({
      message: "Falha vincular usuario as tarefas, tente novamente" + error
    });
  }
};


exports.cadastroUsuario = async (req, res) => {

  const { nom_usuario, des_senha, des_email, ind_ativo, cod_cliente, cod_grupo, cod_perfil } = req.body;

  try {

    await db.queryContabil(`insert into tab_usuario 
                      ( nom_usuario,
                        des_senha,
                        des_email,
                        ind_ativo,
                        cod_cliente,
                        cod_grupo,
                        cod_perfil )
                        values
                        ($1,$2,$3,$4,$5,$6,$7)`, [nom_usuario, des_senha, des_email, ind_ativo, cod_cliente, cod_grupo, cod_perfil]);

    res.status(200).json({
      message: "Registro Incluso com Sucesso"
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em incluir registro, tente novamente " + error
    });
  }
};

exports.funcionario = async (req, res) => {

  try {

    const result = await db.queryContabil(`select 
                                    a.cod_usuario, 
                                    a.nom_usuario, 
                                    a.cod_perfil,
                                    b.cod_departamento_atuacao
                                    from tab_usuario a
                                    inner join tab_perfil b on (a.cod_perfil = b.cod_perfil)
                                    where b.ind_tipo = 'F'`);

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em incluir registro, tente novamente " + error
    });
  }
};

exports.buscaObrigacaoCliente = async (req, res) => {

  const { cod_cliente } = req.body;

  try {

    const result = await db.queryContabil(`select 
                                          a.seq_obrigacao,
                                          c.nom_cliente,
                                          a.observacao,
                                          b.des_obrigacao,
                                          a.frequencia,
                                          a.dta_entrega,
                                          a.ind_status
                                          from tab_obrigacao_cliente a
                                          inner join tab_obrigacoes b on (a.cod_obrigacao = b.cod_obrigacao)
                                          inner join tab_cliente c on (a.cod_cliente = c.cod_cliente)
                                          where a.cod_cliente = $1`, [cod_cliente]);

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar obrigacoes associadas ao cliente, tente novamente " + error
    });
  }

};

exports.removeObrigacaoCliente = async (req, res) => {

  const { seq_obrigacao } = req.body;

  try {

    await db.queryContabil(`update  tab_obrigacao_cliente
                                            set ind_status = 'X'
                                            where seq_obrigacao = $1
                                          `, [seq_obrigacao]);

    await db.queryContabil(`update tab_tarefa
                                          set ind_status = 'X'
                                          where seq_obrigacao = $1
                                        `, [seq_obrigacao]);

    res.status(200).json({
      message: "Registro Excluido com sucesso"
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em excluir registro, tente novamente " + error
    });
  }

};

exports.deletaTipoAtividade = async (req, res) => {

  const { cod_departamento } = req.body;

  try {

    const result = await db.queryContabil(`update  tab_departamento
                                            set ind_ativo = 'N'
                                            where cod_departamento = $1
                                          `, [cod_departamento]);

    res.status(200).json({
      message: "Registro Excluido com sucesso"
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em excluir registro, tente novamente " + error
    });
  }

};

exports.buscaDepartamento = async (req, res) => {

  try {

    const result = await db.queryContabil(`select 
                                          cod_departamento,
                                          des_departamento
                                          from tab_departamento 
                                          where ind_ativo = 'S'`);

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar lista de tipos de atividades, tente novamente " + error
    });
  }

};

exports.cadastroTipoAtividade = async (req, res) => {

  const { des_departamento } = req.body;

  try {

    await db.queryContabil(`insert into tab_departamento
                      ( des_departamento,
                        ind_ativo )
                        values
                        ($1, 'S')`, [des_departamento]);

    res.status(200).json({
      message: "Registro Incluso com Sucesso"
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em incluir registro, tente novamente " + error
    });
  }
};

exports.alteraTipoAtividade = async (req, res) => {

  const { cod_departamento, des_departamento } = req.body;

  try {

    await db.queryContabil(`update tab_departamento 
                    set des_departamento = $1
                    where cod_departamento = $2`, [des_departamento, cod_departamento]);

    res.status(200).json({
      message: "Registro alterado com sucesso"
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em alterar cadastro, tente novamente " + error
    });
  }
};

exports.buscaUsuariosAdministrados = async (req, res) => {

  const { cod_usuario } = req.body;

  console.log(req.body);

  try {
    const usuarios = await db.queryContabil(`select a.usuarios_dependentes from tab_gerencia_usuario a
                                    where cod_usuario = $1`, [cod_usuario]);


    if (usuarios.rowCount > 0) {
      const result = await db.queryContabil(`select * from tab_usuario where cod_usuario in (${usuarios.rows[0].usuarios_dependentes})`);

      res.status(200).json({
        message: result.rows
      });
    }

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar vinculos de usuários, tente novamente " + error
    });
  }

};

exports.salvaUsuarioAdministrado = async (req, res) => {

  const { cod_usuario, usuarios_administrados } = req.body;


  const usuariosCodigos = usuarios_administrados.map(usuario => usuario.cod_usuario);
  const users = usuariosCodigos.join(",");

  try {
    await db.queryContabil("delete from tab_gerencia_usuario where cod_usuario = $1", [cod_usuario]);
    await db.queryContabil(`insert into tab_gerencia_usuario
                                ( cod_usuario, usuarios_dependentes)
                                values ($1, $2)`, [cod_usuario, users]);

    res.status(200).json({
      message: "Vinculo realizado com sucesso"
    });
  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar viculos de usuários, tente novamente " + error
    });
  }

};

exports.salvaPerfil = async (req, res) => {

  const { cod_perfil, des_perfil, ind_tipo, cod_departamento_visualizacao, cod_departamento_atuacao } = req.body;

  try {
    if (cod_departamento_visualizacao) {

      await db.queryContabil(`update tab_perfil
      set des_perfil = $1,
          ind_tipo = $2,
          cod_departamento_visualizacao = '${cod_departamento_visualizacao}',
          cod_departamento_atuacao = $3
          where cod_perfil = $4`, [des_perfil, ind_tipo, cod_departamento_atuacao, cod_perfil]);
    } else {
      await db.queryContabil(`update tab_perfil
      set des_perfil = $1,
          ind_tipo = $2,
          cod_departamento_visualizacao = $3,
          cod_departamento_atuacao = $4
          where cod_perfil = $5`, [des_perfil, ind_tipo, cod_departamento_visualizacao, cod_departamento_atuacao, cod_perfil]);
    }

    res.status(200).json({
      message: "Alteraçao Realizada com Sucesso"
    });
  } catch (error) {
    res.status(500).json({
      message: "Falha em realizar alteracao, tente novamente " + error
    });
  }

};

exports.cadastraPerfil = async (req, res) => {

  const { des_perfil, ind_tipo, cod_departamento_visualizacao, cod_departamento_atuacao } = req.body;

  try {

    if (cod_departamento_visualizacao) {
      await db.queryContabil(`insert into tab_perfil 
                    (des_perfil, ind_tipo, cod_departamento_visualizacao, ind_ativo, cod_departamento_atuacao)
                    values
                    ($1, $2, '${cod_departamento_visualizacao}', 'S', $3)`, [des_perfil, ind_tipo, cod_departamento_atuacao]);
    } else {
      await db.queryContabil(`insert into tab_perfil 
      (des_perfil, ind_tipo, cod_departamento_visualizacao, ind_ativo, cod_departamento_atuacao)
      values
      ($1, $2, $3, 'S', $4)`, [des_perfil, ind_tipo, cod_departamento_visualizacao, cod_departamento_atuacao]);
    }

    res.status(200).json({
      message: "Perfil Cadastrado com Sucesso"
    });
  } catch (error) {
    res.status(500).json({
      message: "Falha em cadatrar parfil, tente novamente " + error
    });
  }

};

exports.removePerfil = async (req, res) => {

  const { cod_perfil } = req.body;

  try {

    await db.queryContabil(`update tab_perfil 
      set ind_ativdo = 'S'
      where cod_perfil = $1`, [cod_perfil]);


    res.status(200).json({
      message: "Perfil Desativado com Sucesso"
    });
  } catch (error) {
    res.status(500).json({
      message: "Falha em desativar perfil, tente novamente " + error
    });
  }

};

exports.salvaClienteGrupo = async (req, res) => {
  const { clientes, cod_grupo } = req.body;

  try {
    const clientIds = clientes.map(client => client.cod_cliente);
    const result = await db.queryContabil(`SELECT cod_cliente, nom_usuario FROM tab_usuario WHERE cod_cliente IN (${clientIds})`);

    const associatedUsers = result.rows.map(row => row.cod_cliente);

    const clientsToUpdate = clientes.filter(client => !associatedUsers.includes(client.cod_cliente));

    if (clientsToUpdate.length === 0) {
      return res.status(500).json({
        message: "Cliente já associado a um usuario de acesso ao sistema"
      });
    }

    for (const client of clientsToUpdate) {
      await db.queryContabil("UPDATE tab_cliente SET cod_grupo_cliente = $1 WHERE cod_cliente = $2", [cod_grupo, client.cod_cliente]);
    }

    return res.status(200).json({
      message: "Clientes associados ao grupo com sucesso"
    });

  } catch (error) {
    return res.status(500).json({
      message: "Falha ao processar a associação de clientes ao grupo: " + error
    });
  }
};

exports.removeClienteGrupo = async (req, res) => {

  const { cod_cliente, cod_grupo } = req.body;

  try {

    await db.queryContabil(`update tab_cliente
      set cod_grupo_cliente = null
      where cod_cliente = $1
      and cod_grupo_cliente = $2`, [cod_cliente, cod_grupo]);

    res.status(200).json({
      message: "Cliente desvinculado do Grupo"
    });
  } catch (error) {
    res.status(500).json({
      message: "Falha em desvincular cliente do grupo, tente novamente " + error
    });
  }

};

exports.buscaFuncaoSistema = async (req, res) => {

  try {
    const result = await db.queryContabil("select cod_funcao, des_funcao, des_grupo, false as checked from tab_funcao_sistema where des_grupo <> 'FUN' order by 1,3 ");
    const result1 = await db.queryContabil("select cod_funcao, des_funcao, des_grupo, false as checked from tab_funcao_sistema where des_grupo = 'FUN' order by 1,3");

    res.status(200).json({
      message: result.rows,
      acoes: result1.rows
    });
  } catch (error) {
    res.status(500).json({
      message: "Falha em busca funcoes do sitema, tente novamente " + error
    });
  }

};

exports.salvaAcessoUsuario = async (req, res) => {

  const { cod_usuario, listaDeFuncoes, listaDeAcoes } = req.body;

  try {

    await db.queryContabil("delete from tab_acesso_usuario where cod_usuario = $1", [cod_usuario]);
    for (const row of listaDeFuncoes) {

      if (row.checked === true) {
        await db.queryContabil("insert into tab_acesso_usuario (cod_usuario, cod_funcao) values ($1, $2)", [cod_usuario, row.cod_funcao]);
      }
    }

    for (const row of listaDeAcoes) {

      if (row.checked === true) {
        await db.queryContabil("insert into tab_acesso_usuario (cod_usuario, cod_funcao) values ($1, $2)", [cod_usuario, row.cod_funcao]);
      }
    }

    res.status(200).json({
      message: "Acessos parametrizados com sucesso."
    });

  } catch (error) {

    res.status(500).json({
      message: "Falha em busca funcoes do sitema, tente novamente " + error
    });

  }

};

exports.buscaAcessoUsuario = async (req, res) => {
  const { cod_usuario } = req.body;

  try {
    // Bloco 1 - Funções diferentes de 'FUN'
    const result = await db.queryContabil(`
      SELECT 
          a.cod_funcao, 
          a.des_funcao, 
          a.des_grupo,
          a.nivel,
          TRUE AS checked
      FROM 
          tab_funcao_sistema a 
      RIGHT JOIN 
          tab_acesso_usuario b ON (a.cod_funcao = b.cod_funcao)
      WHERE 
          b.cod_usuario = $1
          AND a.des_grupo <> 'FUN'
      UNION ALL
      SELECT 
          a.cod_funcao, 
          a.des_funcao, 
          a.des_grupo,
          a.nivel,
          FALSE AS checked
      FROM 
          tab_funcao_sistema a 
      WHERE 
          NOT EXISTS (
              SELECT 1 
              FROM tab_acesso_usuario b
              WHERE a.cod_funcao = b.cod_funcao
              AND b.cod_usuario = $1
          ) 
          AND a.des_grupo <> 'FUN'
      ORDER BY 
         nivel, cod_funcao, des_grupo;
    `, [cod_usuario]);

    // Bloco 2 - Funções do grupo 'FUN'
    const result1 = await db.queryContabil(`
      SELECT 
          a.cod_funcao, 
          a.des_funcao, 
          a.des_grupo,
          a.nivel,
          TRUE AS checked
      FROM 
          tab_funcao_sistema a 
      RIGHT JOIN 
          tab_acesso_usuario b ON (a.cod_funcao = b.cod_funcao)
      WHERE 
          b.cod_usuario = $1
          AND a.des_grupo = 'FUN'
      UNION ALL
      SELECT 
          a.cod_funcao, 
          a.des_funcao, 
          a.des_grupo,
          a.nivel,
          FALSE AS checked
      FROM 
          tab_funcao_sistema a 
      WHERE 
          NOT EXISTS (
              SELECT 1 
              FROM tab_acesso_usuario b
              WHERE a.cod_funcao = b.cod_funcao
              AND b.cod_usuario = $1
          ) 
          AND a.des_grupo = 'FUN'
      ORDER BY 
         nivel, cod_funcao, des_grupo;
    `, [cod_usuario]);

    res.status(200).json({
      message: result.rows,
      acoes: result1.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em busca funcoes do sistema, tente novamente. Erro: " + error
    });
  }
};


exports.alteraSenhaUsuario = async (req, res) => {

  const { cod_usuario, senha } = req.body;

  try {

    const result = await db.queryContabil("update tab_usuario set des_senha = $1 where cod_usuario = $2", [senha, cod_usuario]);

    res.status(200).json({
      message: "Senha Alterada com Sucesso."
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar tributacoes, tente novamente " + error
    });
  }

};

exports.cadastroGrupoTarefa = async (req, res) => {

  const { cod_grupo, des_grupo, cod_departamento, des_departamento } = req.body;

  try {

    const result = await db.queryContabil("INSERT INTO tab_grupo_tarefa (des_grupo, cod_grupo, cod_departamento, des_departamento) values ($1, $2, $3, $4 )", [des_grupo, cod_grupo, cod_departamento, des_departamento]);

    res.status(200).json({
      message: "Grupo Incluso com sucesso"
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em incluir grupo de tarefas, tente novamente " + error
    });
  }

};

exports.salvaGrupoTarefa = async (req, res) => {

  const { seq_registro, cod_grupo, des_grupo, ind_ativo } = req.body;

  try {

    if (ind_ativo === false) {
      const codTarefaResult = await db.queryContabil(
        `SELECT cod_tarefa FROM tab_tarefas_grupo WHERE cod_grupo = $1`,
        [cod_grupo]
      );

      if (codTarefaResult.rows.length > 0) {
        const codigos = codTarefaResult.rows.map(r => r.cod_tarefa).join(',').toString();

        const tarefasResult = await db.queryContabil(
          `SELECT * FROM tab_tarefa 
               WHERE cod_tarefa_grupo IN (${codigos}) 
               AND ind_status <> 'F'`
        );

        if (tarefasResult.rows.length > 0) {
          return res.status(400).json({
            message: `Existem ${tarefasResult.rows.length} tarefa(s) aberta(s) no grupo ${cod_grupo}`,
            tarefas: tarefasResult.rows
          });
        } else {
          await db.queryContabil(
            `update FROM tab_tarefas_grupo
                 SET ind_ativo = $1
                 where cod_grupo IN (${codigos})`, [false, codigos]
          );
          await db.queryContabil("update tab_grupo_tarefa set ind_ativo = $1 where seq_registro = $2", [false, seq_registro])
        }
      }
    } else {

      await db.queryContabil("update tab_grupo_tarefa set cod_grupo = $1, des_grupo = $2, ind_ativo = $4 where seq_registro = $3", [cod_grupo, des_grupo, seq_registro, ind_ativo]);

      res.status(200).json({
        message: "Grupo salvo com sucesso"
      });
    }

  } catch (error) {
    res.status(500).json({
      message: "Falha em salvar grupo de tarefas, tente novamente " + error
    });
  }

};

exports.buscaGrupoTarefa = async (req, res) => {

  try {

    const result = await db.queryContabil("select * from tab_grupo_tarefa where ind_ativo = true ORDER BY CAST(cod_grupo AS DECIMAL(10,2))");

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar grupo de tarefas, tente novamente " + error
    });
  }

};


exports.cadastroItemGrupoTarefa = async (req, res) => {

  const { des_tarefa, cod_tarefa, cod_grupo, des_grupo } = req.body;

  try {

    const result = await db.queryContabil("INSERT INTO tab_tarefas_grupo (des_tarefa, cod_tarefa, cod_grupo, des_grupo) values ($1, $2, $3, $4 )", [des_tarefa, cod_tarefa, cod_grupo, des_grupo]);

    res.status(200).json({
      message: "Grupo Incluso com sucesso"
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em incluir grupo de tarefas, tente novamente " + error
    });
  }

};

exports.salvaItemGrupoTarefa = async (req, res) => {

  const { seq_registro, des_tarefa, cod_tarefa, ind_ativo } = req.body;

  try {

    if (ind_ativo === false) {

      const tarefasResult = await db.queryContabil(
        `SELECT * FROM tab_tarefa 
         WHERE cod_tarefa_grupo = $1 
         AND ind_status <> 'F'`, [cod_tarefa]
      );

      if (tarefasResult.rows.length > 0) {
        return res.status(400).json({
          message: `Existem ${tarefasResult.rows.length} tarefa(s) aberta(s)`,
          tarefas: tarefasResult.rows
        });
      } else {

        await db.queryContabil(
          `update tab_tarefas_grupo
                 SET ind_ativo = $1
                 where seq_registro IN ($2)`, [false, seq_registro]
        );
        res.status(200).json({
          message: "Item Grupo salvo com sucesso"
        });
      }

    } else {

      await db.queryContabil("update tab_tarefas_grupo set des_tarefa = $1, cod_tarefa = $2, ind_ativo = $4 where seq_registro = $3", [des_tarefa, cod_tarefa, seq_registro, ind_ativo]);

      res.status(200).json({
        message: "Item Grupo salvo com sucesso"
      });

    }

  } catch (error) {
    res.status(500).json({
      message: "Falha em salvar item grupo tarefa, tente novamente " + error
    });
  }

};

exports.buscaItemGrupoTarefa = async (req, res) => {

  try {

    const result = await db.queryContabil(`select 
                                              a.seq_registro, 
                                              a.cod_tarefa, 
                                              a.des_tarefa, 
                                              a.cod_grupo, 
                                              a.des_grupo, 
                                              b.cod_departamento, 
                                              b.des_departamento,
                                              false as item_salvo,
                                              false as ind_precedente_cliente,
                                              a.ind_ativo
                                            from tab_tarefas_grupo a 
                                            inner join tab_grupo_tarefa b 
                                            on (a.cod_grupo = b.cod_grupo)
                                            where a.ind_ativo = true
                                            ORDER BY CAST(a.cod_tarefa AS DECIMAL(10,2));`);

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar item grupo de tarefas, tente novamente " + error
    });
  }

};

exports.cadastrarTarefaPrecedente = async (req, res) => {

  const { cod_tarefa_precedente, cod_tarefa_grupo, des_tarefa_precedente, des_tarefa_grupo } = req.body;

  try {

    const result = await db.queryContabil("INSERT INTO tab_tarefa_precedente (cod_tarefa_precedente, cod_tarefa_grupo, des_tarefa_precedente, des_tarefa_grupo) values ($1, $2, $3, $4 )", [cod_tarefa_precedente, cod_tarefa_grupo, des_tarefa_precedente, des_tarefa_grupo]);

    res.status(200).json({
      message: "Tarefa Predecente Incluso com sucesso"
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em incluir tarefas, tente novamente " + error
    });
  }

};

exports.buscaTarefaPrecedente = async (req, res) => {

  try {

    const result = await db.queryContabil("select * from tab_tarefa_precedente");

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar tarefas precedentes, tente novamente " + error
    });
  }

};

exports.cadastrarPlanoTarefa = async (req, res) => {

  const { cod_tarefa, des_tarefa } = req.body;

  try {

    await db.queryContabil("INSERT INTO tab_plano_tarefa_cliente (cod_tarefa, des_tarefa) values ($1, $2 )", [cod_tarefa, des_tarefa]);

    res.status(200).json({
      message: "Tarefa Cliente Incluso com sucesso"
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em incluir tarefas, tente novamente " + error
    });
  }

};

exports.editaPlanoTarefa = async (req, res) => {

  const { seq_registro, cod_tarefa, des_tarefa } = req.body;

  try {

    await db.queryContabil("UPDATE tab_plano_tarefa_cliente SET des_tarefa = $1, cod_tarefa = $2 WHERE seq_registro = $3", [des_tarefa, cod_tarefa, seq_registro]);

    res.status(200).json({
      message: "Tarefa Cliente Alterada com sucesso"
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em Alterar tarefa, tente novamente " + error
    });
  }

};

exports.buscaPlanoTarefaCliente = async (req, res) => {

  try {

    const result = await db.queryContabil("select * from tab_plano_tarefa_cliente ORDER BY CAST(cod_tarefa AS DECIMAL(10,2)) ");

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar tarefas cliente, tente novamente " + error
    });
  }

};

exports.salvaConfiguracao = async (req, res) => {
  const { clientes, configGrupo, tarefaAdd } = req.body;

  const dataAtual = moment().format("YYYY.MM.DD"); // Certifique-se que `moment` está corretamente importado.

  console.log(clientes, configGrupo, tarefaAdd)
  try {

    await db.queryPedido("BEGIN");
    // Função auxiliar para inserir tarefas adicionais
    const insereTarefaAdicional = async (tarefaAdc, cliente) => {
      return db.queryContabil(
        `INSERT INTO tab_config_tarefa_adc_cli 
          (
            des_tarefa_adicional,
            id,
            dta_entrega,
            cod_tarefa_cliente,
            des_tarefa_cliente,
            cod_tarefa_originaria,
            des_tarefa_originaria,
            cod_cliente,
            des_observacao
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          tarefaAdc.des_tarefa_adicional,
          tarefaAdc.id,
          tarefaAdc.dta_entrega,
          tarefaAdc.cod_tarefa_cliente,
          tarefaAdc.des_tarefa_cliente,
          tarefaAdc.cod_tarefa_originaria,
          tarefaAdc.des_tarefa_originaria,
          cliente.cod_cliente,
          tarefaAdc.des_observacao
        ]
      );
    };

    // Função auxiliar para inserir configuração de tarefa
    const insereConfigTarefa = async (tarefa, cliente) => {
      return db.queryContabil(
        `INSERT INTO tab_config_tarefa 
          (
            ind_precede_tarefa_cliente,
            cod_usuario_1,
            des_usuario_1,
            cod_usuario_2,
            des_usuario_2,
            dta_entrega,
            tempo_estimado,
            prioridade,
            frequencia,
            cod_tarefa_precedente,
            des_tarefa_precedente,
            cod_tarefa_grupo,
            des_tarefa_grupo,
            cod_cliente,
            des_observacao
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          tarefa.ind_precede_tarefa_cliente,
          tarefa.cod_usuario_1,
          tarefa.des_usuario_1,
          tarefa.cod_usuario_2,
          tarefa.des_usuario_2,
          tarefa.dta_entrega,
          tarefa.tempo_estimado,
          tarefa.prioridade,
          tarefa.frequencia,
          tarefa.cod_tarefa_precedente,
          tarefa.des_tarefa_precedente,
          tarefa.cod_tarefa_grupo,
          tarefa.des_tarefa_grupo,
          cliente.cod_cliente,
          tarefa.des_obrigacao
        ]
      );
    };

    // Função auxiliar para atualizar cliente
    const atualizaCliente = async (cliente) => {
      return db.queryContabil(
        `UPDATE tab_cliente 
          SET ind_configurado = 'S',
              dta_configuracao = $1
          WHERE cod_cliente = $2`,
        [dataAtual, cliente.cod_cliente]
      );
    };

    // Loop principal
    for (const cliente of clientes) {
      // Inserir todas as tarefas para o cliente
      for (const tarefa of configGrupo) {
        if (tarefa.ind_precede_tarefa_cliente) {
          // Filtra as tarefas adicionais
          const tarefasAdicionais = tarefaAdd.filter(
            (row) =>
              row.cod_tarefa_precedente === tarefa.cod_tarefa_cliente &&
              row.cod_tarefa_grupo === tarefa.cod_tarefa_originaria
          );

          // Inserir tarefas adicionais
          await Promise.all(
            tarefasAdicionais.map((tarefaAdc) =>
              insereTarefaAdicional(tarefaAdc, cliente)
            )
          );
        }

        // Inserir configuração de tarefa
        await insereConfigTarefa(tarefa, cliente);
      }

      // Atualizar cliente após todas as tarefas
      await atualizaCliente(cliente);
    }

    await db.queryPedido("COMMIT");
    // Retorna resposta de sucesso
    res.status(200).json({
      message: "Configuração salva com sucesso!",
    });
  } catch (error) {
    // Retorna resposta de erro
    await db.queryPedido("ROLLBACK");
    console.error("Erro ao salvar configuração:", error);
    res.status(500).json({
      message: `Falha ao salvar configuração: ${error.message}`,
    });
  }
};

exports.salvaConfiguracaoIndividual = async (req, res) => {
  const { tarefa } = req.body;

  try {

    // Função auxiliar para inserir configuração de tarefa

    for (const row of tarefa) {
      await db.queryContabil(
        `UPDATE tab_config_tarefa 
         SET
            ind_precede_tarefa_cliente = $1,
            cod_usuario_1 = $2,
            des_usuario_1 = $3,
            cod_usuario_2 = $4,
            des_usuario_2 = $5,
            dta_entrega = $6,
            tempo_estimado = $7,
            prioridade = $8,
            frequencia = $9,
            cod_tarefa_precedente = $10,
            des_tarefa_precedente = $11,
            cod_tarefa_grupo = $12,
            des_tarefa_grupo = $13,
            des_observacao = $14
          WHERE seq_registro = $15
          `,
        [
          row.ind_precede_tarefa_cliente,
          row.cod_usuario_1,
          row.des_usuario_1,
          row.cod_usuario_2,
          row.des_usuario_2,
          row.dta_entrega,
          row.tempo_estimado,
          row.prioridade,
          row.frequencia,
          row.cod_tarefa_precedente,
          row.des_tarefa_precedente,
          row.cod_tarefa_grupo,
          row.des_tarefa_grupo,
          row.des_obrigacao,
          row.seq_registro
        ]
      );
    }

    await db.queryPedido("COMMIT");
    // Retorna resposta de sucesso
    res.status(200).json({
      message: "Configuração salva com sucesso!",
    });
  } catch (error) {
    // Retorna resposta de erro
    await db.queryPedido("ROLLBACK");
    console.error("Erro ao salvar configuração:", error);
    res.status(500).json({
      message: `Falha ao salvar configuração: ${error.message}`,
    });
  }
};

exports.deletaConfiguracaoIndividual = async (req, res) => {

  const { seq_registro, cod_cliente } = req.body;

  try {
    if (seq_registro.length > 0) {
      // Criando placeholders dinâmicos para evitar SQL Injection
      const placeholders = seq_registro.map((_, i) => `$${i + 1}`).join(", ");

      // Primeiro DELETE: Remove da tab_config_tarefa_adc_cli
      await db.queryContabil(`
        DELETE FROM tab_config_tarefa_adc_cli
        WHERE cod_tarefa_cliente IN (
          SELECT cod_tarefa_precedente 
          FROM tab_config_tarefa
          WHERE seq_registro IN (${placeholders})
          AND cod_cliente = $${seq_registro.length + 1}
        )`, [...seq_registro, cod_cliente]);

      // Segundo DELETE: Remove da tab_config_tarefa
      await db.queryContabil(`
        DELETE FROM tab_config_tarefa
        WHERE seq_registro IN (${placeholders})
        AND cod_cliente = $${seq_registro.length + 1}
      `, [...seq_registro, cod_cliente]);
    }

    // Função auxiliar para inserir configuração de tarefa

    // for (const row of tarefa) {
    //   await db.queryContabil(
    //     `UPDATE tab_config_tarefa 
    //      SET
    //         ind_precede_tarefa_cliente = $1,
    //         cod_usuario_1 = $2,
    //         des_usuario_1 = $3,
    //         cod_usuario_2 = $4,
    //         des_usuario_2 = $5,
    //         dta_entrega = $6,
    //         tempo_estimado = $7,
    //         prioridade = $8,
    //         frequencia = $9,
    //         cod_tarefa_precedente = $10,
    //         des_tarefa_precedente = $11,
    //         cod_tarefa_grupo = $12,
    //         des_tarefa_grupo = $13,
    //         des_observacao = $14
    //       WHERE seq_registro = $15
    //       `,
    //     [
    //       row.ind_precede_tarefa_cliente,
    //       row.cod_usuario_1,
    //       row.des_usuario_1,
    //       row.cod_usuario_2,
    //       row.des_usuario_2,
    //       row.dta_entrega,
    //       row.tempo_estimado,
    //       row.prioridade,
    //       row.frequencia,
    //       row.cod_tarefa_precedente,
    //       row.des_tarefa_precedente,
    //       row.cod_tarefa_grupo,
    //       row.des_tarefa_grupo,
    //       row.des_obrigacao,
    //       row.seq_registro
    //     ]
    //   );
    // }

    await db.queryPedido("COMMIT");
    // Retorna resposta de sucesso
    res.status(200).json({
      message: "Configuração salva com sucesso!",
    });
  } catch (error) {
    // Retorna resposta de erro
    await db.queryPedido("ROLLBACK");
    console.error("Erro ao salvar configuração:", error);
    res.status(500).json({
      message: `Falha ao salvar configuração: ${error.message}`,
    });
  }
};

exports.buscaConfigCliente = async (req, res) => {
  const { clientes } = req.body;

  try {
    // Extrai os códigos dos clientes
    const cod_cliente = clientes.map((row) => row.cod_cliente);

    // Busca as configurações do cliente
    const configTarefaCliente = await db.queryContabil(
      `SELECT a.*, b.cod_grupo as cod_departamento, 
              b.des_grupo as des_departamento, 
              c.cod_departamento as cod_departamento_atuacao, 
              a.des_usuario_1 as nom_usuario_1, 
              a.des_usuario_2 as nom_usuario_2, 
              false as ind_configurado_manual, 
              false as ind_ciente_delete,
              false as salvo_manual,
                                    CASE
                                    WHEN a.cod_tarefa_precedente is null THEN false
                                    ELSE true
                                    END AS ind_config_completa
        FROM tab_config_tarefa a
        INNER JOIN tab_tarefas_grupo b on (a.cod_tarefa_grupo = b.cod_tarefa)
        inner join tab_grupo_tarefa c on (c.cod_grupo = b.cod_grupo)
        WHERE cod_cliente in (${cod_cliente})
        ORDER BY CAST(a.cod_tarefa_grupo AS DECIMAL(10,2))`
    );
    const configTarefaAdcCliente = await db.queryContabil(
      `SELECT * FROM tab_config_tarefa_adc_cli WHERE cod_cliente in (${cod_cliente})`
    );

    // Retorna os dados encontrados
    res.status(200).json({
      configTarefaCliente: configTarefaCliente.rows,
      configTarefaAdcCliente: configTarefaAdcCliente.rows,
    });
  } catch (error) {
    // Retorna uma mensagem de erro em caso de falha
    console.error("Erro ao buscar configurações do cliente:", error);
    res.status(500).json({
      message: `Falha em buscar tarefas cliente, tente novamente: ${error.message}`,
    });
  }
};

// function diaUtil(ano, mes, diaUtil) {
//   let diaUtilCount = 0;
//   let data = moment({ year: ano, month: mes - 1, day: 1 }); // Começa no primeiro dia do mês

//   // Loop pelos dias do mês
//   while (data.month() === mes - 1) {
//     const diaSemana = data.isoWeekday(); // 1 = segunda-feira, 7 = domingo

//     // Verifica se é dia útil (excluindo sábado e domingo)
//     if (diaSemana >= 1 && diaSemana <= diaUtil) {
//       diaUtilCount++;
//     }

//     // Se chegou ao 5º dia útil, retorna a data
//     if (diaUtilCount === diaUtil) {
//       return data.format('YYYY.MM.DD');
//     }

//     // Incrementa para o próximo dia
//     data.add(1, 'day');
//   }

//   // Caso não haja 5 dias úteis (ex.: fevereiro em anos bissextos), retorna null
//   return null;
// }

function diaUtil(ano, mes, diaUtilDesejado) {
  let data = moment(`${ano}-${mes}-01`, 'YYYY-MM-DD'); // Primeiro dia do mês
  let diaUtilCount = 0;

  while (data.month() + 1 === mes) { // Garantir que está no mês correto
    const diaSemana = data.isoWeekday(); // 1 = segunda-feira, 7 = domingo

    if (diaSemana >= 1 && diaSemana <= 5) { // Apenas dias úteis (segunda a sexta)
      diaUtilCount++;
    }

    if (diaUtilCount === diaUtilDesejado) {
      return data.format('YYYY-MM-DD'); // Retorna a data do 5º dia útil, por exemplo
    }

    data.add(1, 'day'); // Avança para o próximo dia
  }

  return null; // Caso o mês não tenha 5 dias úteis
}

function gerarCodigoUnico(length) {
  // Gera uma string hexadecimal aleatória
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

exports.executarRotina = async (req, res) => {
  const { clientes, configTarefaCliente, configTarefaAdcCliente, mes, ano } = req.body;

  console.log(clientes, configTarefaCliente, configTarefaAdcCliente, mes, ano)

  const dataAtual = moment().format("YYYY.MM.DD"); // Certifique-se que `moment` está corretamente importado.

  try {

    await db.queryPedido("BEGIN");
    // Função auxiliar para inserir tarefas adicionais
    const insereTarefaAdicional = async (tarefaAdc, cliente, codigoUnico) => {
      return db.queryContabil(
        `INSERT INTO tab_tarefa_anexo_cliente
          (
            seq_registro_anexo,
            des_tarefa_adicional,
            dta_entrega,
            cod_tarefa_cliente,
            des_tarefa_cliente,
            cod_tarefa_originaria,
            des_tarefa_originaria,
            cod_cliente,
            anexo,
            des_anexo,
            dta_upload_anexo,
            ind_aprovado
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, null, null, null, 'P')`,
        [
          codigoUnico,
          tarefaAdc.des_tarefa_adicional,
          tarefaAdc.dta_entrega,
          tarefaAdc.cod_tarefa_cliente,
          tarefaAdc.des_tarefa_cliente,
          tarefaAdc.cod_tarefa_originaria,
          tarefaAdc.des_tarefa_originaria,
          cliente.cod_cliente,
        ]
      );
    };

    // Função auxiliar para inserir configuração de tarefa
    const insereTarefa = async (tarefa, cliente, codigoUnico) => {
      return db.queryContabil(
        `INSERT INTO public.tab_tarefa (
        cod_tarefa_grupo,
        des_tarefa_grupo,
        cod_tarefa_precedente,
        des_tarefa_precedente,
        cod_usuario_1,
        des_usuario_1,
        cod_usuario_2,
        des_usuario_2,
        ind_precede_tarefa_cliente,
        dta_tarefa,
        tempo_estimado,
        prioridade,
        frequencia,
        cod_grupo_cliente,
        sistema_cliente,
        dta_limite_tarefa,
        dta_inicio_tarefa,
        dta_fim_tarefa,
        cod_departamento,
        dta_ciencia_cliente,
        seq_registro_anexo,
        des_grupo_cliente,
        des_departamento,
        cod_cliente,
        ind_status,
        ind_precedente_concluida
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      )`,
        [
          tarefa.cod_tarefa_grupo,
          tarefa.des_tarefa_grupo,
          tarefa.cod_tarefa_precedente,
          tarefa.des_tarefa_precedente,
          tarefa.cod_usuario_1,
          tarefa.des_usuario_1,
          tarefa.cod_usuario_2,
          tarefa.des_usuario_2,
          tarefa.ind_precede_tarefa_cliente === true ? true : false,
          tarefa.frequencia === 'M' ? diaUtil(ano, mes, parseInt(tarefa.dta_entrega, 10)) : tarefa.dta_entrega, // dta_tarefa
          tarefa.tempo_estimado,
          tarefa.prioridade,
          tarefa.frequencia,
          cliente.cod_grupo_cliente,
          tarefa.sistema_cliente,
          tarefa.frequencia === 'M' ? diaUtil(ano, mes, parseInt(tarefa.dta_entrega, 10) + 5) : moment(tarefa.dta_entrega, 'YYYY.MM.DD').add(5, 'days').format('YYYY.MM.DD'), //dta_limite_tarefa
          tarefa.dta_inicio_tarefa,
          tarefa.dta_fim_tarefa,
          tarefa.cod_departamento,
          tarefa.dta_ciencia_cliente,
          tarefa.ind_precede_tarefa_cliente === true ? codigoUnico : null,
          cliente.des_grupo_cliente,
          tarefa.des_departamento,
          cliente.cod_cliente,
          tarefa.ind_precede_tarefa_cliente === true ? 'P' : 'A',
          tarefa.cod_tarefa_precedente !== null ? 'N' : null
        ]
      );
    };

    // Função auxiliar para atualizar cliente
    const atualizaCliente = async (cliente) => {
      return db.queryContabil(
        `UPDATE tab_cliente 
          SET dta_execucao_config = $1
          WHERE cod_cliente = $2`,
        [dataAtual, cliente.cod_cliente]
      );
    };

    // Loop principal
    for (const cliente of clientes) {
      // Inserir todas as tarefas para o cliente
      for (const tarefa of configTarefaCliente) {
        codigo = gerarCodigoUnico(8)
        if (tarefa.ind_precede_tarefa_cliente) {
          // Filtra as tarefas adicionais
          const tarefasAdicionais = configTarefaAdcCliente.filter(
            (row) =>
              row.cod_tarefa_precedente === tarefa.cod_tarefa_cliente &&
              row.cod_tarefa_grupo === tarefa.cod_tarefa_originaria
          );

          // Inserir tarefas adicionais
          await Promise.all(

            tarefasAdicionais.map((tarefaAdc) =>
              insereTarefaAdicional(tarefaAdc, cliente, codigo)
            )
          );
        }

        // Inserir configuração de tarefa
        await insereTarefa(tarefa, cliente, codigo);
      }

      // Atualizar cliente após todas as tarefas
      await atualizaCliente(cliente);
    }

    await db.queryPedido("COMMIT");
    // Retorna resposta de sucesso
    res.status(200).json({
      message: "Configuração salva com sucesso!",
    });
  } catch (error) {
    // Retorna resposta de erro
    await db.queryPedido("ROLLBACK");
    console.error("Erro ao salvar configuração:", error);
    res.status(500).json({
      message: `Falha ao salvar configuração: ${error.message}`,
    });
  }
};

exports.cadastroConfigApontamentoRapido = async (req, res) => {

  const { grupo, itemGrupo } = req.body

  try {

    await db.queryContabil(`INSERT INTO TAB_CONFIG_APONTAMENTO_RAPIDO 
                            (cod_departamento, des_departamento, cod_tarefa, des_tarefa, ind_ativo)
                            values
                            ($1, $2, $3, $4, $5)`, [grupo.cod_departamento, grupo.des_departamento, itemGrupo.cod_tarefa, itemGrupo.des_tarefa, true]);

    res.status(200).json({
      message: 'Cadastro Realizado com Sucesso'
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em cadastrar Config Apontamento Rapido, tente novamente " + error
    });
  }

};

exports.buscaConfigApontamentoRapido = async (req, res) => {

  try {

    const result = await db.queryContabil("select * from TAB_CONFIG_APONTAMENTO_RAPIDO where ind_ativo = true ORDER BY CAST(cod_tarefa AS DECIMAL(10,2)) ");

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar Config Apontameto Rapido, tente novamente " + error
    });
  }

};

exports.inativaConfigApontamentoRapido = async (req, res) => {

  const { seq_registro } = req.body;

  try {

    const result = await db.queryContabil("UPDATE TAB_CONFIG_APONTAMENTO_RAPIDO SET IND_ATIVO = FALSE WHERE SEQ_REGISTRO = $1", [seq_registro]);

    res.status(200).json({
      message: 'Registro Inativado com Sucesso'
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em inativar Config Apontameto Rapido, tente novamente " + error
    });
  }

};