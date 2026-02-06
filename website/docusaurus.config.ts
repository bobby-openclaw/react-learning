import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Learn React by Building',
  tagline: 'A project-based React 19 curriculum — from mental models to production UI',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://bobby-openclaw.github.io',
  baseUrl: '/react-learning/',

  organizationName: 'bobby-openclaw',
  projectName: 'react-learning',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-live-codeblock', '@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/bobby-openclaw/react-learning/tree/main/website/',
          routeBasePath: '/', // Docs at root
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/react-learning-social.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Learn React',
      logo: {
        alt: 'React Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'courseSidebar',
          position: 'left',
          label: 'Course',
        },
        {
          href: 'https://github.com/bobby-openclaw/taskflow-app',
          label: 'TaskFlow Code',
          position: 'left',
        },
        {
          href: 'https://github.com/bobby-openclaw/react-learning',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Course',
          items: [
            { label: 'Part 1: React Fundamentals', to: '/category/part-1-react-fundamentals' },
            { label: 'Part 2: Tailwind CSS', to: '/category/part-2-tailwind-css' },
            { label: 'Part 3: shadcn/ui', to: '/category/part-3-shadcnui' },
          ],
        },
        {
          title: 'Resources',
          items: [
            { label: 'TaskFlow Companion Repo', href: 'https://github.com/bobby-openclaw/taskflow-app' },
            { label: 'React Docs', href: 'https://react.dev' },
            { label: 'Tailwind Docs', href: 'https://tailwindcss.com' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: 'https://github.com/bobby-openclaw/react-learning' },
          ],
        },
      ],
      copyright: `Built with React 19 in mind. Last updated ${new Date().getFullYear()}.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'tsx'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
