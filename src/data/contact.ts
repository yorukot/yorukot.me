export const contact = {
    heading: 'CONTACT',
    intro: 'Reach me directly, follow the code, or support the open-source work I keep building.',
    donate: {
        label: 'Donate',
        title: 'Support my work',
        href: 'https://github.com/sponsors/yorukot',
        description:
            'Help keep the tools, experiments, and open-source projects moving.',
    },
    channels: [
        {
            label: 'Email',
            href: 'mailto:hello@yorukot.me',
            value: 'hello@yorukot.me',
            description:
                'For project questions, collaboration, and anything better sent directly.',
        },
        {
            label: 'GitHub',
            href: 'https://github.com/yorukot',
            value: '@yorukot',
            description:
                'Code, issues, pull requests, releases, and open-source work.',
        },
        {
            label: 'Discord',
            href: 'https://discord.com/users/yorukot',
            value: 'yorukot',
            description:
                'Fast messages, community chats, and development conversations.',
        },
        {
            label: 'Telegram',
            href: 'https://t.me/yorukot',
            value: '@yorukot',
            description:
                'Short updates and direct messages when Telegram is easier.',
        },
    ],
} as const;
