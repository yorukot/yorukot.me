export const contact = {
    heading: 'CONTACT',
    intro: 'Find my writing, code, and the places where I am easiest to reach.',
    links: [
        {
            label: 'Blog',
            href: 'https://blog.yorukot.me',
            meta: 'Writing',
            description:
                'Notes, ideas, build logs, and longer thoughts about software.',
        },
        {
            label: 'GitHub',
            href: 'https://github.com/yorukot',
            meta: 'Code',
            description:
                'Open-source projects, tools, experiments, and active development work.',
        },
        {
            label: 'Email',
            href: 'mailto:hello@yorukot.me',
            meta: 'Direct',
            description:
                'Reach out for projects, questions, or anything that is better sent directly.',
        },
    ],
} as const;
