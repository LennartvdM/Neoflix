/**
 * publicationRecords.js — the bibliographic facts about each paper.
 *
 * Separate from publicationsPage.js because the build scripts read this
 * too, and they run in plain Node: nothing here may import assetUrl,
 * touch import.meta.env, or use a Vite glob.
 *
 * This exists so machines can read the work without downloading it. The
 * papers themselves are 1.5–3.5MB of two-column PDF; a crawler spends
 * all of that to recover text that comes back out as "video-reﬂecti"
 * and "re- time", which is no basis for a citation. The same facts as
 * structured data cost a couple of KB and are unambiguous.
 *
 * DOIs were read out of the PDFs themselves. Author lists are the full
 * bylines, not the "et al." of the display citations, because a
 * citation tool needs every name.
 *
 * Keyed by section id in publicationsPage.js.
 */
export const publicationRecords = {
  narrative: {
    abstract:
      'As the complexity of emergency care increases, current research methods ' +
      'to improve care are often unable to capture all aspects of everyday ' +
      'clinical practice. Video recordings can visualize clinical care in an ' +
      'objective way. They can be used as a tool to assess care and to reflect ' +
      'on care with the caregivers themselves. Although the use of video ' +
      'recordings to reflect on medical interventions (video-reflection) has ' +
      'increased over the years, it is still not used on a regular basis. ' +
      'However, video-reflection proved to be of educational value and can ' +
      'improve teams\' management and performance. It has a positive effect on ' +
      'guideline adherence, documentation, clinical care and teamwork. ' +
      'Recordings can also be used for video-reflexivity. Here, caregivers ' +
      'review recordings together to reflect on their everyday practice from ' +
      'new perspectives with regard to context and conduct in general. Although ' +
      'video-reflection in emergency care has proven to be valuable, certain ' +
      'preconditions have to be met and obstacles need to be overcome. These ' +
      'include gaining trust of the caregivers, having a proper ' +
      'consent-procedure, maintaining confidentiality and adequate use of ' +
      'technical equipment. To implement the lessons learned from ' +
      'video-reflection in a sustainable way and to continuously improve care, ' +
      'it should be integrated in regular simulation training or education. ' +
      'This narrative review will describe the development of video recording ' +
      'in emergency care and how video-reflection can improve patient care and ' +
      'safety in new ways. On our own department, the NICU at the LUMC, ' +
      'video-reflection has already been implemented and we want to further ' +
      'expand this. We will describe the use of video-reflection in our own ' +
      'unit. Based on the results of this narrative review we will propose ' +
      'options for future research to increase the value of video-reflection.',
    title:
      'Video recording emergency care and video-reflection to improve patient care; a narrative review and case-study of a Neonatal Intensive Care Unit',
    authors: [
      'Veerle Heesters',
      'Ruben Witlox',
      'Henriette A. van Zanten',
      'Sophie J. Jansen',
      'Remco Visser',
      'Veerle Heijstek',
      'Arjan B. te Pas',
    ],
    journal: 'Frontiers in Pediatrics',
    year: 2022,
    doi: '10.3389/fped.2022.931055',
    licence: 'CC BY',
  },
  providers: {
    title:
      'Using the providers’ perspective on video review of neonatal procedures to create a roadmap: a qualitative study',
    authors: [
      'Veerle Heesters',
      'Henriëtte A. van Zanten',
      'Maria C. den Boer',
      'Arjan B. te Pas',
      'Ruben S. G. M. Witlox',
    ],
    journal: 'Archives of Disease in Childhood — Fetal and Neonatal Edition',
    year: 2024,
    doi: '10.1136/archdischild-2023-326528',
    licence: null,
  },
  recordreflectrefine: {
    title:
      'Record, reflect and refine: using video review as an initiative to improve neonatal care',
    authors: [
      'Veerle Heesters',
      'Henriette A. van Zanten',
      'Veerle Heijstek',
      'Arjan B. te Pas',
      'Ruben S. G. M. Witlox',
    ],
    journal: 'Pediatric Research',
    year: 2024,
    doi: '10.1038/s41390-024-03083-w',
    licence: null,
  },
  practicalguidance: {
    abstract:
      'Video review (VR) of procedures in the medical environment can be used ' +
      'to drive quality improvement. However, first it has to be implemented in ' +
      'a safe and effective way. Our primary objective was to (re)define a ' +
      'guideline for implementing interprofessional VR in a neonatal intensive ' +
      'care unit (NICU). Our secondary objective was to determine the rate of ' +
      'acceptance by providers attending VR. For 9 months, VR sessions were ' +
      'evaluated with a study group, consisting of different stakeholders. A ' +
      'questionnaire was embedded at the end of each session to obtain feedback ' +
      'from providers on the session and on the safe learning environment. In ' +
      'consensus meetings, success factors and preconditions were identified ' +
      'and divided into different factors that influenced the rate of adoption ' +
      'of VR. The number of providers who recorded procedures and attended VR ' +
      'sessions was determined. A total of 18 VR sessions could be organised, ' +
      'with an equal distribution of medical and nursing staff. After the ' +
      '9-month period, 101/125 (81%) of all providers working on the NICU ' +
      'attended at least 1 session and 80/125 (64%) of all providers recorded ' +
      'their performance of a procedure at least 1 time. In total, 179/297 ' +
      '(61%) providers completed the questionnaire. Almost all providers (99%) ' +
      'reported to have a positive opinion about the review sessions. ' +
      'Preconditions and success factors related to implementation were ' +
      'identified and addressed, including improving the pathway for obtaining ' +
      'consent, preparation of VR, defining the role of the chair during the ' +
      'session and building a safe learning environment. Different strategies ' +
      'were developed to ensure findings from sessions were used for quality ' +
      'improvement. VR was successfully implemented on our NICU and we ' +
      'redefined our guideline with various preconditions and success factors. ' +
      'The adjusted guideline can be helpful for implementation of VR in ' +
      'emergency care settings.',
    title:
      'Quality improvement initiative: implementing and redefining video review of real-time neonatal procedures using action research',
    authors: [
      'Veerle Heesters',
      'Henriette A. van Zanten',
      'Linsey C. C. de Boer',
      'Remco Visser',
      'Veerle Heijstek',
      'Arjan B. te Pas',
      'Ruben S. G. M. Witlox',
    ],
    journal: 'BMJ Open Quality',
    year: 2024,
    doi: '10.1136/bmjoq-2023-002588',
    licence: 'CC BY-NC',
  },
  drivingresearch: {
    abstract:
      'Aim: Studies in animals have shown that vocal cords (VCs) close during ' +
      'apnoea before and after birth, thereby impairing the effect of ' +
      'non-invasive ventilation. We tested the feasibility of visualising VCs ' +
      'using ultrasonography (US) and investigated the position and movement of ' +
      'the VCs during non-invasive respiratory support of preterm infants at ' +
      'birth. Methods: In an observational study, VCs were visualised using US ' +
      'in infants <30 weeks gestation during both stabilisation after birth and ' +
      'at one hour after birth. Respiratory efforts were simultaneously ' +
      'recorded. The percentage of time the VCs were closed in the first ten ' +
      'minutes was determined from videoframes acquired at 15 Hz and compared ' +
      'with respiratory flow patterns measured using a respiratory function ' +
      'monitor. Results: US of the VCs could be performed in 20/20 infants ' +
      'included (median (IQR) gestational age 27+6 (27+1–28+6) weeks) without ' +
      'interfering with stabilisation, of whom 60% (12/20) were initially ' +
      'breathing and 40% (8/20) were apnoeic at birth. In breathing infants, ' +
      'the VCs closed between breaths and during breath holds, which accounted ' +
      'for 57% (49–66) of the time. In apnoeic infants receiving positive ' +
      'pressure ventilation, the VCs were closed for 93% (81–99) of the time. ' +
      'US at one hour after birth could be performed in 14/20 infants, VCs were ' +
      'closed between breaths and during breath holds, accounting for 46% ' +
      '(27–52) of the time. Conclusion: Visualising VCs in preterm infants at ' +
      'birth using US is feasible. The VCs were closed during apnoea, in ' +
      'between breaths and during breath holds, impairing the effect of ' +
      'ventilation given.',
    title:
      'The vocal cords are predominantly closed in preterm infants <30 weeks gestation during transition after birth; an observational study',
    authors: [
      'Veerle Heesters',
      'Janneke Dekker',
      'Timothy J. R. Panneflek',
      'Kristel L. A. M. Kuypers',
      'Stuart B. Hooper',
      'Remco Visser',
      'Arjan B. te Pas',
    ],
    journal: 'Resuscitation',
    year: 2024,
    doi: '10.1016/j.resuscitation.2023.110053',
    licence: 'CC BY',
  },
  internationalcollab: {
    abstract:
      'Background/Objectives: The Leiden University Medical Center (LUMC) and ' +
      'the Medical University of Vienna (MUV) both implemented video recording ' +
      'and review in their neonatal intensive care unit (NICU). The two centers ' +
      'initiated collaborative, multicenter video review sessions to facilitate ' +
      'international knowledge exchange. Methods: In this exploratory, ' +
      'descriptive study, collaborative video review sessions were organized ' +
      'with the interprofessional NICU staff of the LUMC and the MUV. We aimed ' +
      'to describe our experience with organizing these sessions and to report ' +
      'procedural variations, and document lessons learned that led to new ' +
      'perspectives on care. Results: We conducted five sessions using ' +
      'recordings of different patients undergoing intubation, less invasive ' +
      'surfactant administration, umbilical, central-catheter insertion and ' +
      'physiologically based cord clamping after birth. The videos were ' +
      'selected to ensure technical and clinical comparability. Sessions were ' +
      'attended by a mean of eight providers per center. A total of 19 relevant ' +
      'differences were described, of which seven (37%) prompted changes in ' +
      'practice or new insights for one or both centers. Finally, we developed ' +
      'a roadmap for organizing multicenter video review sessions. Conclusions: ' +
      'This study shows that multicenter video review may represent a feasible ' +
      'and innovative educational approach for identifying practice variations ' +
      'and fostering cross-institutional clinical refinement.',
    title:
      'International Multicenter Video Review on Neonatal Procedures: Lessons Learned from a Collaborative Study',
    authors: [
      'Veerle Heesters',
      'Hannah Schwarz',
      'Henriette A. van Zanten',
      'Katharina Bibl',
      'Tobias Werther',
      'Katrin Klebermass-Schrehof',
      'Angelika Berger',
      'Sophie Jansen',
      'Arjan B. te Pas',
      'Ruben Witlox',
      'Michael Wagner',
    ],
    journal: 'Children',
    year: 2026,
    doi: '10.3390/children13060816',
    licence: 'CC BY',
  },
};

/**
 * Section id → URL slug for its own page at /publications/<slug>.
 *
 * Every paper has one. Two are under a publisher's exclusive licence, so
 * their abstract is not reproduced (the page links to the publisher's);
 * the page still carries the library's own summary and connections.
 */
export const publicationSlugs = {
  narrative: 'narrative-review',
  providers: 'providers-perspective',
  recordreflectrefine: 'record-reflect-refine',
  practicalguidance: 'practical-guidance',
  drivingresearch: 'driving-research',
  internationalcollab: 'international-collaboration',
};

/**
 * Ids that have their own page, in page order. Since the library
 * (website/system) every paper is a record with its own address: one
 * without an open-licence abstract still carries what the library says
 * about it — what it asked, found and changed — and where it connects,
 * which is no longer a thin page.
 */
export function papersWithPages() {
  return publicationOrder.filter((id) => publicationSlugs[id]);
}

export function recordForSlug(slug) {
  const id = Object.keys(publicationSlugs).find((key) => publicationSlugs[key] === slug);
  return id ? { id, slug, record: publicationRecords[id] } : null;
}

export function paperPath(id) {
  return publicationSlugs[id] ? `/publications/${publicationSlugs[id]}` : null;
}

/** Ordered the way the page presents them. */
export const publicationOrder = [
  'narrative',
  'providers',
  'recordreflectrefine',
  'practicalguidance',
  'drivingresearch',
  'internationalcollab',
];

export function doiUrl(record) {
  return record?.doi ? `https://doi.org/${record.doi}` : null;
}

/** "Heesters V, Witlox R, van Zanten HA, et al." — display form. */
export function shortAuthors(record, max = 3) {
  const names = record?.authors || [];
  // "Henriette A. van Zanten" → "van Zanten HA": particles (van, te,
  // de, den…) belong to the surname, not the initials.
  const PARTICLE = /^(van|von|der|den|de|te|ten|ter|la|le|du)$/i;
  const initials = names.slice(0, max).map((name) => {
    const parts = name.split(' ').filter(Boolean);
    const surname = [parts.pop()];
    while (parts.length > 1 && PARTICLE.test(parts[parts.length - 1])) surname.unshift(parts.pop());
    return `${surname.join(' ')} ${parts.map((p) => p[0]).join('')}`;
  });
  return names.length > max ? `${initials.join(', ')}, et al.` : initials.join(', ');
}
