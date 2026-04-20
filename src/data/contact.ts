export const contact = {
    heading: 'CONTACT',
    intro: 'Reach me directly, follow the code, support the open-source work I keep building, or get in touch about work opportunities.',
    donate: {
        label: 'Donate',
        title: 'Support my work',
        href: 'https://yorukot.me/sponsor',
        description:
            'Help keep the tools, experiments, and open-source projects moving.',
    },
    channels: [
        {
            label: 'Email',
            href: 'mailto:hi@yorukot.me',
            value: 'hi@yorukot.me',
            description:
                'For project questions, collaboration, and anything better sent directly.',
        },
        {
            label: 'GitHub',
            href: 'https://yorukot.me/github',
            value: '@yorukot',
            description:
                'Code, issues, pull requests, releases, and open-source work.',
        },
        {
            label: 'Discord',
            href: 'https://yorukot.me/discord',
            value: 'yoru.kot',
            description:
                'Fast messages, community chats, and development conversations.',
        },
        {
            label: 'Telegram',
            href: 'https://yorukot.me/telegram',
            value: '@yorukot',
            description:
                'Short updates and direct messages when Telegram is easier.',
        },
    ],
} as const;
