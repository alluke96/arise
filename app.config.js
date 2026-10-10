/**
 * Configuração dinâmica por cima do app.json.
 *
 * O caminho base /arise/app (GitHub Pages) vale SÓ para o build web
 * (scripts/build-web.mjs define ARISE_WEB=1). No iPhone pelo Expo Go e nos
 * builds nativos ele não entra: lá não existe caminho de site.
 */
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.ARISE_WEB === '1' ? { baseUrl: '/arise/app' } : {}),
  },
});
