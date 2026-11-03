// Each robot has its own matched three-video comparison. Only the visible,
// selected robot plays; explicit play is available under reduced motion.
interface Comparison {
  element: HTMLElement;
  videos: HTMLVideoElement[];
  button: HTMLButtonElement;
  visible: boolean;
  choice: 'play' | 'pause' | null;
  starting: boolean;
  epoch: number;
}

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const groups: Comparison[] = Array.from(document.querySelectorAll<HTMLElement>('.fewshot-comparison')).flatMap(element => {
  const button = element.querySelector<HTMLButtonElement>('[data-comparison-playback]');
  const videos = Array.from(element.querySelectorAll('video'));
  return button && videos.length ? [{ element, button, videos, visible: false, choice: null, starting: false, epoch: 0 }] : [];
});

function allowed(group: Comparison) {
  return group.visible && !document.hidden && !group.element.closest('[hidden]') &&
    (group.choice === 'play' || (group.choice !== 'pause' && !reduced.matches));
}

function render(group: Comparison) {
  const playing = group.starting || group.videos.some(video => !video.paused);
  group.button.hidden = false;
  group.button.textContent = playing ? 'Pause comparison Ⅱ' : 'Play comparison ▶';
  group.button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${group.element.dataset.robotName} comparison`);
}

function pause(group: Comparison) {
  group.epoch++;
  group.starting = false;
  group.videos.forEach(video => video.pause());
  render(group);
}

function ready(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadeddata', loaded);
      video.removeEventListener('error', failed);
    };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error('Comparison video unavailable')); };
    video.addEventListener('loadeddata', loaded, { once: true });
    video.addEventListener('error', failed, { once: true });
    video.preload = 'auto';
    video.load();
  });
}

async function start(group: Comparison) {
  if (group.starting || group.videos.every(video => !video.paused)) return;
  const epoch = ++group.epoch;
  group.starting = true;
  render(group);
  try {
    await Promise.all(group.videos.map(ready));
    if (epoch !== group.epoch || !allowed(group)) return;
    const time = group.videos[0].currentTime;
    group.videos.forEach(video => { video.currentTime = time; });
    await Promise.all(group.videos.map(video => video.play()));
    // A tab may have changed while playback promises were pending.
    if (epoch !== group.epoch || !allowed(group)) {
      if (!allowed(group)) pause(group);
      return;
    }
    group.starting = false;
    render(group);
  } catch {
    if (epoch !== group.epoch) return;
    group.choice = 'pause';
    pause(group);
  }
}

export function updateFewShotPlayback() {
  groups.forEach(group => {
    if (allowed(group)) void start(group);
    else pause(group);
  });
}

for (const group of groups) {
  render(group);
  group.button.addEventListener('click', () => {
    group.choice = group.starting || group.videos.some(video => !video.paused) ? 'pause' : 'play';
    updateFewShotPlayback();
  });
  // Ground truth is the shared clock. Correct drift on playback and loop wraps.
  group.videos[0].addEventListener('timeupdate', () => {
    const leader = group.videos[0];
    if (leader.paused || group.starting || !allowed(group)) return;
    group.videos.slice(1).forEach(video => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !video.seeking && Math.abs(video.currentTime - leader.currentTime) > .15) {
        video.currentTime = leader.currentTime;
      }
    });
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const group = groups.find(item => item.element === entry.target);
      if (group) group.visible = entry.isIntersecting;
    });
    updateFewShotPlayback();
  }, { threshold: .2 });
  groups.forEach(group => observer.observe(group.element));
}

document.addEventListener('visibilitychange', updateFewShotPlayback);
reduced.addEventListener('change', updateFewShotPlayback);
