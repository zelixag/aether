import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Aether',
  description: 'Compile-time Reactive Framework - 100% TypeScript, No vDOM, No Hooks Rules',
  lang: 'en-US',
  base: '/aether/',

  head: [
    ['link', { rel: 'icon', href: '/aether/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#c45d35' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Aether Framework' }],
    ['meta', { property: 'og:description', content: 'Compile-time Reactive Framework' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/$state' },
      { text: 'Examples', link: '/examples/counter' },
      { text: 'GitHub', link: 'https://github.com/zelixag/aether' },
    ],
    sidebar: {
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: '$state', link: '/api/$state' },
            { text: '$derived', link: '/api/$derived' },
            { text: '$effect', link: '/api/$effect' },
            { text: '$store', link: '/api/$store' },
            { text: '$async', link: '/api/$async' },
            { text: '$style', link: '/api/$style' },
            { text: 'mount', link: '/api/mount' },
            { text: 'Router', link: '/api/router' },
          ]
        }
      ],
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/getting-started' },
            { text: 'Concepts', link: '/guide/concepts' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Counter', link: '/examples/counter' },
          ]
        }
      ],
    },
    footer: {
      message: 'MIT License',
      copyright: 'Copyright © 2024-present zelixag'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/zelixag/aether' }
    ]
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },

  ignoreDeadLinks: true
})
