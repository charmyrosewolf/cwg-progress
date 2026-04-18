'use client';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import { useState } from 'react';

export function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => {
    const c = createCache({ key: 'css' });
    c.compat = true;
    return c;
  });

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted);
    if (!names.length) return null;

    let styles = '';
    let dataEmotion = cache.key;
    const globals: string[] = [];

    for (const name of names) {
      const style = cache.inserted[name];
      if (typeof style !== 'string') continue;
      if (name === '') {
        globals.push(style);
      } else {
        styles += style;
        dataEmotion += ` ${name}`;
      }
    }

    return (
      <>
        {globals.map((style, i) => (
          <style
            key={i}
            data-emotion={`${cache.key}-global`}
            dangerouslySetInnerHTML={{ __html: style }}
          />
        ))}
        {styles && (
          <style
            data-emotion={dataEmotion}
            dangerouslySetInnerHTML={{ __html: styles }}
          />
        )}
      </>
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
