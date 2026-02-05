import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  courseSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Part 1: React Fundamentals',
      collapsed: false,
      items: [
        'chapters/00-react-architecture',
        'chapters/01-setup-first-component',
        'chapters/02-state-and-events',
        'chapters/03-component-composition',
        'chapters/04-side-effects-lifecycle',
        'chapters/05-context-global-state',
        'chapters/06-custom-hooks',
      ],
    },
    {
      type: 'category',
      label: 'Part 2: Routing & Forms',
      collapsed: true,
      items: [
        'chapters/07-react-router',
        'chapters/08-forms-validation',
      ],
    },
    {
      type: 'category',
      label: 'Part 3: Tailwind CSS',
      collapsed: true,
      items: [
        'chapters/09-tailwind-fundamentals',
        'chapters/10-advanced-tailwind',
      ],
    },
    {
      type: 'category',
      label: 'Part 4: shadcn/ui',
      collapsed: true,
      items: [
        'chapters/11-shadcn-setup-core',
        'chapters/12-shadcn-complex-components',
        'chapters/13-data-display',
        'chapters/14-shadcn-forms',
        'chapters/15-theming-polish',
      ],
    },
    {
      type: 'category',
      label: 'Part 5: Production',
      collapsed: true,
      items: [
        'chapters/16-performance',
        'chapters/17-testing',
      ],
    },
  ],
};

export default sidebars;
