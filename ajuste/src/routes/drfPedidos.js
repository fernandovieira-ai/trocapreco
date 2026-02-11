
const router = require("express-promise-router")();
const drfPedidos = require("../controllers/drfPedidos.controller.js");
const drfGeoService = require("../controllers/drfGeoService.controller.js");

router.post("/login", drfPedidos.usuarios);

router.post("/userLogin", drfPedidos.userLogin);

router.post("/userRegister", drfPedidos.userRegister); 

router.post("/removeUsuario", drfPedidos.removeUsuario);  

router.post("/alteraUsuario", drfPedidos.alteraUsuario);  

router.post("/buscaUsuarios", drfPedidos.buscaUsuarios);

router.post("/buscaEmpresa", drfPedidos.buscaEmpresaSchema);

router.post("/buscaItens", drfPedidos.buscaItens);

router.post("/buscaCliente", drfPedidos.buscaCliente);

router.post("/buscaCondicaoPagamento", drfPedidos.buscaCondicaoPagamento);

router.post("/propriedadeRural", drfPedidos.propriedadeRural);

router.post("/salvaCondicaoFrete", drfPedidos.salvaCondicaoFrete);

router.post("/buscaCondicaoFrete", drfPedidos.buscaCondicaoFrete);

router.post("/buscaTaxaJuros", drfPedidos.buscaTaxaJuros);

router.post("/salvaTaxaJuros", drfPedidos.salvaTaxaJuros);

router.post("/geoService", drfGeoService.geoService); 

router.post("/enviaPedido", drfPedidos.enviaPedido);

router.post("/buscaPedido", drfPedidos.buscaPedido);

router.post("/buscaDetalhesPedido", drfPedidos.buscaDetalhesPedido); 

router.post("/salvaQtdItemPedido", drfPedidos.salvaQtdItemPedido);

router.post("/salvaPedido", drfPedidos.salvaPedido); 

router.post("/atualizaSchema", drfPedidos.atualizaSchema);

module.exports = router;