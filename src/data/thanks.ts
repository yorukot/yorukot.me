import ncseBanner from '../assets/thanks/ncse-banner.png';
import warpBanner from '../assets/thanks/warp-banner.png';

export const thanks = {
    hero: {
        eyebrow: '/thanks',
        title: 'Back the work. Fund the next build.',
        description:
            'This page is for the people and teams who keep open-source tools, articles, and late-night shipping sessions alive.',
    },
    donationOptions: [
        {
            label: 'SPONSORS',
            title: 'Send a direct thank you',
            href: 'https://yorukot.me/sponsor',
            action: 'Donation',
            description: '',
        },
        {
            label: 'Company',
            title: 'Sponsor as a team or brand',
            href: 'mailto:hi@yorukot.me',
            action: 'Start a conversation',
            description: '',
        },
    ],
    sponsorTiers: [
        {
            tier: 'Sponsors',
            sponsors: [
                {
                    name: 'Warp',
                    href: 'https://www.warp.dev/?utm_source=github&utm_medium=referral&utm_campaign=superfile',
                    note: 'Sponsors superfile and helps keep its development moving.',
                    banner: {
                        src: warpBanner,
                        alt: 'Warp sponsor banner',
                    },
                },
            ],
        },
    ],
    specialThanks: [
        {
            title: 'NCSE',
            href: 'https://www.ncse.tw/en/',
            description: 'Special thanks for providing a free VPS that helps power the project infrastructure.',
            banner: {
                src: ncseBanner,
                alt: 'NCSE special thanks banner',
            },
        },
    ],
} as const;
