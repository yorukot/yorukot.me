export const contact = {
    heading: 'CONTACT',
    email: {
        title: 'Get in touch',
        note: 'I love getting emails, so feel free to write me about anything.',
        href: 'mailto:hi@yorukot.me',
        value: 'hi@yorukot.me',
    },
    donate: {
        label: 'Donate',
        href: 'https://yorukot.me/sponsor',
        value: 'Ko-fi',
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
