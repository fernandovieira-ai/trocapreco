/**
 * arquivo: routes/fasthelproutes.js
 * descriçao: arquivo responsavel pelas rotas da API
 * data: 14/03/2022
 * autor: Renato Filho
*/

const router = require("express-promise-router")();
const drfGaragem = require("../controllers/drfWebGaragem.controller");

//=> Definindo as rotas do CRUD - Fasthelp

// => Rota para criar/inserir usuario : (POST) : localhost:3000/api/fasthelp-createUser
//festhelp-user abaixo é a rota que insere no postman para acessar esse metodo (createUser).

router.post("/login", drfGaragem.fazerLogin);

router.post("/cadastroContaBanco", drfGaragem.cadastroContaBanco);

router.get("/listaContaBanco", drfGaragem.listaContaBanco);

router.post("/cadastraVeiculo", drfGaragem.cadastraVeiculo); 

router.get("/buscaParceiros", drfGaragem.buscaParceiros); 

router.post("/cadastraDocumentoVeiculo", drfGaragem.cadastraDocumentoVeiculo);

router.post("/lancarDespesa", drfGaragem.lancarDespesa);

router.post("/tipoDespesa", drfGaragem.tipoDespesa);

router.post("/tipoReceita", drfGaragem.tipoReceita);

router.get("/listaDespesaFixa", drfGaragem.listaDespesaFixa);

router.get("/listaReceitaReceber", drfGaragem.listaReceitaReceber);

router.post("/criaDespesaFixa", drfGaragem.criaDespesaFixa);

router.post("/criaReceitaReceber", drfGaragem.criaReceitaReceber);

router.post("/deleteDespesaFixa", drfGaragem.deleteDespesaFixa);

router.get("/listaDespesasLancadas", drfGaragem.listaDespesasLancadas);

router.get("/getTotalDespesasFixas", drfGaragem.getTotalDespesasFixas);

router.get("/getTotalReceitaReceber", drfGaragem.getTotalReceitaReceber);

router.post("/receitaRecebida", drfGaragem.receitaRecebida);

router.get("/veiculosAbertos", drfGaragem.veiculosAbertos);

router.post("/veiculosAbertosParceiro", drfGaragem.veiculosAbertosParceiro);

router.post("/lancaDespesaVeiculo", drfGaragem.lancaDespesaVeiculo);

router.post("/lancaDespesaVeiculoParceiro", drfGaragem.lancaDespesaVeiculoParceiro);

router.post("/listaDespesaVeiculo", drfGaragem.listaDespesaVeiculo);

router.post("/listaDespesasVeiculoParceiro", drfGaragem.listaDespesasVeiculoParceiro);

router.post("/finalizaVendaVeiculo", drfGaragem.finalizaVendaVeiculo);

router.post("/finalizaVendaVeiculoParceiro", drfGaragem.finalizaVendaVeiculoParceiro);

router.post("/listaMovimentacao", drfGaragem.listaMovimentacao); 

router.post("/conciliaMov", drfGaragem.conciliaMov);

router.post("/veiculosVendidos", drfGaragem.veiculosVendidos); 

router.post("/veiculosVendidosParceiro", drfGaragem.veiculosVendidosParceiro);

router.post("/desfazerVendaVeiculo", drfGaragem.desfazerVendaVeiculo);

router.post("/transferenciaEntreContas", drfGaragem.transferenciaEntreContas);

router.get("/listaLucroOperacao", drfGaragem.listaLucroOperacao);

router.post("/retiradaLucro", drfGaragem.retiradaLucro);

router.post("/dre", drfGaragem.dre);

router.post("/insereLembrete", drfGaragem.insereLembrete);

router.post("/removeLembrete", drfGaragem.removeLembrete);

router.get("/buscaLembrete", drfGaragem.buscaLembrete); 

router.get("/buscaValoresEspecie", drfGaragem.buscaValoresEspecie); 

router.post("/realizarDeposito", drfGaragem.realizarDeposito);

router.post("/finalizaVeiculoDeParceiros", drfGaragem.finalizaVeiculoDeParceiros);

router.post("/cadastroUsuario", drfGaragem.cadastroUsuario); 

router.get("/listaDeClientes", drfGaragem.listaDeClientes); 

router.post("/indicacao", drfGaragem.indicacao);  

router.post("/vincularClienteVeiculo", drfGaragem.vincularClienteVeiculo); 

router.post("/buscaVeiculoUsuario", drfGaragem.buscaVeiculoUsuario);

router.get("/buscaIndicacao", drfGaragem.buscaIndicacao); 

router.post("/atualizaIndicacao", drfGaragem.atualizaIndicacao); 

router.post("/buscaIndicacaoAreaCliente", drfGaragem.buscaIndicacaoAreaCliente);  

router.post("/enviarOcorrencia", drfGaragem.enviarOcorrencia); 

router.post("/buscaOcorrencia", drfGaragem.buscaOcorrencia); 

router.post("/respostaOcorrencia", drfGaragem.respostaOcorrencia); 

router.post("/buscaOcorrenciaAreaCliente", drfGaragem.buscaOcorrenciaAreaCliente); 

router.post("/finalizaOcorrencia", drfGaragem.finalizaOcorrencia); 

router.post("/pixUsuario", drfGaragem.pixUsuario); 

router.post("/ofertarVeiculo", drfGaragem.ofertarVeiculo); 

router.post("/buscaOfertasAreaCliente", drfGaragem.buscaOfertasAreaCliente); 

router.get("/buscaOfertasVeiculos", drfGaragem.buscaOfertasVeiculos); 

router.post("/atualizaStatusOfertasVeiculos", drfGaragem.atualizaStatusOfertasVeiculos); 

router.post("/metricaVendaVeiculo", drfGaragem.metricaVendaVeiculo); 

router.get("/metricaVendaVendedor", drfGaragem.metricaVendaVendedor); 

router.get("/buscaVendedores", drfGaragem.buscaVendedores);

router.post("/publicarVeiculo", drfGaragem.publicarVeiculo);  

router.post("/atualizaDesVeiculo", drfGaragem.atualizaDesVeiculo); 

router.get("/veiculosAbertosAreaCliente", drfGaragem.veiculosAbertosAreaCliente); 

router.post("/cadastrarCliente", drfGaragem.cadastrarCliente); 

router.post("/alterarSenha", drfGaragem.alterarSenha);  

router.post("/alterarImagem", drfGaragem.alterarImagem);

router.post("/salvaContratoVeiculo", drfGaragem.salvaContratoVeiculo); 

router.get("/buscaAtivosPassivos", drfGaragem.buscaAtivosPassivos); 

router.post("/atualizaVeiculoAutoscar", drfGaragem.atualizaVeiculoAutoscar); 

router.post("/alteraStatusVeiculo", drfGaragem.alteraStatusVeiculo); 

router.post("/removerVeiculo", drfGaragem.removerVeiculo); 

router.post("/despesaReceita", drfGaragem.despesaReceita); 

module.exports = router;