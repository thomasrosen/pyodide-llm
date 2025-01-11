// import CopyWebpackPlugin from "copy-webpack-plugin";
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   webpack: (config, { isServer }) => {
//     if (isServer) {
//       config.plugins.push(
//         new CopyWebpackPlugin({
//           patterns: [
//             {
//               from: "pyodide", // Source folder
//               to: ".next/server/pyodide", // Destination in build
//             },
//           ],
//         })
//       );
//     }
//     return config;
//   },
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.module.exprContextCritical = false; // Suppress warnings for critical dependencies
      config.module.rules.push({
        test: /\.mjs$/,
        type: "javascript/auto", // Ensure Webpack processes .mjs files correctly
      });
    }
    return config;
  },
};

export default nextConfig;
