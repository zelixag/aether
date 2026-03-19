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
      { text: 'Architecture', link: '/architecture' },
      { text: 'RFC', link: '/rfc/ROADMAP' },
      { text: 'Examples', link: '/examples/counter' },
      { text: 'GitHub', link: 'https://github.com/zelixag/aether' },
    ],
    sidebar: {
      '/api/': [
        {
          text: 'Reactive Macros',
          items: [
            { text: '$state', link: '/api/$state' },
            { text: '$derived', link: '/api/$derived' },
            { text: '$effect', link: '/api/$effect' },
          ]
        },
        {
          text: 'Built-in Features',
          items: [
            { text: '$store', link: '/api/$store' },
            { text: '$async', link: '/api/$async' },
            { text: '$style', link: '/api/$style' },
            { text: 'Router', link: '/api/router' },
            { text: 'mount', link: '/api/mount' },
          ]
        }
      ],
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/concepts' },
          ]
        }
      ],
      '/architecture': [
        {
          text: 'Deep Dive',
          items: [
            { text: 'Architecture', link: '/architecture' },
            { text: 'Performance', link: '/performance' },
          ]
        }
      ],
      '/rfc/': [
        {
          text: 'RFC & Roadmap',
          items: [
            { text: 'Roadmap', link: '/rfc/ROADMAP' },
            { text: 'Competitive Analysis', link: '/rfc/COMPETITIVE-ANALYSIS' },
            { text: 'RFC-001: SSR Support', link: '/rfc/001-ssr-support' },
            { text: 'RFC-002: CLI Scaffolding', link: '/rfc/002-cli-scaffolding' },
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
