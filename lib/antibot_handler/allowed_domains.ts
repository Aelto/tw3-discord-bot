export const allowed_domains = [
  "nexusmods.com",
  "imgur.com",
  "reddit.com",
  "spotify.com",
  "pastebin.com",
  "github.com",
  "tenor.com",
  "youtube.com",
  "youtu.be",
  "discordapp.com/attachments",
  "discordapp.net/attachments",
  "github.io",
  "ibb.co",
  "sites.google.com/view/project-crimson-witcher-guide",
  "sites.google.com/view/caerme-the-w3-guide",
  "sites.google.com/view/lune-the-w3-guide",
];

export function containsAllowedDomain(str: string): boolean {
  return allowed_domains.some((domain) => str.includes(domain));
}
