/* Gerado por scripts/build-web.mjs — não editar. */
const VERSION = "409f432f6a8a";
const CACHE = 'arise-' + VERSION;
const BASE = new URL('./', self.location).href;
const FILES = ["./","./_expo/static/js/web/entry-fe74df2cf7b5c9ecf72ac547687545f5.js","./assets/npm/@expo-google-fonts/barlow/100Thin/Barlow_100Thin.72e9db32bda6dbdfd6da0e9d74420ad0.ttf","./assets/npm/@expo-google-fonts/barlow/100Thin_Italic/Barlow_100Thin_Italic.8f3831b74d2837bafff3b3b802929c49.ttf","./assets/npm/@expo-google-fonts/barlow/200ExtraLight/Barlow_200ExtraLight.f7e57760641fada9e5bbab93c12e3614.ttf","./assets/npm/@expo-google-fonts/barlow/200ExtraLight_Italic/Barlow_200ExtraLight_Italic.98958f423d96a38619408113e1a423de.ttf","./assets/npm/@expo-google-fonts/barlow/300Light/Barlow_300Light.2f88cf8762c53a8be3c3ec53b8e01edf.ttf","./assets/npm/@expo-google-fonts/barlow/300Light_Italic/Barlow_300Light_Italic.2a4be013f41213c4cca8db8449754665.ttf","./assets/npm/@expo-google-fonts/barlow/400Regular/Barlow_400Regular.9373fb661b5c2954ab84d1b7f42774fe.ttf","./assets/npm/@expo-google-fonts/barlow/400Regular_Italic/Barlow_400Regular_Italic.ed7d4bb9c5638c38a28ccd3149b334fb.ttf","./assets/npm/@expo-google-fonts/barlow/500Medium/Barlow_500Medium.bdffb48240a3383080812d6830ff6f54.ttf","./assets/npm/@expo-google-fonts/barlow/500Medium_Italic/Barlow_500Medium_Italic.4257d524ad11d173176df62fc3c03c60.ttf","./assets/npm/@expo-google-fonts/barlow/600SemiBold/Barlow_600SemiBold.29527ab52af2334e2bcb6290c8692f70.ttf","./assets/npm/@expo-google-fonts/barlow/600SemiBold_Italic/Barlow_600SemiBold_Italic.089c2031b86f3a8575428e825ab26dbf.ttf","./assets/npm/@expo-google-fonts/barlow/700Bold/Barlow_700Bold.72871854aabdd7a79c4fc5038cb4faaf.ttf","./assets/npm/@expo-google-fonts/barlow/700Bold_Italic/Barlow_700Bold_Italic.4b570971567053b1204438e248a88b30.ttf","./assets/npm/@expo-google-fonts/barlow/800ExtraBold/Barlow_800ExtraBold.12075155b398a9e6cc43cb03300e00de.ttf","./assets/npm/@expo-google-fonts/barlow/800ExtraBold_Italic/Barlow_800ExtraBold_Italic.b9bbe6d5299b39c2c272653a245e8d60.ttf","./assets/npm/@expo-google-fonts/barlow/900Black/Barlow_900Black.3259b9d5da281613ed918c9d165c20a5.ttf","./assets/npm/@expo-google-fonts/barlow/900Black_Italic/Barlow_900Black_Italic.24404d87029dab428f1102872581bd7f.ttf","./assets/npm/@expo-google-fonts/chakra-petch/300Light/ChakraPetch_300Light.3f9c4b4859854edd76044d5fd59f1cd8.ttf","./assets/npm/@expo-google-fonts/chakra-petch/300Light_Italic/ChakraPetch_300Light_Italic.6c820b8f98fea627fbeeeb954b481b40.ttf","./assets/npm/@expo-google-fonts/chakra-petch/400Regular/ChakraPetch_400Regular.12c7b5f81aa7ab4781673a2a4cf69b5c.ttf","./assets/npm/@expo-google-fonts/chakra-petch/400Regular_Italic/ChakraPetch_400Regular_Italic.a822a551828b4787a05c6487b7bc782c.ttf","./assets/npm/@expo-google-fonts/chakra-petch/500Medium/ChakraPetch_500Medium.4780773bba5e260130580694d237c910.ttf","./assets/npm/@expo-google-fonts/chakra-petch/500Medium_Italic/ChakraPetch_500Medium_Italic.d679092f2e53af6283cf086943c72621.ttf","./assets/npm/@expo-google-fonts/chakra-petch/600SemiBold/ChakraPetch_600SemiBold.2c5f0890be62b29479ab1453e038fbbf.ttf","./assets/npm/@expo-google-fonts/chakra-petch/600SemiBold_Italic/ChakraPetch_600SemiBold_Italic.6b3f7f26bfd04ffa5d4c22a7d3ad8e14.ttf","./assets/npm/@expo-google-fonts/chakra-petch/700Bold/ChakraPetch_700Bold.905455c99ecaff560f87ca42f904c0a8.ttf","./assets/npm/@expo-google-fonts/chakra-petch/700Bold_Italic/ChakraPetch_700Bold_Italic.79e23734147404f65b4d6e544c5c7a06.ttf","./assets/npm/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png","./assets/npm/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png","./assets/npm/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png","./assets/npm/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png","./assets/npm/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png","./assets/npm/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png","./assets/npm/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png","./assets/npm/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png","./assets/npm/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png","./assets/npm/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png","./assets/npm/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png","./assets/npm/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png","./assets/npm/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png","./assets/npm/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png","./assets/npm/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png","./assets/npm/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png","./assets/npm/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png","./assets/npm/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png","./favicon.ico","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./index.html","./manifest.webmanifest","./metadata.json","./vendor/sql-wasm.js","./vendor/sql-wasm.wasm"];

// Instala: baixa o app INTEIRO de uma vez. Só ativa se tudo chegou.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(new URL(f, BASE), { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

// Ativa: apaga caches de versões antigas. Os DADOS ficam no IndexedDB e não
// são tocados por aqui.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('arise-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Offline primeiro: tudo vem do cache. Navegação (abrir o app, recarregar
// numa rota) sempre recebe o index.html guardado.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(BASE)) return;
  if (req.mode === 'navigate') {
    event.respondWith(caches.match(new URL('./index.html', BASE).href).then((r) => r || fetch(req)));
    return;
  }
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
