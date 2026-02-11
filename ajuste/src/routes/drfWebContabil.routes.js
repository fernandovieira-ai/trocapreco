/**drfweb
 * arquivo: routes/fasthelproutes.js
 * descriçao: arquivo responsavel pelas rotas da API
 * data: 14/03/2022
 * autor: Renato Filho
*/

const router = require("express-promise-router")();
const drfContabilCadastros = require("../controllers/drfContabilCadastros.controller");
const drfContabilAreaCliente = require("../controllers/drfContabilAreaCliente.controller");
const drfContabilAprovacaoArquivo = require("../controllers/drfContabilAprovacaoArquivo.controller");
const drfContabilTarefas = require("../controllers/drfContabilTarefas.controller");

//=> Definindo as rotas do CRUD - Fasthelp

// => Rota para criar/inserir usuario : (POST) : localhost:3000/api/fasthelp-createUser
//festhelp-user abaixo é a rota que insere no postman para acessar esse metodo (createUser).

//----------------------------------------- Daqui pra baixo, rotas da Area de Cadatros

router.post("/login", drfContabilCadastros.fazerLogin);

router.post("/registraLog", drfContabilCadastros.registraLog);

router.post("/cadastroGrupoCliente", drfContabilCadastros.cadastroGrupoCliente);

router.get("/buscaGrupoCliente", drfContabilCadastros.buscaGrupoCliente);

router.post("/alteraGrupoCliente", drfContabilCadastros.alteraGrupoCliente);

router.post("/removeCadastroGrupoCliente", drfContabilCadastros.removeCadastroGrupoCliente);

router.post("/cadastroTributacaoCliente", drfContabilCadastros.cadastroTributacaoCliente);

router.get("/buscaTributacaoCliente", drfContabilCadastros.buscaTributacaoCliente);

router.post("/alteraTributacaoCliente", drfContabilCadastros.alteraTributacaoCliente);

router.post("/removeTributacaoCliente", drfContabilCadastros.removeTributacaoCliente);

router.get("/buscaObrigacao", drfContabilCadastros.buscaObrigacao);

router.post("/alteraObrigacao", drfContabilCadastros.alteraObrigacao);

router.post("/cadastroObrigacao", drfContabilCadastros.cadastroObrigacao);

router.post("/removeObrigacao", drfContabilCadastros.removeObrigacao);

router.get("/buscaRamoAtividade", drfContabilCadastros.buscaRamoAtividade);

router.post("/cadastroRamoAtividade", drfContabilCadastros.cadastroRamoAtividade);

router.post("/removeRamoAtividade", drfContabilCadastros.removeRamoAtividade);

router.post("/alteraRamoAtividade", drfContabilCadastros.alteraRamoAtividade);

router.get("/buscaRegimeTributario", drfContabilCadastros.buscaRegimeTributario);

router.post("/cadastroCliente", drfContabilCadastros.cadastroCliente);

router.get("/buscaCadastroCliente", drfContabilCadastros.buscaCadastroCliente);

router.post("/alteraCadastroCliente", drfContabilCadastros.alteraCadastroCliente);

router.post("/salvaClienteObrigacao", drfContabilCadastros.salvaClienteObrigacao);

router.get("/buscaPerfilUsuario", drfContabilCadastros.buscaPerfilUsuario);

router.get("/buscaUsuario", drfContabilCadastros.buscaUsuario);

router.post("/altaraCadastroUsuario", drfContabilCadastros.altaraCadastroUsuario); 

router.post("/vinculaTarefaUsuarioInativado", drfContabilCadastros.vinculaTarefaUsuarioInativado);

router.post("/cadastroUsuario", drfContabilCadastros.cadastroUsuario);

router.get("/funcionario", drfContabilCadastros.funcionario);

router.post("/buscaObrigacaoCliente", drfContabilCadastros.buscaObrigacaoCliente); 

router.post("/removeObrigacaoCliente", drfContabilCadastros.removeObrigacaoCliente);

router.post("/deletaTipoAtividade", drfContabilCadastros.deletaTipoAtividade);

router.post("/alteraTipoAtividade", drfContabilCadastros.alteraTipoAtividade);

router.post("/cadastroTipoAtividade", drfContabilCadastros.cadastroTipoAtividade);  

router.get("/buscaDepartamento", drfContabilCadastros.buscaDepartamento);

router.post("/buscaUsuariosAdministrados", drfContabilCadastros.buscaUsuariosAdministrados);

router.post("/salvaUsuarioAdministrado", drfContabilCadastros.salvaUsuarioAdministrado); 

router.post("/salvaPerfil", drfContabilCadastros.salvaPerfil); 

router.post("/cadastraPerfil", drfContabilCadastros.cadastraPerfil); 

router.post("/removePerfil", drfContabilCadastros.removePerfil); 

router.post("/salvaClienteGrupo", drfContabilCadastros.salvaClienteGrupo);  

router.post("/removeClienteGrupo", drfContabilCadastros.removeClienteGrupo); 

router.get("/buscaFuncaoSistema", drfContabilCadastros.buscaFuncaoSistema);

router.post("/salvaAcessoUsuario", drfContabilCadastros.salvaAcessoUsuario); 

router.post("/buscaAcessoUsuario", drfContabilCadastros.buscaAcessoUsuario); 

router.post("/alteraSenhaUsuario", drfContabilCadastros.alteraSenhaUsuario);  

router.post("/cadastroGrupoTarefa", drfContabilCadastros.cadastroGrupoTarefa); 

router.post("/salvaGrupoTarefa", drfContabilCadastros.salvaGrupoTarefa); 

router.post("/buscaGrupoTarefa", drfContabilCadastros.buscaGrupoTarefa);  

router.post("/cadastroItemGrupoTarefa", drfContabilCadastros.cadastroItemGrupoTarefa); 

router.post("/salvaItemGrupoTarefa", drfContabilCadastros.salvaItemGrupoTarefa); 

router.post("/buscaItemGrupoTarefa", drfContabilCadastros.buscaItemGrupoTarefa);

router.post("/cadastrarTarefaPrecedente", drfContabilCadastros.cadastrarTarefaPrecedente);

router.post("/buscaTarefaPrecedente", drfContabilCadastros.buscaTarefaPrecedente);  

router.post("/cadastrarPlanoTarefa", drfContabilCadastros.cadastrarPlanoTarefa); 

router.post("/editaPlanoTarefa", drfContabilCadastros.editaPlanoTarefa);

router.post("/buscaPlanoTarefaCliente", drfContabilCadastros.buscaPlanoTarefaCliente); 

router.post("/salvaConfiguracao", drfContabilCadastros.salvaConfiguracao); 

router.post("/salvaConfiguracaoIndividual", drfContabilCadastros.salvaConfiguracaoIndividual); 

router.post("/deletaConfiguracaoIndividual", drfContabilCadastros.deletaConfiguracaoIndividual);

router.post("/buscaConfigCliente", drfContabilCadastros.buscaConfigCliente);

router.post("/executarRotina", drfContabilCadastros.executarRotina);

router.post("/cadastroConfigApontamentoRapido", drfContabilCadastros.cadastroConfigApontamentoRapido);

router.post("/buscaConfigApontamentoRapido", drfContabilCadastros.buscaConfigApontamentoRapido);

router.post("/inativaConfigApontamentoRapido", drfContabilCadastros.inativaConfigApontamentoRapido);

//----------------------------------------- Daqui pra baixo, rotas da Area do Cliente

router.post("/buscaAtividadeCliente", drfContabilAreaCliente.buscaAtividadeCliente);

router.post("/enviaArquivoTarefaCliente", drfContabilAreaCliente.enviaArquivoTarefaCliente);

//----------------------------------------- Daqui pra baixo, rotas da Aprovacao de Arquivos

router.post("/listaArquivosEntregues", drfContabilAprovacaoArquivo.listaArquivosEntregues); 

router.post("/rejeitarArquivoCliente", drfContabilAprovacaoArquivo.rejeitarArquivoCliente);

router.post("/aprovarArquivoCliente", drfContabilAprovacaoArquivo.aprovarArquivoCliente);  

//----------------------------------------- Daqui pra baixo, rotas do Painel de Tarefas

router.post("/buscaTarefasPainel", drfContabilTarefas.buscaTarefasPainel);

router.get("/buscaTarefasTv", drfContabilTarefas.buscaTarefasTv);

router.post("/buscaTarefasFiltroUser", drfContabilTarefas.buscaTarefasFiltroUser); 

router.post("/incluiNovaTarefa", drfContabilTarefas.incluiNovaTarefa);

router.post("/alteraFuncionarioTarefa", drfContabilTarefas.alteraFuncionarioTarefa);

router.post("/deletaTarefa", drfContabilTarefas.deletaTarefa); 

router.post("/alterarTarefa", drfContabilTarefas.alterarTarefa);

router.post("/iniciaTarefa", drfContabilTarefas.iniciaTarefa);   

router.post("/verificaTarefaIniciada", drfContabilTarefas.verificaTarefaIniciada); 

router.post("/pausarTarefa", drfContabilTarefas.pausarTarefa);

router.post("/finalizaTarefa", drfContabilTarefas.finalizaTarefa);

router.post("/alteraDataTarefa", drfContabilTarefas.alteraDataTarefa);

router.post("/recriaTarefa", drfContabilTarefas.recriaTarefa); 

router.post("/incluirLembrete", drfContabilTarefas.incluirLembrete); 

router.get("/buscaLembrete", drfContabilTarefas.buscaLembrete); 

router.post("/excluirLembrete", drfContabilTarefas.excluirLembrete);  

router.post("/buscaHoraTarefa", drfContabilTarefas.buscaHoraTarefa); 

router.post("/horasDeTarefas", drfContabilTarefas.horasDeTarefas);

router.post("/buscaTodaTarefaFinalizada", drfContabilTarefas.buscaTodaTarefaFinalizada);


//----------------------------------------- Daqui pra baixo, rotas do Tarefas Concluídas

router.post("/buscaTarefaFinalizada", drfContabilTarefas.buscaTarefaFinalizada); 

router.post("/reabrirTarefa", drfContabilTarefas.reabrirTarefa); 

router.post("/ajustaDataTarefa", drfContabilTarefas.ajustaDataTarefa);



module.exports = router;