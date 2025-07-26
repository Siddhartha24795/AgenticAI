
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // These packages are required by Genkit's OpenTelemetry integration,
    // but are not compatible with the client-side browser environment.
    // We mark them as external to prevent them from being bundled for the client.
    if (!isServer) {
      config.externals.push('@opentelemetry/exporter-jaeger');
      config.externals.push('@opentelemetry/winston-transport');
    }

    return config;
  },
};

module.exports = nextConfig;
