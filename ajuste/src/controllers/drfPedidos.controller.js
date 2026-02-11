const db = require("../config/database");
require("dotenv-safe").config();
const moment = require("moment");
const jwt = require("jsonwebtoken");

exports.usuarios = async (req, res) => {
  
   const { schema } = req.body;
  
    const result = await db.queryPedido(`select 
                                            cod_pessoa as cod_vendedor,
                                            nom_pessoa as des_vendedor,
                                            des_senha,
                                            '${schema}' as schema
                                        from ${schema}.tab_pessoa
                                        where ind_vendedor = 'S'
                                        `);
  
    if (result.rowCount > 0) {
  
      const token = jwt.sign({ id: 12345 }, process.env.SECRET, {
        expiresIn: 6000, // 1h de prazo para expirar a sessao.
      });
      res.status(200).json({ token: token, user: result.rows });
      
      //Se existir usuario e senha, abre a sessão com um token.
    } else {
      res.status(500).json({
        message: "Usuário e Senha inválidos ou não existentes.",
      });
    }
};


exports.userLogin = async (req, res) => {
  
  const { schema, cnpj, senha } = req.body;

  try {

       const result = await db.queryPedido(`select 
                                           cod_pessoa,
                                           num_cnpj_cpf,
                                           nom_pessoa
                                       from ${schema}.tab_pessoa
                                       where ind_vendedor = 'N'
                                       and num_cnpj_cpf = $1
                                       and num_cnpj_cpf = $2
                                       `,[cnpj, senha]);
 
   if (result.rowCount > 0) { // se sim, ele é um cliente

    const id = (result.rows[0].num_cnpj_cpf)
 
    const token = jwt.sign({ id }, process.env.SECRET, {
      expiresIn: 6000, // 1h de prazo para expirar a sessao.
    });
     res.status(200).json({ token: token, user: result.rows, func: false });
     
     //Se existir usuario e senha, abre a sessão com um token.
   } else {


      const result = await db.queryPedido(`select 
                                           seq_usuario as cod_pessoa,
                                           seq_usuario as num_cnpj_cpf,
                                           des_usuario as nom_pessoa,
                                           ind_edita_pedido,
                                           ind_ativo
                                       from ${schema}.tab_usuario
                                       where des_usuario = $1
                                       and des_senha = $2
                                       `,[cnpj, senha]);
 
   if (result.rowCount > 0) { // se sim, ele é um funcionario

    const id = (result.rows[0].num_cnpj_cpf)
 
    const token = jwt.sign({ id }, process.env.SECRET, {
      expiresIn: 6000, // 1h de prazo para expirar a sessao.
    });
     res.status(200).json({ token: token, user: result.rows, func: true });
     
   }
  } 
  } catch (error) {
    res.status(500).json({
      message: "Erro em realizar login: " + error,
    });
  }

};

exports.userRegister = async (req, res) => {
  
  const { schema, des_usuario, des_senha, ind_edita_pedido } = req.body;
  
  try {
    await db.queryPedido("BEGIN");

    const result = await db.queryPedido(
      `SELECT * FROM ${schema}.tab_usuario WHERE des_usuario LIKE $1`,
      [`%${des_usuario}%`]
    );

    if(result.rowCount > 0){
      res.status(200).json({
        message: 'Usuário com mesmo nome ja criado'
      });
    }else{
      await db.queryPedido(`INSERT INTO ${schema}.tab_usuario 
                              (des_usuario, des_senha, ind_edita_pedido, ind_ativo)
                            VALUES
                            ($1, $2, $3, $4)`,[des_usuario, des_senha, ind_edita_pedido, true]);

      
      res.status(200).json({
        message: 'Usuário criado com sucesso'
      });
    }

    await db.queryPedido("COMMIT");
     
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha em incluir usuario, tente novamente. " + error
    });
  }
};

exports.buscaUsuarios = async (req, res) => {
  
  const { schema } = req.body;
  
  try {
    await db.queryPedido("BEGIN");
     
    const result = await db.queryPedido(`select * from ${schema}.tab_usuario`);

    await db.queryPedido("COMMIT");

    res.status(200).json({
      message: result.rows
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha eao buscar usuarios, tente novamente. " + error
    });
  }
};

exports.alteraUsuario = async (req, res) => {
  
  const { schema, seq_usuario, des_usuario, des_senha, ind_edita_pedido } = req.body;
  
  try {
    await db.queryPedido("BEGIN");
     
    const result = await db.queryPedido(`update ${schema}.tab_usuario 
                                          set des_usuario = $1,
                                              des_senha = $2,
                                              ind_edita_pedido = $3
                                          where seq_usuario = $4
                                        `,[des_usuario, des_senha, ind_edita_pedido, seq_usuario]);

    await db.queryPedido("COMMIT");

    res.status(200).json({
      message: 'Usuario Alterado com Sucesso'
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha eao buscar usuarios, tente novamente. " + error
    });
  }
};

exports.removeUsuario = async (req, res) => {
  
  const { schema, seq_usuario } = req.body;
  
  try {
    await db.queryPedido("BEGIN");
     
    const result = await db.queryPedido(`delete from ${schema}.tab_usuario where seq_usuario = $1`,[seq_usuario]);

    await db.queryPedido("COMMIT");

    res.status(200).json({
      message: 'Usuario Removido com Sucesso'
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha em remover usuario, tente novamente. " + error
    });
  }
};

exports.atualizaSchema = async (req, res) => {
  
  const { schema } = req.body;
  
  try {
    await db.queryPedido("BEGIN");
     
    const result = await db.queryPedido(`select ${schema}.sp_cadastro_app($1)`,[schema]);

    await db.queryPedido("COMMIT");

    console.log(result.rows)

    res.status(200).json({
      message: result.rows
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha eao buscar usuarios, tente novamente. " + error
    });
  }
};

exports.buscaEmpresaSchema = async (req, res) => {

  const { schema } = req.body;

  try {

    const result =  await db.queryPedido(`select cod_empresa, nom_fantasia, num_cnpj_cpf, '${schema}' as schema from ${schema}.tab_empresa_schema`)

    res.status(200).json({
      message: result.rows
    });
    
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }

    // Enviar a resposta com status 500 e a mensagem de erro
    res.status(500).json({
      message: "Falha buscar empresas, tente novamente. " + error
    });
  }

}


exports.buscaItens = async (req, res) => {
  
  const { schema } = req.body;

  try {

  await db.queryPedido("BEGIN");
     
   const result = await db.queryPedido(`select 
                                          a.cod_barra, 
                                          a.cod_item, 
                                          a.des_item, 
                                          a.des_unidade,
                                          b.val_preco_venda, 
                                          b.val_custo_medio,
                                          '${schema}' as schema,
                                          b.cod_empresa,
                                          0 as qtd,
                                          num_fator_conversao
                                        from ${schema}.tab_item a
                                        inner join ${schema}.tab_custo_preco b on (a.cod_item = b.cod_item)`);

   await db.queryPedido("COMMIT");

    res.status(200).json({
      message: result.rows
    });
    
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }

    // Enviar a resposta com status 500 e a mensagem de erro
    res.status(500).json({
      message: "Falha buscar itens, tente novamente. " + error
    });
  }
};

exports.buscaCliente = async (req, res) =>{

  const { schema } = req.body;

  try {
    await db.queryPedido("BEGIN");

    const result = await db.queryPedido(`select 
                                          cod_pessoa, 
                                          nom_pessoa, 
                                          num_cnpj_cpf, '${schema}' as schema, 
                                          qtd_km_entrega as km,
                                          ie_rg,
                                          logradouro,
                                          cidade
                                        from ${schema}.tab_pessoa where ind_cliente = 'S'`)

    await db.queryPedido("COMMIT");

    res.status(200).json({
      message: result.rows
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha buscar clientes, tente novamente. " + error
    });
  }
}

exports.buscaCondicaoPagamento = async (req, res) =>{

  const { schema } = req.body;

  try {
    await db.queryPedido("BEGIN");

    const result = await db.queryPedido(`select cod_condicao_pagamento, des_condicao_pagamento, '${schema}' as schema from ${schema}.tab_condicao_pagamento`)

    await db.queryPedido("COMMIT");
    
    res.status(200).json({
      message: result.rows
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha buscar clientes, tente novamente. " + error
    });
  }
}

exports.propriedadeRural = async (req, res) => {
  
  const { schema } = req.body;

  try {

  await db.queryPedido("BEGIN");
     
   const result = await db.queryPedido(`select 
                                          a.seq_propriedade, 
                                          a.cod_pessoa, 
                                          a.endereco, 
                                          a.nom_propriedade,
                                          a.nom_cidade, 
                                          a.num_inscricao_pr,
                                          '${schema}' as schema,
                                          a.distancia_sede as km
                                        from ${schema}.tab_produtor_rural a`);

   await db.queryPedido("COMMIT");

    res.status(200).json({
      message: result.rows
    });
    
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }

    // Enviar a resposta com status 500 e a mensagem de erro
    res.status(500).json({
      message: "Falha buscar propriedades rurais, tente novamente. " + error
    });
  }
};


exports.salvaCondicaoFrete = async (req, res) => {
  const { schema, condicao, tipoFrete } = req.body;

  // Validação básica dos parâmetros
  if (!schema || !condicao || !Array.isArray(condicao)) {
    return res.status(400).json({
      message: "Dados inválidos. Certifique-se de que o schema e condicao estão corretos."
    });
  }

  try {
    await db.queryPedido("BEGIN");
    await db.queryPedido(`delete from ${schema}.tab_condicao_frete where condicao = $1`,[tipoFrete]);

    for (const i of condicao) {
      await db.queryPedido(
        `INSERT INTO ${schema}.tab_condicao_frete (condicao, id, km, valor)
         VALUES ($1, $2, $3, $4)`,
        [tipoFrete, i.id, i.km, i.valor]
      );
    }

    await db.queryPedido("COMMIT");

    res.status(200).json({
      message: 'Registros salvos com sucesso'
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }

    res.status(500).json({
      message: "Falha ao salvar os registros. Tente novamente mais tarde.",
      error: error.message // Opção para fornecer mais detalhes do erro
    });
  }
};

exports.buscaCondicaoFrete = async (req, res) =>{

  const { schema } = req.body;

  try {
    await db.queryPedido("BEGIN");

    const result = await db.queryPedido(`select seq_registro, condicao, id, km, valor, '${schema}' as schema from ${schema}.tab_condicao_frete`)

    await db.queryPedido("COMMIT");
    
    res.status(200).json({
      message: result.rows
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha buscar condicoes de frente, tente novamente. " + error
    });
  }
}

exports.buscaTaxaJuros = async (req, res) =>{

  const { schema } = req.body;

  try {
    await db.queryPedido("BEGIN");

    const result = await db.queryPedido(`select seq_registro, val_juros, '${schema}' as schema from ${schema}.tab_taxa_juros`)

    await db.queryPedido("COMMIT");
    
    res.status(200).json({
      message: result.rows
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha buscar taxa de juros, tente novamente. " + error
    });
  }
}

exports.salvaTaxaJuros = async (req, res) =>{

  const { schema, seq_registro, juros } = req.body;

  try {
    await db.queryPedido("BEGIN");

    await db.queryPedido(`update ${schema}.tab_taxa_juros set val_juros = $1 where seq_registro = $2`,[juros, seq_registro])

    await db.queryPedido("COMMIT");
    
    res.status(200).json({
      message: 'Taxa de Juros Atualizada'
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha em atualizar taxa de juros, tente novamente. " + error
    });
  }
}


// exports.enviaPedido = async (req, res) =>{

//   const { schema, pedidoRealizado, itensPedido, pagamentoPedido } = req.body;

//   let pedidos = pedidoRealizado.map(row => row.seq_pedido)

//   try {
//     await db.queryPedido("BEGIN");

//     for (const i of pedidoRealizado) {
//       await db.queryPedido(`INSERT INTO ${schema}.tab_pedido_app (
//         seq_pedido,
//         cod_empresa,
//         cod_vendedor,
//         cod_cliente,
//         des_cliente,
//         cpfcnpj,
//         schema,
//         dta_emissao,
//         cod_condicao_pagamento,
//         val_desconto,
//         totalCarga,
//         totalProduto,
//         totalFrete,
//         totalFreteCompartilhado,
//         totalPedido,
//         totalPedidoOriginal,
//         totalProdutoOriginal,
//         tipoFrete,
//         valTabelaFrete,
//         val_total_juros,
//         distancia,
//         percentual_desconto,
//         juros_embutidos,
//         assinatura,
//         ind_sincronizado,
//         latitude,
//         longitude,
//         hora,
//         seq_propriedade,
//         ind_status,
//         solicitante,
//         distancia_gps,
//         end_origem_pedido
//       ) VALUES (
//         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
//       )`, [
//         i.seq_pedido,
//         i.cod_empresa,
//         i.cod_vendedor,
//         i.cod_cliente,
//         i.des_cliente,
//         i.cpfcnpj,
//         i.schema,
//         i.dta_emissao,
//         i.cod_condicao_pagamento,
//         i.val_desconto,
//         i.totalCarga,
//         i.totalProduto,
//         i.totalFrete,
//         i.totalFreteCompartilhado,
//         i.totalPedido,
//         i.totalPedidoOriginal,
//         i.totalProdutoOriginal,
//         i.tipoFrete,
//         i.valTabelaFrete,
//         i.val_total_juros,
//         i.distancia,
//         i.percentual_desconto,
//         i.juros_embutidos,
//         i.assinatura,
//         i.ind_sincronizado,
//         i.latitude,
//         i.longitude,
//         i.hora,
//         i.seq_propriedade,
//         i.ind_status,
//         i.solicitante,
//         i.distanciaGPS,
//         i.endOrigenPedido
//       ]);
//     }

//     for (const i of itensPedido) {
//       await db.queryPedido(
//         `INSERT INTO ${schema}.TAB_ITEM_PEDIDO_APP (
//           seq_pedido,
//           cod_item,
//           des_item,
//           val_preco_venda,
//           val_custo_medio,
//           cod_empresa,
//           schema,
//           qtd_pedido,
//           val_total,
//           cod_almoxarifado,
//           peso_item,
//           custo_frete_item,
//           val_desconto_rateado,
//           val_juros_embutido,
//           ind_frete_aplicado
//         ) VALUES (
//           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
//         )`, [
//           i.seq_pedido,
//           i.cod_item,
//           i.des_item,
//           i.val_preco_venda,
//           i.val_custo_medio,
//           i.cod_empresa,
//           i.schema,
//           i.qtd_pedido,
//           i.val_total,
//           i.cod_almoxarifado,
//           i.peso_item,
//           i.custo_frete_item,
//           i.val_desconto_rateado,
//           i.val_juros_embutido,
//           i.ind_frete_aplicado
//         ]
//       );
//     }
//     if(pagamentoPedido !== 0){
//       for (const i of pagamentoPedido) {
//         await db.queryPedido(
//           `INSERT INTO ${schema}.TAB_PAGAMENTO_PEDIDO_APP (
//             seq_pedido,
//             num_parcela,
//             val_parcela,
//             dta_parcela,
//             val_juros,
//             val_total_parcela,
//             cod_condicao_pagamento,
//             schema
//           ) VALUES (
//             $1, $2, $3, $4, $5, $6, $7, $8
//           )`, [
//             i.seq_pedido,
//             i.num_parcela,
//             i.val_parcela,
//             i.dta_parcela,
//             i.val_juros,
//             i.val_total_parcela,
//             i.cod_condicao_pagamento,
//             i.schema
//           ]
//         );
//       }
//     }

//     await db.queryPedido("COMMIT");

//     await Promise.all(
//       await db.queryPedido("BEGIN"),
//       pedidos.map(row => 
//         db.queryPedido(`UPDATE ${schema}.tab_pedido_app SET ind_sincronizado = 'S' WHERE seq_pedido = $1`, [row])
//       ),
//       await db.queryPedido("COMMIT"),
//     );
    
    
//     res.status(200).json({
//       message: 'Pedido Enviado com Sucesso.',
//       status: 200,
//       pedidosEnviados: pedidos
//     });
//   } catch (error) {
//     try {
//       await db.queryPedido("ROLLBACK");
//     } catch (rollbackError) {
//       console.error("Erro ao fazer o rollback: ", rollbackError);
//     }
//     res.status(500).json({
//       message: "Falha ao tentar incluir pedido, tente novamente. " + error
//     });
//   }
// }

async function veiricaPedido(schema, seq_pedido){

  await db.queryPedido("BEGIN");
  await db.queryPedido(`delete from ${schema}.tab_pedido_app where seq_pedido = $1`,[seq_pedido])
  await db.queryPedido(`delete from ${schema}.tab_item_pedido_app where seq_pedido = $1`,[seq_pedido])
  await db.queryPedido(`delete from ${schema}.tab_pagamento_pedido_app where seq_pedido = $1`,[seq_pedido])
  await db.queryPedido(`delete from ${schema}.tab_pre_venda where des_observacao4 in ('${seq_pedido}')`)
  await db.queryPedido(`delete from ${schema}.tab_item_pre_venda where seq_item_wms = $1`,[seq_pedido])
  await db.queryPedido(`delete from ${schema}.tab_parcela_pre_venda where seq_pedido = $1`,[seq_pedido])
  await db.queryPedido("COMMIT");

}

exports.enviaPedido = async (req, res) => {
  const { schema, pedidoRealizado, itensPedido, pagamentoPedido } = req.body;

  let pedidos = pedidoRealizado.map(row => row.seq_pedido);

  try {
    // ✅ INICIA A TRANSAÇÃO PARA OS INSERTS
    await db.queryPedido("BEGIN");

    for (const pedido of pedidoRealizado) {
      await veiricaPedido(schema, pedido.seq_pedido)
    }


    //  INSERE PEDIDOS
    for (const i of pedidoRealizado) {
      await db.queryPedido(
        `INSERT INTO ${schema}.tab_pedido_app (
          seq_pedido, cod_empresa, cod_vendedor, cod_cliente, des_cliente, cpfcnpj, schema, dta_emissao,
          cod_condicao_pagamento, val_desconto, totalCarga, totalProduto, totalFrete, totalFreteCompartilhado, 
          totalPedido, totalPedidoOriginal, totalProdutoOriginal, tipoFrete, valTabelaFrete, val_total_juros, 
          distancia, percentual_desconto, juros_embutidos, assinatura, ind_sincronizado, latitude, longitude, 
          hora, seq_propriedade, ind_status, solicitante, distancia_gps, end_origem_pedido
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
        )`, 
        [
          i.seq_pedido, i.cod_empresa, i.cod_vendedor, i.cod_cliente, i.des_cliente, i.cpfcnpj, i.schema, 
          i.dta_emissao, i.cod_condicao_pagamento, i.val_desconto, i.totalCarga, i.totalProduto, i.totalFrete, 
          i.totalFreteCompartilhado, i.totalPedido, i.totalPedidoOriginal, i.totalProdutoOriginal, i.tipoFrete, 
          i.valTabelaFrete, i.val_total_juros, i.distancia, i.percentual_desconto, i.juros_embutidos, 
          i.assinatura, 'N', i.latitude, i.longitude, i.hora, i.seq_propriedade, 'N', 
          i.solicitante, i.distanciaGPS, i.endOrigenPedido
        ]
      );
    }

    //  INSERE ITENS DO PEDIDO
    for (const i of itensPedido) {
      await db.queryPedido(
        `INSERT INTO ${schema}.TAB_ITEM_PEDIDO_APP (
          seq_pedido, cod_item, des_item, val_preco_venda, val_custo_medio, cod_empresa, schema, qtd_pedido, 
          val_total, cod_almoxarifado, peso_item, custo_frete_item, val_desconto_rateado, val_juros_embutido, 
          ind_frete_aplicado
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )`, 
        [
          i.seq_pedido, i.cod_item, i.des_item, i.val_preco_venda, i.val_custo_medio, i.cod_empresa, 
          i.schema, i.qtd_pedido, i.val_total, i.cod_almoxarifado, i.peso_item, i.custo_frete_item, 
          i.val_desconto_rateado, i.val_juros_embutido, i.ind_frete_aplicado
        ]
      );
    }

    //  INSERE PAGAMENTOS (SE EXISTIREM)
    if (pagamentoPedido && pagamentoPedido.length > 0) {
      for (const i of pagamentoPedido) {
        await db.queryPedido(
          `INSERT INTO ${schema}.TAB_PAGAMENTO_PEDIDO_APP (
            seq_pedido, num_parcela, val_parcela, dta_parcela, val_juros, val_total_parcela, 
            cod_condicao_pagamento, schema
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          )`, 
          [
            i.seq_pedido, i.num_parcela, i.val_parcela, i.dta_parcela, i.val_juros, i.val_total_parcela, 
            i.cod_condicao_pagamento, i.schema
          ]
        );
      }
    }

    await db.queryPedido("COMMIT"); // encerra os inserts e comitta

    await db.queryPedido("BEGIN");
    for (const seq_pedido of pedidos) {
      await db.queryPedido(
        `UPDATE ${schema}.tab_pedido_app SET ind_sincronizado = 'S' WHERE seq_pedido = $1 and ind_status = 'N'`, 
        [seq_pedido]
      );
    }

    //  COMMIT o UPDATE
    await db.queryPedido("COMMIT");

    res.status(200).json({
      message: 'Pedido Enviado com Sucesso.',
      status: 200,
      pedidosEnviados: pedidos
    });

  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }

    res.status(500).json({
      message: "Falha ao tentar incluir pedido, tente novamente. " + error
    });
  }
};


exports.buscaPedido = async (req, res) =>{

  const { schema, cnpj } = req.body;

  try {
    await db.queryPedido("BEGIN");

    if(cnpj === 'todos'){
      const pedido =  await db.queryPedido(`select * from ${schema}.tab_pedido_app`)
      res.status(200).json({
        message: pedido.rows
      });

    }else{

      const pedido =  await db.queryPedido(`select * from ${schema}.tab_pedido_app where cpfcnpj = $1`,[cnpj])
      res.status(200).json({
        message: pedido.rows
      });
      
    }

    await db.queryPedido("COMMIT");
    
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha em buscar Pedidos, tente novamente. " + error
    });
  }
}

exports.buscaDetalhesPedido = async (req, res) =>{

  const { schema, seq_pedido } = req.body;

  try {
    await db.queryPedido("BEGIN");

    const pedido =  await db.queryPedido(`select * from ${schema}.tab_item_pedido_app where seq_pedido = $1`,[seq_pedido])
    const logs =  await db.queryPedido(`select * from ${schema}.tab_log where seq_pedido = $1`,[seq_pedido])

    await db.queryPedido("COMMIT");
    
    res.status(200).json({
      message: pedido.rows,
      logs: logs.rows
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha em buscar detalhes do Pedidos, tente novamente. " + error
    });
  }
}



exports.salvaQtdItemPedido = async (req, res) =>{

  const { schema, seq_pedido, itens, log } = req.body;

  try {
    await db.queryPedido("BEGIN");

    for (const row of log) {
      await db.queryPedido(`insert into ${schema}.tab_log 
                              (des_log, cod_usuario, des_usuario, seq_pedido, des_item, cod_item) 
                              values
                              ($1, $2, $3, $4, $5, $6)
                              `,[row.des_log, row.cod_usuario, row.des_usuario, seq_pedido, row.des_item, row.cod_item])
    }

    for (const i of itens) {

      await db.queryPedido(`update ${schema}.tab_item_pedido_app 
        set qtd_pedido = $2 
        where seq_pedido = $1
        and cod_item = $3`
      ,[seq_pedido, i.qtd_pedido, i.cod_item])

    }

    await db.queryPedido("COMMIT");
    
    res.status(200).json({
      message: 'Pedido Atualizado'
    });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback: ", rollbackError);
    }
    res.status(500).json({
      message: "Falha em Atualizar pedido, tente novamente. " + error
    });
  }
}

exports.salvaPedido = async (req, res) => {
  const { schema, pedido } = req.body;

  if (!schema || !pedido || !Array.isArray(pedido)) {
    return res.status(400).json({ message: "Dados inválidos fornecidos." });
  }

  try {
    // Validação do schema para evitar SQL Injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
      throw new Error("Schema inválido.");
    }

    await db.queryPedido("BEGIN");

    for (const item of pedido) {
      if (!item.cod_empresa || !item.seq_pedido || !item.ind_status) {
        throw new Error("Dados do pedido incompletos.");
      }

      const query = `
        UPDATE ${schema}.tab_pedido_app
        SET 
          ind_status = $1,
          ${item.ind_status === 'R' ? "motivo_rejeicao = $2," : ""}
          ind_sincronizado = 'S',
          cod_empresa = $${item.ind_status === 'R' ? 3 : 2}
        WHERE seq_pedido = $${item.ind_status === 'R' ? 4 : 3}
      `;

      const params = item.ind_status === 'R'
        ? [item.ind_status, item.motivo_rejeicao, item.cod_empresa, item.seq_pedido]
        : [item.ind_status, item.cod_empresa, item.seq_pedido];

      await db.queryPedido(query, params);
    }

    // Atualização em tab_item_pedido_app
    await db.queryPedido(
      `UPDATE ${schema}.tab_item_pedido_app SET cod_empresa = $1 WHERE seq_pedido IN (${pedido.map(p => p.seq_pedido).join(',')})`,
      [pedido[0].cod_empresa] // Considerando que todos os pedidos têm o mesmo cod_empresa
    );

    await db.queryPedido("COMMIT");

    res.status(200).json({ message: "Pedido atualizado com sucesso!" });
  } catch (error) {
    try {
      await db.queryPedido("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erro ao fazer o rollback:", rollbackError);
    }

    console.error("Erro ao atualizar pedido:", error);
    res.status(500).json({
      message: "Falha ao atualizar o pedido. Por favor, tente novamente.",
      error: error.message,
    });
  }
};


