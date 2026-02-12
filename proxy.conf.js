const PROXY_CONFIG = {
  "/drfPriceSwap": {
    target: "https://trocaprecoback-production-8514.up.railway.app", // Backend Railway
    secure: true,
    changeOrigin: true,
    logLevel: "debug",
    onProxyReq: function (proxyReq, req, res) {
      console.log("Proxy Request:", req.method, req.url);
    },
    onProxyRes: function (proxyRes, req, res) {
      console.log("Proxy Response:", proxyRes.statusCode, req.url);
    },
    onError: function (err, req, res) {
      console.error("Proxy Error:", err);
    },
  },
};

module.exports = PROXY_CONFIG;
