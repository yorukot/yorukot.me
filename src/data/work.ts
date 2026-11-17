export const work = {
    heading: 'MY WORK',
    work: [
        {
            id: '#001',
            type: 'TUI',
            title: 'superfile',
            image: 'superfile.webp',
            href: 'https://github.com/yorukot/superfile',
            description:
                'Pretty fancy and modern terminal file manager written in Go, with intuitive navigation, file operations, and customizable themes.',
        },
        {
            id: '#002',
            type: 'SSH TUI',
            title: 'ssh.yorukot.me',
            image: 'ssh-yorukot-me.png',
            href: 'https://github.com/yorukot/ssh.yorukot.me',
            description:
                'An SSH-powered version of my personal website, built in Go so visitors can browse my intro and blog directly from the terminal.',
        },
        {
            id: '#003',
            type: 'Website',
            title: 'Personal website',
            href: '/blog/',
            description:
                'This portfolio and blog built with Astro, featuring a responsive layout, strong SEO defaults, and fast static-first pages.',
        },
        {
            id: '#004',
            type: 'Discord Bot',
            title: 'MHCAT',
            href: 'https://github.com/yorukot/MHCAT',
            description:
                'A Discord bot for server management and utility features, built with Discord.js and MongoDB and used by a large server network.',
        },
        {
            id: '#005',
            type: 'CLI',
            title: 'tmlshock',
            href: 'https://github.com/yorukot/tmlshock',
            description:
                'A terminal clock, timer, and stopwatch built with Go for simple time tracking from the command line.',
        },
        {
            id: '#006',
            type: 'Volunteer',
            title: 'SITCON',
            href: 'https://sitcon.org',
            description:
                'Joined the SITCON community as a volunteer, contributing as a speaker, staff member, and SITCON Camp staff.',
        },
    ],
} as const;
