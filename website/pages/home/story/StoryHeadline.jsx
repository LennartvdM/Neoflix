import React from 'react';

// A story's display headline — "In the moment, / only the patient /
// matters" — laid out from the `header` shape in story.data.js. Shared by
// the homepage story sections and the /neoflix act openers, which state
// the same two acts at length, so the lines break and accent identically
// in both places.
//
// `line1suffix` (the reflection story's " ") keeps line 1 and the accent
// on one line; without it they break. `accentClassName` styles the
// accented word. Each break is preceded by a space so the heading's text
// reads "moment, only", not "moment,only", to anything that reads text
// rather than pixels (screen readers, search snippets).
export default function StoryHeadline({ header, accentClassName }) {
  return (
    <>
      {header.line1}
      {header.line1suffix ?? <>{' '}<br /></>}
      <span className={accentClassName}>{header.line2highlight}</span>
      {header.line2suffix}
      {' '}
      <br />
      {header.line3}
      {header.line4 && (
        <>
          {' '}
          <br />
          {header.line4}
        </>
      )}
    </>
  );
}
