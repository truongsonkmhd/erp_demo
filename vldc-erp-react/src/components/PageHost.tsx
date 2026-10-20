import { useLayoutEffect } from 'react';
import { renderPage } from '../legacy/engine';

type Props = { page: string; role: string; navSeq: number };

/**
 * Mount point for the legacy page templates. React never renders children here:
 * render[page]() writes into #content directly, and partial updates (task filters,
 * AI results, DMS search...) keep patching that DOM between navigations.
 */
export default function PageHost({ page, role, navSeq }: Props) {
  useLayoutEffect(() => {
    renderPage(page);
  }, [page, role, navSeq]);

  return <section className="content" id="content" />;
}
