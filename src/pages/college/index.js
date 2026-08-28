import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MonoLabel, Display } from '@/components/brand';
import '../../styles/sakura.css';
import '../../styles/College.css';

// Copy is deliberately unwritten. Oliver supplies the headline, the lede and the
// three descriptions; shipping invented prose under his name is worse than a
// visible gap, so these render as obvious placeholders.
const TOOLS = [
  {
    name: 'Major',
    route: '/major',
    gate: 'Passphrase',
    desc: '[ one line on what /major is for ]',
  },
  {
    name: 'Apply',
    route: '/apply',
    gate: 'Passphrase',
    desc: '[ one line on what /apply is for ]',
  },
  {
    name: 'Studio',
    route: '/studio',
    gate: 'Sign in',
    desc: '[ one line on what /studio is for ]',
  },
];

export const College = () => (
  <main className="sakura cl-page">
    <div className="cl-inner">
      <MonoLabel className="cl-eyebrow">olivernguyen.com · college</MonoLabel>
      <Display as="h1" className="cl-title">
        [ headline ]
      </Display>
      <Separator className="cl-rule" />
      <p className="cl-lede on-prose">[ two or three sentences introducing the college work ]</p>

      <div className="cl-cards">
        {TOOLS.map((tool) => (
          <a className="cl-tool" href={tool.route} key={tool.route}>
            <Card interactive className="cl-tool-card">
              <CardHeader>
                <CardTitle as="h2">{tool.name}</CardTitle>
                <Badge>{tool.gate}</Badge>
              </CardHeader>
              <CardDescription>{tool.desc}</CardDescription>
              <CardFooter>
                <MonoLabel tone="faint">{tool.route}</MonoLabel>
              </CardFooter>
            </Card>
          </a>
        ))}
      </div>
    </div>
  </main>
);

export default College;
