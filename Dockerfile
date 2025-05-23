# Build Stage to generate dist
FROM node:18 AS build-stage

# Install required dependency for building dist
# We want the latest versions of system packages, so not pinning
# hadolint ignore=DL3008
RUN apt-get update && \
    apt-get upgrade --assume-yes && \
    apt-get install \
    --assume-yes --no-install-recommends \
    software-properties-common git && \
    apt-get clean && \
    rm --recursive --force /var/lib/apt/lists/*

WORKDIR /apps/cyware
COPY . /apps/cyware

# Building dist
RUN npm install && npm run build


# Productin stage image
FROM packages.cyware.com/images/hci-ubi9-minimal:9 AS production-stage
USER root

# Install NGINX
# We want the latest versions of system packages, so not pinning
# hadolint ignore=DL3041
RUN microdnf upgrade --assumeyes && \
    microdnf install \
    --setopt=install_weak_deps=0 \
    --setopt=reposdir=/etc/yum.repos.d/ \
    --nodocs --assumeyes \
    nginx gettext && \
    microdnf clean all --assumeyes

WORKDIR /apps/cyware

# Copy required nginx config files in build
COPY nginx/nginx.conf /etc/nginx/nginx.conf.template
COPY entrypoint.sh /apps/cyware

# Copy dist folder from build-stage
COPY --from=build-stage /apps/cyware/dist /usr/share/nginx/static-files/csap-dist/dist

# Create and initialize files and adjust permissions
ARG USERNAME=default
RUN mkdir --parents /var/log/nginx && \
    mkdir --parents /etc/nginx/config && \
    chown --recursive ${USERNAME}:${USERNAME} /var/lib/nginx && \
    chown --recursive ${USERNAME}:${USERNAME} /etc/nginx/config && \
    chown ${USERNAME}:${USERNAME} /var/log/nginx /etc/nginx/nginx.conf /etc/nginx/conf.d;

# Switch to the lower privileged user
USER ${USERNAME}
ENV HOME=/home/${USERNAME}

EXPOSE 8080
ENTRYPOINT ["bash","entrypoint.sh"]