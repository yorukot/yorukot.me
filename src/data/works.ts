export const works = {
    heading: 'MY WORKS',
    intro: 'A simple list of projects, tools, and experiments I have worked on or keep improving.',
    works: [
        {
            id: '#001',
            status: 'Active',
            type: 'Open source',
            title: 'superfile',
            href: 'https://github.com/yorukot/superfile',
            description:
                'A modern terminal file manager focused on speed, clean interactions, and keyboard-first workflows.',
        },
        {
            id: '#002',
            status: 'Active',
            type: 'CLI / TUI',
            title: 'Terminal tools',
            href: 'https://github.com/yorukot',
            description:
                'Small command-line and terminal UI utilities for improving everyday development workflows.',
        },
        {
            id: '#003',
            status: 'Built',
            type: 'Web',
            title: 'Full-stack web apps',
            href: 'https://github.com/yorukot',
            description:
                'Web products and dashboards with practical interfaces, backend services, and clean deployment paths.',
        },
        {
            id: '#004',
            status: 'Built',
            type: 'Automation',
            title: 'Bots and automations',
            href: 'https://github.com/yorukot',
            description:
                'Scripts, bots, and services that remove repetitive work or connect tools that should talk to each other.',
        },
        {
            id: '#005',
            status: 'Ongoing',
            type: 'Lab',
            title: 'Experiments',
            href: 'https://github.com/yorukot',
            description:
                'Focused builds for learning systems, testing ideas, and turning curiosity into something usable.',
        },
    ],
} as const;
