export const environment = {
  // Relative (no leading slash) so it resolves against the document <base href>.
  // Behind the Colossus ingress the app is mounted at /<image-name>/ and that
  // prefix is stripped before the request reaches NestJS, so `api` resolves to
  // /<image-name>/api/* in the browser -> /api/* at the pod. A leading-slash
  // '/api' would bypass the base href and 404 at the domain root.
  production: true,
  apiUrl: 'api',
};
