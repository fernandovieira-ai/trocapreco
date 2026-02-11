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
const nodemailer = require("nodemailer");
const cron = require('node-cron');

const client = nodemailer.createTransport({
  service: "Gmail",
  auth: {
      user: "pcobranca@grupobagattoli.com.br",
      pass: "dukgjdawhdgsovdr"
  }
});


//=> metodo responsavel por listar os usuarios por ID
exports.fazerLogin = async (req, res) => {
  let result = [];
  let schemas, cod_base, nom_empresa, ind_perfil, nom_usuario, id;

  const usuario = req.body.usuario;
  const senha = req.body.senha;

  const user = await db.query(`select te.cod_base, te.nom_empresa, te.nom_schema, tu.ind_perfil, tu.nom_usuario, tube.cod_usuario from tab_usuario tu
                                  inner join tab_usuario_base tube on (tu.cod_usuario = tube.cod_usuario)
                                  inner join tab_base te on (te.cod_base = tube.cod_base)
                                  where tu.nom_usuario = $1
                                  and tu.senha = $2
                                  and tu.ind_ativo = 'S'`,[ usuario, senha ]);

  for (let index = 0; index < user.rows.length; index++) {
    schemas = user.rows[index].nom_schema;
    cod_base = user.rows[index].cod_base;
    nom_empresa = user.rows[index].nom_empresa;
    nom_usuario = user.rows[index].nom_usuario;
    ind_perfil = user.rows[index].ind_perfil;
    id = user.rows[index].cod_usuario;
    cod_base = user.rows[index].cod_base;
  
    const res = await db.query(`select * from ${schemas}.tab_empresa_schema
                                    where cod_base = ${cod_base}
                                    order by cod_empresa`);
                                    
    result.push({
      cod_base: cod_base,
      nom_usuario: nom_usuario,
      id: id,
      nom_empresa: nom_empresa,
      nom_schema: schemas,
      ind_perfil: ind_perfil,
      empresas: res.rows,
    });
  }


  if (user.rowCount !== 0) {
    const id = (user.rows[0].cod_usuario * 100) / 5;

    const token = jwt.sign({ id }, process.env.SECRET, {
      expiresIn: 1800, // 1h de prazo para expirar a sessao.
    });
    res.status(200).json({ authDRFWeb: true, token: token, user: result, status: "ok" });
    //Se existir usuario e senha, abre a sessão com um token.
  } else {
    res.status(400).json({
      message: "Usuário e Senha inválidos ou não existentes.",
      status: "no" 
    });
  }
};

exports.buscaFornecedores = async (req, res) =>{

  let { schema } = req.body;

  try {
    const result = await db.query(`select cod_pessoa, nom_pessoa, num_cnpj_cpf, ind_cliente, ind_fornecedor from ${schema}.tab_pessoa `);
      
    res.status(200).json({
      message: result.rows
    });
    
  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar os Fornecedores:" + error
    });
  }

};

exports.buscaXmlEmpresa = async (req, res) =>{

  let { schema, dtaIni, dtaFim, codEmpresa, codBase, codModDoc } = req.body;
  console.log(req.body);

  try {

    await db.query(`select ${schema}.sp_busca_xml2(${codBase},'${dtaIni}','${dtaFim}','R',${codEmpresa})`);

    const result = await db.query(`select b.seq_nota, b.cod_pessoa_cliente, b.num_chave_nfe, a.des_xml from ${schema}.tab_xml_saida a 
                                    inner join ${schema}.tab_nota_fiscal_saida b on (a.seq_nota = b.seq_nota)
                                    where b.dta_emissao between '${dtaIni}' and '${dtaFim}'
                                    and b.cod_empresa = '${codEmpresa}'
                                    and b.cod_modelo_documento in (${codModDoc})`);
      
    res.status(200).json({
      message: result.rows
    });
    
  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar os Xml:" + error
    });
  }

};

exports.buscaModeloDocumento = async (req, res) =>{

  let { schema,  codEmpresa } = req.body;
  console.log(req.body);

  try {

    const result = await db.query(`select cod_modelo_documento, des_modelo_documento, cod_modelo_doc_anexo_7 from ${schema}.tab_modelo_documento_fiscal
                                    where cod_empresa = '${codEmpresa}'`);
    res.status(200).json({
      message: result.rows
    });
    
  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar os Fornecedores:" + error
    });
  }

};

exports.verifyTokenDecioNota = async (req, res, next) => {
  const token = req.headers.authorization;
  const tokenValido = "655b7f8901d1e";

  if (token === tokenValido) {
    next(); // Chama o próximo middleware se o token for válido
  } else {
    return res.status(401).json({ auth: false, message: "Auth-Token inválidoo." });
  }
};


exports.buscaNota = async (req, res) => {
  try {

    const { schema, codEmpresa, dtaIni, dtaFim } = req.body;
    let codBase = '0'

    if(schema === 'urbanos'){
      codBase = '7'
    }else if( schema === 'beirario'){
      codBase = '1'
    }

    await db.query(`select ${schema}.sp_nfe_nfce (1,$1,$2,'R',$3')`,[dtaIni,dtaFim,codBase]);
    const empresa = await db.query(`select nom_fantasia from ${schema}.tab_empresa_schema where cod_empresa = $1`,[codEmpresa]);

    const result = await db.query(
      `SELECT * FROM ${schema}.tab_nfe_nfce 
      WHERE "cashierOpeningDate" BETWEEN $1 AND $2 
      AND "subsidiaryExtCode" = $3
      `,
      [dtaIni, dtaFim, codEmpresa]
    );
    
    let sales = [];
    
    const promises = result.rows.map(async (row) => {

      let itens = [];
      let consumer =[];
      
      const { noteId,
        movSaleCode,
        noteNumber,
        noteSeries,
        chaveSefaz,
        protocSefaz,
        cupomNumber,
        subsidiaryCode,
        subsidiaryExtCode,
        emissionDate,
        cashierOpeningDate,
        posCode,
        posDescription,
        cashierCpf,
        cashierCode,
        cashierName,
        saleDate,
        saleStatus,
        noteStatus,
        protoCancSefaz,
        motInutiliza,
        saleTotalAmount,
        saleSubsidizedAmount,
        noteTotalAmount,
        totalDiscountAmount,
        totalAmountAddition,
        totalAmountPIS,
        totalAmountCOFINS,
        totalAmountICMS,
        numCPFCNPJ,
        nom_motorista,
        num_placa,
        num_odometro
      } = row;

        if(numCPFCNPJ !== null){
          consumer = {
            consumerName: null,
            cpf_cnpj: numCPFCNPJ,
            stateRegistration: null,
            email: null,
            clientDetails: {
                cpf_cnpj: null,
                corporateName: null,
                TradeName: null,
                stateRegistration: null,
                CityRegistration: null
            },
            address: {
                streetName: null,
                streetNumber: null,
                neighborhood: null,
                postalCode: null,
                city: null,
                state: null,
                country: null
            }
          };
        }

      const pay = await db.query(`SELECT * FROM ${schema}.tab_pagto_nfe_nfce WHERE id = $1`, [row.noteId]);
      const item = await db.query(`SELECT * FROM ${schema}.tab_item_nfe_nfce WHERE id = $1`, [row.noteId]);


      for (const row of item.rows) {
        const { id, seq_item_nota, name, code, externalCode, quantity, price, discount, addition, subsidizedValue, total, ncm, cest, cstIcms, cstPisCofins, cfop, bcPis, vrAliqPis, vrPis, bcCofins, vrAliqCofins, vrCofins, bcIcms, vrAliqIcms, vrIcms } = row;
        itens.push({
                      id: id,
                      name: name,
                      code: code,
                      externalCode: externalCode,
                      quantity: quantity,
                      price: price,
                      discount: discount,
                      addition: addition,
                      subsidizedValue: subsidizedValue,
                      total: total,
                      fiscalInfo: {
                          ncm: ncm,
                          cest: cest,
                          cstIcms: cstIcms,
                          cstPisCofins: cstPisCofins,
                          cfop: cfop,
                          bcPis: bcPis,
                          vrAliqPis: vrAliqPis,
                          vrPis: vrPis,
                          bcCofins: bcCofins,
                          vrAliqCofins: vrAliqCofins,
                          vrCofins: vrCofins,
                          bcIcms: bcIcms,
                          vrAliqIcms: vrAliqIcms,
                          vrIcms: vrIcms
                        }
        });
      }

      sales.push({
        noteId: noteId,
        movSaleCode: movSaleCode,
        noteNumber: noteNumber,
        noteSeries: noteSeries,
        chaveSefaz: chaveSefaz,
        protocSefaz: protocSefaz,
        cupomNumber:cupomNumber,
        subsidiaryCode: subsidiaryCode,
        subsidiaryExtCode: subsidiaryExtCode,
        emissionDate: emissionDate,
        cashierOpeningDate: cashierOpeningDate,
        posCode: posCode,
        posDescription: posDescription,
        cashierCpf: cashierCpf,
        cashierCode: cashierCode,
        cashierName: cashierName,
        saleDate: saleDate,
        saleStatus: saleStatus,
        noteStatus: noteStatus,
        protoCancSefaz: protoCancSefaz,
        motInutiliza: motInutiliza,
        saleTotalAmount: saleTotalAmount,
        saleSubsidizedAmount: saleSubsidizedAmount,
        noteTotalAmount: noteTotalAmount,
        totalDiscountAmount: totalDiscountAmount,
        totalAmountAddition: totalAmountAddition,
        totalAmountPIS: totalAmountPIS,
        totalAmountCOFINS: totalAmountCOFINS,
        totalAmountICMS: totalAmountICMS,
        nom_motorista: nom_motorista,
        num_placa: num_placa,
        num_odometro: num_odometro,
        consumer: consumer,
        itens: itens,
        payments: pay.rows
    });

    });

    await Promise.all(promises);

    res.status(200).json({ 
      subsidiaryCode: codEmpresa,
      subsidiaryExtCode: codEmpresa,
      subsidiaryName: empresa.rows[0].nom_fantasia,
      sales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar notas" });
  }
};

exports.buscaNotaIndividual = async (req, res) => {
  try {

    const { schema, codEmpresa, dtaIni, dtaFim, noteId } = req.body;
    let codBase = '0'

    if(schema === 'urbanos'){
      codBase = '7'
    }else if( schema === 'beirario'){
      codBase = '1'
    }

    await db.query(`select ${schema}.sp_nfe_nfce ($4,$1,$2,'R',$3)`,[dtaIni,dtaFim,codEmpresa,codBase]);
    const empresa = await db.query(`select nom_fantasia from ${schema}.tab_empresa_schema where cod_empresa = $1`,[codEmpresa]);

    const result = await db.query(
      `SELECT * FROM ${schema}.tab_nfe_nfce 
      WHERE "cashierOpeningDate" BETWEEN $1 AND $2 
      AND "subsidiaryExtCode" = $3
      and "noteId"= $4
      `,
      [dtaIni, dtaFim, codEmpresa, noteId]
    );

    
    console.log(result.rows)
    let sales = [];
    

    const promises = result.rows.map(async (row) => {

      let itens = [];
      let consumer =[];
      
      const { noteId,
        movSaleCode,
        noteNumber,
        noteSeries,
        chaveSefaz,
        protocSefaz,
        cupomNumber,
        subsidiaryCode,
        subsidiaryExtCode,
        emissionDate,
        cashierOpeningDate,
        posCode,
        posDescription,
        cashierCpf,
        cashierCode,
        cashierName,
        saleDate,
        saleStatus,
        noteStatus,
        protoCancSefaz,
        motInutiliza,
        saleTotalAmount,
        saleSubsidizedAmount,
        noteTotalAmount,
        totalDiscountAmount,
        totalAmountAddition,
        totalAmountPIS,
        totalAmountCOFINS,
        totalAmountICMS,
        numCPFCNPJ,
        nom_motorista,
        num_placa,
        num_odometro,
       } = row;

        if(numCPFCNPJ !== null){
          consumer = {
            consumerName: null,
            cpf_cnpj: numCPFCNPJ,
            stateRegistration: null,
            email: null,
            clientDetails: {
                cpf_cnpj: null,
                corporateName: null,
                TradeName: null,
                stateRegistration: null,
                CityRegistration: null
            },
            address: {
                streetName: null,
                streetNumber: null,
                neighborhood: null,
                postalCode: null,
                city: null,
                state: null,
                country: null
            }
          };
        }

      const pay = await db.query(`SELECT * FROM ${schema}.tab_pagto_nfe_nfce WHERE id = $1`, [row.noteId]);
      const item = await db.query(`SELECT * FROM ${schema}.tab_item_nfe_nfce WHERE id = $1`, [row.noteId]);


      for (const row of item.rows) {
        const { id, seq_item_nota, name, code, externalCode, quantity, price, discount, addition, subsidizedValue, total, ncm, cest, cstIcms, cstPisCofins, cfop, bcPis, vrAliqPis, vrPis, bcCofins, vrAliqCofins, vrCofins, bcIcms, vrAliqIcms, vrIcms } = row;
        itens.push({
                      id: id,
                      name: name,
                      code: code,
                      externalCode: externalCode,
                      quantity: quantity,
                      price: price,
                      discount: discount,
                      addition: addition,
                      subsidizedValue: subsidizedValue,
                      total: total,
                      fiscalInfo: {
                          ncm: ncm,
                          cest: cest,
                          cstIcms: cstIcms,
                          cstPisCofins: cstPisCofins,
                          cfop: cfop,
                          bcPis: bcPis,
                          vrAliqPis: vrAliqPis,
                          vrPis: vrPis,
                          bcCofins: bcCofins,
                          vrAliqCofins: vrAliqCofins,
                          vrCofins: vrCofins,
                          bcIcms: bcIcms,
                          vrAliqIcms: vrAliqIcms,
                          vrIcms: vrIcms
                        }
        });
      }

      sales.push({
        noteId: noteId,
        movSaleCode: movSaleCode,
        noteNumber: noteNumber,
        noteSeries: noteSeries,
        chaveSefaz: chaveSefaz,
        protocSefaz: protocSefaz,
        cupomNumber:cupomNumber,
        subsidiaryCode: subsidiaryCode,
        subsidiaryExtCode: subsidiaryExtCode,
        emissionDate: emissionDate,
        cashierOpeningDate: cashierOpeningDate,
        posCode: posCode,
        posDescription: posDescription,
        cashierCpf: cashierCpf,
        cashierCode: cashierCode,
        cashierName: cashierName,
        saleDate: saleDate,
        saleStatus: saleStatus,
        noteStatus: noteStatus,
        protoCancSefaz: protoCancSefaz,
        motInutiliza: motInutiliza,
        saleTotalAmount: saleTotalAmount,
        saleSubsidizedAmount: saleSubsidizedAmount,
        noteTotalAmount: noteTotalAmount,
        totalDiscountAmount: totalDiscountAmount,
        totalAmountAddition: totalAmountAddition,
        totalAmountPIS: totalAmountPIS,
        totalAmountCOFINS: totalAmountCOFINS,
        totalAmountICMS: totalAmountICMS,
        nom_motorista: nom_motorista,
        num_placa: num_placa,
        num_odometro: num_odometro,
        consumer: consumer,
        itens: itens,
        payments: pay.rows
    });

    });

    await Promise.all(promises);

    res.status(200).json({ 
      subsidiaryCode: codEmpresa,
      subsidiaryExtCode: codEmpresa,
      subsidiaryName: empresa.rows[0].nom_fantasia,
      sales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar notas" });
  }
};


exports.buscaEmpresaEMSys = async (req, res) =>{

  let { base } = req.body;
  let result = null;
  try {

    switch (base) {
      case "beirario":
        result = await db.query_beirario("select cod_empresa, nom_fantasia from tab_empresa where ind_ativo = 'S' order by cod_empresa");
        break;
      case "deciourbanos":
        result = await db.query_urbanos("select cod_empresa, nom_fantasia from tab_empresa where ind_ativo = 'S' order by cod_empresa");
        break;
      case "variedades":
        result = await db.query_variedades("select cod_empresa, nom_fantasia from tab_empresa where ind_ativo = 'S' order by cod_empresa");
        break;
    }

    res.status(200).json({
      message: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar empresas, tente novamente:" + error
    });
  }

};

exports.auditoria = async (req, res) =>{

  let { dtaIni, dtaFim, codEmpresa, base} = req.body;
  let result = null;
  console.log(req.body);

  try {

    switch (base) {
      case "beirario":
        result = await db.query_beirario(`select 
        a.num_chave_nfe as "Chave NF-e",--Chave NF-e
        a.des_motivo_situacao as "Situação",--Situação
        a.dta_recebimento_nfe as "Data Situação",--Data Situação
        e.des_natureza_operacao as "Natureza Operação",--Natureza Operação
        '' as "Indicador Forma Pagamento",--Indicador Forma Pagamento
        c.cod_modelo_doc_anexo_7 as "Modelo",--Modelo
        c.num_serie as "Série",--Série
        a.num_nota_fiscal as "-Número Documento",--Número Documento
        a.dta_emissao as "Data Emissão Documento",--Data Emissão Documento
        a.dta_saida as "Data Entrada/Saída",--Data Entrada/Saída
        cast('1 - Saida' as varchar(30)) as "Tipo Operação",--Tipo Operação
        cast('1 - NF-e normal' as varchar(30)) as "Finalidade Emissão",--Finalidade Emissão
        cast('0 - Normal' as varchar(30)) as "Indicador Operação Consumidor",--Indicador Operação Consumidor
        '' as "Indicador Presença Comprador", --Indicador Presença Comprador
        cast('1 - Emissão normal' as varchar(30)) as "Tipo Emissão",--Tipo Emissão
        '' as "Data/Hora Contingência",--Data/Hora Contingência
        '' as "Justificativa Contingência",--Justificativa Contingência
        f.num_cnpj as "CNPJ/CPF Emitente",--CNPJ/CPF Emitente
        f.num_insc_estadual as "Inscrição Estadual Emitente",--Inscrição Estadual Emitente
        f.nom_razao_social as "Nome Emitente",--Nome Emitente
        f.nom_fantasia as "Nome Fantasia Emitente",--Nome Fantasia Emitente
        f.des_logradouro as "Logradouro Emitente",--Logradouro Emitente
        SPLIT_PART(f.des_logradouro, ',', 2) as "Número Emitente",--Número Emitente
        f.des_complemento as "Complemento Emitente",--Complemento Emitente
        f.nom_bairro as "Bairro Emitente",--Bairro Emitente
        g.nom_cidade as "Município Emitente",--Município Emitente
        h.sgl_estado as "UF Emitente",--UF Emitente
        f.num_cep as "CEP Emitente",--CEP Emitente
        f.num_telefone as "Fone Emitente",--Fone Emitente
        f.num_insc_estadual_st as "Inscrição Estadual ST Emitente",--Inscrição Estadual ST Emitente
        f.num_insc_municipal as "Inscrição Municipal Emitente",--Inscrição Municipal Emitente
        f.num_cnae as "CNAE Fiscal Emitente",--CNAE Fiscal Emitente
         case 
         when f.cod_regime_tributario = '1'
         then cast('1 - Simples Nascional' as varchar(30))
         when f.cod_regime_tributario = '2'
         then cast('2 - Simples Nacional - excesso de sublimite' as varchar(30))
         when f.cod_regime_tributario = '3'
         then cast('3 - Regime Normal (Lucro Real)' as varchar(30))
         when f.cod_regime_tributario = '4'
         then cast('4 - Regime Normal - (Lucro Presumido)' as varchar(30)) end as "Regime Tributário Emitente",--Regime Tributário Emitente
        d.num_cnpj_cpf as "CNPJ/CPF Destinatário",--CNPJ/CPF Destinatário
        d.num_ie_rg as "Inscrição Estadual Destinatário",--Inscrição Estadual Destinatário
        '' as "ID Estrangeiro Destinatário",--ID Estrangeiro Destinatário
        d.nom_pessoa as "Nome Destinatário",--Nome Destinatário
        '' as "SUFRAMA",--SUFRAMA
        d.des_logradouro as "Logradouro Destinatário",--Logradouro Destinatário
        SPLIT_PART(d.des_logradouro, ',', 2) as "Número Destinatário",--Número Destinatário
        d.des_complemento as "Complemento Destinatário",--Complemento Destinatário
        d.nom_bairro as "Bairro Destinatário",--Bairro Destinatário
        i.nom_cidade as "Município Destinatário",--Município Destinatário
        j.sgl_estado as "UF Destinatário",--UF Destinatário
        d.num_cep as "CEP Destinatário",--CEP Destinatário
        cast('BRASIL' as varchar(10)) as "País Destinatário",--País Destinatário
        d.num_telefone_1 as "Fone Destinatário" ,--Fone Destinatário
        '' as "Indicador Contribuinte Destinatário",--"Indicador Contribuinte Destinatário"
        '' as "SUFRAMA Destinatário",--SUFRAMA Destinatário
        '' as "Inscrição Municipal Destinatário",--Inscrição Municipal Destinatário
        '' as "E-mail Destinatário",--E-mail Destinatário
        '' as "CNPJ/CPF Retirada",--CNPJ/CPF Retirada
        '' as "Logradouro Retirada",--Logradouro Retirada
        '' as "Número Retirada",--Número Retirada
        '' as "Complemento Retirada",--Complemento Retirada
        '' as "Bairro Retirada",--Bairro Retirada
        '' as "Município Retirada",--Município Retirada
        '' as "UF Retirada",--UF Retirada
        '' as "Nome Expedidor",--Nome Expedidor
        '' as "CEP",--CEP
        '' as "Código País",--Código País
        '' as "Nome País",--Nome País
        '' as "Telefone",--Telefone
        '' as "E-mail",--E-mail
        '' as "Inscrição Estadual Expedidor",--Inscrição Estadual Expedidor
        '' as "CNPJ/CPF Entrega",--CNPJ/CPF Entrega
        '' as "Logradouro Entrega",--Logradouro Entrega
        '' as "Número Entrega",--Número Entrega
        '' as "Complemento Entrega",--Complemento Entrega
        '' as "Bairro Entrega",--Bairro Entrega
        '' as "Bairro Entrega",--Município Entrega
        '' as "UF Entrega",--UF Entrega
        '' as "Nome Entrega",--Nome Entrega
        '' as "CEP Entrega",--CEP Entrega
        '' as "Código País Entrega",--Código País Entrega
        '' as "Nome País Entrega",--Nome País Entrega
        '' as "Telefone Entrega",--Telefone Entrega
        '' as "E-mail Entrega",--E-mail Entrega
        '' as "Inscrição Estadual Entrega",--Inscrição Estadual Entrega
        '' as "Percentual Mercadoria Devolvida",--Percentual Mercadoria Devolvida
        a.val_base_icms as "Vlr Total Base Cálculo ICMS",--Vlr Total Base Cálculo ICMS
        a.val_icms as "Vlr Total ICMS",--Vlr Total ICMS
        a.val_icms_desoneracao as "Vlr Total ICMS Desonerado",--Vlr Total ICMS Desonerado
        a.val_base_icms_subst as "Vlr Total Base Cálculo ICMS ST",--Vlr Total Base Cálculo ICMS ST
        a.val_icms_subst as "Vlr Total ICMS ST",--Vlr Total ICMS ST
        a.val_total_produto as "Vlr Total Produto",--Vlr Total Produto
        a.val_frete as "Vlr Total Frete",--Vlr Total Frete
        a.val_seguro as "Vlr Total Seguro",--Vlr Total Seguro
        a.val_desconto_produto as "Vlr Total Desconto",--Vlr Total Desconto
        0 as "Vlr Total II",--Vlr Total II
        a.val_ipi as "Vlr Total IPI",--Vlr Total IPI
        a.val_ret_pis as "Vlr Total PIS",--Vlr Total PIS
        a.val_ret_cofins as "Vlr Total Cofins",--Vlr Total Cofins
        a.val_despesa_acessoria as "Vlr Total Outras Despesas",--Vlr Total Outras Despesas
        a.val_total_nota as "Vlr Total Outras Despesas",--Vlr Total NF-e
        0 as "Vlr Total Aproximado Tributos",--Vlr Total Aproximado Tributos
        a.val_total_servico as "Vlr Total Serviços",--Vlr Total Serviços
        a.val_base_iss as "Vlr Total Base Cálculo ISSQN",--Vlr Total Base Cálculo ISSQN
        a.val_iss_retido as "Vlr Total ISSQN",--Vlr Total ISSQN
        0 as "Vlr Total PIS Serviços",--Vlr Total PIS Serviços
        0 as "Vlr Total Cofins Serviços",--Vlr Total Cofins Serviços
        '' as "Data Prestação Serviços",--Data Prestação Serviços
        0 as "Vlr Total Redução Base Serviços",--Vlr Total Redução Base Serviços
        0 as "Vlr Total Outras Retenções Serviços",--Vlr Total Outras Retenções Serviços
        0 as "Vlr Total Desconto Incondicional Serviços",--Vlr Total Desconto Incondicional Serviços
        0 as "Vlr Total Desconto Condicional Serviços",--Vlr Total Desconto Condicional Serviços
        0 as "Vlr Total Retenção ISSQN",--Vlr Total Retenção ISSQN
        cast('0-Por conta do emitente' as varchar(100)) as "Modalidade Frete",--Modalidade Frete
        '' as "CNPJ/CPF Transportador",--CNPJ/CPF Transportador
        '' as "Nome Transportador",--Nome Transportador
        '' as "Inscrição Estadual Transportador",--Inscrição Estadual Transportador
        '' as "Endereço Transportador",--Endereço Transportador
        '' as "Município Transportador",--Município Transportador
        '' as "UF Transportador",--UF Transportador
        0 as "Vlr Serviço",--Vlr Serviço
        0 as "Vlr Base Retenção ICMS",--Vlr Base Retenção ICMS
        0 as "Alíquota Retenção",--Alíquota Retenção
        0 as "Vlr ICMS Retido",--Vlr ICMS Retido
        '' as "CFOP Retenção",--CFOP Retenção
        '' as "Código Município FG",--Código Município FG
        '' as "Placa Veículo",--Placa Veículo
        '' as "UF Veículo",--UF Veículo
        '' as "RNTC Veículo",--RNTC Veículo
        '' as "Placa Reboque",--Placa Reboque
        '' as "UF Reboque",--UF Reboque
        '' as "RNTC Reboque",--RNTC Reboque
        '' as "Vagão",--Vagão
        '' as "Balsa",--Balsa
        a.qtd_volume as "Qtde Volume Transportado",--Qtde Volume Transportado
        cast('VOLUME' as varchar(6)) as "Espécie Volume Transportado",--Espécie Volume Transportado
        '' as "Marca Volume Transportado",--Marca Volume Transportado
        a.qtd_peso_liquido as "Peso Líquido",--Peso Líquido
        a.qtd_peso_bruto as "Peso Bruto",--Peso Bruto
        a.des_mensagem_nota as "Informação Adicional Fisco",--Informação Adicional Fisco
        a.des_mensagem_nota_2 as "Informação Adicional Contribuinte",--Informação Adicional Contribuinte
        b.seq_item_nota as "Número Item",--Número Item
        b.cod_item as "Código Item",--Código Item
        l.cod_barra as "EAN",--EAN
        l.des_item as "Descrição Item",--Descrição Item
        m.cod_ncm as "NCM",--NCM
        m.cod_cest as "CEST",--CEST
        '' as "Ex TIPI",--Ex TIPI
        n.num_cfop as "CFOP",--CFOP
        o.sgl_unidade as "Unidade Comercial",--Unidade Comercial
        b.qtd_item as "Qtde",--Qtde
        b.val_unitario as "Vlr Unitário",--Vlr Unitário
        b.val_total_item as "Vlr Total Produtos",--Vlr Total Produtos
        cast('SEM GTIN' as varchar(10)) as "EAN Tributável",--EAN Tributável
        o.sgl_unidade as "Unidade Tributável",--Unidade Tributável
        0 as "Vlr Frete Item",--Vlr Frete Item
        0 as "Vlr Seguro Item",--Vlr Seguro Item
        0 as "Vlr Desconto Item",--Vlr Desconto Item
        0 as "Vlr Outas Despesas Item",--Vlr Outas Despesas Item
        '' as "Número FCI",--Número FCI
        '' as "Número DI",--Número DI
        '' as "Data DI",--Data DI
        '' as "Local Desembaraço",--Local Desembaraço
        '' as "UF Desembaraço",--UF Desembaraço
        '' as "Data Desembaraço",--Data Desembaraço
        '' as "Informação Adicional Produto",--Informação Adicional Produto
        '' as "Tipo Operação Venda",--Tipo Operação Venda
        '' as "Chassi Veículo",--Chassi Veículo
        '' as "Tipo Combustível",--Tipo Combustível
        '' as "Ano/Modelo Fabricação",--Ano/Modelo Fabricação
        '' as "Ano Fabricação",--Ano Fabricação
        '' as "Tipo Veículo",--Tipo Veículo
        '' as "Espécie Veículo",--Espécie Veículo
        '' as "VIN - Chassi Remarcado",--VIN - Chassi Remarcado
        '' as "Capacidade Lotação",--Capacidade Lotação
        '' as "Restrição",--Restrição
        '1' as "Origem CST ICMS",--Origem CST ICMS
        b.cod_situacao_tributaria as "CST ICMS",--CST ICMS
        '3' as "Modalidade Base Cálculo ICMS",--Modalidade Base Cálculo ICMS
        0 as "Percentual Redução ICMS",--Percentual Redução ICMS
        b.val_base_icms_subst as "Vlr Base Cálculo ICMS",--Vlr Base Cálculo ICMS
        b.per_aliquota_icms_st as "Alíquota ICMS",--Alíquota ICMS
        0 as "Vlr ICMS Operação Diferimento",--Vlr ICMS Operação Diferimento
        0 as "Percentual Diferimento",--Percentual Diferimento
        0 as "Vlr ICMS Diferido",--Vlr ICMS Diferido
        b.val_icms as "Vlr ICMS",--Vlr ICMS
        0 as "Vlr Base Cálculo ICMS ST Retido",--Vlr Base Cálculo ICMS ST Retido
        0 as "Vlr ICMS ST Retido",--Vlr ICMS ST Retido
        0 as "Percentual Redução Base Efetiva",--Percentual Redução Base Efetiva
        0 as "Vlr Base Cálculo Efetiva",--Vlr Base Cálculo Efetiva
        0 as "Alíquota ICMS Efetiva",--Alíquota ICMS Efetiva
        0 as "Vlr ICMS Efetivo",--Vlr ICMS Efetivo
        0 as "Vlr ICMS Substituto",--Vlr ICMS Substituto
        0 as "Vlr Base Cálculo ICMS Destinatário",--Vlr Base Cálculo ICMS Destinatário
        0 as "Vlr ICMS Destinatário",--Vlr ICMS Destinatário
        0 as "Modalidade Base Cálculo ICMS ST",--Modalidade Base Cálculo ICMS ST
        0 as "Percentual MVA",--Percentual MVA
        0 as "Percentual Redução Base ICMS ST",--Percentual Redução Base ICMS ST
        0 as "Vlr Base Cálculo ICMS ST",--Vlr Base Cálculo ICMS ST
        0 as "Alíquota ICMS ST",--Alíquota ICMS ST
        0 as "Vlr ICMS ST",--Vlr ICMS ST
        0 as "Vlr ICMS Desonerado",--Vlr ICMS Desonerado
        0 as "Motivo Desoneração ICMS",--Motivo Desoneração ICMS
        0 as "Percentual Base Cálculo Operação Própria",--Percentual Base Cálculo Operação Própria
        '' as "UF Devido ICMS ST",--UF Devido ICMS ST
        0 as "Alíquota Crédito Simples",--Alíquota Crédito Simples
        0 as "Vlr Crédito Simples",--Vlr Crédito Simples
        0 as "Vlr Base Cálculo FCP",--Vlr Base Cálculo FCP
        0 as "Alíquota FCP",--Alíquota FCP
        b.val_fcp as "Vlr FCP",--Vlr FCP
        0 as "Vlr Base Cálculo FCP ST",--Vlr Base Cálculo FCP ST
        0 as "Alíquota FCP ST",--Alíquota FCP ST
        b.val_fcp_st as "Vlr FCP ST",--Vlr FCP ST
        b.val_fcp_st_ret as "Vlr Base Cálculo FCP Retido Anteriormente ST",--Vlr Base Cálculo FCP Retido Anteriormente ST
        0 as "Alíquota FCP Retido Anteriormente ST",--Alíquota FCP Retido Anteriormente ST
        0 as "Vlr FCP Retido Anteriormente ST",--Vlr FCP Retido Anteriormente ST
        0 as "Vlr Base Cálculo ICMS UF Destino",--Vlr Base Cálculo ICMS UF Destino
        0 as "Vlr Base Cálculo FCP UF Destino",--Vlr Base Cálculo FCP UF Destino
        0 as "Percentual ICMS Relativo FCP UF Destino",--Percentual ICMS Relativo FCP UF Destino
        0 as "Alíquota Interna UF Destino",--Alíquota Interna UF Destino
        0 as "Alíquota Interestadual UF Envolvidas",--Alíquota Interestadual UF Envolvidas
        0 as "Percentual Provisório Partilha ICMS Interestadual",--Percentual Provisório Partilha ICMS Interestadual
        0 as "Vlr ICMS Relativo FCP UF Destino",--Vlr ICMS Relativo FCP UF Destino
        0 as "Vlr ICMS Interestadual UF Destino",--Vlr ICMS Interestadual UF Destino
        0 as "Vlr ICMS Interestadual UF Remetente",--Vlr ICMS Interestadual UF Remetente
        0 as "Vlr Total ICMS Relativo FCP UF Destino",--Vlr Total ICMS Relativo FCP UF Destino
        0 as "Vlr Total ICMS Interestadual UF Destino",--Vlr Total ICMS Interestadual UF Destino
        0 as "Vlr Total ICMS Interestadual UF Remetente",--Vlr Total ICMS Interestadual UF Remetente
        0 as "Vlr Total FCP Retido Anteriormente ST",--Vlr Total FCP Retido Anteriormente ST
        '' as "Classe Enquadramento IPI",--Classe Enquadramento IPI
        '' as "CNPJ Produtor",--CNPJ Produtor
        '' as "Código Selo",--Código Selo
        0 as "Qtde Selo",--Qtde Selo
        '' as "Código Enquadramento Legal",--Código Enquadramento Legal
        p.cod_situacao_tributaria as "CST IPI",--CST IPI
        b.val_base_ipi as "Vlr Base Cálculo IPI",--Vlr Base Cálculo IPI
        b.per_aliquota_ipi as "Alíquota IPI",--Alíquota IPI
        0 as "Qtde Unidade",--Qtde Unidade
        0 as "Vlr Unidade Tributável",--Vlr Unidade Tributável
        b.val_ipi as "Vlr IPI Item",--Vlr IPI Item
        0 as "Vlr Base Cálculo II",--Vlr Base Cálculo II
        0 as "Vlr Despesas Aduaneiras",--Vlr Despesas Aduaneiras
        0 as "Vlr II Item",--Vlr II Item
        0 as "Vlr IOF",--Vlr IOF
        q.cod_situacao_tributaria as "CST PIS",--CST PIS
        b.val_total_item as "Vlr Base Cálculo PIS",--Vlr Base Cálculo PIS
        b.per_aliquota_pis as "Alíquota PIS",--Alíquota PIS
        0 as "Qtde Base Cálculo PIS",--Qtde Base Cálculo PIS
        0 as "Qtde Alíquota PIS",--Qtde Alíquota PIS
        b.val_pis as "Vlr PIS",--Vlr PIS
        r.cod_situacao_tributaria as "CST Cofins",--CST Cofins
        b.val_total_item as "Vlr Base Cálculo Cofins",--Vlr Base Cálculo Cofins
        b.per_aliquota_cofins as "Alíquota Cofins",--Alíquota Cofins
        0 as "Qtde Base Cálculo Cofins",--Qtde Base Cálculo Cofins
        0 as "Qtde Alíquota Cofins",--Qtde Alíquota Cofins
        b.val_cofins as "Vlr Cofins",--Vlr Cofins
        0 as "Vlr Base Cálculo ISSQN",--Vlr Base Cálculo ISSQN
        0 as "Alíquota ISSQN",--Alíquota ISSQN
        0 as "Vlr ISSQN Item",--Vlr ISSQN Item
        '' as "Código Município FG Item",--Código Município FG Item
        0 as "Item Lista Serviço",--Item Lista Serviço
        0 as "Vlr Dedução Base ISSQN",--Vlr Dedução Base ISSQN
        0 as "Vlr Outras Retenções Item",--Vlr Outras Retenções Item
        0 as "Vlr Desconto Incondicionado",--Vlr Desconto Incondicionado
        0 as "Vlr Desconto Condicionado",--Vlr Desconto Condicionado
        0 as "Vlr Retenção ISSQN",--Vlr Retenção ISSQN
        '' as "Código Serviço",--Código Serviço
        '' as "Código Município",--Código Município
        '' as "Código País Prestado",--Código País Prestado
        '' as "Indicador Incentivo",--Indicador Incentivo
        '' as "Chave NF-e Referenciada",--Chave NF-e Referenciada
        '' as "Chave CT-e Referenciada",--Chave CT-e Referenciada
        '' as "Código UF Emitente",--Código UF Emitente
        '' as "Ano/Mês Emissão",--Ano/Mês Emissão
        '' as "CNPJ Emitente",--CNPJ Emitente
        '' as "CPF Emitente",--CPF Emitente
        '' as "Inscrição Estadual Emitente Referenciado",--Inscrição Estadual Emitente Referenciado
        '' as "Modelo Referenciado",--Modelo Referenciado
        '' as "Série Referenciado",--Série Referenciado
        '' as "Número Documento Referenciado",--Número Documento Referenciado
        '' as "Número Ordem Sequência ECF",--Número Ordem Sequência ECF
        '' as "Contador Ordem Operação COO" --Contador Ordem Operação COO
        
        from tab_nota_fiscal_saida a inner join
             tab_item_nfs b on (a.seq_nota = b.seq_nota) inner join 
             tab_modelo_documento_fiscal c on (a.cod_modelo_documento = c.cod_modelo_documento) inner join
             tab_pessoa d on (d.cod_pessoa = a.cod_pessoa_cliente) inner join
             tab_natureza_operacao e on (e.cod_natureza_operacao = a.cod_natureza_operacao) inner join
             tab_empresa f on (f.cod_empresa = a.cod_empresa) inner join
             tab_cidade g on (g.cod_cidade = f.cod_cidade) inner join 
             tab_estado h on (h.cod_estado = g.cod_estado) inner join
             tab_cidade i on (i.cod_cidade = d.cod_cidade) inner join
             tab_estado j on (j.cod_estado = i.cod_estado) inner join
             tab_item l on (l.cod_item = b.cod_item) inner join 
             tab_natureza_operacao n on (n.cod_natureza_operacao = b.cod_natureza_operacao) inner join
             tab_unidade o on (o.cod_unidade = b.cod_unidade_venda) left join 
             tab_ncm m on (m.seq_ncm = l.seq_ncm) left join 
             tab_tributacao p on (p.cod_tributacao = b.cod_tributacao_ipi) left join 
             tab_tributacao q on (q.cod_tributacao = b.cod_tributacao_pis) left join 
             tab_tributacao r on (r.cod_tributacao = b.cod_tributacao_cofins)
             
             
        where a.dta_emissao >= $1
        and   a.dta_emissao <= $2
        and   a.cod_empresa = $3
        and   c.cod_modelo_doc_anexo_7 = '55'
        and   a.ind_status <> 'C'
        and   a.cod_situacao_nfe = '100'`,[dtaIni, dtaFim, codEmpresa]);
    
        break;
      case "deciourbanos":
        result = await db.query_urbanos(`select 
        a.num_chave_nfe as "Chave NF-e",--Chave NF-e
        a.des_motivo_situacao as "Situação",--Situação
        a.dta_recebimento_nfe as "Data Situação",--Data Situação
        e.des_natureza_operacao as "Natureza Operação",--Natureza Operação
        '' as "Indicador Forma Pagamento",--Indicador Forma Pagamento
        c.cod_modelo_doc_anexo_7 as "Modelo",--Modelo
        c.num_serie as "Série",--Série
        a.num_nota_fiscal as "-Número Documento",--Número Documento
        a.dta_emissao as "Data Emissão Documento",--Data Emissão Documento
        a.dta_saida as "Data Entrada/Saída",--Data Entrada/Saída
        cast('1 - Saida' as varchar(30)) as "Tipo Operação",--Tipo Operação
        cast('1 - NF-e normal' as varchar(30)) as "Finalidade Emissão",--Finalidade Emissão
        cast('0 - Normal' as varchar(30)) as "Indicador Operação Consumidor",--Indicador Operação Consumidor
        '' as "Indicador Presença Comprador", --Indicador Presença Comprador
        cast('1 - Emissão normal' as varchar(30)) as "Tipo Emissão",--Tipo Emissão
        '' as "Data/Hora Contingência",--Data/Hora Contingência
        '' as "Justificativa Contingência",--Justificativa Contingência
        f.num_cnpj as "CNPJ/CPF Emitente",--CNPJ/CPF Emitente
        f.num_insc_estadual as "Inscrição Estadual Emitente",--Inscrição Estadual Emitente
        f.nom_razao_social as "Nome Emitente",--Nome Emitente
        f.nom_fantasia as "Nome Fantasia Emitente",--Nome Fantasia Emitente
        f.des_logradouro as "Logradouro Emitente",--Logradouro Emitente
        SPLIT_PART(f.des_logradouro, ',', 2) as "Número Emitente",--Número Emitente
        f.des_complemento as "Complemento Emitente",--Complemento Emitente
        f.nom_bairro as "Bairro Emitente",--Bairro Emitente
        g.nom_cidade as "Município Emitente",--Município Emitente
        h.sgl_estado as "UF Emitente",--UF Emitente
        f.num_cep as "CEP Emitente",--CEP Emitente
        f.num_telefone as "Fone Emitente",--Fone Emitente
        f.num_insc_estadual_st as "Inscrição Estadual ST Emitente",--Inscrição Estadual ST Emitente
        f.num_insc_municipal as "Inscrição Municipal Emitente",--Inscrição Municipal Emitente
        f.num_cnae as "CNAE Fiscal Emitente",--CNAE Fiscal Emitente
         case 
         when f.cod_regime_tributario = '1'
         then cast('1 - Simples Nascional' as varchar(30))
         when f.cod_regime_tributario = '2'
         then cast('2 - Simples Nacional - excesso de sublimite' as varchar(30))
         when f.cod_regime_tributario = '3'
         then cast('3 - Regime Normal (Lucro Real)' as varchar(30))
         when f.cod_regime_tributario = '4'
         then cast('4 - Regime Normal - (Lucro Presumido)' as varchar(30)) end as "Regime Tributário Emitente",--Regime Tributário Emitente
        d.num_cnpj_cpf as "CNPJ/CPF Destinatário",--CNPJ/CPF Destinatário
        d.num_ie_rg as "Inscrição Estadual Destinatário",--Inscrição Estadual Destinatário
        '' as "ID Estrangeiro Destinatário",--ID Estrangeiro Destinatário
        d.nom_pessoa as "Nome Destinatário",--Nome Destinatário
        '' as "SUFRAMA",--SUFRAMA
        d.des_logradouro as "Logradouro Destinatário",--Logradouro Destinatário
        SPLIT_PART(d.des_logradouro, ',', 2) as "Número Destinatário",--Número Destinatário
        d.des_complemento as "Complemento Destinatário",--Complemento Destinatário
        d.nom_bairro as "Bairro Destinatário",--Bairro Destinatário
        i.nom_cidade as "Município Destinatário",--Município Destinatário
        j.sgl_estado as "UF Destinatário",--UF Destinatário
        d.num_cep as "CEP Destinatário",--CEP Destinatário
        cast('BRASIL' as varchar(10)) as "País Destinatário",--País Destinatário
        d.num_telefone_1 as "Fone Destinatário" ,--Fone Destinatário
        '' as "Indicador Contribuinte Destinatário",--"Indicador Contribuinte Destinatário"
        '' as "SUFRAMA Destinatário",--SUFRAMA Destinatário
        '' as "Inscrição Municipal Destinatário",--Inscrição Municipal Destinatário
        '' as "E-mail Destinatário",--E-mail Destinatário
        '' as "CNPJ/CPF Retirada",--CNPJ/CPF Retirada
        '' as "Logradouro Retirada",--Logradouro Retirada
        '' as "Número Retirada",--Número Retirada
        '' as "Complemento Retirada",--Complemento Retirada
        '' as "Bairro Retirada",--Bairro Retirada
        '' as "Município Retirada",--Município Retirada
        '' as "UF Retirada",--UF Retirada
        '' as "Nome Expedidor",--Nome Expedidor
        '' as "CEP",--CEP
        '' as "Código País",--Código País
        '' as "Nome País",--Nome País
        '' as "Telefone",--Telefone
        '' as "E-mail",--E-mail
        '' as "Inscrição Estadual Expedidor",--Inscrição Estadual Expedidor
        '' as "CNPJ/CPF Entrega",--CNPJ/CPF Entrega
        '' as "Logradouro Entrega",--Logradouro Entrega
        '' as "Número Entrega",--Número Entrega
        '' as "Complemento Entrega",--Complemento Entrega
        '' as "Bairro Entrega",--Bairro Entrega
        '' as "Bairro Entrega",--Município Entrega
        '' as "UF Entrega",--UF Entrega
        '' as "Nome Entrega",--Nome Entrega
        '' as "CEP Entrega",--CEP Entrega
        '' as "Código País Entrega",--Código País Entrega
        '' as "Nome País Entrega",--Nome País Entrega
        '' as "Telefone Entrega",--Telefone Entrega
        '' as "E-mail Entrega",--E-mail Entrega
        '' as "Inscrição Estadual Entrega",--Inscrição Estadual Entrega
        '' as "Percentual Mercadoria Devolvida",--Percentual Mercadoria Devolvida
        a.val_base_icms as "Vlr Total Base Cálculo ICMS",--Vlr Total Base Cálculo ICMS
        a.val_icms as "Vlr Total ICMS",--Vlr Total ICMS
        a.val_icms_desoneracao as "Vlr Total ICMS Desonerado",--Vlr Total ICMS Desonerado
        a.val_base_icms_subst as "Vlr Total Base Cálculo ICMS ST",--Vlr Total Base Cálculo ICMS ST
        a.val_icms_subst as "Vlr Total ICMS ST",--Vlr Total ICMS ST
        a.val_total_produto as "Vlr Total Produto",--Vlr Total Produto
        a.val_frete as "Vlr Total Frete",--Vlr Total Frete
        a.val_seguro as "Vlr Total Seguro",--Vlr Total Seguro
        a.val_desconto_produto as "Vlr Total Desconto",--Vlr Total Desconto
        0 as "Vlr Total II",--Vlr Total II
        a.val_ipi as "Vlr Total IPI",--Vlr Total IPI
        a.val_ret_pis as "Vlr Total PIS",--Vlr Total PIS
        a.val_ret_cofins as "Vlr Total Cofins",--Vlr Total Cofins
        a.val_despesa_acessoria as "Vlr Total Outras Despesas",--Vlr Total Outras Despesas
        a.val_total_nota as "Vlr Total Outras Despesas",--Vlr Total NF-e
        0 as "Vlr Total Aproximado Tributos",--Vlr Total Aproximado Tributos
        a.val_total_servico as "Vlr Total Serviços",--Vlr Total Serviços
        a.val_base_iss as "Vlr Total Base Cálculo ISSQN",--Vlr Total Base Cálculo ISSQN
        a.val_iss_retido as "Vlr Total ISSQN",--Vlr Total ISSQN
        0 as "Vlr Total PIS Serviços",--Vlr Total PIS Serviços
        0 as "Vlr Total Cofins Serviços",--Vlr Total Cofins Serviços
        '' as "Data Prestação Serviços",--Data Prestação Serviços
        0 as "Vlr Total Redução Base Serviços",--Vlr Total Redução Base Serviços
        0 as "Vlr Total Outras Retenções Serviços",--Vlr Total Outras Retenções Serviços
        0 as "Vlr Total Desconto Incondicional Serviços",--Vlr Total Desconto Incondicional Serviços
        0 as "Vlr Total Desconto Condicional Serviços",--Vlr Total Desconto Condicional Serviços
        0 as "Vlr Total Retenção ISSQN",--Vlr Total Retenção ISSQN
        cast('0-Por conta do emitente' as varchar(100)) as "Modalidade Frete",--Modalidade Frete
        '' as "CNPJ/CPF Transportador",--CNPJ/CPF Transportador
        '' as "Nome Transportador",--Nome Transportador
        '' as "Inscrição Estadual Transportador",--Inscrição Estadual Transportador
        '' as "Endereço Transportador",--Endereço Transportador
        '' as "Município Transportador",--Município Transportador
        '' as "UF Transportador",--UF Transportador
        0 as "Vlr Serviço",--Vlr Serviço
        0 as "Vlr Base Retenção ICMS",--Vlr Base Retenção ICMS
        0 as "Alíquota Retenção",--Alíquota Retenção
        0 as "Vlr ICMS Retido",--Vlr ICMS Retido
        '' as "CFOP Retenção",--CFOP Retenção
        '' as "Código Município FG",--Código Município FG
        '' as "Placa Veículo",--Placa Veículo
        '' as "UF Veículo",--UF Veículo
        '' as "RNTC Veículo",--RNTC Veículo
        '' as "Placa Reboque",--Placa Reboque
        '' as "UF Reboque",--UF Reboque
        '' as "RNTC Reboque",--RNTC Reboque
        '' as "Vagão",--Vagão
        '' as "Balsa",--Balsa
        a.qtd_volume as "Qtde Volume Transportado",--Qtde Volume Transportado
        cast('VOLUME' as varchar(6)) as "Espécie Volume Transportado",--Espécie Volume Transportado
        '' as "Marca Volume Transportado",--Marca Volume Transportado
        a.qtd_peso_liquido as "Peso Líquido",--Peso Líquido
        a.qtd_peso_bruto as "Peso Bruto",--Peso Bruto
        a.des_mensagem_nota as "Informação Adicional Fisco",--Informação Adicional Fisco
        a.des_mensagem_nota_2 as "Informação Adicional Contribuinte",--Informação Adicional Contribuinte
        b.seq_item_nota as "Número Item",--Número Item
        b.cod_item as "Código Item",--Código Item
        l.cod_barra as "EAN",--EAN
        l.des_item as "Descrição Item",--Descrição Item
        m.cod_ncm as "NCM",--NCM
        m.cod_cest as "CEST",--CEST
        '' as "Ex TIPI",--Ex TIPI
        n.num_cfop as "CFOP",--CFOP
        o.sgl_unidade as "Unidade Comercial",--Unidade Comercial
        b.qtd_item as "Qtde",--Qtde
        b.val_unitario as "Vlr Unitário",--Vlr Unitário
        b.val_total_item as "Vlr Total Produtos",--Vlr Total Produtos
        cast('SEM GTIN' as varchar(10)) as "EAN Tributável",--EAN Tributável
        o.sgl_unidade as "Unidade Tributável",--Unidade Tributável
        0 as "Vlr Frete Item",--Vlr Frete Item
        0 as "Vlr Seguro Item",--Vlr Seguro Item
        0 as "Vlr Desconto Item",--Vlr Desconto Item
        0 as "Vlr Outas Despesas Item",--Vlr Outas Despesas Item
        '' as "Número FCI",--Número FCI
        '' as "Número DI",--Número DI
        '' as "Data DI",--Data DI
        '' as "Local Desembaraço",--Local Desembaraço
        '' as "UF Desembaraço",--UF Desembaraço
        '' as "Data Desembaraço",--Data Desembaraço
        '' as "Informação Adicional Produto",--Informação Adicional Produto
        '' as "Tipo Operação Venda",--Tipo Operação Venda
        '' as "Chassi Veículo",--Chassi Veículo
        '' as "Tipo Combustível",--Tipo Combustível
        '' as "Ano/Modelo Fabricação",--Ano/Modelo Fabricação
        '' as "Ano Fabricação",--Ano Fabricação
        '' as "Tipo Veículo",--Tipo Veículo
        '' as "Espécie Veículo",--Espécie Veículo
        '' as "VIN - Chassi Remarcado",--VIN - Chassi Remarcado
        '' as "Capacidade Lotação",--Capacidade Lotação
        '' as "Restrição",--Restrição
        '1' as "Origem CST ICMS",--Origem CST ICMS
        b.cod_situacao_tributaria as "CST ICMS",--CST ICMS
        '3' as "Modalidade Base Cálculo ICMS",--Modalidade Base Cálculo ICMS
        0 as "Percentual Redução ICMS",--Percentual Redução ICMS
        b.val_base_icms_subst as "Vlr Base Cálculo ICMS",--Vlr Base Cálculo ICMS
        b.per_aliquota_icms_st as "Alíquota ICMS",--Alíquota ICMS
        0 as "Vlr ICMS Operação Diferimento",--Vlr ICMS Operação Diferimento
        0 as "Percentual Diferimento",--Percentual Diferimento
        0 as "Vlr ICMS Diferido",--Vlr ICMS Diferido
        b.val_icms as "Vlr ICMS",--Vlr ICMS
        0 as "Vlr Base Cálculo ICMS ST Retido",--Vlr Base Cálculo ICMS ST Retido
        0 as "Vlr ICMS ST Retido",--Vlr ICMS ST Retido
        0 as "Percentual Redução Base Efetiva",--Percentual Redução Base Efetiva
        0 as "Vlr Base Cálculo Efetiva",--Vlr Base Cálculo Efetiva
        0 as "Alíquota ICMS Efetiva",--Alíquota ICMS Efetiva
        0 as "Vlr ICMS Efetivo",--Vlr ICMS Efetivo
        0 as "Vlr ICMS Substituto",--Vlr ICMS Substituto
        0 as "Vlr Base Cálculo ICMS Destinatário",--Vlr Base Cálculo ICMS Destinatário
        0 as "Vlr ICMS Destinatário",--Vlr ICMS Destinatário
        0 as "Modalidade Base Cálculo ICMS ST",--Modalidade Base Cálculo ICMS ST
        0 as "Percentual MVA",--Percentual MVA
        0 as "Percentual Redução Base ICMS ST",--Percentual Redução Base ICMS ST
        0 as "Vlr Base Cálculo ICMS ST",--Vlr Base Cálculo ICMS ST
        0 as "Alíquota ICMS ST",--Alíquota ICMS ST
        0 as "Vlr ICMS ST",--Vlr ICMS ST
        0 as "Vlr ICMS Desonerado",--Vlr ICMS Desonerado
        0 as "Motivo Desoneração ICMS",--Motivo Desoneração ICMS
        0 as "Percentual Base Cálculo Operação Própria",--Percentual Base Cálculo Operação Própria
        '' as "UF Devido ICMS ST",--UF Devido ICMS ST
        0 as "Alíquota Crédito Simples",--Alíquota Crédito Simples
        0 as "Vlr Crédito Simples",--Vlr Crédito Simples
        0 as "Vlr Base Cálculo FCP",--Vlr Base Cálculo FCP
        0 as "Alíquota FCP",--Alíquota FCP
        b.val_fcp as "Vlr FCP",--Vlr FCP
        0 as "Vlr Base Cálculo FCP ST",--Vlr Base Cálculo FCP ST
        0 as "Alíquota FCP ST",--Alíquota FCP ST
        b.val_fcp_st as "Vlr FCP ST",--Vlr FCP ST
        b.val_fcp_st_ret as "Vlr Base Cálculo FCP Retido Anteriormente ST",--Vlr Base Cálculo FCP Retido Anteriormente ST
        0 as "Alíquota FCP Retido Anteriormente ST",--Alíquota FCP Retido Anteriormente ST
        0 as "Vlr FCP Retido Anteriormente ST",--Vlr FCP Retido Anteriormente ST
        0 as "Vlr Base Cálculo ICMS UF Destino",--Vlr Base Cálculo ICMS UF Destino
        0 as "Vlr Base Cálculo FCP UF Destino",--Vlr Base Cálculo FCP UF Destino
        0 as "Percentual ICMS Relativo FCP UF Destino",--Percentual ICMS Relativo FCP UF Destino
        0 as "Alíquota Interna UF Destino",--Alíquota Interna UF Destino
        0 as "Alíquota Interestadual UF Envolvidas",--Alíquota Interestadual UF Envolvidas
        0 as "Percentual Provisório Partilha ICMS Interestadual",--Percentual Provisório Partilha ICMS Interestadual
        0 as "Vlr ICMS Relativo FCP UF Destino",--Vlr ICMS Relativo FCP UF Destino
        0 as "Vlr ICMS Interestadual UF Destino",--Vlr ICMS Interestadual UF Destino
        0 as "Vlr ICMS Interestadual UF Remetente",--Vlr ICMS Interestadual UF Remetente
        0 as "Vlr Total ICMS Relativo FCP UF Destino",--Vlr Total ICMS Relativo FCP UF Destino
        0 as "Vlr Total ICMS Interestadual UF Destino",--Vlr Total ICMS Interestadual UF Destino
        0 as "Vlr Total ICMS Interestadual UF Remetente",--Vlr Total ICMS Interestadual UF Remetente
        0 as "Vlr Total FCP Retido Anteriormente ST",--Vlr Total FCP Retido Anteriormente ST
        '' as "Classe Enquadramento IPI",--Classe Enquadramento IPI
        '' as "CNPJ Produtor",--CNPJ Produtor
        '' as "Código Selo",--Código Selo
        0 as "Qtde Selo",--Qtde Selo
        '' as "Código Enquadramento Legal",--Código Enquadramento Legal
        p.cod_situacao_tributaria as "CST IPI",--CST IPI
        b.val_base_ipi as "Vlr Base Cálculo IPI",--Vlr Base Cálculo IPI
        b.per_aliquota_ipi as "Alíquota IPI",--Alíquota IPI
        0 as "Qtde Unidade",--Qtde Unidade
        0 as "Vlr Unidade Tributável",--Vlr Unidade Tributável
        b.val_ipi as "Vlr IPI Item",--Vlr IPI Item
        0 as "Vlr Base Cálculo II",--Vlr Base Cálculo II
        0 as "Vlr Despesas Aduaneiras",--Vlr Despesas Aduaneiras
        0 as "Vlr II Item",--Vlr II Item
        0 as "Vlr IOF",--Vlr IOF
        q.cod_situacao_tributaria as "CST PIS",--CST PIS
        b.val_total_item as "Vlr Base Cálculo PIS",--Vlr Base Cálculo PIS
        b.per_aliquota_pis as "Alíquota PIS",--Alíquota PIS
        0 as "Qtde Base Cálculo PIS",--Qtde Base Cálculo PIS
        0 as "Qtde Alíquota PIS",--Qtde Alíquota PIS
        b.val_pis as "Vlr PIS",--Vlr PIS
        r.cod_situacao_tributaria as "CST Cofins",--CST Cofins
        b.val_total_item as "Vlr Base Cálculo Cofins",--Vlr Base Cálculo Cofins
        b.per_aliquota_cofins as "Alíquota Cofins",--Alíquota Cofins
        0 as "Qtde Base Cálculo Cofins",--Qtde Base Cálculo Cofins
        0 as "Qtde Alíquota Cofins",--Qtde Alíquota Cofins
        b.val_cofins as "Vlr Cofins",--Vlr Cofins
        0 as "Vlr Base Cálculo ISSQN",--Vlr Base Cálculo ISSQN
        0 as "Alíquota ISSQN",--Alíquota ISSQN
        0 as "Vlr ISSQN Item",--Vlr ISSQN Item
        '' as "Código Município FG Item",--Código Município FG Item
        0 as "Item Lista Serviço",--Item Lista Serviço
        0 as "Vlr Dedução Base ISSQN",--Vlr Dedução Base ISSQN
        0 as "Vlr Outras Retenções Item",--Vlr Outras Retenções Item
        0 as "Vlr Desconto Incondicionado",--Vlr Desconto Incondicionado
        0 as "Vlr Desconto Condicionado",--Vlr Desconto Condicionado
        0 as "Vlr Retenção ISSQN",--Vlr Retenção ISSQN
        '' as "Código Serviço",--Código Serviço
        '' as "Código Município",--Código Município
        '' as "Código País Prestado",--Código País Prestado
        '' as "Indicador Incentivo",--Indicador Incentivo
        '' as "Chave NF-e Referenciada",--Chave NF-e Referenciada
        '' as "Chave CT-e Referenciada",--Chave CT-e Referenciada
        '' as "Código UF Emitente",--Código UF Emitente
        '' as "Ano/Mês Emissão",--Ano/Mês Emissão
        '' as "CNPJ Emitente",--CNPJ Emitente
        '' as "CPF Emitente",--CPF Emitente
        '' as "Inscrição Estadual Emitente Referenciado",--Inscrição Estadual Emitente Referenciado
        '' as "Modelo Referenciado",--Modelo Referenciado
        '' as "Série Referenciado",--Série Referenciado
        '' as "Número Documento Referenciado",--Número Documento Referenciado
        '' as "Número Ordem Sequência ECF",--Número Ordem Sequência ECF
        '' as "Contador Ordem Operação COO" --Contador Ordem Operação COO
        
        from tab_nota_fiscal_saida a inner join
             tab_item_nfs b on (a.seq_nota = b.seq_nota) inner join 
             tab_modelo_documento_fiscal c on (a.cod_modelo_documento = c.cod_modelo_documento) inner join
             tab_pessoa d on (d.cod_pessoa = a.cod_pessoa_cliente) inner join
             tab_natureza_operacao e on (e.cod_natureza_operacao = a.cod_natureza_operacao) inner join
             tab_empresa f on (f.cod_empresa = a.cod_empresa) inner join
             tab_cidade g on (g.cod_cidade = f.cod_cidade) inner join 
             tab_estado h on (h.cod_estado = g.cod_estado) inner join
             tab_cidade i on (i.cod_cidade = d.cod_cidade) inner join
             tab_estado j on (j.cod_estado = i.cod_estado) inner join
             tab_item l on (l.cod_item = b.cod_item) inner join 
             tab_natureza_operacao n on (n.cod_natureza_operacao = b.cod_natureza_operacao) inner join
             tab_unidade o on (o.cod_unidade = b.cod_unidade_venda) left join 
             tab_ncm m on (m.seq_ncm = l.seq_ncm) left join 
             tab_tributacao p on (p.cod_tributacao = b.cod_tributacao_ipi) left join 
             tab_tributacao q on (q.cod_tributacao = b.cod_tributacao_pis) left join 
             tab_tributacao r on (r.cod_tributacao = b.cod_tributacao_cofins)
             
             
        where a.dta_emissao >= $1
        and   a.dta_emissao <= $2
        and   a.cod_empresa = $3
        and   c.cod_modelo_doc_anexo_7 = '55'
        and   a.ind_status <> 'C'
        and   a.cod_situacao_nfe = '100'`,[dtaIni, dtaFim, codEmpresa]);
        break;
      case "variedades":
        result = await db.query_variedades(`select 
        a.num_chave_nfe as "Chave NF-e",--Chave NF-e
        a.des_motivo_situacao as "Situação",--Situação
        a.dta_recebimento_nfe as "Data Situação",--Data Situação
        e.des_natureza_operacao as "Natureza Operação",--Natureza Operação
        '' as "Indicador Forma Pagamento",--Indicador Forma Pagamento
        c.cod_modelo_doc_anexo_7 as "Modelo",--Modelo
        c.num_serie as "Série",--Série
        a.num_nota_fiscal as "-Número Documento",--Número Documento
        a.dta_emissao as "Data Emissão Documento",--Data Emissão Documento
        a.dta_saida as "Data Entrada/Saída",--Data Entrada/Saída
        cast('1 - Saida' as varchar(30)) as "Tipo Operação",--Tipo Operação
        cast('1 - NF-e normal' as varchar(30)) as "Finalidade Emissão",--Finalidade Emissão
        cast('0 - Normal' as varchar(30)) as "Indicador Operação Consumidor",--Indicador Operação Consumidor
        '' as "Indicador Presença Comprador", --Indicador Presença Comprador
        cast('1 - Emissão normal' as varchar(30)) as "Tipo Emissão",--Tipo Emissão
        '' as "Data/Hora Contingência",--Data/Hora Contingência
        '' as "Justificativa Contingência",--Justificativa Contingência
        f.num_cnpj as "CNPJ/CPF Emitente",--CNPJ/CPF Emitente
        f.num_insc_estadual as "Inscrição Estadual Emitente",--Inscrição Estadual Emitente
        f.nom_razao_social as "Nome Emitente",--Nome Emitente
        f.nom_fantasia as "Nome Fantasia Emitente",--Nome Fantasia Emitente
        f.des_logradouro as "Logradouro Emitente",--Logradouro Emitente
        SPLIT_PART(f.des_logradouro, ',', 2) as "Número Emitente",--Número Emitente
        f.des_complemento as "Complemento Emitente",--Complemento Emitente
        f.nom_bairro as "Bairro Emitente",--Bairro Emitente
        g.nom_cidade as "Município Emitente",--Município Emitente
        h.sgl_estado as "UF Emitente",--UF Emitente
        f.num_cep as "CEP Emitente",--CEP Emitente
        f.num_telefone as "Fone Emitente",--Fone Emitente
        f.num_insc_estadual_st as "Inscrição Estadual ST Emitente",--Inscrição Estadual ST Emitente
        f.num_insc_municipal as "Inscrição Municipal Emitente",--Inscrição Municipal Emitente
        f.num_cnae as "CNAE Fiscal Emitente",--CNAE Fiscal Emitente
         case 
         when f.cod_regime_tributario = '1'
         then cast('1 - Simples Nascional' as varchar(30))
         when f.cod_regime_tributario = '2'
         then cast('2 - Simples Nacional - excesso de sublimite' as varchar(30))
         when f.cod_regime_tributario = '3'
         then cast('3 - Regime Normal (Lucro Real)' as varchar(30))
         when f.cod_regime_tributario = '4'
         then cast('4 - Regime Normal - (Lucro Presumido)' as varchar(30)) end as "Regime Tributário Emitente",--Regime Tributário Emitente
        d.num_cnpj_cpf as "CNPJ/CPF Destinatário",--CNPJ/CPF Destinatário
        d.num_ie_rg as "Inscrição Estadual Destinatário",--Inscrição Estadual Destinatário
        '' as "ID Estrangeiro Destinatário",--ID Estrangeiro Destinatário
        d.nom_pessoa as "Nome Destinatário",--Nome Destinatário
        '' as "SUFRAMA",--SUFRAMA
        d.des_logradouro as "Logradouro Destinatário",--Logradouro Destinatário
        SPLIT_PART(d.des_logradouro, ',', 2) as "Número Destinatário",--Número Destinatário
        d.des_complemento as "Complemento Destinatário",--Complemento Destinatário
        d.nom_bairro as "Bairro Destinatário",--Bairro Destinatário
        i.nom_cidade as "Município Destinatário",--Município Destinatário
        j.sgl_estado as "UF Destinatário",--UF Destinatário
        d.num_cep as "CEP Destinatário",--CEP Destinatário
        cast('BRASIL' as varchar(10)) as "País Destinatário",--País Destinatário
        d.num_telefone_1 as "Fone Destinatário" ,--Fone Destinatário
        '' as "Indicador Contribuinte Destinatário",--"Indicador Contribuinte Destinatário"
        '' as "SUFRAMA Destinatário",--SUFRAMA Destinatário
        '' as "Inscrição Municipal Destinatário",--Inscrição Municipal Destinatário
        '' as "E-mail Destinatário",--E-mail Destinatário
        '' as "CNPJ/CPF Retirada",--CNPJ/CPF Retirada
        '' as "Logradouro Retirada",--Logradouro Retirada
        '' as "Número Retirada",--Número Retirada
        '' as "Complemento Retirada",--Complemento Retirada
        '' as "Bairro Retirada",--Bairro Retirada
        '' as "Município Retirada",--Município Retirada
        '' as "UF Retirada",--UF Retirada
        '' as "Nome Expedidor",--Nome Expedidor
        '' as "CEP",--CEP
        '' as "Código País",--Código País
        '' as "Nome País",--Nome País
        '' as "Telefone",--Telefone
        '' as "E-mail",--E-mail
        '' as "Inscrição Estadual Expedidor",--Inscrição Estadual Expedidor
        '' as "CNPJ/CPF Entrega",--CNPJ/CPF Entrega
        '' as "Logradouro Entrega",--Logradouro Entrega
        '' as "Número Entrega",--Número Entrega
        '' as "Complemento Entrega",--Complemento Entrega
        '' as "Bairro Entrega",--Bairro Entrega
        '' as "Bairro Entrega",--Município Entrega
        '' as "UF Entrega",--UF Entrega
        '' as "Nome Entrega",--Nome Entrega
        '' as "CEP Entrega",--CEP Entrega
        '' as "Código País Entrega",--Código País Entrega
        '' as "Nome País Entrega",--Nome País Entrega
        '' as "Telefone Entrega",--Telefone Entrega
        '' as "E-mail Entrega",--E-mail Entrega
        '' as "Inscrição Estadual Entrega",--Inscrição Estadual Entrega
        '' as "Percentual Mercadoria Devolvida",--Percentual Mercadoria Devolvida
        a.val_base_icms as "Vlr Total Base Cálculo ICMS",--Vlr Total Base Cálculo ICMS
        a.val_icms as "Vlr Total ICMS",--Vlr Total ICMS
        a.val_icms_desoneracao as "Vlr Total ICMS Desonerado",--Vlr Total ICMS Desonerado
        a.val_base_icms_subst as "Vlr Total Base Cálculo ICMS ST",--Vlr Total Base Cálculo ICMS ST
        a.val_icms_subst as "Vlr Total ICMS ST",--Vlr Total ICMS ST
        a.val_total_produto as "Vlr Total Produto",--Vlr Total Produto
        a.val_frete as "Vlr Total Frete",--Vlr Total Frete
        a.val_seguro as "Vlr Total Seguro",--Vlr Total Seguro
        a.val_desconto_produto as "Vlr Total Desconto",--Vlr Total Desconto
        0 as "Vlr Total II",--Vlr Total II
        a.val_ipi as "Vlr Total IPI",--Vlr Total IPI
        a.val_ret_pis as "Vlr Total PIS",--Vlr Total PIS
        a.val_ret_cofins as "Vlr Total Cofins",--Vlr Total Cofins
        a.val_despesa_acessoria as "Vlr Total Outras Despesas",--Vlr Total Outras Despesas
        a.val_total_nota as "Vlr Total Outras Despesas",--Vlr Total NF-e
        0 as "Vlr Total Aproximado Tributos",--Vlr Total Aproximado Tributos
        a.val_total_servico as "Vlr Total Serviços",--Vlr Total Serviços
        a.val_base_iss as "Vlr Total Base Cálculo ISSQN",--Vlr Total Base Cálculo ISSQN
        a.val_iss_retido as "Vlr Total ISSQN",--Vlr Total ISSQN
        0 as "Vlr Total PIS Serviços",--Vlr Total PIS Serviços
        0 as "Vlr Total Cofins Serviços",--Vlr Total Cofins Serviços
        '' as "Data Prestação Serviços",--Data Prestação Serviços
        0 as "Vlr Total Redução Base Serviços",--Vlr Total Redução Base Serviços
        0 as "Vlr Total Outras Retenções Serviços",--Vlr Total Outras Retenções Serviços
        0 as "Vlr Total Desconto Incondicional Serviços",--Vlr Total Desconto Incondicional Serviços
        0 as "Vlr Total Desconto Condicional Serviços",--Vlr Total Desconto Condicional Serviços
        0 as "Vlr Total Retenção ISSQN",--Vlr Total Retenção ISSQN
        cast('0-Por conta do emitente' as varchar(100)) as "Modalidade Frete",--Modalidade Frete
        '' as "CNPJ/CPF Transportador",--CNPJ/CPF Transportador
        '' as "Nome Transportador",--Nome Transportador
        '' as "Inscrição Estadual Transportador",--Inscrição Estadual Transportador
        '' as "Endereço Transportador",--Endereço Transportador
        '' as "Município Transportador",--Município Transportador
        '' as "UF Transportador",--UF Transportador
        0 as "Vlr Serviço",--Vlr Serviço
        0 as "Vlr Base Retenção ICMS",--Vlr Base Retenção ICMS
        0 as "Alíquota Retenção",--Alíquota Retenção
        0 as "Vlr ICMS Retido",--Vlr ICMS Retido
        '' as "CFOP Retenção",--CFOP Retenção
        '' as "Código Município FG",--Código Município FG
        '' as "Placa Veículo",--Placa Veículo
        '' as "UF Veículo",--UF Veículo
        '' as "RNTC Veículo",--RNTC Veículo
        '' as "Placa Reboque",--Placa Reboque
        '' as "UF Reboque",--UF Reboque
        '' as "RNTC Reboque",--RNTC Reboque
        '' as "Vagão",--Vagão
        '' as "Balsa",--Balsa
        a.qtd_volume as "Qtde Volume Transportado",--Qtde Volume Transportado
        cast('VOLUME' as varchar(6)) as "Espécie Volume Transportado",--Espécie Volume Transportado
        '' as "Marca Volume Transportado",--Marca Volume Transportado
        a.qtd_peso_liquido as "Peso Líquido",--Peso Líquido
        a.qtd_peso_bruto as "Peso Bruto",--Peso Bruto
        a.des_mensagem_nota as "Informação Adicional Fisco",--Informação Adicional Fisco
        a.des_mensagem_nota_2 as "Informação Adicional Contribuinte",--Informação Adicional Contribuinte
        b.seq_item_nota as "Número Item",--Número Item
        b.cod_item as "Código Item",--Código Item
        l.cod_barra as "EAN",--EAN
        l.des_item as "Descrição Item",--Descrição Item
        m.cod_ncm as "NCM",--NCM
        m.cod_cest as "CEST",--CEST
        '' as "Ex TIPI",--Ex TIPI
        n.num_cfop as "CFOP",--CFOP
        o.sgl_unidade as "Unidade Comercial",--Unidade Comercial
        b.qtd_item as "Qtde",--Qtde
        b.val_unitario as "Vlr Unitário",--Vlr Unitário
        b.val_total_item as "Vlr Total Produtos",--Vlr Total Produtos
        cast('SEM GTIN' as varchar(10)) as "EAN Tributável",--EAN Tributável
        o.sgl_unidade as "Unidade Tributável",--Unidade Tributável
        0 as "Vlr Frete Item",--Vlr Frete Item
        0 as "Vlr Seguro Item",--Vlr Seguro Item
        0 as "Vlr Desconto Item",--Vlr Desconto Item
        0 as "Vlr Outas Despesas Item",--Vlr Outas Despesas Item
        '' as "Número FCI",--Número FCI
        '' as "Número DI",--Número DI
        '' as "Data DI",--Data DI
        '' as "Local Desembaraço",--Local Desembaraço
        '' as "UF Desembaraço",--UF Desembaraço
        '' as "Data Desembaraço",--Data Desembaraço
        '' as "Informação Adicional Produto",--Informação Adicional Produto
        '' as "Tipo Operação Venda",--Tipo Operação Venda
        '' as "Chassi Veículo",--Chassi Veículo
        '' as "Tipo Combustível",--Tipo Combustível
        '' as "Ano/Modelo Fabricação",--Ano/Modelo Fabricação
        '' as "Ano Fabricação",--Ano Fabricação
        '' as "Tipo Veículo",--Tipo Veículo
        '' as "Espécie Veículo",--Espécie Veículo
        '' as "VIN - Chassi Remarcado",--VIN - Chassi Remarcado
        '' as "Capacidade Lotação",--Capacidade Lotação
        '' as "Restrição",--Restrição
        '1' as "Origem CST ICMS",--Origem CST ICMS
        b.cod_situacao_tributaria as "CST ICMS",--CST ICMS
        '3' as "Modalidade Base Cálculo ICMS",--Modalidade Base Cálculo ICMS
        0 as "Percentual Redução ICMS",--Percentual Redução ICMS
        b.val_base_icms_subst as "Vlr Base Cálculo ICMS",--Vlr Base Cálculo ICMS
        b.per_aliquota_icms_st as "Alíquota ICMS",--Alíquota ICMS
        0 as "Vlr ICMS Operação Diferimento",--Vlr ICMS Operação Diferimento
        0 as "Percentual Diferimento",--Percentual Diferimento
        0 as "Vlr ICMS Diferido",--Vlr ICMS Diferido
        b.val_icms as "Vlr ICMS",--Vlr ICMS
        0 as "Vlr Base Cálculo ICMS ST Retido",--Vlr Base Cálculo ICMS ST Retido
        0 as "Vlr ICMS ST Retido",--Vlr ICMS ST Retido
        0 as "Percentual Redução Base Efetiva",--Percentual Redução Base Efetiva
        0 as "Vlr Base Cálculo Efetiva",--Vlr Base Cálculo Efetiva
        0 as "Alíquota ICMS Efetiva",--Alíquota ICMS Efetiva
        0 as "Vlr ICMS Efetivo",--Vlr ICMS Efetivo
        0 as "Vlr ICMS Substituto",--Vlr ICMS Substituto
        0 as "Vlr Base Cálculo ICMS Destinatário",--Vlr Base Cálculo ICMS Destinatário
        0 as "Vlr ICMS Destinatário",--Vlr ICMS Destinatário
        0 as "Modalidade Base Cálculo ICMS ST",--Modalidade Base Cálculo ICMS ST
        0 as "Percentual MVA",--Percentual MVA
        0 as "Percentual Redução Base ICMS ST",--Percentual Redução Base ICMS ST
        0 as "Vlr Base Cálculo ICMS ST",--Vlr Base Cálculo ICMS ST
        0 as "Alíquota ICMS ST",--Alíquota ICMS ST
        0 as "Vlr ICMS ST",--Vlr ICMS ST
        0 as "Vlr ICMS Desonerado",--Vlr ICMS Desonerado
        0 as "Motivo Desoneração ICMS",--Motivo Desoneração ICMS
        0 as "Percentual Base Cálculo Operação Própria",--Percentual Base Cálculo Operação Própria
        '' as "UF Devido ICMS ST",--UF Devido ICMS ST
        0 as "Alíquota Crédito Simples",--Alíquota Crédito Simples
        0 as "Vlr Crédito Simples",--Vlr Crédito Simples
        0 as "Vlr Base Cálculo FCP",--Vlr Base Cálculo FCP
        0 as "Alíquota FCP",--Alíquota FCP
        b.val_fcp as "Vlr FCP",--Vlr FCP
        0 as "Vlr Base Cálculo FCP ST",--Vlr Base Cálculo FCP ST
        0 as "Alíquota FCP ST",--Alíquota FCP ST
        b.val_fcp_st as "Vlr FCP ST",--Vlr FCP ST
        b.val_fcp_st_ret as "Vlr Base Cálculo FCP Retido Anteriormente ST",--Vlr Base Cálculo FCP Retido Anteriormente ST
        0 as "Alíquota FCP Retido Anteriormente ST",--Alíquota FCP Retido Anteriormente ST
        0 as "Vlr FCP Retido Anteriormente ST",--Vlr FCP Retido Anteriormente ST
        0 as "Vlr Base Cálculo ICMS UF Destino",--Vlr Base Cálculo ICMS UF Destino
        0 as "Vlr Base Cálculo FCP UF Destino",--Vlr Base Cálculo FCP UF Destino
        0 as "Percentual ICMS Relativo FCP UF Destino",--Percentual ICMS Relativo FCP UF Destino
        0 as "Alíquota Interna UF Destino",--Alíquota Interna UF Destino
        0 as "Alíquota Interestadual UF Envolvidas",--Alíquota Interestadual UF Envolvidas
        0 as "Percentual Provisório Partilha ICMS Interestadual",--Percentual Provisório Partilha ICMS Interestadual
        0 as "Vlr ICMS Relativo FCP UF Destino",--Vlr ICMS Relativo FCP UF Destino
        0 as "Vlr ICMS Interestadual UF Destino",--Vlr ICMS Interestadual UF Destino
        0 as "Vlr ICMS Interestadual UF Remetente",--Vlr ICMS Interestadual UF Remetente
        0 as "Vlr Total ICMS Relativo FCP UF Destino",--Vlr Total ICMS Relativo FCP UF Destino
        0 as "Vlr Total ICMS Interestadual UF Destino",--Vlr Total ICMS Interestadual UF Destino
        0 as "Vlr Total ICMS Interestadual UF Remetente",--Vlr Total ICMS Interestadual UF Remetente
        0 as "Vlr Total FCP Retido Anteriormente ST",--Vlr Total FCP Retido Anteriormente ST
        '' as "Classe Enquadramento IPI",--Classe Enquadramento IPI
        '' as "CNPJ Produtor",--CNPJ Produtor
        '' as "Código Selo",--Código Selo
        0 as "Qtde Selo",--Qtde Selo
        '' as "Código Enquadramento Legal",--Código Enquadramento Legal
        p.cod_situacao_tributaria as "CST IPI",--CST IPI
        b.val_base_ipi as "Vlr Base Cálculo IPI",--Vlr Base Cálculo IPI
        b.per_aliquota_ipi as "Alíquota IPI",--Alíquota IPI
        0 as "Qtde Unidade",--Qtde Unidade
        0 as "Vlr Unidade Tributável",--Vlr Unidade Tributável
        b.val_ipi as "Vlr IPI Item",--Vlr IPI Item
        0 as "Vlr Base Cálculo II",--Vlr Base Cálculo II
        0 as "Vlr Despesas Aduaneiras",--Vlr Despesas Aduaneiras
        0 as "Vlr II Item",--Vlr II Item
        0 as "Vlr IOF",--Vlr IOF
        q.cod_situacao_tributaria as "CST PIS",--CST PIS
        b.val_total_item as "Vlr Base Cálculo PIS",--Vlr Base Cálculo PIS
        b.per_aliquota_pis as "Alíquota PIS",--Alíquota PIS
        0 as "Qtde Base Cálculo PIS",--Qtde Base Cálculo PIS
        0 as "Qtde Alíquota PIS",--Qtde Alíquota PIS
        b.val_pis as "Vlr PIS",--Vlr PIS
        r.cod_situacao_tributaria as "CST Cofins",--CST Cofins
        b.val_total_item as "Vlr Base Cálculo Cofins",--Vlr Base Cálculo Cofins
        b.per_aliquota_cofins as "Alíquota Cofins",--Alíquota Cofins
        0 as "Qtde Base Cálculo Cofins",--Qtde Base Cálculo Cofins
        0 as "Qtde Alíquota Cofins",--Qtde Alíquota Cofins
        b.val_cofins as "Vlr Cofins",--Vlr Cofins
        0 as "Vlr Base Cálculo ISSQN",--Vlr Base Cálculo ISSQN
        0 as "Alíquota ISSQN",--Alíquota ISSQN
        0 as "Vlr ISSQN Item",--Vlr ISSQN Item
        '' as "Código Município FG Item",--Código Município FG Item
        0 as "Item Lista Serviço",--Item Lista Serviço
        0 as "Vlr Dedução Base ISSQN",--Vlr Dedução Base ISSQN
        0 as "Vlr Outras Retenções Item",--Vlr Outras Retenções Item
        0 as "Vlr Desconto Incondicionado",--Vlr Desconto Incondicionado
        0 as "Vlr Desconto Condicionado",--Vlr Desconto Condicionado
        0 as "Vlr Retenção ISSQN",--Vlr Retenção ISSQN
        '' as "Código Serviço",--Código Serviço
        '' as "Código Município",--Código Município
        '' as "Código País Prestado",--Código País Prestado
        '' as "Indicador Incentivo",--Indicador Incentivo
        '' as "Chave NF-e Referenciada",--Chave NF-e Referenciada
        '' as "Chave CT-e Referenciada",--Chave CT-e Referenciada
        '' as "Código UF Emitente",--Código UF Emitente
        '' as "Ano/Mês Emissão",--Ano/Mês Emissão
        '' as "CNPJ Emitente",--CNPJ Emitente
        '' as "CPF Emitente",--CPF Emitente
        '' as "Inscrição Estadual Emitente Referenciado",--Inscrição Estadual Emitente Referenciado
        '' as "Modelo Referenciado",--Modelo Referenciado
        '' as "Série Referenciado",--Série Referenciado
        '' as "Número Documento Referenciado",--Número Documento Referenciado
        '' as "Número Ordem Sequência ECF",--Número Ordem Sequência ECF
        '' as "Contador Ordem Operação COO" --Contador Ordem Operação COO
        
        from tab_nota_fiscal_saida a inner join
             tab_item_nfs b on (a.seq_nota = b.seq_nota) inner join 
             tab_modelo_documento_fiscal c on (a.cod_modelo_documento = c.cod_modelo_documento) inner join
             tab_pessoa d on (d.cod_pessoa = a.cod_pessoa_cliente) inner join
             tab_natureza_operacao e on (e.cod_natureza_operacao = a.cod_natureza_operacao) inner join
             tab_empresa f on (f.cod_empresa = a.cod_empresa) inner join
             tab_cidade g on (g.cod_cidade = f.cod_cidade) inner join 
             tab_estado h on (h.cod_estado = g.cod_estado) inner join
             tab_cidade i on (i.cod_cidade = d.cod_cidade) inner join
             tab_estado j on (j.cod_estado = i.cod_estado) inner join
             tab_item l on (l.cod_item = b.cod_item) inner join 
             tab_natureza_operacao n on (n.cod_natureza_operacao = b.cod_natureza_operacao) inner join
             tab_unidade o on (o.cod_unidade = b.cod_unidade_venda) left join 
             tab_ncm m on (m.seq_ncm = l.seq_ncm) left join 
             tab_tributacao p on (p.cod_tributacao = b.cod_tributacao_ipi) left join 
             tab_tributacao q on (q.cod_tributacao = b.cod_tributacao_pis) left join 
             tab_tributacao r on (r.cod_tributacao = b.cod_tributacao_cofins)
             
             
        where a.dta_emissao >= $1
        and   a.dta_emissao <= $2
        and   a.cod_empresa = $3
        and   c.cod_modelo_doc_anexo_7 = '55'
        and   a.ind_status <> 'C'
        and   a.cod_situacao_nfe = '100'`,[dtaIni, dtaFim, codEmpresa]);
        break;
    }

    res.status(200).json({
      message: result.rows
    });
    
  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar registros:" + error
    });
  }

};



exports.buscaPessoaTitulo = async (req, res) =>{

  let { schema } = req.body;

  try {

    const result = await db.query(`select a.cod_pessoa, a.nom_pessoa, a.num_cnpj_cpf from ${schema}.tab_pessoa a
                                  where a.ind_cliente = 'S'`);
      
    res.status(200).json({
      message: result.rows
    });
    
  } catch (error) {
    res.status(500).json({
      message: "Falha em buscar os Xml:" + error
    });
  }

};

exports.buscaArquivoDeTitulos = async (req, res) =>{

  const { schema, empresa, filtros } = req.body;
  const result = [];

  try {

    console.log(req.body);
    await db.query(`select bagattoli.sp_busca_titulo_receber(5, '${filtros.dataInicial}', '${filtros.dataFinal}', 'R', ${empresa})`)

    if(empresa === "1"){


      await db.query("BEGIN"); // Inicia uma transação

      const result1 = await db.query(`

      --select de faturas ou titulos
      select '' as debito, '11201001' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao
      end as historico
      ,a.val_original  as valor , a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'titulo' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join ${schema}.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

      union all
      --select de liquidacao em banco 
      select c.cod_conta as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao || ' Valor Titulo: ' || a.val_original || ' Valor Recebimento: ' || a.val_recebimento_banco
      end as historico
      ,a.val_recebimento_banco as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'liquidacao banco' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join ${schema}.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              inner join ${schema}.tab_conta_contabil_banco c on (a.num_mnemonico = c.num_mnemonico)
                                              where a.ind_status = 'L'
                                              and a.val_recebimento_banco > 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'
                                              
                                              
      union all
      --select de liquidacao em especie                              
      select '11101001' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao || ' Valor Titulo: ' || a.val_original || ' Valor Recebimento: ' || a.val_recebimento_caixa
      end as historico
      ,a.val_recebimento_caixa  as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'liquidacao caixa' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_recebimento_caixa > 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'


      union all
      --select de liquidacao em cheque                          
      select '11101001' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao || ' Valor Titulo: ' || a.val_original || ' Valor Recebimento: ' || a.val_recebimento_cheque
      end as historico
      ,a.val_recebimento_cheque  as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'liquidacao cheque' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_recebimento_cheque > 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

                                              union all
      --select de liquidacao em cartao                          
      select '11102007' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao || ' Valor Titulo: ' || a.val_original || ' Valor Recebimento: ' || a.val_recebimento_cartao
      end as historico
      ,a.val_recebimento_cartao  as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'liquidacao cartao' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_recebimento_cartao > 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'


      union all
      --select de juros               
      select '' as debito, '31401001' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao 
      end as historico
      ,a.val_juros + a.val_multa as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'juros' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_juros + a.val_multa	> 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

      union all
      --select de despesas acessorias             
      select '41203008' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao 
      end as historico
      ,a.val_despesa_acessoria as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'Desp Acessoria' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_despesa_acessoria	> 0
                                              and a.cod_empresa = '${empresa}'
                                                                                      and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

      union all
      --select de troco          
      select '' as debito, '11101001' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao 
      end as historico
      ,a.val_troco, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'troco' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_troco	> 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

      union all
      --select de descontos concedidos        
      select '41203003' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao 
      end as historico
      ,a.val_desconto, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'Descontos' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_desconto	> 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

      union all
      --select de acrescimos       
      select '' as debito, '31401001' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao 
      end as historico
      ,a.val_outros_acrescimos, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'Acrescimos' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_outros_acrescimos	> 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'
                                              
      union all  
      --select de taxa de cobrança           
      select '41203008' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao
      end as historico
      , a.val_taxa_cobranca as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'taxa cobranca' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_taxa_cobranca > 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'
                                              order by 9 desc,3,4`);

      result.push(result1.rows);

      const result2 = await db.query(`select distinct b.cod_pessoa, b.nom_pessoa, sum(a.val_original) as valor from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'
                                              group by 1, 2`);

      await db.query("COMMIT"); // Confirma a transação

      if(result !== null){
        res.status(200).json({
          message: result.flat(7),
          pessoas: result2.rows
        });
      }else{
        await db.query("ROLLBACK"); // Desfaz a transação em caso de erro
        res.status(500).json({
          message: "Nenhum registro encontrado com estes critérios de pesquisa."
        });
      }

    }else{

      await db.query("BEGIN"); // Inicia uma transação
      
      const result1 = await db.query(`

      --select de faturas ou titulos
      select '' as debito, '11201002' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao
      end as historico
      ,a.val_original  as valor , a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'titulo' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join ${schema}.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

      union all
      --select de liquidacao em banco 
      select c.cod_conta as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao || ' Valor Titulo: ' || a.val_original || ' Valor Recebimento: ' || a.val_recebimento_banco
      end as historico
      ,a.val_recebimento_banco as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'liquidacao banco' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join ${schema}.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              inner join ${schema}.tab_conta_contabil_banco c on (a.num_mnemonico = c.num_mnemonico)
                                              where a.ind_status = 'L'
                                              and a.val_recebimento_banco > 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'
                                              
                                              
      union all
      --select de liquidacao em especie                              
      select '11101002' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao || ' Valor Titulo: ' || a.val_original || ' Valor Recebimento: ' || a.val_recebimento_caixa
      end as historico
      ,a.val_recebimento_caixa  as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'liquidacao caixa' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_recebimento_caixa > 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'


      union all
      --select de liquidacao em cheque                          
      select '11101002' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao || ' Valor Titulo: ' || a.val_original || ' Valor Recebimento: ' || a.val_recebimento_cheque
      end as historico
      ,a.val_recebimento_cheque  as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'liquidacao cheque' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_recebimento_cheque > 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

                                              union all
      --select de liquidacao em cartao                          
      select '11103001' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao || ' Valor Titulo: ' || a.val_original || ' Valor Recebimento: ' || a.val_recebimento_cartao
      end as historico
      ,a.val_recebimento_cartao  as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'liquidacao cartao' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_recebimento_cartao > 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'


      union all
      --select de juros               
      select '' as debito, '31402001' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao 
      end as historico
      ,a.val_juros + a.val_multa as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'juros' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_juros + a.val_multa	> 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

      union all
      --select de despesas acessorias             
      select '41204008' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao 
      end as historico
      ,a.val_despesa_acessoria as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'Desp Acessoria' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_despesa_acessoria	> 0
                                              and a.cod_empresa = '${empresa}'
                                                                                      and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

      union all
      --select de troco          
      select '' as debito, '11101002' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao 
      end as historico
      ,a.val_troco, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'troco' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_troco	> 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

      union all
      --select de descontos concedidos        
      select '41204003' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao 
      end as historico
      ,a.val_desconto, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'Descontos' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_desconto	> 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'

      union all
      --select de acrescimos       
      select '' as debito, '31402001' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao 
      end as historico
      ,a.val_outros_acrescimos, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'Acrescimos' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_outros_acrescimos	> 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'
                                              
      union all  
      --select de taxa de cobrança           
      select '41204008' as debito, '' as credito, b.cod_pessoa, b.nom_pessoa, TO_CHAR(a.dta_liquidacao, 'dd/MM') as data, 
      case when a.des_observacao is null or a.des_observacao = ''
      then 'N/recebimento fatura numero '|| a.num_titulo
      else a.des_observacao
      end as historico
      , a.val_taxa_cobranca as valor, a.num_titulo as documento, a.seq_titulo as numero, a.ind_status, 'taxa cobranca' as ind_tipo  from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.val_taxa_cobranca > 0
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'
                                              order by 9 desc,3,4`);

      result.push(result1.rows);

      const result2 = await db.query(`select distinct b.cod_pessoa, b.nom_pessoa, sum(a.val_original) as valor from ${schema}.tab_titulo_receber a
                                              inner join bagattoli.tab_pessoa b on (b.cod_pessoa = a.cod_pessoa_sacado)
                                              where a.ind_status = 'L'
                                              and a.cod_empresa = '${empresa}'
                                              and a.dta_liquidacao BETWEEN '${filtros.dataInicial}' and '${filtros.dataFinal}'
                                              group by 1, 2`);

      await db.query("COMMIT"); // Confirma a transação

      if(result !== null){
        res.status(200).json({
          message: result.flat(7),
          pessoas: result2.rows
        });
      }else{
        await db.query("ROLLBACK"); // Desfaz a transação em caso de erro
        res.status(500).json({
          message: "Nenhum registro encontrado com estes critérios de pesquisa."
        });
      }



    }

    
  } catch (error) {
    await db.query("ROLLBACK"); // Desfaz a transação em caso de erro
    res.status(500).json({
      message: "Falha em buscar os registros" + error
    });
  }

};

exports.vendasVendedor = async (req, res) => {
  const schema = req.body.schema;
  const codEmpresa = req.body.codEmpresa;

  let currentDay = moment().format("YYYY.MM.DD");
  let back1Days = moment().subtract(1, "day").format("YYYY.MM.DD");
  let back7Days = moment().subtract(7, "day").format("YYYY.MM.DD");
  let back15Days = moment().subtract(15, "day").format("YYYY.MM.DD");
  let back30Days = moment().subtract(30, "day").format("YYYY.MM.DD");

  let vendasPorVendedorDiaAtual = [];
  let vendasPorVendedorOntem = [];
  let vendasPorVendedor7d = [];
  let vendasPorVendedor15d = [];
  let vendasPorVendedor30d = [];

    const vpvda = await db.query_bi(
      `select tvv.cod_vendedor, 
            tvv.nom_vendedor, 
            tvv.qtdcupom, 
            tvv.qtdvenda, 
            tvv.valtotal, 
            te.cod_empresa, 
            te.nom_fantasia,
            to_char(tvv.dta_venda, 'DD/MM/YYYY') as dta_venda
            from ${schema}.tab_vendas_vendedor tvv
            inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvv.cod_empresa)
            where tvv.cod_empresa = ${codEmpresa}
            and dta_venda = '${currentDay}'
            order by tvv.qtdvenda desc`
    );

    vendasPorVendedorDiaAtual.push(vpvda.rows);

    const vpv7d = await db.query_bi(
      `select tvv.cod_vendedor, 
            tvv.nom_vendedor, 
            sum(tvv.qtdcupom) as qtdcupom,
            sum(tvv.qtdvenda) as qtdvenda,
            sum(tvv.valtotal) as valtotal,
            te.cod_empresa, 
            te.nom_fantasia
            from ${schema}.tab_vendas_vendedor tvv
            inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvv.cod_empresa)
            where tvv.cod_empresa = ${codEmpresa}
            and dta_venda BETWEEN '${back7Days}' and '${currentDay}'
            group by tvv.cod_vendedor,
            tvv.nom_vendedor,
            te.cod_empresa,
            te.nom_fantasia
            order by qtdvenda desc `
    );

    vendasPorVendedor7d.push(vpv7d.rows);

    const vpvo = await db.query_bi(
      `select tvv.cod_vendedor, 
            tvv.nom_vendedor, 
            tvv.qtdcupom, 
            tvv.qtdvenda, 
            tvv.valtotal, 
            te.cod_empresa, 
            te.nom_fantasia,
            to_char(tvv.dta_venda, 'DD/MM/YYYY') as dta_venda
            from ${schema}.tab_vendas_vendedor tvv
            inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvv.cod_empresa)
            where tvv.cod_empresa = ${codEmpresa}
            and dta_venda = '${back1Days}'
            order by tvv.qtdvenda desc`
    );

    vendasPorVendedorOntem.push(vpvo.rows);

    const vpv15d = await db.query_bi(
      `select tvv.cod_vendedor, 
            tvv.nom_vendedor, 
            sum(tvv.qtdcupom) as qtdcupom,
            sum(tvv.qtdvenda) as qtdvenda,
            sum(tvv.valtotal) as valtotal,
            te.cod_empresa, 
            te.nom_fantasia
            from ${schema}.tab_vendas_vendedor tvv
                                                                        inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvv.cod_empresa)
                                                                        where tvv.cod_empresa = ${codEmpresa}
                                                                        and dta_venda BETWEEN '${back15Days}' and '${currentDay}'
                                                                        group by tvv.cod_vendedor,
                                                                        tvv.nom_vendedor,
                                                                        te.cod_empresa,
                                                                        te.nom_fantasia
                                                                        order by qtdvenda desc`
    );

    vendasPorVendedor15d.push(vpv15d.rows);

    const vpv30d = await db.query_bi(
      `select tvv.cod_vendedor, 
            tvv.nom_vendedor, 
            sum(tvv.qtdcupom) as qtdcupom,
            sum(tvv.qtdvenda) as qtdvenda,
            sum(tvv.valtotal) as valtotal,
            te.cod_empresa, 
            te.nom_fantasia
            from ${schema}.tab_vendas_vendedor tvv
                                                                        inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvv.cod_empresa)
                                                                        where tvv.cod_empresa = ${codEmpresa}
                                                                        and dta_venda BETWEEN '${back30Days}' and '${currentDay}'
                                                                        group by tvv.cod_vendedor,
                                                                        tvv.nom_vendedor,
                                                                        te.cod_empresa,
                                                                        te.nom_fantasia
                                                                        order by qtdvenda desc`
    );

    vendasPorVendedor30d.push(vpv30d.rows);

  res.status(200).send({
    data: [
      {
        vendasPorVendedorDiaAtual: vendasPorVendedorDiaAtual.flat(7),
        vendasPorVendedorOntem : vendasPorVendedorOntem.flat(7),
        vendasPorVendedor7d: vendasPorVendedor7d.flat(7),
        vendasPorVendedor15d: vendasPorVendedor15d.flat(7),
        vendasPorVendedor30d: vendasPorVendedor30d.flat(7),
      },
    ],
  });
};

exports.vendasVendedorCustom = async (req, res) =>{
  const { schema, codEmpresa, dtaInicio, dtaFim } = req.body;
  
  let vendasPorVendedorCustom = [];

  try {
    const vpvc = await db.query_bi(
      `select tvv.cod_vendedor, 
            tvv.nom_vendedor, 
            sum(tvv.qtdcupom) as qtdcupom,
            sum(tvv.qtdvenda) as qtdvenda,
            sum(tvv.valtotal) as valtotal,
            te.cod_empresa, 
            te.nom_fantasia
            from ${schema}.tab_vendas_vendedor tvv
            inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvv.cod_empresa)
            where tvv.cod_empresa = ${codEmpresa}
            and dta_venda BETWEEN '${dtaInicio}' and '${dtaFim}'
            group by tvv.cod_vendedor,
            tvv.nom_vendedor,
            te.cod_empresa,
            te.nom_fantasia
            order by qtdvenda desc `
    );
  
    vendasPorVendedorCustom.push(vpvc.rows);
  
    res.status(200).send({
      data: [
        {
          vendasPorVendedorCustom: vendasPorVendedorCustom.flat(7)
        }
      ],
    });
  } catch (error) {
    res.status(500).send({
      data: "Falha em obter vendas de vendedores"+ error
    });
  }

};

exports.estoqueTanque = async (req, res) => {
  const schema = req.body.schema;
  const codEmpresa = req.body.codEmpresa;
  let saldoTanque = [];

  try {
    const st = await db.query_bi(`select cod_empresa, 
    cod_tanque, 
    des_tanque,
    num_tanque, 
    qtd_capacidade_tanque, 
    cast(qtd_estoque as numeric (15,2)) as qtd_estoque 
    from ${schema}.tab_estoque_tanque
    where cod_empresa = ${codEmpresa}
    order by num_tanque`);

saldoTanque.push(st.rows);

res.status(200).send({
data: [
  {
    estoqueTanque: saldoTanque.flat(7),
  }
]
});
  } catch (error) {
    res.status(500).send({
      data: "Falha em obter estoque de tanques"+ error
    });
  }
};

exports.vendasFormaPagto = async (req, res) => {
  const schema = req.body.schema;
  const codEmpresa = req.body.codEmpresa;

  let currentDay = moment().format("YYYY.MM.DD");
  let back1Days = moment().subtract(1, "day").format("YYYY.MM.DD");
  let back7Days = moment().subtract(7, "day").format("YYYY.MM.DD");
  let back15Days = moment().subtract(15, "day").format("YYYY.MM.DD");
  let back30Days = moment().subtract(30, "day").format("YYYY.MM.DD");

  let vendasFormaPagtoDiaAtual = [];
  let vendasFormaPagtoOntem = [];
  let vendasFormaPagto7d = [];
  let vendasFormaPagto15d = [];
  let vendasFormaPagto30d = [];

  try {

    const vfpda = await db.query_bi(
      `select 
            te.cod_empresa,
            te.nom_fantasia,
            tvfp.valtotal,
            tvfp.nom_forma_pagto,
            to_char(tvfp.dta_venda, 'DD/MM/YYYY') as dta_venda
            from ${schema}.tab_venda_forma_pagto tvfp
            inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvfp.cod_empresa)
            where tvfp.cod_empresa = ${codEmpresa}
            and dta_venda = '${currentDay}'
            order by tvfp.valtotal desc`
    );

    vendasFormaPagtoDiaAtual.push(vfpda.rows);

    const vfpo = await db.query_bi(
      `select 
            te.cod_empresa,
            te.nom_fantasia,
            tvfp.valtotal,
            tvfp.nom_forma_pagto,
            to_char(tvfp.dta_venda, 'DD/MM/YYYY') as dta_venda
            from ${schema}.tab_venda_forma_pagto tvfp
            inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvfp.cod_empresa)
            where tvfp.cod_empresa = ${codEmpresa}
            and dta_venda = '${back1Days}'
            order by tvfp.valtotal desc`
    );

    vendasFormaPagtoOntem.push(vfpo.rows);

    const vfp7d = await db.query_bi(
      `select 
            te.cod_empresa,
            te.nom_fantasia,
            tvfp.nom_forma_pagto, 
            sum(tvfp.valtotal) as valtotal
            from ${schema}.tab_venda_forma_pagto tvfp
                                                                        inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvfp.cod_empresa)
                                                                        where tvfp.cod_empresa = ${codEmpresa}
                                                                        and dta_venda BETWEEN '${back7Days}' and '${currentDay}'
                                                                        group by tvfp.nom_forma_pagto,
                                                                        te.cod_empresa,
                                                                        te.nom_fantasia
                                                                        order by valtotal desc `
    );

    vendasFormaPagto7d.push(vfp7d.rows);

    const vfp15d = await db.query_bi(
      `select 
            te.cod_empresa,
            te.nom_fantasia,
            tvfp.nom_forma_pagto, 
            sum(tvfp.valtotal) as valtotal
            from ${schema}.tab_venda_forma_pagto tvfp
                                                                        inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvfp.cod_empresa)
                                                                        where tvfp.cod_empresa = ${codEmpresa}
                                                                        and dta_venda BETWEEN '${back15Days}' and '${currentDay}'
                                                                        group by tvfp.nom_forma_pagto,
                                                                        te.cod_empresa,
                                                                        te.nom_fantasia
                                                                        order by valtotal desc`
    );

    vendasFormaPagto15d.push(vfp15d.rows);

    const vfp30d = await db.query_bi(
      `select 
            te.cod_empresa,
            te.nom_fantasia,
            tvfp.nom_forma_pagto, 
            sum(tvfp.valtotal) as valtotal
            from ${schema}.tab_venda_forma_pagto tvfp
                                                                        inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvfp.cod_empresa)
                                                                        where tvfp.cod_empresa = ${codEmpresa}
                                                                        and dta_venda BETWEEN '${back30Days}' and '${currentDay}'
                                                                        group by tvfp.nom_forma_pagto,
                                                                        te.cod_empresa,
                                                                        te.nom_fantasia
                                                                        order by valtotal desc `
    );

    vendasFormaPagto30d.push(vfp30d.rows);
  
  res.status(200).send({
    data: [
      {
        vendasFormaPagtoDiaAtual: vendasFormaPagtoDiaAtual.flat(7),
        vendasFormaPagtoOntem: vendasFormaPagtoOntem.flat(7),
        vendasFormaPagto7d: vendasFormaPagto7d.flat(7),
        vendasFormaPagto15d: vendasFormaPagto15d.flat(7),
        vendasFormaPagto30d: vendasFormaPagto30d.flat(7),
      },
    ],
  });
    
  } catch (error) {
    res.status(500).send({
      data: "Falha em obter vendas de por forma de pagamento"+ error
    });
  }
};

exports.vendaFormaPagtoCustom = async (req, res) => {

  const { schema, codEmpresa, dtaInicio, dtaFim } = req.body;

  let vendasFormaPagtoCustom = [];

  try {
    const vfpc = await db.query_bi(
      `select 
            te.cod_empresa,
            te.nom_fantasia,
            tvfp.nom_forma_pagto, 
            sum(tvfp.valtotal) as valtotal
            from ${schema}.tab_venda_forma_pagto tvfp
                                                                        inner join ${schema}.tab_empresa_schema te on (te.cod_empresa = tvfp.cod_empresa)
                                                                        where tvfp.cod_empresa = ${codEmpresa}
                                                                        and dta_venda BETWEEN '${dtaInicio}' and '${dtaFim}'
                                                                        group by tvfp.nom_forma_pagto,
                                                                        te.cod_empresa,
                                                                        te.nom_fantasia
                                                                        order by valtotal desc `
    );

    vendasFormaPagtoCustom.push(vfpc.rows);
  
  res.status(200).send({
    data: [
      {
        vendasFormaPagtoCustom: vendasFormaPagtoCustom.flat(7)
      },
    ],
  });
    
  } catch (error) {
    res.status(500).send({
      data: "Falha em obter vendas de por forma de pagamento"+ error
    });
  }
};

exports.vendaCombustivel = async (req, res) => {
  const schema = req.body.schema;
  const codEmpresa = req.body.codEmpresa;

  moment.locale();
  let currentDay = moment().format("YYYY.MM.DD");
  let back1Days = moment().subtract(1, "day").format("YYYY.MM.DD");
  let back7Days = moment().subtract(7, "day").format("YYYY.MM.DD");
  let back15Days = moment().subtract(15, "day").format("YYYY.MM.DD");
  let back30Days = moment().subtract(30, "day").format("YYYY.MM.DD");
  let mes = moment().subtract(1, "month").format("MM");

  let meses = [];
  let itens = [];
  let vendaCombAnual = [];
  let vendaCombDiaAtual = [];
  let vendaCombOntem = [];
  let vendaComb7d = [];
  let vendaComb15d = [];
  let vendaComb30d = [];

  let descAcreAferDiaAtual = [];
  let descAcreAferOntem = [];
  let descAcreAfer7d = [];
  let descAcreAfer15d = [];
  let descAcreAfer30d = [];

  let emp = "";
  let item = "";
  let des_item = "";
  let qtd = [];

  try {

  const m = await db.query_bi(
    `select distinct cod_item, des_item from ${schema}.tab_venda_combustivel order by cod_item, des_item`
  );

  itens = m.rows;

  for (let index = 1; index < 13; index++) {
    meses.unshift({
      ind_mes: parseInt(
        moment()
          .subtract(index - 1, "month")
          .format("MM")
      ),
      mes: moment()
        .subtract(index - 1, "month")
        .format("MMMM, yyyy"),
    });
  }


    for (let indexI = 0; indexI < itens.length; indexI++) {
      item = itens[indexI].cod_item;
      des_item = itens[indexI].des_item;
      qtd = [];

      for (let indexM = 0; indexM < meses.length; indexM++) {
        const vca = await db.query_bi(`select 
                cod_empresa, 
                cod_item, 
                des_item,
                mes,
                sum(qtd_litros) as qtd_litros,
                sum(val_liquido) as val_liquido
                from ${schema}.tab_venda_combustivel
                where cod_empresa = ${codEmpresa}
                and cod_item = ${itens[indexI].cod_item}
                and mes = ${meses[indexM].ind_mes}
                group by mes, cod_empresa, cod_item, des_item
                order by mes`);

        if (vca.rowCount > 0) {
          qtd.push(vca.rows[0].qtd_litros);
        } else {
          qtd.push("NaN");
        }
      }
      vendaCombAnual.push({
        cod_empresa: codEmpresa,
        cod_item: item,
        des_item: des_item,
        qtd_litros: qtd,
      });
    }

    const vcda = await db.query_bi(
      `select 
        cod_empresa, 
        cod_item, 
        des_item,
        sum(qtd_litros) as qtd_litros,
        sum(val_liquido) as val_liquido
        from ${schema}.tab_venda_combustivel
                                        where cod_empresa = ${codEmpresa}
                                        and dta_fechamento = '${currentDay}'
                                        group by cod_empresa, cod_item, des_item
                                        order by val_liquido desc`
    );

    vendaCombDiaAtual.push(vcda.rows);

    const vco = await db.query_bi(
      `select 
        cod_empresa, 
        cod_item, 
        des_item,
        sum(qtd_litros) as qtd_litros,
        sum(val_liquido) as val_liquido
        from ${schema}.tab_venda_combustivel
                                        where cod_empresa = ${codEmpresa}
                                        and dta_fechamento = '${back1Days}'
                                        group by cod_empresa, cod_item, des_item
                                        order by val_liquido desc`
    );

    vendaCombOntem.push(vco.rows);

    const vc7d = await db.query_bi(`select 
        cod_empresa, 
        cod_item, 
        des_item,
        sum(qtd_litros) as qtd_litros,
        sum(val_liquido) as val_liquido
        from ${schema}.tab_venda_combustivel
                                        where cod_empresa = ${codEmpresa}
                                        and dta_fechamento BETWEEN '${back7Days}' and '${currentDay}'
                                        group by cod_empresa, cod_item, des_item
                                        order by val_liquido desc`);

    vendaComb7d.push(vc7d.rows);

    const vc15d = await db.query_bi(`select 
        cod_empresa, 
        cod_item, 
        des_item,
        sum(qtd_litros) as qtd_litros,
        sum(val_liquido) as val_liquido
        from ${schema}.tab_venda_combustivel
                                        where cod_empresa = ${codEmpresa}
                                        and dta_fechamento BETWEEN '${back15Days}' and '${currentDay}'
                                        group by cod_empresa, cod_item, des_item
                                        order by val_liquido desc`);

    vendaComb15d.push(vc15d.rows);

    const vc30d = await db.query_bi(`select 
        cod_empresa, 
        cod_item, 
        des_item,
        sum(qtd_litros) as qtd_litros,
        sum(val_liquido) as val_liquido
        from ${schema}.tab_venda_combustivel
                                        where cod_empresa = ${codEmpresa}
                                        and dta_fechamento BETWEEN '${back30Days}' and '${currentDay}'
                                        group by cod_empresa, cod_item, des_item
                                        order by val_liquido desc`);

    vendaComb30d.push(vc30d.rows);

    const dafda = await db.query_bi(
      `select 
        cod_empresa, 
        cod_item, 
        des_item,
        sum(qtd_afericao) as qtd_afericao,
        sum(val_desconto) as val_desconto,
        sum(val_acrescimo) as val_acrescimo
        from ${schema}.tab_afericao_desc_acre
                                        where cod_empresa = ${codEmpresa}
                                        and dta_afericao = '${currentDay}'
                                        group by cod_empresa, cod_item, des_item
                                        order by qtd_afericao desc`
    );
    descAcreAferDiaAtual.push(dafda.rows);

    const dafo = await db.query_bi(
      `select 
        cod_empresa, 
        cod_item, 
        des_item,
        sum(qtd_afericao) as qtd_afericao,
        sum(val_desconto) as val_desconto,
        sum(val_acrescimo) as val_acrescimo
        from ${schema}.tab_afericao_desc_acre
                                        where cod_empresa = ${codEmpresa}
                                        and dta_afericao = '${back1Days}'
                                        group by cod_empresa, cod_item, des_item
                                        order by qtd_afericao desc`
    );
    descAcreAferOntem.push(dafo.rows);

    const daf7d = await db.query_bi(`select 
          cod_empresa, 
          cod_item, 
          des_item,
          sum(qtd_afericao) as qtd_afericao,
          sum(val_desconto) as val_desconto,
          sum(val_acrescimo) as val_acrescimo
          from ${schema}.tab_afericao_desc_acre
                                    where cod_empresa = ${codEmpresa}
                                    and dta_afericao BETWEEN '${back7Days}' and '${currentDay}'
                                    group by cod_empresa, cod_item, des_item
                                    order by qtd_afericao desc`);
    descAcreAfer7d.push(daf7d.rows);

    const daf15d = await db.query_bi(`select 
    cod_empresa, 
    cod_item, 
    des_item,
    sum(qtd_afericao) as qtd_afericao,
    sum(val_desconto) as val_desconto,
    sum(val_acrescimo) as val_acrescimo
    from ${schema}.tab_afericao_desc_acre
                                    where cod_empresa = ${codEmpresa}
                                    and dta_afericao BETWEEN '${back15Days}' and '${currentDay}'
                                    group by cod_empresa, cod_item, des_item
                                    order by qtd_afericao desc`);

    descAcreAfer15d.push(daf15d.rows);

    const daf30d = await db.query_bi(`select 
    cod_empresa, 
    cod_item, 
    des_item,
    sum(qtd_afericao) as qtd_afericao,
    sum(val_desconto) as val_desconto,
    sum(val_acrescimo) as val_acrescimo
    from ${schema}.tab_afericao_desc_acre
                                    where cod_empresa = ${codEmpresa}
                                    and dta_afericao BETWEEN '${back30Days}' and '${currentDay}'
                                    group by cod_empresa, cod_item, des_item
                                    order by qtd_afericao desc`);

    descAcreAfer30d.push(daf30d.rows);
  

  res.status(200).send({
    data: [
      {
        meses: meses,
        vendaCombAnual: vendaCombAnual.flat(7),
        vendaCombDiaAtual: vendaCombDiaAtual.flat(7),
        vendaCombOntem: vendaCombOntem.flat(7),
        vendaComb7d: vendaComb7d.flat(7),
        vendaComb15d: vendaComb15d.flat(7),
        vendaComb30d: vendaComb30d.flat(7),
      },
    ],
    data1: [
      {
      descAcreAferDiaAtual: descAcreAferDiaAtual.flat(7),
      descAcreAferOntem: descAcreAferOntem.flat(7),
      descAcreAfer7d: descAcreAfer7d.flat(7),
      descAcreAfer15d: descAcreAfer15d.flat(7),
      descAcreAfer30d:  descAcreAfer30d.flat(7)
      }
    ]
  });
    
  } catch (error) {
    res.status(500).send({
      data: "Falha em obter vendas de combustiveis"+ error
    });
  }
};

exports.vendaCombustivelCustom = async (req, res) => {

  const { schema, codEmpresa, dtaInicio, dtaFim } = req.body;

  let vendaCombustivelCustom = [];

  try {
    const vcc = await db.query_bi(`select 
        cod_empresa, 
        cod_item, 
        des_item,
        sum(qtd_litros) as qtd_litros,
        sum(val_liquido) as val_liquido
        from ${schema}.tab_venda_combustivel
                                        where cod_empresa = ${codEmpresa}
                                        and dta_fechamento BETWEEN '${dtaInicio}' and '${dtaFim}'
                                        group by cod_empresa, cod_item, des_item
                                        order by val_liquido desc`);

    vendaCombustivelCustom.push(vcc.rows);
  
  res.status(200).send({
    data: [
      {
        vendaCombustivelCustom: vendaCombustivelCustom.flat(7)
      },
    ],
  });
    
  } catch (error) {
    res.status(500).send({
      data: "Falha em obter vendas de combustiveis"+ error
    });
  }
};

exports.acreDescAfeCustom = async (req, res) => {

  const { schema, codEmpresa, dtaInicio, dtaFim } = req.body;

  let descAcreAferCustom = [];

  try {
    const adac = await db.query_bi(`select 
    cod_empresa, 
    cod_item, 
    des_item,
    sum(qtd_afericao) as qtd_afericao,
    sum(val_desconto) as val_desconto,
    sum(val_acrescimo) as val_acrescimo
    from ${schema}.tab_afericao_desc_acre
                                    where cod_empresa = ${codEmpresa}
                                    and dta_afericao BETWEEN '${dtaInicio}' and '${dtaFim}'
                                    group by cod_empresa, cod_item, des_item
                                    order by qtd_afericao desc`);

    descAcreAferCustom.push(adac.rows);
  
  res.status(200).send({
    data: [
      {
        descAcreAferCustom: descAcreAferCustom.flat(7)
      },
    ],
  });
    
  } catch (error) {
    res.status(500).send({
      data: "Falha em obter acrescimos/aferiçoes/descontos"+ error
    });
  }
};


async function enviaEmail() {
  try {
    await db.query("select bagattoli.sp_busca_titulo_email(5,'R')");
    const notificacao1 = await db.query(`select nom_pessoa, val_original, TO_CHAR(dta_vencimento, 'dd/MM/YYYY') as dta_vencimento, des_email from bagattoli.tab_titulo_receber_email where dta_notificacao_1 = 'today'`);
    const notificacao2 = await db.query(`select nom_pessoa, val_original, TO_CHAR(dta_vencimento, 'dd/MM/YYYY') as dta_vencimento, des_email from bagattoli.tab_titulo_receber_email where dta_notificacao_2 = 'today'`);
    
    await enviarEmails(notificacao1.rows, 'Próximo ao Vencimento');
    await enviarEmails(notificacao2.rows, 'Vencendo Amanha');
    
    console.log('E-mails enviados com sucesso');
  } catch (error) {
    console.error('Erro ao enviar e-mails:', error);
  }
}

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

cron.schedule('0 10 * * *', () => {
  console.log('Executando envio de Email...');
  enviaEmail();
});

exports.verifyJWT = async (req, res, next) => {

  const token = req.headers.authorization;

  if (!token)
    return res.status(401).json({ auth: false, message: "Auth-Token inválido." });

  jwt.verify(token, process.env.SECRET, function (err, decoded) {
    if (err)
      return res
        .status(401)
        .json({ auth: false, message: "Auth-Token inválido." });

    // se tudo estiver ok, salva no request para uso posterior
    req.userId = decoded.id;
    next();
  });
};

exports.verifyTokenSim = async (req, res, next) => {
  const token = req.headers.authorization;
  const tokenValido = "655b7f8901d2F";

  if (token === tokenValido) {
    next(); // Chama o próximo middleware se o token for válido
  } else {
    return res.status(401).json({ auth: false, message: "Auth-Token inválidoo." });
  }
};





