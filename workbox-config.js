export default {
  globDirectory: "public/",
  globPatterns: [
    "**/*.{html,js,css,png,jpg,svg,json}"
  ],
  swDest: "sw.js",
  ignoreURLParametersMatching: [
    /^utm_/,
    /^fbclid$/
  ],
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.openai\.com\/v1/,
      handler: "NetworkFirst",
      options: {
        cacheName: "openai-api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        }
      }
    },
    {
      urlPattern: /^https:\/\/api\.pinecone\.io/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pinecone-api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        }
      }
    },
    {
      urlPattern: new RegExp("^https://(?:trello\\.com|api\\.trello\\.com)"),
      handler: "NetworkFirst",
      options: {
        cacheName: "trello-api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        }
      }
    },
    {
      urlPattern: new RegExp("^https://(?:notion\\.so|api\\.notion\\.com)"),
      handler: "NetworkFirst",
      options: {
        cacheName: "notion-api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        }
      }
    },
    {
      urlPattern: new RegExp("^https://(?:calendar\\.google\\.com|www\\.googleapis\\.com)"),
      handler: "NetworkFirst",
      options: {
        cacheName: "google-api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        }
      }
    },
    {
      // Cache font files
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-stylesheets",
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ]
}; 