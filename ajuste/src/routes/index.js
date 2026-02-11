/**
 * arquivo: routes/index.js
 * descriçao: arquivo responsavel pela chamada da API na aplicaçao no lado do back-end
 * data: 14/03/2022
 * autor: Renato Filho
*/

const express = require("express"); // sempre instanciar o express numa variavel pois ele fará a rota de acesso
const path = require("path");

const router = express.Router();

router.get("/drfweb", (req, res) => {
     res.status(200).send({
        success: "Voce conseguiu! HTTPS",
        message: "Seja bem vindo a API node.js + PostgreSQL + Ionic(Angular)",
        version: "1.0.0"
    });
});

router.get("/drfwebGaragem", (req, res) => {
    res.status(200).send({
       success: "Voce conseguiu! HTTPS",
       message: "Seja bem vindo a API node.js + PostgreSQL + Ionic(Angular)",
       version: "1.0.0"
   });
});

router.get("/drfwebContabil", (req, res) => {
    res.status(200).send({
       success: "Voce conseguiu! HTTPS",
       message: "Seja bem vindo a API node.js + PostgreSQL + Ionic(Angular)",
       version: "1.0.0"
   });
});

router.get("/drfwebInventario", (req, res) => {
    res.status(200).send({
       success: "Voce conseguiu! HTTPS",
       message: "Seja bem vindo a API node.js + PostgreSQL + Ionic(Angular)",
       version: "1.0.0"
   });
});

router.get("/.well-known/pki-validation/6E39D6983FA2A84E1FFC2E7E71B82E48.txt", (req, res) => {
    res.sendFile(path.join(__dirname, "6E39D6983FA2A84E1FFC2E7E71B82E48.txt"));
  });


module.exports = router;