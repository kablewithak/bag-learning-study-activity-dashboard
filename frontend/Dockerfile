FROM node:20-alpine

ENV NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_FETCH_RETRIES=10 \
    NPM_CONFIG_FETCH_RETRY_FACTOR=2 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=300000 \
    NPM_CONFIG_MAXSOCKETS=1

WORKDIR /app

COPY package.json package-lock.json ./

# The dashboard runs Vite from devDependencies. Make that inclusion explicit
# and fail the image build if Vite's executable is not available at runtime.
RUN set -eux; \
    attempt=1; \
    until npm ci --include=dev --no-audit --no-fund --loglevel=warn; do \
        if [ "$attempt" -ge 3 ]; then \
            exit 1; \
        fi; \
        rm -rf node_modules /root/.npm/_cacache; \
        sleep $((attempt * 15)); \
        attempt=$((attempt + 1)); \
    done; \
    test -x ./node_modules/.bin/vite; \
    ./node_modules/.bin/vite --version

COPY . ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
