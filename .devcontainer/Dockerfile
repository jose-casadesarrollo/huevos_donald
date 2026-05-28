FROM mcr.microsoft.com/devcontainers/base:2.0.4-noble

# Install Node.js 22 LTS (provides node/npm/npx) via NodeSource so it
# survives container rebuilds. Needed for the Next.js + HeroUI app.
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# use this Dockerfile to install additional tools you might need, e.g.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>
