import React from 'react';

const SocialLinks: React.FC = () => {
  const socials = [
    {
      name: 'LinkedIn',
      icon: '🔗',
      url: 'https://linkedin.com/company/cryptoprism',
      label: 'Visit our LinkedIn'
    },
    {
      name: 'Instagram',
      icon: '📷',
      url: 'https://instagram.com/cryptoprism',
      label: 'Follow us on Instagram'
    },
    {
      name: 'X',
      icon: '𝕏',
      url: 'https://x.com/cryptoprism',
      label: 'Follow us on X'
    },
    {
      name: 'Website',
      icon: '🌐',
      url: 'https://cryptoprism.io',
      label: 'Visit our website'
    }
  ];

  return (
    <div className="flex items-center gap-2">
      {socials.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          title={social.label}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/40 hover:bg-slate-600/60 text-slate-300 hover:text-cyan-300 transition-all duration-200 text-lg"
          aria-label={social.label}
        >
          {social.icon}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
