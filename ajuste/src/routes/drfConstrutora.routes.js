const router = require("express-promise-router")();
const drfConstrutora = require("../controllers/drfConstrutora.controller.js");

router.post("/criaCadastroEmpresa", drfConstrutora.criaCadastroEmpresa); 

router.post("/criaCadastroEmpresaInterna", drfConstrutora.criaCadastroEmpresaInterna); 

router.post("/buscaCadastroEmpresa", drfConstrutora.buscaCadastroEmpresa); 

router.post("/buscaCadastroEmpresaInterna", drfConstrutora.buscaCadastroEmpresaInterna);

router.post("/statusCadastroEmpresa", drfConstrutora.statusCadastroEmpresa);

router.post("/login", drfConstrutora.login);  

router.post("/criaCadastroUsuario", drfConstrutora.criaCadastroUsuario); 

router.post("/cadastroRepresentante", drfConstrutora.cadastroRepresentante);

router.post("/buscaCadastroUsuario", drfConstrutora.buscaCadastroUsuario); 

router.post("/cadastroRequisicaoDemanda", drfConstrutora.cadastroRequisicaoDemanda);

router.post("/buscaRequisicaoDemandaUsuario", drfConstrutora.buscaRequisicaoDemandaUsuario); 

router.post("/salvaRequisicaoDemanda", drfConstrutora.salvaRequisicaoDemanda); 

router.post("/buscaRequisicaoDemandaAdm", drfConstrutora.buscaRequisicaoDemandaAdm); 

router.post("/vinculaRepresEmp", drfConstrutora.vinculaRepresEmp);  

router.post("/cadastroArquivoSinapi", drfConstrutora.cadastroArquivoSinapi); 

router.post("/tabelaSinapi", drfConstrutora.tabelaSinapi); 

router.post("/criaContrato", drfConstrutora.criaContrato); 

router.post("/buscaContrato", drfConstrutora.buscaContrato); 

router.post("/buscaContratoEmpresaCliente", drfConstrutora.buscaContratoEmpresaCliente); 

router.post("/criaGrupoInsumo", drfConstrutora.criaGrupoInsumo); 

router.post("/listaGrupoInsumo", drfConstrutora.listaGrupoInsumo); 

router.post("/alteraGrupoInsumo", drfConstrutora.alteraGrupoInsumo); 

router.post("/buscaTipoInsumo", drfConstrutora.buscaTipoInsumo); 

router.post("/criaInsumo", drfConstrutora.criaInsumo);


module.exports = router;