/**
 * arquivo: routes/fasthelproutes.js
 * descriçao: arquivo responsavel pelas rotas da API
 * data: 14/03/2022
 * autor: Renato Filho
*/

const router = require("express-promise-router")();
const drfWeb = require("../controllers/drfWeb.controller");


//=> Rotas abaixo sao do grupo Decio

router.post("/login", drfWeb.fazerLogin);

router.post("/buscaXmlEmpresa", drfWeb.verifyJWT, drfWeb.buscaXmlEmpresa);

router.post("/buscaModeloDocumento", drfWeb.verifyJWT, drfWeb.buscaModeloDocumento);

router.post("/buscaNota", drfWeb.verifyTokenDecioNota, drfWeb.buscaNota);

router.post("/buscaNotaIndividual", drfWeb.verifyTokenDecioNota, drfWeb.buscaNotaIndividual);

router.post("/auditoria", drfWeb.auditoria);

router.post("/buscaEmpresaEMSys", drfWeb.buscaEmpresaEMSys);

// rotas do menu exportaçao de titulos nasajon

router.post("/buscaPessoaTitulo", drfWeb.buscaPessoaTitulo);

router.post("/buscaArquivoDeTitulos", drfWeb.buscaArquivoDeTitulos);


// rotas do menu drf bi

router.post("/vendasVendedor", drfWeb.vendasVendedor);

router.post("/vendasVendedorCustom", drfWeb.vendasVendedorCustom);

router.post("/estoqueTanque", drfWeb.estoqueTanque);

router.post("/vendaFormaPagto", drfWeb.vendasFormaPagto);

router.post("/vendaFormaPagtoCustom", drfWeb.vendaFormaPagtoCustom);

router.post("/vendaCombustivel", drfWeb.vendaCombustivel);

router.post("/vendaCombustivelCustom", drfWeb.vendaCombustivelCustom);

router.post("/acreDescAfeCustom", drfWeb.acreDescAfeCustom);

module.exports = router;