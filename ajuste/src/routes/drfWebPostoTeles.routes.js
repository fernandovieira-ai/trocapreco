const router = require("express-promise-router")();
const drfWebPostoTeles = require("../controllers/drfWebPostoTeles.controller");


router.get("/empresa", drfWebPostoTeles.empresa);

router.get("/produtos", drfWebPostoTeles.produtos);  

router.get("/vendaItem", drfWebPostoTeles.vendaItem); 

router.get("/compraItem", drfWebPostoTeles.compraItem); 

router.get("/funcionario", drfWebPostoTeles.funcionario); 

router.get("/valeFuncionario", drfWebPostoTeles.valeFuncionario); 

module.exports = router;