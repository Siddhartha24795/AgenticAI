/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // These packages are required by Genkit's OpenTelemetry integration,
    // but are not compatible with the client-side browser environment.
    // We also mark them as external on the server to prevent Webpack
    // from trying to process them, which can cause errors.
    config.externals.push('@opentelemetry/exporter-jaeger');
    config.externals.push('@opentelemetry/winston-transport');

    return config;
  },
};

module.exports = nextConfig;
