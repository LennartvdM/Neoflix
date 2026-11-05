/**
 * An intermission: an explainer (an abstract moving illustration of a
 * concept, system/content/ontology.js) taking the whole screen, edge to
 * edge, under the frosted sidebar too. The story stops talking; the page
 * carries only the concept's name and one sentence (Page.jsx, `pause`).
 *
 * Placeholder for now: a deep, cool field with slow shapes, and the
 * animation brief (`motion`) written faintly in a corner, so whoever
 * makes the real one knows what it has to show. Replace the stage per
 * concept when the animations exist (key by `concept`).
 */
import React from 'react';
import { motion } from 'framer-motion';
import { entry } from '../system/content/ontology';

export default function Intermission({ concept }) {
  const c = entry(`concept:${concept}`);
  return (
    <motion.div
      className="intermission"
      data-concept={concept}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div className="intermission__stage">
        <i /><i /><i /><i /><i />
      </div>
      {c && <p className="intermission__brief"><b>Animation to come</b>{c.motion}</p>}
    </motion.div>
  );
}
