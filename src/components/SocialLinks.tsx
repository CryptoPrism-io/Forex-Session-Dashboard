import React from 'react';
import { IconLinkedIn, IconInstagram, IconX, IconWebsite } from './icons';

const SocialLinks: React.FC = () => {
  const socials = [
    {
      name: 'LinkedIn',
      icon: IconLinkedIn,
      url: 'https://linkedin.com/in/yogeshsahu',
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
      url: 'https://forex-dashboard-963362833537.us-central1.run.app',
      label: 'Visit our website'
    }
  ];

  return (
    <div className="flex items-center gap-2">
      {socials.map((social) => {
        const IconComponent = social.icon;
        return (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            title={social.label}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/20 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300 hover:text-cyan-300 transition-all duration-300 backdrop-blur-md shadow-lg shadow-black/10 hover:shadow-cyan-500/20"
            aria-label={social.label}
          >
            <IconComponent className="w-4 h-4" />
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;
