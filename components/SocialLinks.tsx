import React from 'react';
import { IconLinkedIn, IconInstagram, IconX, IconWebsite } from './icons';

const SocialLinks: React.FC = () => {
  const socials = [
    {
      name: 'LinkedIn',
      icon: IconLinkedIn,
      url: 'https://linkedin.com/company/cryptoprism',
      label: 'Visit our LinkedIn'
    },
    {
      name: 'Instagram',
      icon: IconInstagram,
      url: 'https://instagram.com/cryptoprism',
      label: 'Follow us on Instagram'
    },
    {
      name: 'X',
      icon: IconX,
      url: 'https://x.com/cryptoprism',
      label: 'Follow us on X'
    },
    {
      name: 'Website',
      icon: IconWebsite,
      url: 'https://cryptoprism.io',
      label: 'Visit our website'
    }
  ];

  return (
    <div className="flex items-center gap-3">
      {socials.map((social) => {
        const IconComponent = social.icon;
        return (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            title={social.label}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700/20 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300 hover:text-cyan-300 transition-all duration-300 backdrop-blur-md shadow-lg shadow-black/10 hover:shadow-cyan-500/20"
            aria-label={social.label}
          >
            <IconComponent className="w-5 h-5" />
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;
