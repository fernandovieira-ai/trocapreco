/* eslint-disable no-unused-vars */
/**
 * arquivo: config/database.js
 * descriçao: arquivo responsavel pela logica do CRUD (API)
 * data: 14/03/2022
 * autor: Renato Filho
 */

const db = require("../config/database");
require("dotenv-safe").config();
const moment = require("moment");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { Console } = require("console");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

const logger = new Console({
  stdout: fs.createWriteStream("log.txt")
  });

const client = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "renato.filho@digitalrf.com.br",
        pass: "ekpgykwxilbbuxrz"
    }
});

//=> metodo responsavel por listar os usuarios por ID
exports.fazerLogin = async (req, res) => {
  let schemas;
  let cod_base = "";
  let nom_empresa = "";
  let ind_perfil = "";
  let nom_usuario = "";
  let id = "";
  let result = [];

  const email = req.body.email;
  const senha = req.body.senha;
  const schema = await db.queryInventario(
    `select te.cod_base, te.nom_empresa, te.nom_schema, tu.ind_perfil, tu.nom_usuario, tube.cod_usuario from tab_usuario tu
                                        inner join tab_usuario_base tube on (tu.cod_usuario = tube.cod_usuario)
                                        inner join tab_base te on (te.cod_base = tube.cod_base)
                                        where tu.email = $1
                                        and tu.senha = $2
                                        and tu.ind_ativo = 'S'`,
    [email, senha]
  );


  for (let index = 0; index < schema.rows.length; index++) {
    schemas = schema.rows[index].nom_schema;
    cod_base = schema.rows[index].cod_base;
    nom_empresa = schema.rows[index].nom_empresa;
    nom_usuario = schema.rows[index].nom_usuario;
    ind_perfil = schema.rows[index].ind_perfil;
    id = schema.rows[index].cod_usuario;

    await db.queryInventario(`select sp_atualiza_geral(${cod_base},'S',0,'R')`);

    const res = await db.queryInventario(`select * from ${schemas}.tab_empresa_schema
                                    where cod_base = ${cod_base}`);
                                    
    result.push({
      cod_base: cod_base,
      nom_usuario: nom_usuario,
      nom_empresa: nom_empresa,
      nom_schema: schemas,
      ind_perfil: ind_perfil,
      empresas: res.rows,
      id: id,
    });
  }


  if (schema.rowCount !== 0) {
    const id = (schema.rows[0].cod_usuario * 100) / 5;

    const token = jwt.sign({ id }, process.env.SECRET, {
      expiresIn: 6000, // 1h de prazo para expirar a sessao.
    });
    res.status(200).json({ auth: true, token: token, user: result });
    //Se existir usuario e senha, abre a sessão com um token.
  } else {
    res.status(500).json({
      message: "Usuário e Senha inválidos ou não existentes.",
    });
  }
};

exports.userRegister = async (req, res) =>{

  let usuario = req.body.usuario
  let senha = req.body.senha
  let email = req.body.email

  const validaUser = await db.queryInventario(`select * from tab_usuario
                                      where email = '${usuario}'
                                      and ind_ativo = 'S'`)

  if(validaUser.rows.length > 0){
    res.status(500).json({
      message: "Ja existe registrado este nome de usuário"
    });
  }else{

    try{
      const result = await db.queryInventario(`insert into tab_usuario (
        email,
        senha,
        ind_perfil,
        ind_ativo,
        nom_usuario,
        email_adm) values (
        '${usuario}',
        '${senha}',
        1, 'S',
        '${usuario}',
        '${email}')
      `)
  
        const userID = await db.queryInventario(`select max(cod_usuario) as cod_usuario from tab_usuario where email = '${usuario}' and ind_ativo = 'S'`)
        await db.queryInventario(`insert into tab_usuario_base (cod_usuario, cod_base) values (${userID.rows[0].cod_usuario}, 1)`)
  
        res.status(200).json({
          message: "Registro concluido com sucesso.",
        });
  
    }catch(err){
      console.log(err)
      res.status(500).json({
        message: "Falha ao criar login, tente novamente mais tarde",
      });
    }
  }
 
}

exports.cancelarConta = async (req, res) =>{
  let motivo = req.body.motivo;
  let cod_usuario = req.body.id;

  try {

    await db.queryInventario(`update tab_usuario
                  set ind_ativo = 'N' 
                  where  cod_usuario = '${cod_usuario}'`)

    
    res.status(200).json({
      message: "Sua conta foi excluída Esperamos que você volte em breve!",
    });
    
  } catch (error) {
    res.status(500).json({
      message: "Falha ao remover cadastro, tente novamente",
    });
  }
        
}

exports.dispositivo = async (req, res) =>{

  let cod_usuario = req.body.id;
  let des_modelo = req.body.des_modelo;
  let des_fabricante = req.body.des_fabricante;
  let des_dispositivo = req.body.des_dispositivo;
  var hora = moment().format("HH:MM:SS");
  var dia = moment().format("YYYY.MM.DD");


  try {

    await db.queryInventario(`insert into tab_dispositivo 
    (cod_usuario, 
      des_modelo, 
      des_fabricante, 
      des_dispositivo,
      dta,
      hora)
      values 
      (${cod_usuario},
        '${des_modelo}',
        '${des_fabricante}',
        '${des_dispositivo}',
        '${dia}',
        '${hora}')`);

  } catch (error) {
      console.log(error);
  }

};

exports.buscaItem = async (req, res) =>{

  let schema = req.body.schema;

  const result = await db.queryInventario(`select * from ${schema}.tab_item`);

  res.json({
    message: result.rows,
  });
};

exports.buscaItemLocal = async (req, res) =>{

  let schema = req.body.schema;
  let localItem = req.body.localItem;
  let cod_empresa = req.body.empresa;

  const result = await db.queryInventario(`select * from ${schema}.tab_item ti
                                  inner join ${schema}.tab_item_local_empresa til on (ti.cod_item = til.cod_item)
                                  where til.cod_local_item = ${localItem}
                                  and til.cod_empresa = ${cod_empresa}`);

  res.json({
    message: result.rows,
  });
};

exports.buscaAlmInv = async (req, res) =>{

  let schema = req.body.schema;
  let cod_empresa = req.body.empresa;

  //busca os almoxarifados da empresa selecionada
  const result = await db.queryInventario(`select ta.cod_almoxarifado, ta.des_almoxarifado from ${schema}.tab_empresa_schema tes
                                  inner join ${schema}.tab_almoxarifado ta on (tes.cod_empresa = ta.cod_empresa)
                                  where ta.cod_empresa = '${cod_empresa}'
                                  `);

  //busca os inventarios em aberto da empresa selecionada
  const result2 = await db.queryInventario(`select ti.*, ta.des_almoxarifado,
                                  case WHEN ti.cod_local_item = 0
	                                THEN cast('undefined' as varchar(60)) else tli.des_local_item end as des_local_item
                                  from ${schema}.tab_empresa_schema tes
                                  inner join ${schema}.tab_inventario ti on (ti.cod_empresa = tes.cod_empresa)
                                  inner join ${schema}.tab_almoxarifado ta on (ti.cod_almoxarifado = ta.cod_almoxarifado)
                                  left join ${schema}.tab_local_item tli on (ti.cod_local_item = tli.cod_local_item)
                                  where ti.cod_empresa = '${cod_empresa}'
                                  and ti.ind_status = 'P'
                                  order by ti.seq_inventario`);

  //busca os locais de itens pre-definidos
  const result3 = await db.queryInventario(`select tli.* from ${schema}.tab_local_item tli
                                  where exists (select 1 from ${schema}.tab_item_local_empresa tile
                                  where tli.cod_local_item = tile.cod_local_item
                                  and tile.cod_empresa = '${cod_empresa}')
                                  order by tli.des_local_item`);

  res.json({
    message: result.rows,
    message1: result2.rows,
    message2: result3.rows
  });   
};

exports.buscaSeqContagemInvUsuario = async (req,res) =>{

  let usuario = req.body.usuario;
  let seq_inventario = req.body.seqInventario;
  let schema = req.body.schema;
  //busca o max seq contagem do usuario logado
  const result = await db.queryInventario(`select case when max(seq_contagem_usuario) is null
                                  THEN cast(0 as integer) else max(seq_contagem_usuario) end as seq_contagem_usuario
                                  from ${schema}.tab_inventario_contagem
                                  where nom_usuario = '${usuario}'
                                  AND seq_inventario = ${seq_inventario}`);

  // busca os itens do inventario em andamento do usuario logado
  const result2 = await db.queryInventario(`select tic.seq_inventario,
                                  tic.cod_barra,
                                  ti.des_item,
                                  tic.qtd_contagem_1,
                                  tic.qtd_contagem_2,
                                  tic.nom_usuario,
                                  tic.seq_contagem_usuario
                                  from ${schema}.tab_inventario_contagem tic
                                  inner join ${schema}.tab_item ti on (ti.cod_barra = tic.cod_barra)
                                  where nom_usuario = '${usuario}'
                                  AND seq_inventario = ${seq_inventario}
                                  order by tic.seq_contagem_usuario desc`);

    res.json({
      message: result.rows[0].seq_contagem_usuario,
      itens: result2.rows
    });   
};

exports.criarInventario = async (req, res) =>{

  let schema = req.body.schema;
  let cod_empresa = req.body.empresa;
  let cod_almoxarifado = req.body.almoxarifado;
  let usuario = req.body.usuario;
  let observacao = req.body.observacao;
  let localItem = req.body.localItem;
  let data = moment().format("YYYY.MM.DD");
  var hora = moment().format("HH:mm:ss");

  try {

    await db.queryInventario(`insert into ${schema}.tab_inventario (
      dta_lancamento,
      cod_empresa,
      cod_almoxarifado,
      nom_usuario,
      hora_abertura,
      des_observacao,
      ind_status,
      cod_local_item)
      values
      (
        '${data}',
        ${cod_empresa},
        ${cod_almoxarifado},
        '${usuario}',
        '${hora}',
        '${observacao}',
        'P',
        ${localItem}
      )
    `);

    const result = await db.queryInventario(`select ti.*, ta.des_almoxarifado,
                                    case WHEN ti.cod_local_item = 0
                                    THEN cast('undefined' as varchar(60)) else tli.des_local_item end as des_local_item
                                    from ${schema}.tab_empresa_schema tes
                                    inner join ${schema}.tab_inventario ti on (ti.cod_empresa = tes.cod_empresa)
                                    inner join ${schema}.tab_almoxarifado ta on (ti.cod_almoxarifado = ta.cod_almoxarifado)
                                    left join demo.tab_local_item tli on (ti.cod_local_item = ti.cod_local_item)
                                    where ti.cod_empresa = '${cod_empresa}'
                                    and ti.nom_usuario = '${usuario}'
                                    order by ti.seq_inventario desc
                                    limit 1`);

        res.json({
          message: "Inventário criado com sucesso!",
          inventario: result.rows
        });
    
  } catch (error) {
    res.json({
      message: error
    });
  }

};

exports.itemContagemAberta = async (req, res) => {

  let barras = req.body.barras;
  let seq_inventario =  req.body.seqInventario;
  let schema = req.body.schema;
  console.log(req.body);
  var hora = moment().format("HH:mm:ss");
  let data = moment().format("YYYY.MM.DD");

 try {

  const result = await db.queryInventario(`select 
                                  tic.seq_inventario, 
                                  ta.des_almoxarifado, 
                                  ti.dta_lancamento  
                                  from ${schema}.tab_inventario_contagem tic
                                  inner join ${schema}.tab_inventario ti on (ti.seq_inventario = tic.seq_inventario)
                                  inner join ${schema}.tab_almoxarifado ta on (ti.cod_almoxarifado = ta.cod_almoxarifado)
                                  where tic.cod_barra = '${barras}'
                                  and   ti.ind_status = 'P' 
                                  and tic.seq_inventario <> ${seq_inventario}`);
    
      res.json({
        message: result.rows
      });
    
  } catch (error) {
    res.status(500).json({
      message: `Falha ao pesquisar item em outros inventários abertos. ${error}`,
    });
  }
};


exports.itemContagem = async (req, res) =>{

  let contagem = req.body.contagem;
  let schema = req.body.schema;
  console.log(req.body);
  var hora = moment().format("HH:mm:ss");
  let data = moment().format("YYYY.MM.DD");

  try {

    await db.queryInventario(`insert into ${schema}.tab_inventario_contagem (
                      seq_inventario,
                      cod_barra,
                      qtd_contagem_1,
                      qtd_contagem_2,
                      nom_usuario,
                      hora_leitura,
                      ind_contagem,
                      seq_contagem_usuario,
                      dta_leitura
                      ) values (
                      ${contagem.seq_inventario},
                      '${contagem.cod_barra}',
                      ${contagem.qtd_contagem_1},
                      0,
                      '${contagem.nom_usuario}',
                      '${hora}',
                      1,
                      ${contagem.seq_contagem_usuario},
                      '${data}')
                    `);
    
    res.json({
      message: "Item incluso com sucesso!",
    });
  } catch (error) {
    res.status(500).json({
      message: `Falha ao incluir item, tente novamente. ${error}`,
    });
  }

};

exports.removeItemContagem = async (req, res)  => {

  let schema = req.body.schema;
  let seq_contagem = req.body.seq;
  let seq_inventario = req.body.seqInventario;
  let usuario = req.body.usuario;

  try {
    
    await db.queryInventario(`delete from ${schema}.tab_inventario_contagem
                    where seq_inventario = ${seq_inventario}
                    and nom_usuario = '${usuario}'
                    and seq_contagem_usuario = ${seq_contagem}`);

    res.json({
      message: "Item excluido com sucesso!",
    });        
  } catch (error) {
    res.status(500).json({
      message: `Falha ao excluir item, tente novamente. ${error}`,
    });
  }
};

exports.updateItemContagem = async (req, res) =>{

  let schema = req.body.schema;
  let seq_contagem = req.body.seq;
  let seq_inventario = req.body.seqInventario;
  let usuario = req.body.usuario;
  let qtd = req.body.qtd;

  try {
    await db.queryInventario(`update ${schema}.tab_inventario_contagem
                    set qtd_contagem_1 = ${qtd}
                    where seq_inventario = ${seq_inventario}
                    and nom_usuario = '${usuario}'
                    and seq_contagem_usuario = ${seq_contagem}`);

    res.json({
      message: "Quantidade alterada com sucesso!",
    });        
  } catch (error) {
    res.status(500).json({
      message: `Falha ao alterar item, tente novamente. ${error}`,
    });
  }
};

exports.bustaTodosInventariosAbertos = async (req,res) =>{

  let schema = req.body.schema;
  let empresa = req.body.empresa;

  try {

  const result = await db.queryInventario(`select c.cod_empresa,
                            c.nom_fantasia,
                            a.dta_lancamento,
                            b.des_almoxarifado,
                            b.cod_almoxarifado,
                            a.cod_local_item,
                            a.nom_usuario,
                            a.hora_abertura,
                            a.des_observacao,
                            a.ind_status,
                            a.seq_inventario,
                            Case 
                          When d.des_local_item is null 
                          Then cast('SETOR NÃO DEFINIDO' as varchar(30))
                          Else d.des_local_item end as des_local_item
                             
                          from ${schema}.tab_inventario a inner join
                          ${schema}.tab_almoxarifado b on (a.cod_almoxarifado = b.cod_almoxarifado) inner join
                          ${schema}.tab_empresa_schema c on (c.cod_empresa = a.cod_empresa) left join
                          ${schema}.tab_local_item d on (d.cod_local_item = a.cod_local_item)
                          where a.cod_empresa = '${empresa}'
                          order by a.seq_inventario desc`);

  res.json({
      message: result.rows
    });        
  } catch (error) {
    res.status(500).json({
      message: `Falha ao obter lista de inventarios, Tente novamente. ${error}`,
    });
  }             
};

exports.concluirInv = async (req, res) =>{

  let usuario = req.body.usuario;
  let id = req.body.id;
  let schema = req.body.schema;
  let seq_inventario = req.body.seqInventario;
  let cod_empresa = req.body.codEmpresa;

  try {

    await db.queryInventario(`update ${schema}.tab_inventario
                    set ind_status = 'C'
                    where seq_inventario = ${seq_inventario}
                    and cod_empresa = ${cod_empresa}`);

    const result = await db.queryInventario(`select a.nom_fantasia, a.num_cnpj_cpf from ${schema}.tab_empresa_schema a
                                  where a.cod_empresa = ${cod_empresa}`);
    const email = await db.queryInventario(`select email_adm from tab_usuario
                                  where cod_usuario = ${id}`);

    client.sendMail(
      {
          from: "renato.filho@digitalrf.com.br",
          to: `${email.rows[0].email_adm}`,
          subject: "DRF-Inventário Online",
          text: `Olá, notificamos que o usuario: ${usuario}, alterou um inventário para "concluído" na empresa código: ${cod_empresa} - Nome: ${result.rows[0].nom_fantasia} - base: ${schema}`
      }
    );

    res.json({
      message: "Inventário concluído, resta encerra-lo!"
    });
    
  } catch (error) {

    res.status(500).json({
      message: `Falha ao concluir inventário. ${error}`,
    });
  }
};

exports.itemInventario = async (req, res) =>{

  let contagem = req.body.contagem;
  let cod_empresa = req.body.codEmpresa;
  let schema = req.body.schema;

  try {

   const result = await db.queryInventario(`select tic.seq_inventario,
                    tic.cod_barra,
                    ti.des_item,
                    sum(tic.qtd_contagem_1) as qtd_contagem_1
                    --tic.nom_usuario,
                    from ${schema}.tab_inventario_contagem tic
                    inner join ${schema}.tab_item ti on (ti.cod_barra = tic.cod_barra)
                    inner join ${schema}.tab_inventario tiv on (tiv.seq_inventario = tic.seq_inventario	)
                    where tiv.cod_empresa = ${cod_empresa}
                    AND tiv.seq_inventario = ${contagem}
                    group by 2,3,1, ti.des_item
                    order by ti.des_item`);
    
    res.json({
      message: result.rows
    });

    
  } catch (error) {
    res.status(500).json({
      message: `Falha ao obter lista de inventario, tente novamente. ${error}`,
    });
  }
};

exports.removeItemInventario = async (req, res)  => {

  var hora = moment().format("HH:mm:ss");
  let data = moment().format("YYYY.MM.DD");

  let schema = req.body.schema;
  let cod_barra = req.body.codBarra;
  let seq_inventario = req.body.seqInventario;
  let usuario = req.body.usuario;

  try {
    
    await db.queryInventario(`delete from ${schema}.tab_inventario_contagem
                    where seq_inventario = ${seq_inventario}
                    and cod_barra = '${cod_barra}'`);

    res.json({
      message: "Item removido do inventário!",
    });        
    logger.log(`Solicitação: removeItemInventario = usuario:${usuario}, cod_barra: ${cod_barra}, seq_inv: ${seq_inventario}, ${data, hora}`);
  } catch (error) {
    res.status(500).json({
      message: `Falha ao remover item, tente novamente. ${error}`,
    });
  }
};

exports.atualizaStatus = async (req,res) =>{

  let seq_inventario = req.body.seqInventario;
  let id = req.body.id;
  let usuario = req.body.usuario;
  let cod_empresa = req.body.codEmpresa;
  let schema = req.body.schema;
  let status = req.body.status;
  let nom_processo = req.body.processo;
  var hora = moment().format("HH:mm:ss");
  let data = moment().format("DD.MM.YYYY");

console.log(nom_processo);
  try {
    await db.queryInventario(`update ${schema}.tab_inventario
                  set ind_status = '${status}'
                  where seq_inventario = ${seq_inventario}
                  and cod_empresa = ${cod_empresa}`);

    logger.log(`Solicitação: Tela de finalizaçao - alteração = usuario:${usuario}, status: ${status}, seq_inv: ${seq_inventario}, ${data, hora}`);

    const result = await db.queryInventario(`select a.nom_fantasia, a.num_cnpj_cpf from ${schema}.tab_empresa_schema a
                                   where a.cod_empresa = ${cod_empresa}`);

    const email = await db.queryInventario(`select email_adm from tab_usuario
        where cod_usuario = ${id}`);

    if(nom_processo === "Concluído"){
      console.log("entrei aqui");
       pdfInventario(seq_inventario, schema, email.rows[0].email_adm, result.rows[0].nom_fantasia, data, hora, usuario, cod_empresa);
    }else{
      client.sendMail(
        {
         from: "renato.filho@digitalrf.com.br",
         to: `${email.rows[0].email_adm}`,
         subject: "DRF-Inventário Online",
         text: `Olá, Prezado cliente Digital RF \n
                Notificamos que o usuario: ${usuario}, alterou um inventário para "${nom_processo}" \n 
                Empresa código: ${cod_empresa} - Nome: ${result.rows[0].nom_fantasia} - base: ${schema} em ${data} as ${hora} \n
                Segue relatório do App em anexo.`
         }
       );
    }

    res.json({
      message: "Solicitação efetuada com sucesso!",
    });        
  } catch (error) {
    res.status(500).json({
      message: `Falha na solicitação: ${error}`,
    });
  }

};

exports.relFinal = async (req,res) =>{

  let seq_inventario = req.body.seqInventario;
  let schema = req.body.schema;

  try {
    
    const result = await db.queryInventario(`SELECT 
                      b.cod_barra,
                      b.des_item,
                      a.qtd_contagem,
                      a.qtd_estoque - a.qtd_venda_aberto as qtd_estoque_emsys,
                      a.qtd_diferenca,
                      cast(a.val_custo as numeric (15,2)) as val_custo,
                      cast(case
                      when a.qtd_diferenca < 0
                      then (a.qtd_diferenca * -1) * a.val_custo
                      else a.qtd_diferenca * a.val_custo end as numeric (15,2))  as val_diferenca 
                      FROM ${schema}.tab_inventario_concluido a 
                      inner join ${schema}.tab_item b on (a.cod_item = b.cod_item)
                      where a.seq_inventario = '${seq_inventario}'
                      and   b.ind_barra_adicional = 'N'`);

    const result1 = await db.queryInventario(`select cast(sum(case 
                                    when aa.qtd_diferenca < 0
                                    then (aa.qtd_diferenca * -1) * aa.val_custo
                                    else aa.qtd_diferenca * aa.val_custo end) as numeric (15,2)) as total
                                    from   ${schema}.tab_inventario_concluido aa
                                    where aa.seq_inventario = '${seq_inventario}'`);

    res.json({
      message: result.rows,
      message1: result1.rows
    });        
  } catch (error) {
    res.status(500).json({
      message: `Falha ao obter relatório final, tente novamente! ${error}`,
    });
  }

};

exports.verificaM = async (req,res) =>{

  let usuario = req.body.usuario;
  let m = req.body.m;

  const result = await db.queryInventario(`select * from tab_usuario
                          where senha_mestra = '${m}'
                          and nom_usuario = '${usuario}'`);

  console.log(result.rowCount);
  if(result.rowCount > 0){
    res.json({
      message: true
    });  
  }else{
    res.status(500).json({
      message: "Senha incorreta!",
    });
  }

};

exports.verificaC = async (req,res) =>{

  let usuario = req.body.usuario;
  let m = req.body.m;

  const result = await db.queryInventario(`select * from tab_usuario
                          where senha_confirmacao = '${m}'
                          and nom_usuario = '${usuario}'`);

  console.log(result.rowCount);
  if(result.rowCount > 0){
    res.json({
      message: true
    });  
  }else{
    res.status(500).json({
      message: "Senha incorreta!",
    });
  }

};

exports.excluirInv = async (req, res) =>{

  let seq_inventario = req.body.seqInventario;
  let id = req.body.id;
  let usuario = req.body.usuario;
  let cod_empresa = req.body.codEmpresa;
  let schema = req.body.schema;

  try {
    await db.queryInventario(`delete from ${schema}.tab_inventario_contagem
                  where seq_inventario = '${seq_inventario}'`).then( data =>{

                  db.queryInventario(`delete from ${schema}.tab_inventario
                  where seq_inventario = '${seq_inventario}'
                  and cod_empresa = '${cod_empresa}'`);
                  });

    const result = await db.queryInventario(`select a.nom_fantasia, a.num_cnpj_cpf from ${schema}.tab_empresa_schema a
    where a.cod_empresa = ${cod_empresa}`);

    const email = await db.queryInventario(`select email_adm from tab_usuario
    where cod_usuario = ${id}`);

    client.sendMail(
      {
          from: "renato.filho@digitalrf.com.br",
          to: `${email.rows[0].email_adm}`,
          subject: "DRF-Inventário Online",
          text: `Olá, notificamos que o usuario: ${usuario}, alterou um inventário para "Excluido" na empresa código: ${cod_empresa} - Nome: ${result.rows[0].nom_fantasia} - base: ${schema}`
      }
    );
    res.json({
      message: "Exclusão realizada com sucesso!",
    });        
  } catch (error) {
    res.status(500).json({
      message: `Falha na solicitação: ${error}`,
    });
  }
};

exports.versaoAppInventario = async ( req, res) =>{

  const result = await db.queryInventario("select * from tab_versao_inventario");

  res.status(200).send({
    message: result.rows
  });
};

const pdfInventario = async (seq, schema, email, nom_fantasia, data, hora, usuario, cod_empresa) =>{

  const doc = new PDFDocument();
  const fileName = `pdf/DRF-Inventário-${schema}.pdf`;
  const writeStream = fs.createWriteStream(fileName);
  doc.font("Helvetica-Bold").fontSize(20).text("DRF Inventário Online", { align: "center" });

  try {
    const result = await db.queryInventario(`select 
                                    tic.seq_inventario, 
                                    ti.des_item, 
                                    tic.cod_item, 
                                    ti.cod_barra,
                                    tic.qtd_contagem, 
                                    tic.qtd_estoque, 
                                    tic.qtd_diferenca, 
                                    tic.val_custo from ${schema}.tab_item ti
                                    inner join ${schema}.tab_inventario_concluido tic on (ti.cod_item = tic.cod_item)
                                    where tic.seq_inventario = '${seq}'
                                    order by ti.des_item`);

    result.rows.map((row) => {
      doc.moveDown();
      doc.font("Helvetica-Bold").fontSize(12).text(`${row.des_item}`, { align: "center" });
      doc.font("Helvetica-Bold").fontSize(10).text(`${row.cod_barra}`, { align: "center" });
      doc.moveDown();
      doc.font("Helvetica").fontSize(12)
        .text(`Contagem: ${row.qtd_contagem}        Estoque: ${row.qtd_estoque}          Diferença: ${row.qtd_diferenca}         Custo: ${row.val_custo}`,{align: "center"});
      doc.moveDown();
    });
    doc.pipe(writeStream);
    doc.end();
    console.log("PDF document generated successfully.");

    client.sendMail(
      {
       from: "renato.filho@digitalrf.com.br",
       to: `${email}`,
       subject: "DRF-Inventário Online",
       text: `Olá, Prezado cliente Digital RF \n
             Notificamos que o usuario: ${usuario}, alterou um inventário para "CONCLUÍDO" \n 
             Empresa código: ${cod_empresa} - Nome: ${nom_fantasia} - base: ${schema} em ${data} as ${hora}`
              ,
              attachments: [{
                filename: `pdf/DRF-Inventário-${schema}.pdf`,
                content: writeStream,
                path: `pdf/DRF-Inventário-${schema}.pdf`
              }]
       }
     );
     console.log(`Email enviado para ${email}`);
    
  } catch (error) {
    console.log(`Error generating PDF document: ${error.message}`);
  }
};
