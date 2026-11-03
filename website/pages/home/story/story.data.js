// The homepage's two story sections. The six captions are NOT written
// here: they are the beats' claims in shared/argument.js (which the phone
// homepage and /neoflix read too). What is written here: each story's
// `header` — also written as `chapterHeader` in HomePhone.jsx, keep the
// two in step — and the clips.
import PunchOutBand from './PunchOutBand';
import MirroredPunchOutBand from './MirroredPunchOutBand';
import { assetUrl } from '../../../lib/utils/assetUrl';
import { beatById, captionLines } from '../../../shared/argument';

// The captions are the beats' claims — the universal line at its smallest
// (shared/argument.js). The answer beats also carry a proof beneath.
const captions = (ids) =>
  ids.map((id) => {
    const beat = beatById(id);
    const [firstLine, secondLine] = captionLines(beat.claim);
    return { firstLine, secondLine, sectionTarget: id, proof: beat.homeProof };
  });

export const BASE_INDEX = 2; // index of the always-visible base video

// The homepage's two story sections. `pressure` states the problem
// (urgency, coordination, tunnel vision); `reflection` states the
// answer (sharpened skills, cohesion, shared understanding). The keys
// are the section names used by DesktopHome, the `story` prop and the
// backdrop's `medical-<story>` target keys.
export const STORIES = {
  pressure: {
    blurVideos: [
      { id: "0", video: assetUrl("/videos/blururgency.mp4"), alt: "Blurred medical urgency" },
      { id: "1", video: assetUrl("/videos/blurcoordination.mp4"), alt: "Blurred team coordination" },
      { id: "2", video: assetUrl("/videos/blurfocus.mp4"), alt: "Blurred medical focus" },
    ],
    headlines: captions(['time-sensitive', 'like-a-dance', 'cost']),
    mainVideos: [
      { id: "0", video: assetUrl("/videos/urgency.mp4"), alt: "Medical urgency demonstration" },
      { id: "1", video: assetUrl("/videos/coordination.mp4"), alt: "Medical team coordination" },
      { id: "2", video: assetUrl("/videos/focus.mp4"), alt: "Medical focus and precision" },
    ],
    sectionTargets: ["time-sensitive", "like-a-dance", "cost"],
    punchOutBand: PunchOutBand,
    orientation: 'video-right',
    header: {
      line1: 'In the moment,',
      line2prefix: '',
      line2highlight: 'only',
      line2suffix: ' the patient',
      line3: 'matters'
    }
  },
  reflection: {
    blurVideos: [
      { id: "0", video: assetUrl("/videos/blurskills.mp4"), alt: "Blurred skills demonstration" },
      { id: "1", video: assetUrl("/videos/blurteam.mp4"), alt: "Blurred team coordination" },
      { id: "2", video: assetUrl("/videos/blurperspectives.mp4"), alt: "Blurred perspectives" },
    ],
    headlines: captions(['sharpening', 'team-dynamics', 'perspectives']),
    mainVideos: [
      { id: "0", video: assetUrl("/videos/skills.mp4"), alt: "Sharpening skills" },
      { id: "1", video: assetUrl("/videos/team.mp4"), alt: "Team cohesion" },
      { id: "2", video: assetUrl("/videos/perspectives.mp4"), alt: "Shared perspectives" },
    ],
    sectionTargets: ["sharpening", "team-dynamics", "perspectives"],
    punchOutBand: MirroredPunchOutBand,
    orientation: 'video-left',
    header: {
      line1: 'Yet,',
      line1suffix: ' ',
      line2prefix: '',
      line2highlight: 'reflection',
      line2suffix: '',
      line3: 'strengthens',
      line4: 'the next'
    }
  }
};
