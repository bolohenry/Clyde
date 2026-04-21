/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude the native Node.js ONNX runtime — browser uses onnxruntime-web (WASM)
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-node": false,
    };

    if (!isServer) {
      // Enable async WASM for @huggingface/transformers
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };

      // Treat .mjs files from node_modules as plain JS so Terser doesn't
      // choke on import.meta (used by onnxruntime-web)
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto",
      });
    }

    return config;
  },
};

export default nextConfig;
