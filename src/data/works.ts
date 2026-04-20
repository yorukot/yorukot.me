export const works = {
    heading: 'MY WORKS',
    intro: 'Projects, tools, games, and experiments I have built or keep improving.',
    works: [
        {
            id: '#001',
            status: 'GitHub Trending',
            type: 'Terminal',
            title: 'superfile',
            href: 'https://github.com/yorukot/superfile',
            description:
                'Pretty fancy and modern terminal file manager written in Go, with intuitive navigation, file operations, and customizable themes.',
            tags: ['Go', 'Terminal', 'CLI', 'Bubble Tea'],
        },
        {
            id: '#002',
            status: 'Live',
            type: 'Website',
            title: 'Personal website',
            href: '/blog',
            description:
                'This portfolio and blog built with Astro, featuring a responsive layout, strong SEO defaults, and fast static-first pages.',
            tags: ['Astro', 'TypeScript', 'Tailwind CSS'],
        },
        {
            id: '#003',
            status: '1M+ Users',
            type: 'Discord Bot',
            title: 'MHCAT',
            href: 'https://github.com/yorukot/MHCAT',
            description:
                'A Discord bot for server management and utility features, built with Discord.js and MongoDB and used by a large server network.',
            tags: ['Node.js', 'Discord.js', 'MongoDB'],
        },
        {
            id: '#004',
            status: 'Built',
            type: 'CLI',
            title: 'tmlshock',
            href: 'https://github.com/yorukot/tmlshock',
            description:
                'A terminal clock, timer, and stopwatch built with Go for simple time tracking from the command line.',
            tags: ['Go', 'Terminal', 'CLI'],
        },
        {
            id: '#005',
            status: 'Ongoing',
            type: 'Web',
            title: 'Random Websites',
            description:
                'Small useful or playful websites built while exploring product ideas, web stacks, and interface patterns.',
            tags: ['React', 'Next.js', 'Tailwind CSS', 'Node.js'],
        },
        {
            id: '#006',
            status: 'Community',
            type: 'Volunteer',
            title: 'SITCON',
            description:
                'Joined the SITCON community as a volunteer, contributing as a speaker, staff member, and SITCON Camp staff.',
            tags: ['SITCON', 'Community', 'Volunteer'],
        },
    ],
} as const;
