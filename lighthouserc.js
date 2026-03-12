# Lighthouse CI Configuration

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'ready in',
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/search?q=kenya',
        'http://localhost:4173/post/0ab4d6e4-c4ff-4044-8988-cc85a2340f79',
      ],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        
        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'valid-lang': 'error',
        
        // Best Practices
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'errors-in-console': 'off', // Too strict for development
        
        // SEO
        'categories:seo': ['warn', { minScore: 0.9 }],
        'meta-description': 'error',
        'document-title': 'error',
        
        // PWA (Optional)
        'categories:pwa': 'off',
        
        // Custom assertions
        'unused-javascript': ['warn', { maxLength: 1 }],
        'modern-image-formats': ['warn', { maxLength: 0 }],
        'offscreen-images': 'warn',
        'uses-responsive-images': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
      // Or use GitHub:
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },
  },
};
