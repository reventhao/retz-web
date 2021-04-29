module.exports = {
    devServer: {
        proxy: {
            "/api": {
                target: "http://127.0.0.1:5000",
                ws: true,
                secure: true,
                changeOrigin: true,
                pathRewrite: {
                    "/api": "/"
                }
            }
        }
    }
}