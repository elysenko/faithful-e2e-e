# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Copy the README as a minimal index page so the deployment has content to serve.
# This repo is currently empty (only README.md + .github/); the container just
# proves ingress + service + pod wiring work end-to-end.
RUN mkdir -p /usr/share/nginx/html
COPY README.md /usr/share/nginx/html/README.md

RUN printf '%s\n' \
  '<!doctype html>' \
  '<html><head><meta charset="utf-8"><title>faithful-e2e-e</title></head>' \
  '<body><h1>faithful-e2e-e</h1><p>Repository is empty; placeholder deploy.</p>' \
  '<p><a href="README.md">README.md</a></p></body></html>' \
  > /usr/share/nginx/html/index.html

RUN printf '%s\n' \
  'server {' \
  '    listen 8080;' \
  '    root /usr/share/nginx/html;' \
  '    location / { try_files $uri $uri/ /index.html; }' \
  '    location = /api/health { return 200 "ok\n"; add_header Content-Type text/plain; }' \
  '}' \
  > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
