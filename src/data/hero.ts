export type IntroRole = {
    article: string;
    label: string;
};

export type CloneDirection = {
    x: string;
    y: string;
    top: string;
    left: string;
};

export const hero = {
    introPrefix: 'This is Yorukot,',
    headline: 'Open-source developer',
    introRoles: [
      { article: 'a', label: 'CLI developer' },
      { article: 'a', label: 'backend developer' },
      { article: 'a', label: 'frontend developer' },
      { article: 'a', label: 'Self-hosting nerd' },
      { article: 'a', label: 'DevOps engineer' },
      { article: 'an', label: 'open-source maintainer' },
    ] satisfies IntroRole[],
    cloneDirections: [
        { x: '0%', y: '100%', top: '-100%', left: '0%' },
        { x: '-100%', y: '0%', top: '0%', left: '100%' },
        { x: '0%', y: '-100%', top: '100%', left: '0%' },
        { x: '100%', y: '0%', top: '0%', left: '-100%' },
    ] satisfies CloneDirection[],
} as const;
