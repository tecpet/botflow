#!/bin/bash

set -e

echo "🔧 Configurando ambiente runtime..."
cd apps/viewer;
node -e "const { configureRuntimeEnv } = require('next-runtime-env/build/configure'); configureRuntimeEnv();"
cd ../..;

echo "🚀 Iniciando aplicação..."
echo "🌐 HOSTNAME: ${HOSTNAME:-0.0.0.0}"
echo "🔌 PORT: ${PORT:-3000}"

# Forçar Next.js a escutar em 0.0.0.0
export HOSTNAME=0.0.0.0
export PORT=${PORT:-3000}

# Aguardar um pouco para garantir que tudo está pronto
sleep 2

# Iniciar o servidor
NODE_OPTIONS="--no-node-snapshot" node apps/viewer/server.js