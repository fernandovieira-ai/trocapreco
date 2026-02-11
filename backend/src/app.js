/**
 * arquivo: app.js
 * descrição: arquivo responsável por fazer a configuração do express
 * data: 29/01/2026
 */

const express = require("express");
const cors = require("cors");

const app = express();

const corsOptions = {
  origin: [
    "http://localhost",
    "http://localhost:4200",
    "http://localhost:8100",
    "http://192.168.100.12:4200",
    "https://drf-trocaprecos.web.app",
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

//> rotas da api trocapreco
const index = require("./routes/index");
const drfPriceSwap = require("./routes/drfPriceSwap");

app.use(express.urlencoded({ extended: true }, { limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.json({ type: "application/vnd.api+json" }));
app.use(cors(corsOptions));

app.use(index);
app.use("/drfPriceSwap/", drfPriceSwap);

module.exports = app;
