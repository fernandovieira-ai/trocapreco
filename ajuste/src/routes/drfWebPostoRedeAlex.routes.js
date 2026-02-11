const router = require("express-promise-router")();
const drfWebPostoRedeAlex = require("../controllers/drfWebPostoRedeAlex.controller");


router.get("/empresa", drfWebPostoRedeAlex.empresa);

router.get("/produtos", drfWebPostoRedeAlex.produtos);  

router.get("/vendaItem", drfWebPostoRedeAlex.vendaItem); 

router.get("/compraItem", drfWebPostoRedeAlex.compraItem); 

router.get("/funcionario", drfWebPostoRedeAlex.funcionario); 

router.get("/valeFuncionario", drfWebPostoRedeAlex.valeFuncionario); 

router.get("/notaEntrada", drfWebPostoRedeAlex.notaEntrada); 

router.get("/tituloReceber", drfWebPostoRedeAlex.tituloReceber); 

router.get("/tituloPagar", drfWebPostoRedeAlex.tituloPagar); 

router.get("/formaPagto", drfWebPostoRedeAlex.formaPagto); 

router.get("/lmc", drfWebPostoRedeAlex.lmc); 

router.get("/tanque", drfWebPostoRedeAlex.tanque); 

router.get("/bico", drfWebPostoRedeAlex.bico); 

router.get("/bomba", drfWebPostoRedeAlex.bomba); 

router.get("/abastecimentos", drfWebPostoRedeAlex.abastecimentos); 

router.get("/cliente", drfWebPostoRedeAlex.cliente); 

router.get("/fornecedor", drfWebPostoRedeAlex.fornecedor); 

router.get("/contaBanco", drfWebPostoRedeAlex.contaBanco); 

router.get("/vendas", drfWebPostoRedeAlex.vendas); 

router.get("/vendaFormaPagamento", drfWebPostoRedeAlex.vendaFormaPagamento); 

router.get("/planoContas", drfWebPostoRedeAlex.planoContas);

router.get("/verificaRegistros", drfWebPostoRedeAlex.verificaRegistros);

module.exports = router;