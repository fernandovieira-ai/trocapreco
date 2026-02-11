const db = require("../config/database");
require("dotenv-safe").config();
const jwt = require("jsonwebtoken");
const moment = require("moment");
const crypto = require('crypto');
const database = require("../config/database");


exports.criaCadastroEmpresa = async (req, res) => {
  
    const { schema, num_cnpj, razao_social, nom_fantasia, ie, cep, endereco, complemento, bairro, municipio, uf, email, telefone } = req.body;

    try {
   
    const result = await db.queryConstrutora(`select ind_ativo
                                               from ${schema}.tab_cadastro_empresa_cliente
                                               where num_cnpj = $1
                                           `,[num_cnpj]);
  
    if (result.rowCount > 0) {

       res.status(200).json({
          message: result.rows 
       });

    } else {

        await db.queryConstrutora(`insert into ${schema}.tab_cadastro_empresa_cliente (num_cnpj, razao_social, nom_fantasia, ie, cep, endereco, complemento, bairro, municipio, uf, email, telefone, ind_ativo)
                                    values
                                  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'P')`,
                                  [num_cnpj, razao_social, nom_fantasia, ie, cep, endereco, complemento, bairro, municipio, uf, email, telefone])

      res.status(200).json({
        message: "Cadastro enviado com sucesso, aguarde aprovação..",
      });
    }
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao realizar o cadastro, tente novamente. " + error
        });
    };
}

exports.criaCadastroEmpresaInterna = async (req, res) => {
  
    const { schema, num_cnpj, razao_social, nom_fantasia, ie, cep, endereco, complemento, bairro, municipio, uf, email, telefone } = req.body;

    try {
   
    const result = await db.queryConstrutora(`select *
                                               from ${schema}.tab_cadastro_empresa_interna
                                               where num_cnpj = $1
                                           `,[num_cnpj]);
  
    if (result.rowCount > 0) {

       res.status(200).json({
          message: "Cadastro já existente!"
       });

    } else {

        await db.queryConstrutora(`insert into ${schema}.tab_cadastro_empresa_interna (num_cnpj, razao_social, nom_fantasia, ie, cep, endereco, complemento, bairro, municipio, uf, email, telefone, ind_ativo)
                                    values
                                  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'S')`,
                                  [num_cnpj, razao_social, nom_fantasia, ie, cep, endereco, complemento, bairro, municipio, uf, email, telefone])

      res.status(200).json({
        message: "Cadastro realizado com sucesso",
      });
    }
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao realizar o cadastro, tente novamente. " + error
        });
    };
}

exports.buscaCadastroEmpresa = async (req, res) => {
  
    const { schema } = req.body;

    try {
   
    const result = await db.queryConstrutora(`select a.*, b.nom_pessoa, b.num_cpf, b.email as email_func, b.cargo
                                               from ${schema}.tab_cadastro_empresa_cliente a
                                               left join ${schema}.tab_funcionario_empresa b on (a.seq_func_representante = b.seq_registro)
                                           `);

       res.status(200).json({
          message: result.rows 
       });
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao realizar busca de cadastros, tente novamente. " + error
        });
    };
}

exports.buscaCadastroEmpresaInterna = async (req, res) => {
  
    const { schema } = req.body;

    try {
   
    const empresas = await db.queryConstrutora(`select a.*
                                               from ${schema}.tab_cadastro_empresa_interna a
                                               `);

    const funcionarios = await db.queryConstrutora(`select *
                                            from ${schema}.tab_funcionario_empresa
                                            where ind_tipo = 'I'
                                            `);

       res.status(200).json({
          message1: empresas.rows,
          message2: funcionarios.rows
       });
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao realizar busca de cadastros, tente novamente. " + error
        });
    };
}

exports.statusCadastroEmpresa = async (req, res) => {
  
    const { schema, seq_registro, status } = req.body;

    try {
   
    await db.queryConstrutora(`update ${schema}.tab_cadastro_empresa_cliente
                                               set ind_ativo = $1,
                                                   des_senha = num_cnpj
                                               where seq_registro = $2
                                           `,[status, seq_registro]);

    res.status(200).json({
       message: 'Registro Atualizado com Sucesso'
    });
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao atualizar registro, tente novamente. " + error
        });
    };
}

exports.login = async (req, res) => {
  
    const { schema, username, password } = req.body;

    try {

    await db.queryConstrutora("BEGIN");
   
    const resultEmpresa = await db.queryConstrutora(`select * from ${schema}.tab_cadastro_empresa_cliente
                                               where ind_ativo = 'A'
                                               and num_cnpj = $1
                                               and des_senha = $2
                                           `,[username, password]);

    const resultUsuario = await db.queryConstrutora(`SELECT a.*, b.razao_social, b.num_cnpj from ${schema}.tab_funcionario_empresa a
                                                        inner join ${schema}.tab_cadastro_empresa_cliente b on (a.cod_empresa = b.seq_registro)
                                                        where a.num_cpf = $1 and a.des_senha = $2
                                                    `,[username, password]);

    if(resultEmpresa.rowCount > 0){
        res.status(200).json({
            message: resultEmpresa.rows,
            status: true,
            perfil: 'cliente-adm',
            router: '/home-cliente'
         });
    }else if(resultUsuario.rowCount > 0){
        res.status(200).json({
            message: resultUsuario.rows,
            status: true,
            perfil: 'usuario',
            router: '/home-usuario'
         });
    }else{
        res.status(500).json({
            message: "Erro ao buscar dados de login, tente novamente. "
        });
    }

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao buscar dados de login, tente novamente. " + error
        });
    };
}

exports.criaCadastroUsuario = async (req, res) => {
  
    const { schema, nom_pessoa , num_cpf, matricula, email, telefone, cod_empresa, ind_tipo } = req.body;

    try {

    await db.queryConstrutora("BEGIN");
   
    await db.queryConstrutora(`INSERT INTO ${schema}.tab_funcionario_empresa
                                               (nom_pessoa, num_cpf, matricula, email, telefone, ind_ativo, cod_empresa, des_senha, ind_tipo)
                                               values
                                               ($1, $2, $3, $4, $5, $6, $7, $8)
                                           `,[nom_pessoa, num_cpf, matricula, email, telefone, 'S', cod_empresa, num_cpf, ind_tipo]);

        res.status(200).json({
            message: 'Cadastro Realizado com Sucesso'
         });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao realizar o cadastro, tente novamente. " + error
        });
    };
}

exports.vinculaRepresEmp = async (req, res) => {
  
    const { schema, cod_empresa, nom_pessoa, num_cpf, cargo, email } = req.body;


    try {

    await db.queryConstrutora("BEGIN");
   
    const result = await db.queryConstrutora(
        `INSERT INTO ${schema}.tab_funcionario_empresa
          (nom_pessoa, num_cpf, email, ind_ativo, cod_empresa, des_senha, cargo)
         VALUES
          ($1, $2, $3, $4, $5, $6, $7)
         RETURNING seq_registro`, // Corrigido aqui
        [nom_pessoa, num_cpf, email, 'S', cod_empresa, num_cpf, cargo]
      );

    const seqRegistro = result.rows[0]?.seq_registro;

    await db.queryConstrutora(`UPDATE ${schema}.tab_cadastro_empresa_cliente set seq_func_representante = $1`,[seqRegistro])

    res.status(200).json({
        message: 'Vinculo Realizado com Sucesso'
    });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao realizar o vinculo, tente novamente. " + error
        });
    };
}

exports.cadastroRepresentante = async (req, res) => {
  
    const { schema, cod_empresa, nom_pessoa, num_cpf, cargo, email, ind_tipo } = req.body;

    console.log(req.body)

    try {

    await db.queryConstrutora("BEGIN");

    const result = await db.queryConstrutora(`select * from ${schema}.tab_funcionario_empresa where num_cpf = $1`,[num_cpf])

    if(result.rowCount> 0){

        res.status(200).json({
            message: 'Cadastro com este CPF já existente'
        });

    }else{

        await db.queryConstrutora(
            `INSERT INTO ${schema}.tab_funcionario_empresa
              (nom_pessoa, num_cpf, email, ind_ativo, cod_empresa, des_senha, cargo, ind_tipo)
             VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [nom_pessoa, num_cpf, email, 'S', cod_empresa, num_cpf, cargo, ind_tipo]
        );

        res.status(200).json({
            message: 'Cadastro Realizado com Sucesso'
        });
    }

    await db.queryConstrutora("COMMIT");


        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao realizar o cadastro, tente novamente. " + error
        });
    };
}

exports.buscaCadastroUsuario = async (req, res) => {
  
    const { schema, cod_empresa } = req.body;

    try {

    await db.queryConstrutora("BEGIN");
   
    const result = await db.queryConstrutora(`SELECT a.*, b.razao_social, b.num_cnpj from ${schema}.tab_funcionario_empresa a
                                                inner join ${schema}.tab_cadastro_empresa_cliente b on (a.cod_empresa = b.seq_registro)
                                                where a.cod_empresa = $1
                                           `,[cod_empresa]);

        res.status(200).json({
            message: result.rows
         });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao buscar o cadastro, tente novamente. " + error
        });
    };
}

function gerarCodigoUltimoRegistro(ultimoCodigo) {
    // Obtém a data atual no formato YYYYMMDD
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0'); // Adiciona zero à esquerda
    const dia = String(dataAtual.getDate()).padStart(2, '0');
  
    const dataFormatada = `${ano}${mes}${dia}`;
  
    let novoSequencial
  
    if (ultimoCodigo) {
      // Pega a parte numérica do último código gerado
      const partes = ultimoCodigo.split('-');
      const ultimoSequencial = parseInt(partes[1], 10);
      
      // Incrementa o número sequencial
      novoSequencial = ultimoSequencial + 1;
    } else {
      // Se não houver último código, começa com 1
      novoSequencial = 1;
    }
  
    // Formata o sequencial para 8 dígitos com zeros à esquerda
    const sequencialFormatado = String(novoSequencial).padStart(8, '0');
  
    // Retorna o novo código gerado
    return `${dataFormatada}-${sequencialFormatado}`;
  }
 
exports.cadastroRequisicaoDemanda = async (req, res) => {
  
    const { schema, solicitante, requisicao, listaServicos} = req.body;

    try {

    await db.queryConstrutora("BEGIN");

    const ultimoRegistro = await db.queryConstrutora(`select max(num_rd) FROM ${schema}.tab_requisicao where cod_empresa = $1`,[solicitante.cod_empresa])

    let codigo = gerarCodigoUltimoRegistro(ultimoRegistro.rows[0].max)
   
    await db.queryConstrutora(`INSERT INTO ${schema}.tab_requisicao
                                               (num_rd, num_contrato, num_processo, dta_emissao, bdi_ref, val_desconto, des_solicitante, num_matricula, des_email, num_telefone, cod_empresa,
                                                nom_empresa, num_cnpj, des_servico_programado, des_tipo_chamado, des_tipo_manutencao, des_local_servico, des_servico, des_quantitativos_estimados,
                                                carimbo_contratante, assinatura_responsavel, ind_status, motivo_rejeicao, cod_solicitante)
                                               values
                                               ($1, $2, $3, $4, $5, $6, $7 , $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
                                           `,[codigo, codigo, codigo, requisicao.dta_emissao, null, null, solicitante.nom_pessoa, solicitante.matricula, solicitante.email, solicitante.telefone,
                                              solicitante.cod_empresa, solicitante.razao_social, solicitante.num_cnpj, null, requisicao.des_tipo_chamado, requisicao.des_tipo_manutencao, requisicao.des_local_servico,
                                              requisicao.des_servico, null, null, null, 'P', null, solicitante.seq_registro
                                            ]);

    for (const row of listaServicos) {
        await db.queryConstrutora(`INSERT INTO ${schema}.tab_servico_requisicao
            ( des_servico, ind_status, num_rd, cod_empresa )
             values
             ($1, $2, $3, $4)`,[row.des_servico, 'P', codigo, row.cod_empresa])   
    }                                     

    res.status(200).json({
        message: 'Cadastro Realizado com Sucesso'
    });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao criar requisicao, tente novamente. " + error
        });
    };
}

exports.salvaRequisicaoDemanda = async (req, res) => {
  
    const { schema, requisicao } = req.body;

    try {

    await db.queryConstrutora("BEGIN");
   
    await db.queryConstrutora(`
                                              UPDATE ${schema}.tab_requisicao 
                                              SET 
                                                  des_tipo_chamado = $1,
                                                  des_tipo_manutencao = $2,
                                                  des_local_servico = $3,
                                                  des_servico = $4
                                              WHERE seq_registro = $5
                                          `, [
                                              requisicao.des_tipo_chamado, requisicao.des_tipo_manutencao, requisicao.des_local_servico, requisicao.des_servico, requisicao.seq_registro // <- Identificador do registro
                                            ]);
    

        res.status(200).json({
            message: 'Cadastro Realizado com Sucesso'
         });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao criar requisicao, tente novamente. " + error
        });
    };
}

exports.buscaRequisicaoDemandaUsuario = async (req, res) => {
    const { schema, solicitante } = req.body;

    // Inicializa a lista de serviços
    let listaServicos = [];

    try {
        await db.queryConstrutora("BEGIN"); // Inicia a transação

        // Busca as requisições do solicitante
        const result = await db.queryConstrutora(
            `SELECT * FROM ${schema}.tab_requisicao WHERE cod_solicitante = $1`,
            [solicitante.seq_registro]
        );

        // Se não houver requisições, retorna uma resposta vazia
        if (result.rows.length === 0) {
            await db.queryConstrutora("COMMIT"); // Confirma a transação
            return res.status(200).json({ message: [], listaServicos: [] });
        }

        // Percorre as requisições e busca os serviços associados
        for (const row of result.rows) {
            const servicos = await db.queryConstrutora(
                `SELECT * FROM ${schema}.tab_servico_requisicao 
                 WHERE num_rd = $1 AND cod_empresa = $2`,
                [row.num_rd, row.cod_empresa]
            );

            // Adiciona os serviços ao array mantendo a referência da requisição
            listaServicos.push(servicos.rows);
        }

        await db.queryConstrutora("COMMIT"); // Finaliza a transação com sucesso

        // Retorna a resposta JSON formatada
        return res.status(200).json({
            requisicoes: result.rows, // Lista de requisições
            listaServicos: listaServicos.flat(), // Lista com os serviços associados
        });

    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK"); // Reverte a transação em caso de erro
        } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
        }

        console.error("Erro ao buscar requisições: ", error);
        return res.status(500).json({
            message: "Erro ao buscar requisições, tente novamente.",
            error: error.message, // Retorna a mensagem de erro detalhada
        });
    }
};

exports.buscaRequisicaoDemandaAdm = async (req, res) => {
    const { schema } = req.body;

    // Inicializa a lista de serviços
    let listaServicos = [];

    try {
        await db.queryConstrutora("BEGIN"); // Inicia a transação

        // Busca as requisições do solicitante
        const result = await db.queryConstrutora(
            `SELECT * FROM ${schema}.tab_requisicao`
        );

        // Se não houver requisições, retorna uma resposta vazia
        if (result.rows.length === 0) {
            await db.queryConstrutora("COMMIT"); // Confirma a transação
            return res.status(200).json({ message: [], listaServicos: [] });
        }

        // Percorre as requisições e busca os serviços associados
        for (const row of result.rows) {
            const servicos = await db.queryConstrutora(
                `SELECT * FROM ${schema}.tab_servico_requisicao`
            );

            // Adiciona os serviços ao array mantendo a referência da requisição
            listaServicos.push(servicos.rows);
        }

        await db.queryConstrutora("COMMIT"); // Finaliza a transação com sucesso

        // Retorna a resposta JSON formatada
        return res.status(200).json({
            requisicoes: result.rows, // Lista de requisições
            listaServicos: listaServicos.flat(), // Lista com os serviços associados
        });

    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK"); // Reverte a transação em caso de erro
        } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
        }

        console.error("Erro ao buscar requisições: ", error);
        return res.status(500).json({
            message: "Erro ao buscar requisições, tente novamente.",
            error: error.message, // Retorna a mensagem de erro detalhada
        });
    }
};

exports.cadastroArquivoSinapi = async (req, res) => {
    const { schema, dadosGerais, insumos } = req.body;
  
    // 🔹 Validação básica para evitar SQL Injection
    if (!/^[a-zA-Z0-9_]+$/.test(schema)) {
      return res.status(400).json({ message: "Schema inválido!" });
    }
  
    if (!dadosGerais || !dadosGerais.mesColeta || !dadosGerais.localidade || !dadosGerais.nomeArquivo) {
      return res.status(400).json({ message: "Dados gerais incompletos!" });
    }
  
    if (!Array.isArray(insumos) || insumos.length === 0) {
      return res.status(400).json({ message: "Lista de insumos inválida ou vazia!" });
    }
  
    try {
      await db.queryConstrutora("BEGIN");
  
      // 🔹 Inserção da tabela SINAPI
      const result = await db.queryConstrutora(
        `INSERT INTO ${schema}.tab_sinapi (mes_coleta, localidade, nom_arquivo, total_records, ind_processado)
         VALUES ($1, $2, $3, $4, $5) RETURNING seq_registro`,
        [dadosGerais.mesColeta, dadosGerais.localidade, dadosGerais.nomeArquivo, insumos.length - 1, 'N']
      );

      await db.queryConstrutora("COMMIT");

      res.status(200).json({ message: "Tabela e Insumos em processamento interno" });

      await db.queryConstrutora("BEGIN");
  
      // 🔹 Captura o ID gerado
      const codTabSinapi = result.rows[0]?.seq_registro;
  
      if (!codTabSinapi) {
        throw new Error("Erro ao obter o código da tabela SINAPI.");
      }
  
      // 🔹 Inserção dos insumos
      for (const row of insumos.slice(1)) {
        await db.queryConstrutora(
          `INSERT INTO ${schema}.tab_sinapi_insumo (codigo, descricao, unidade, origem_preco, preco_mediano, cod_tab_sinapi)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            parseInt(row.codigo),
            row.descricao,
            row.unidadeMedida,
            row.origemPreco,
            parseFloat(row.precoMediano),
            codTabSinapi
          ]
        );
      }

      if (insumos.length > 1) { // Verifica se existem insumos após o cabeçalho
        await db.queryConstrutora(`UPDATE ${schema}.tab_sinapi SET ind_processado = 'S' WHERE seq_registro = $1`, [codTabSinapi]);
      }
  
      await db.queryConstrutora("COMMIT");
  
    } catch (error) {
      try {
        await db.queryConstrutora("ROLLBACK");
      } catch (rollbackError) {
        console.error("Erro ao fazer o rollback:", rollbackError);
      }
  
      console.error("Erro no cadastroArquivoSinapi:", error);
      res.status(500).json({ message: "Erro ao cadastrar insumos: " + error.message });
    }
};
  
exports.tabelaSinapi = async (req, res) => {
  
    const { schema } = req.body;

    try {

    await db.queryConstrutora("BEGIN");
   
    const tabela = await db.queryConstrutora(`select 
                                                    seq_registro, 
                                                    mes_coleta as "mesColeta", 
                                                    localidade, 
                                                    nom_arquivo as "nomeArquivo", 
                                                    total_records, 
                                                    ind_processado 
                                                from ${schema}.tab_sinapi`);

        res.status(200).json({
            message: tabela.rows
         });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao buscar tabelas SINAPI, tente novamente. " + error
        });
    };
}

exports.criaContrato = async (req, res) => {
  
    const { schema, contrato } = req.body;

    console.log(contrato)

    try {

    await db.queryConstrutora("BEGIN");

    const normalizeText = (text) => {
        if (!text) return '';
      
        return text
          .normalize("NFD") // Decompor caracteres acentuados
          .replace(/[\u2013\u2014]/g, "-") // Substituir travessões por hífen
          .replace(/[\u00A0]/g, " ") // Substituir espaço não separável por espaço normal
          .replace(/[^\x00-\x7F]/g, ""); // Remover caracteres não ASCII
    };
      
      // Aplicar a função nos campos que podem conter caracteres especiais
    const contratoLimpo = {
        ...contrato,
        contrato: normalizeText(contrato.contrato),
        objeto: normalizeText(contrato.objeto),
        ordem_servico: normalizeText(contrato.ordem_servico),
        licitacao: normalizeText(contrato.licitacao),
        processo: normalizeText(contrato.processo),
        local_exec_contrato: normalizeText(contrato.local_exec_contrato),
        indice_reajuste_orcamento: normalizeText(contrato.indice_reajuste_orcamento),
    };
   
    await db.queryConstrutora(
        `INSERT INTO ${schema}.tab_contrato (
          contrato, ordem_servico, licitacao, processo, objeto, local_exec_contrato,
          val_total_contrato, regime_exec_contrato, base_orcamento_referencial, 
          indice_reajuste_orcamento, prazo_exec_contrato, dta_inicio, dta_fim, 
          valor_percentual_bdi, percentual_desc_ofertado, seq_func_gestor_contrato, 
          seq_func_fiscal_contrato, cod_contratada, cod_contratante, 
          cod_rep_tec_contratada, cod_rep_legal_contratada, cod_rep_legal_contratante
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
          $16, $17, $18, $19, $20, $21, $22
        )`,
        [
          contratoLimpo.contrato,
          contratoLimpo.ordem_servico,
          contratoLimpo.licitacao,
          contratoLimpo.processo,
          contratoLimpo.objeto,
          contratoLimpo.local_exec_contrato,
          contratoLimpo.val_total_contrato,
          contratoLimpo.regime_exec_contrato,
          contratoLimpo.base_orcamento_referencial,
          contratoLimpo.indice_reajuste_orcamento,
          contratoLimpo.prazo_exec_contrato,
          contratoLimpo.dta_inicio,
          contratoLimpo.dta_fim,
          contratoLimpo.valor_percentual_bdi,
          contratoLimpo.percentual_desc_ofertado,
          contratoLimpo.seq_func_gestor_contrato,
          contratoLimpo.seq_func_fiscal_contrato,
          contratoLimpo.cod_contratada,
          contratoLimpo.cod_contratante,
          contratoLimpo.cod_rep_tec_contratada,
          contratoLimpo.cod_rep_legal_contratada,
          contratoLimpo.cod_rep_legal_contratante
        ]
      );
      
    res.status(200).json({
        message: 'Contrato Cadastrado com Sucesso'
    });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao cadatrar contrato, tente novamente. " + error
        });
    };
}

exports.buscaContrato = async (req, res) => {
  
    const { schema} = req.body;


    try {

    await db.queryConstrutora("BEGIN");
   
    const result = await db.queryConstrutora(`select a.*, b.nom_fantasia from ${schema}.tab_contrato a
                                              left join ${schema}.tab_cadastro_empresa_cliente b on (a.cod_contratante = b.seq_registro)`);
      
    res.status(200).json({
        message: result.rows
    });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao buscar contratos, tente novamente. " + error
        });
    };
}

exports.buscaContratoEmpresaCliente = async (req, res) => {
  
    const { schema, cod_empresa } = req.body;


    try {

    await db.queryConstrutora("BEGIN");
   
    const result = await db.queryConstrutora(`select a.*, b.nom_fantasia from ${schema}.tab_contrato a
                                              left join ${schema}.tab_cadastro_empresa_interna b on (a.cod_contratada = b.seq_registro)
                                              where a.cod_contratante = $1`, [cod_empresa]);
      
    res.status(200).json({
        message: result.rows
    });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao buscar contratos, tente novamente. " + error
        });
    };
}

exports.criaGrupoInsumo = async (req, res) => {
  
    const { schema, grupo } = req.body;


    try {

    await db.queryConstrutora("BEGIN");
   
    await db.queryConstrutora(`INSERT INTO ${schema}.tab_grupo_insumo 
                                    (des_grupo, ind_status)
                                    values
                                    ($1, $2)`, [grupo.des_grupo, grupo.ind_status]);
      
    res.status(200).json({
        message: 'Grupo Cadastrado com Sucesso'
    });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao cadastrar Grupo, tente novamente. " + error
        });
    };
}

exports.listaGrupoInsumo = async (req, res) => {
  
    const { schema, grupo } = req.body;


    try {

    await db.queryConstrutora("BEGIN");
   
    const result = await db.queryConstrutora(`select * from ${schema}.tab_grupo_insumo 
                                   order by des_grupo`);
      
    res.status(200).json({
        message: result.rows
    });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao buscar Grupo, tente novamente. " + error
        });
    };
}

exports.alteraGrupoInsumo = async (req, res) => {
  
    const { schema, seq_registro, ind_status } = req.body;


    try {

    await db.queryConstrutora("BEGIN");
   
    const result = await db.queryConstrutora(`UPDATE ${schema}.tab_grupo_insumo 
                                   SET ind_status = $1 where seq_registro = $2`,[ind_status,seq_registro]);
      
    res.status(200).json({
        message: `Grupo ${ind_status ? 'Ativado' : 'Inativado'} com sucesso`
    });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: `Erro ao ${ind_status ? 'Ativado' : 'Inativado'} Grupo, tente novamente. ` + error
        });
    };
}

exports.buscaTipoInsumo = async (req, res) => {
  
    const { schema } = req.body;


    try {

    await db.queryConstrutora("BEGIN");
   
    const result = await db.queryConstrutora(`select * from ${schema}.tab_tipo_insumo
                                   order by des_tipo_insumo`);
      
    res.status(200).json({
        message: result.rows
    });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao buscar Tipo Insumo, tente novamente. " + error
        });
    };
}

exports.criaInsumo = async (req, res) => {
  
    const { schema, insumo } = req.body;

    try {

    await db.queryConstrutora("BEGIN");
   
    const result = await db.queryConstrutora(`INSERT INTO ${schema}.tab_insumo_proprio 
                                                (cod_grupo, cod_insumo, des_insumo, unidade, cod_tipo_insumo, uf, valor_insumo, valor_nao_desonerado_operativo, valor_desonerado_operativo,
                                                valor_nao_desonerado_improdutivo, valor_desonerado_improdutivo, ind_ativo)
                                              VALUES
                                                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
                                            [insumo.cod_grupo, insumo.cod_insumo, insumo.des_insumo, insumo.unidade, insumo.cod_tipo_insumo, insumo.uf,
                                             insumo.valor_nao_desonerado_operativo, insumo.valor_desonerado_operativo, insumo.valor_nao_desonerado_improdutivo, insumo.valor_desonerado_improdutivo,
                                             true
                                            ]);
      
    res.status(200).json({
        message: 'Insumo Próprio cadastrado com Sucesso'
    });

    await db.queryConstrutora("COMMIT");
        
    } catch (error) {
        try {
            await db.queryConstrutora("ROLLBACK");
          } catch (rollbackError) {
            console.error("Erro ao fazer o rollback: ", rollbackError);
          }
          res.status(500).json({
            message: "Erro ao cadastrar insumo proprio, tente novamente. " + error
        });
    };
}

