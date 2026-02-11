const PROXY_CONFIG = {
  "/drfPriceSwap": {
    target: "http://localhost:3000", // Backend local
    secure: false,
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
