/**
 * arquivo: config/database.js
 * descriçao: arquivo responsavel pelas requisiçoes no banco de dados (connection strings)
 * data: 14/03/2022
 * autor: Renato Filho
*/

const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

//=> conexao com a base de dados
const pool = new Pool({
     connectionString: process.env.DATABASE_URL // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const poolGaragem = new Pool({
    connectionString: process.env.DATABASE_URL_GARAGEM // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const poolContabil = new Pool({
    connectionString: process.env.DATABASE_URL_CONTABIL // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const poolInventario = new Pool({
    connectionString: process.env.DATABASE_URL_INVENTARIO // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const pool_beirario = new Pool({
    connectionString: process.env.DATABASE_URL_LINX_BEIRARIO // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const pool_urbanos = new Pool({
    connectionString: process.env.DATABASE_URL_LINX_URBANOS // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const pool_variedades = new Pool({
    connectionString: process.env.DATABASE_URL_LINX_VARIEDADES // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const pool_webpostoTeles = new Pool({
    connectionString: process.env.DATABASE_URL_WEBPOSTOTELES // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const pool_webpostoRedeAlex = new Pool({
    connectionString: process.env.DATABASE_URL_WEBPOSTOREDEALEX // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const pool_trocaprecos = new Pool({
    connectionString: process.env.DATABASE_URL_TROCAPRECOS // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const pool_drfPedidos = new Pool({
    connectionString: process.env.DATABASE_URL_DRFPEDIDO // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const pool_contabil= new Pool({
    connectionString: process.env.DATABASE_URL_CONTABIL // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});

const pool_construtora = new Pool({
    connectionString: process.env.DATABASE_URL_DRFCONSTRUTORA // metodo espera uma strig de conexao com a base e dessa forma ocultamos nossa string
});


// eslint-disable-next-line no-unused-vars
pool.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

poolGaragem.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

poolContabil.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

poolInventario.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

pool_webpostoTeles.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

pool_webpostoTeles.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});

pool_webpostoRedeAlex.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

pool_webpostoRedeAlex.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});


pool.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});



poolGaragem.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});


poolContabil.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});

poolInventario.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});


pool_beirario.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

pool_beirario.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});

pool_urbanos.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

pool_urbanos.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});

pool_variedades.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

pool_variedades.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});

pool_trocaprecos.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});

pool_trocaprecos.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

pool_drfPedidos.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});

pool_drfPedidos.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

pool_contabil.on("connect", () =>{
    //console.log("Base de dados conectada com sucesso!");
});

pool_contabil.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

pool_construtora.on("connect", () =>{
    console.log("Base de dados conectada com sucesso!");
});

pool_construtora.on("error", (err, client) =>{ // se der erro de conexao ele fecha o processo
    console.log("Unexpected erros on idle client", err);
    process.exit(-1);
});

const queryGaragem = async (text, params, transaction = false) => {
    const client = await poolGaragem.connect();
    try {
        //console.log('Executando script:', text);
        if (params) {
            //console.log('Com parâmetros:', params);
        }
        if (transaction) await client.query('BEGIN');
        const res = await client.query(text, params);
        if (transaction) await client.query('COMMIT');
        return res;
    } catch (err) {
        if (transaction) await client.query('ROLLBACK');
        console.log(err.stack);
        throw err;
    } finally {
        client.release();
    }
};

const queryPedido = async (text, params, transaction = false) => {
    const client = await pool_drfPedidos.connect();
    try {
        console.log('Executando script:', text);
        if (params) {
            console.log('Com parâmetros:', params);
        }
        if (transaction) await client.query('BEGIN');
        const res = await client.query(text, params);
        if (transaction) await client.query('COMMIT');
        return res;
    } catch (err) {
        if (transaction) await client.query('ROLLBACK');
        console.log(err.stack);
        throw err;
    } finally {
        client.release();
    }
};

const queryContabil = async (text, params, transaction = false) => {
    const client = await pool_contabil.connect();
    try {
        //console.log('Executando script:', text);
        if (params) {
            //console.log('Com parâmetros:', params);
        }
        //if (transaction) await client.query('BEGIN');
        const res = await client.query(text, params);
       // if (transaction) await client.query('COMMIT');
        return res;
    } catch (err) {
        if (transaction) await client.query('ROLLBACK');
        console.log(err);
        throw err;
    } finally {
        client.release();
    }
};

const queryConstrutora = async (text, params, transaction = false) => {
    const client = await pool_construtora.connect();
    try {
        console.log('Executando script:', text);
        if (params) {
            console.log('Com parâmetros:', params);
        }
        //if (transaction) await client.query('BEGIN');
        const res = await client.query(text, params);
        //if (transaction) await client.query('COMMIT');
        return res;
    } catch (err) {
        if (transaction) await client.query('ROLLBACK');
        console.log(err.stack);
        throw err;
    } finally {
        client.release();
    }
};

const query_beirario = async (text, params, transaction = false) => {
    const client = await pool_beirario.connect();
    try {
        console.log('Executando script:', text);
        if (params) {
            console.log('Com parâmetros:', params);
        }
        if (transaction) await client.query('BEGIN');
        const res = await client.query(text, params);
        if (transaction) await client.query('COMMIT');
        return res;
    } catch (err) {
        if (transaction) await client.query('ROLLBACK');
        console.log(err.stack);
        throw err;
    } finally {
        client.release();
    }
};

const query_webpostoteles = async (text, params, transaction = false) => {
    const client = await pool_webpostoTeles.connect();
    try {
        console.log('Executando script:', text);
        if (params) {
            console.log('Com parâmetros:', params);
        }
        if (transaction) await client.query('BEGIN');
        const res = await client.query(text, params);
        if (transaction) await client.query('COMMIT');
        return res;
    } catch (err) {
        if (transaction) await client.query('ROLLBACK');
        console.log(err.stack);
        throw err;
    } finally {
        client.release();
    }
};

const query_webpostoRedeAlex = async (text, params, transaction = false) => {
    const client = await pool_webpostoRedeAlex.connect();
    try {
        //console.log('Executando script:', text);
        if (params) {
            //console.log('Com parâmetros:', params);
        }
        if (transaction) await client.query('BEGIN');
        const res = await client.query(text, params);
        if (transaction) await client.query('COMMIT');
        return res;
    } catch (err) {
        if (transaction) await client.query('ROLLBACK');
        console.log(err.stack);
        throw err;
    } finally {
        client.release();
    }
};

const transaction = async (callback) => {
    const client = await pool_webpostoRedeAlex.connect();
    try {
      await client.query('BEGIN');
      console.debug('Transação iniciada');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      console.debug('Transação commitada com sucesso');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Transação revertida devido a erro:', err.stack);
      throw err;
    } finally {
      client.release();
      console.debug('Cliente liberado de volta para o pool');
    }
  };

module.exports = {
    query: (text, params) => {
        return pool.connect()
            .then((client) => {
                return client.query(text, params)
                    .then((res) => {
                        console.log('Executando script:', text);
                        console.log('Com parâmetros:', params);
                        client.release();
                        return res;
                    })
                    .catch((err) => {
                        client.release();
                        console.log(err.stack);
                    });
            });
    },
    queryGaragem,
    queryContabil,
    queryInventario: (text, params) => {
        console.log(text);
        return poolInventario.connect()
            .then((client) => {
                return client.query(text, params)
                    .then((res) => {
                        client.release();
                        return res;
                    })
                    .catch((err) => {
                        client.release();
                        console.log(err.stack);
                    });
            });
    },
    query_beirario,
    query_urbanos: (text, params) => {
        console.log(text);
        return pool_urbanos.connect()
            .then((client) => {
                return client.query(text, params)
                    .then((res) => {
                        client.release();
                        return res;
                    })
                    .catch((err) => {
                        client.release();
                        console.log(err.stack);
                    });
            });
    },
    query_variedades: (text, params) => {
        console.log(text);
        return pool_variedades.connect()
            .then((client) => {
                return client.query(text, params)
                    .then((res) => {
                        client.release();
                        return res;
                    })
                    .catch((err) => {
                        client.release();
                        console.log(err.stack);
                    });
            });
    },
    query_webpostoteles,
    query_webpostoRedeAlex,
    transaction,
    query_trocaprecos: (text, params) => {
        console.log(text);
        return pool_trocaprecos.connect()
            .then((client) => {
                return client.query(text, params)
                    .then((res) => {
                        client.release();
                        return res;
                    })
                    .catch((err) => {
                        client.release();
                        console.log(err.stack);
                    });
            });
    },
    queryPedido,
    queryConstrutora
};









