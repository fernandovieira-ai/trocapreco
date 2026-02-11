const { httpsServer } = require("./src/app");
const { socket } = require("./src/controllers/websocket.controller")

const port = process.env.port || 443;

httpsServer.listen(port, socket, () =>{
    console.log("Aplicação sendo executada na porta...: ", port);
});