import logoImg from './images/shiv_studio_logo_1784453716682.jpg';
import heroWeddingImg from './images/hero_wedding_cinematic_1795227823650.jpg';
import preWeddingImg from './images/prewedding_golden_hour_1795227823599.jpg';
import maternityBabyImg from './images/maternity_baby_studio_1795227823223.jpg';
import cinematicDroneImg from './images/cinematic_drone_film_1795227823544.jpg';
import luxuryAlbumFrameImg from './images/luxury_album_frame_1795227823341.jpg';
import studioPortraitImg from './images/studio_portrait_creative_1795227823438.jpg';
import engagementRingImg from './images/engagement_ring_ceremony_1795227839261.jpg';
import birthdayEventImg from './images/birthday_celebration_event_1795227839433.jpg';

export const STUDIO_IMAGES = {
  logo: logoImg,
  heroWedding: heroWeddingImg,
  preWedding: preWeddingImg,
  maternityBaby: maternityBabyImg,
  cinematicDrone: cinematicDroneImg,
  luxuryAlbumFrame: luxuryAlbumFrameImg,
  studioPortrait: studioPortraitImg,
  engagementRing: engagementRingImg,
  birthdayEvent: birthdayEventImg,
};

export function getImageForSlugOrCategory(key?: string): string {
  const normalized = (key || '').toLowerCase();
  if (normalized.includes('pre-wedding') || normalized.includes('pre wedding')) return preWeddingImg;
  if (normalized.includes('engagement') || normalized.includes('ring')) return engagementRingImg;
  if (normalized.includes('maternity') || normalized.includes('baby')) return maternityBabyImg;
  if (normalized.includes('birthday') || normalized.includes('event')) return birthdayEventImg;
  if (normalized.includes('drone') || normalized.includes('cinematic') || normalized.includes('video')) return cinematicDroneImg;
  if (normalized.includes('album') || normalized.includes('frame') || normalized.includes('gift') || normalized.includes('graphic')) return luxuryAlbumFrameImg;
  if (normalized.includes('studio') || normalized.includes('about')) return studioPortraitImg;
  return heroWeddingImg;
}
