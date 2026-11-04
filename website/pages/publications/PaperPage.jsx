import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import useTransitionNavigate from '../../lib/hooks/useTransitionNavigate';
import useDownloadGuard from '../../lib/hooks/useDownloadGuard';
import { useBackdropTarget } from '../../shared/backdrop/useBackdrop';
import { assetUrl } from '../../lib/utils/assetUrl';
import { publicationPdfs } from './content';
import { recordForSlug, doiUrl } from './records';
import { formatAttachmentMeta } from './PublicationAttachment';
import './paper-page.css';

/**
 * /publications/<slug> — one paper, on its own address.
 *
 * The point of this page is to be citable. Six papers behind six anchors
 * on one URL gave an answer engine nothing to name; a paper with its own
 * address, abstract and DOI can be quoted and attributed exactly, and
 * can rank for its own subject rather than competing with five others.
 *
 * It deliberately does not repeat the summary written for /publications.
 * Two pages carrying the same prose are two weak pages — this one holds
 * what the publications page doesn't: the abstract as published, the
 * complete byline, and the DOI that resolves to the copy of record.
 *
 * Only papers under an open licence reach here (see publicationSlugs).
 */
export default function PaperPage() {
  const { slug } = useParams();
  const found = recordForSlug(slug);
  const transitionNavigate = useTransitionNavigate();
  // Same brake the publications page uses, keyed to the same file, so a
  // paper's two homes can't be used to double the allowance.
  const guard = useDownloadGuard(publicationPdfs[found?.id]?.src);

  // The backdrop is keyed per route elsewhere; a paper reads better
  // against the flat page colour than against moving footage.
  useBackdropTarget('blog', null);

  if (!found || !found.record?.abstract) return <Navigate to="/publications" replace />;

  const { id, record } = found;
  const doi = doiUrl(record);
  const pdf = publicationPdfs[id];

  return (
    <main className="paper-page">
      <div className="paper-page__inner">
        <a
          className="paper-page__back"
          href="/publications"
          onClick={(event) => {
            event.preventDefault();
            transitionNavigate('/publications');
          }}
        >
          ← All publications
        </a>

        <article className="paper-page__card">
          <header className="paper-page__head">
            <p className="paper-page__kicker">
              {record.journal} · {record.year}
            </p>
            <h1>{record.title}</h1>
            <p className="paper-page__authors">{record.authors.join(', ')}</p>
          </header>

          <div className="paper-page__body">
            <h2>Abstract</h2>
            <p className="paper-page__abstract">{record.abstract}</p>

            <dl className="paper-page__facts">
              <div>
                <dt>Journal</dt>
                <dd>{record.journal}</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>{record.year}</dd>
              </div>
              {record.doi && (
                <div>
                  <dt>DOI</dt>
                  <dd>
                    <a href={doi} target="_blank" rel="noopener noreferrer">
                      {record.doi}
                    </a>
                  </dd>
                </div>
              )}
              {record.licence && (
                <div>
                  <dt>Licence</dt>
                  <dd>{record.licence}</dd>
                </div>
              )}
            </dl>

            {/* The publisher's copy is what a citation should name, so it
                leads; the local file is the convenience copy. */}
            <div className="paper-page__actions">
              {doi && (
                <a
                  className="paper-page__primary"
                  href={doi}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read at the publisher
                </a>
              )}
              {pdf && (
                <a
                  className={`paper-page__secondary${guard.cooling ? ' is-cooling' : ''}`}
                  href={assetUrl(pdf.src)}
                  download
                  aria-disabled={guard.cooling || undefined}
                  onClick={guard.onClick}
                >
                  {guard.cooling
                    ? `Ready again in ${guard.secondsLeft}s`
                    : `Download PDF · ${formatAttachmentMeta(pdf).replace('PDF · ', '')}`}
                </a>
              )}
            </div>
          </div>
        </article>

        <p className="paper-page__note">
          Published under {record.licence}. Cite the version of record via its{' '}
          {doi ? <a href={doi} target="_blank" rel="noopener noreferrer">DOI</a> : 'DOI'}.
        </p>
      </div>
    </main>
  );
}
