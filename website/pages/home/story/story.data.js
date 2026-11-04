// CONTENT WARNING — duplicated copy, edit BOTH surfaces.
// The phone homepage restates these headlines in
// components/mobile/MobileHome.jsx (MOBILE_PANELS), in a different
// data shape. When wording changes here, make the same change there,
// or phone and desktop will say different things. See data/homePage.js.
import PunchOutBand from './PunchOutBand';
import MirroredPunchOutBand from './MirroredPunchOutBand';
import { assetUrl } from '../../../lib/utils/assetUrl';

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
    headlines: [
      { firstLine: "Medical interventions demand", secondLine: "precision and urgency.", sectionTarget: "time-sensitive" },
      { firstLine: "Which makes coordination within", secondLine: "teams vital for success.", sectionTarget: "like-a-dance" },
      { firstLine: "Task\u2011driven focus can lead to", secondLine: "tunnel vision and misalignment.", sectionTarget: "cost" },
    ],
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
    headlines: [
      { firstLine: "Quiet reflection allows for", secondLine: "sharpening skills.", sectionTarget: "sharpening" },
      { firstLine: "Further video debriefs foster", secondLine: "cohesion amongst peers.", sectionTarget: "team-dynamics" },
      { firstLine: "Shared understanding enhances", secondLine: "decisiveness.", sectionTarget: "perspectives" },
    ],
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
