const TECH_LOGOS = new Map([
  ['react', 'react'],
  ['reactjs', 'react'],
  ['angular', 'angular'],
  ['sqlserver', 'sqlserver'],
  ['microsoftsqlserver', 'sqlserver'],
  ['flutter', 'flutter'],
  ['nodejs', 'nodejs'],
  ['node', 'nodejs'],
  ['python', 'python'],
  ['postgresql', 'postgresql'],
  ['postgres', 'postgresql'],
  ['n8n', 'n8n'],
  ['aws', 'aws'],
  ['amazonwebservices', 'aws'],
]);

export const HERO_TECHNOLOGIES = ["React", "Angular", "Node.js", "Python", "PostgreSQL", "SQL Server", "Flutter", "n8n", "AWS"];

export function heroTechnologyLogo(label: string): string | null {
  const icon = TECH_LOGOS.get(label.toLowerCase().replace(/[^a-z0-9]/g, ""));
  return icon ? "brand/stack/" + icon + ".svg" : null;
}
