/**
 * arquivo: app.js
 * descriçao: arquivo responsavel por fazer a conexao com o arquivo 'server.js' 
 * data: 17/05/2022
 * autor: Renato Filho
*/

const express = require("express");
const fs = require('fs');
const https = require('https');
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();

const privateKey = fs.readFileSync('c:/projetos/DRF-Web-Back/ssl/variedades_digitalrf_com_br/pem/privkey.pem', 'utf8');
const certificate = fs.readFileSync('c:/projetos/DRF-Web-Back/ssl/variedades_digitalrf_com_br/pem/cert.pem', 'utf8');
const ca = fs.readFileSync('c:/projetos/DRF-Web-Back/ssl/variedades_digitalrf_com_br/pem/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate, ca: ca };

const corsOptions = {
    origin: ['https://localhost', 
      'https://unpkg.com/@fortawesome/fontawesome-free@6.2.1/webfonts/fa-solid-900.woff2',
      'https://unpkg.com/@fortawesome/fontawesome-free@6.2.1/webfonts/fa-solid-900.ttf',
       'http://localhost', 'http://localhost:8100', 'https://localhost:8100', 'https://192.168.100.122:8100', 'https://drfwebpedidos.web.app', 'https://10.0.0.104:8100','https://digitalrfweb.web.app', 'https://drf-garagem.web.app','https://drfweb-garagem.web.app', 'https://drfweb-booker.web.app', 'https://drf-inventario.web.app', 'https://drf-trocaprecos.web.app'], // Substitua pelo domínio que deseja permitir 
    //origin: 'http://localhost:8100',
    methods: ['GET', 'POST'], // Especifique os métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Especifique os cabeçalhos permitidos
  };

const httpsServer = https.createServer(credentials, app);

const io = new Server(httpsServer, {cors: {
  origin: "*",
},
maxHttpBufferSize: 1e8,});

//> rotas da api fasthelp
const index = require("./routes/index");
const drfWeb = require("./routes/drfWeb.routes");
const drfWebPostoTeles = require("./routes/drfWebPostoTeles.routes");
const drfWebPostoRedeAlex = require("./routes/drfWebPostoRedeAlex.routes");
const drfWebGaragem = require("./routes/drfWebGaragem.routes");
const drfWebGaragemME = require("./routes/drfWebGaragemME.routes");
const drfWebContabil = require("./routes/drfWebContabil.routes");
const drfWebInventario = require("./routes/drfWebInventario.routes");
const drfPriceSwap = require("./routes/drfPriceSwap");
const drfPedidos = require("./routes/drfPedidos");
const drfConstrutora = require("./routes/drfConstrutora.routes");

app.use(express.urlencoded({extended: true}, {limit: "50mb"}));
app.use(express.json({limit: "50mb"})); // dizendo que minha api vai retornar para o front dados em json
app.use(express.json({type: "application/vnd.api+json"}));
app.use(cors(corsOptions));

app.use(index);
app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));
app.use("/drfWeb/", drfWeb);
app.use("/drfWebPostoTeles/", drfWebPostoTeles);
app.use("/drfWebPostoRedeAlex/", drfWebPostoRedeAlex);
app.use("/drfWebGaragem/", drfWebGaragem);
app.use("/drfWebGaragemME/", drfWebGaragemME);
app.use("/drfWebContabil/", drfWebContabil);
app.use("/drfWebInventario/", drfWebInventario);
app.use("/drfPriceSwap/", drfPriceSwap);
app.use("/drfPedidos/", drfPedidos);
app.use("/drfConstrutora/", drfConstrutora);

module.exports = { httpsServer, io };