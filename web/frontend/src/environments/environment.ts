export const environment = {
  // Relative (no leading slash) so it resolves against the document <base href>.
  // In dev the base href is '/', so `api` -> /api/* which proxy.conf.json
  // forwards to the NestJS dev server. See environment.prod.ts for the
  // ingress-sub-path rationale.
  production: false,
  apiUrl: 'api',
};
