ARG NGINX_IMAGE=nginx:stable-alpine@sha256:47928bf67eb62a1863cb08d9ecb52d3e704304ba614eaee17884204677702951
FROM ${NGINX_IMAGE}
ARG BUILD_REVISION=unversioned-local
LABEL org.opencontainers.image.revision="${BUILD_REVISION}"
COPY infra/docker/nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx frontend/ /usr/share/nginx/html/
USER nginx
EXPOSE 8080
STOPSIGNAL SIGQUIT
# Bypass mutable entrypoint templates; configuration is an explicit build artifact.
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
