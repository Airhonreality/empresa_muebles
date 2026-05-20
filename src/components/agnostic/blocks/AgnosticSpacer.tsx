const SIZES: Record<string, string> = {
  xs: '1rem', sm: '2rem', md: '4rem', lg: '8rem', xl: '12rem'
};

interface Props { visual?: { size?: string; custom?: string } }

export function AgnosticSpacer({ visual }: Props) {
  const height = visual?.custom || SIZES[visual?.size || 'md'] || '4rem';
  return <div style={{ height }} aria-hidden="true" />;
}
