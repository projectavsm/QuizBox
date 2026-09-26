/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '192.168.1.71',
    'localhost:3000',
    '*.ngrok-free.app',
    '*.ngrok.io',
  ],
};

module.exports = nextConfig;