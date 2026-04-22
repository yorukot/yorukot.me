export const work = {
    heading: 'MY WORK',
    intro: 'Projects, tools, games, and experiments I have built or keep improving.',
    work: [
        {
            id: '#001',
            status: 'GitHub Trending',
            type: 'TUI',
            title: 'superfile',
            href: 'https://github.com/yorukot/superfile',
            description:
                'Pretty fancy and modern terminal file manager written in Go, with intuitive navigation, file operations, and customizable themes.',
            tags: ['Go', 'Terminal', 'TUI'],
        },
        {
            id: '#002',
            status: 'Live',
            type: 'SSH TUI',
            title: 'ssh.yorukot.me',
            href: 'https://github.com/yorukot/ssh.yorukot.me',
            description:
                'An SSH-powered version of my personal website, built in Go so visitors can browse my intro and blog directly from the terminal.',
            tags: ['Go', 'SSH', 'TUI'],
        },
        {
            id: '#003',
            status: 'Live',
            type: 'Website',
            title: 'Personal website',
            href: '/blog/',
            description:
                'This portfolio and blog built with Astro, featuring a responsive layout, strong SEO defaults, and fast static-first pages.',
            tags: ['Astro', 'Tailwind CSS'],
        },
        {
            id: '#004',
            status: '1M+ Users',
            type: 'Discord Bot',
            title: 'MHCAT',
            href: 'https://github.com/yorukot/MHCAT',
            description:
                'A Discord bot for server management and utility features, built with Discord.js and MongoDB and used by a large server network.',
            tags: ['JavaScript', 'MongoDB'],
        },
        {
            id: '#005',
            status: 'Built',
            type: 'CLI',
            title: 'tmlshock',
            href: 'https://github.com/yorukot/tmlshock',
            description:
                'A terminal clock, timer, and stopwatch built with Go for simple time tracking from the command line.',
            tags: ['Go', 'Terminal', 'CLI'],
        },
        {
            id: '#006',
            status: 'Ongoing',
            type: 'Web',
            title: 'Full Stack',
            description:
                'Small useful or playful websites built while exploring product ideas, web stacks, and interface patterns.',
            tags: ['System Design', 'PostgreSQL', 'Redis', 'React', 'Next.JS'],
        },
        {
            id: '#007',
            status: 'Community',
            type: 'Volunteer',
            title: 'SITCON',
            description:
                'Joined the SITCON community as a volunteer, contributing as a speaker, staff member, and SITCON Camp staff.',
            tags: ['Community', 'Volunteer'],
        },
    ],
} as const;
