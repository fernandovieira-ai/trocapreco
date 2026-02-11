/**
 * arquivo: routes/fasthelproutes.js
 * descriçao: arquivo responsavel pelas rotas da API
 * data: 14/03/2022
 * autor: Renato Filho
*/

const router = require("express-promise-router")();
const invOn = require("../controllers/drfWebInventario.controller");

//=> Definindo as rotas do CRUD - Fasthelp

// => Rota para criar/inserir usuario : (POST) : localhost:3000/api/fasthelp-createUser
//festhelp-user abaixo é a rota que insere no postman para acessar esse metodo (createUser).

router.post("/login", invOn.fazerLogin);

router.post("/register/", invOn.userRegister);

router.post("/cancelarConta", invOn.cancelarConta);

router.post("/buscaItem", invOn.buscaItem);

router.post("/buscaItemLocal", invOn.buscaItemLocal);

router.post("/buscaAlmInv", invOn.buscaAlmInv);

router.post("/buscaSeqContagemInvUsuario", invOn.buscaSeqContagemInvUsuario);

router.post("/criarInventario", invOn.criarInventario);

router.post("/itemContagem", invOn.itemContagem);

router.post("/itemContagemAberta", invOn.itemContagemAberta);

router.post("/removeItemContagem", invOn.removeItemContagem);

router.post("/updateItemContagem", invOn.updateItemContagem);

router.post("/bustaTodosInventariosAbertos", invOn.bustaTodosInventariosAbertos);

router.post("/concluirInv", invOn.concluirInv);

router.post("/itemInventario", invOn.itemInventario);

router.post("/removeItemInventario", invOn.removeItemInventario);

router.post("/atualizaStatus", invOn.atualizaStatus);

router.post("/relFinal", invOn.relFinal);

router.post("/verificaM", invOn.verificaM);

router.post("/verificaC", invOn.verificaC);

router.post("/excluirInv", invOn.excluirInv);

router.post("/dispositivo", invOn.dispositivo);

router.get("/versaoAppInventario", invOn.versaoAppInventario);


module.exports = router;