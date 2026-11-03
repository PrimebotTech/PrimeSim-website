import { updateFewShotPlayback } from './fewshot-videos';

// Optional motion layer. Stills and immediate transitions serve reduced-motion
// users; the first robot panel remains visible without JavaScript.
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ease = 'cubic-bezier(.16,1,.3,1)';
root.classList.add('cinematic');

const preview = document.querySelector<HTMLElement>('.hero-preview');
const heroVideo = document.querySelector<HTMLVideoElement>('#hero-video');
const heroPlayback = document.querySelector<HTMLButtonElement>('#hero-playback');
const galleryVideos = Array.from(document.querySelectorAll<HTMLVideoElement>('.clip video, [data-ambient-video]'));
const inlineChoices = new Map<HTMLVideoElement, 'play' | 'pause'>();
const ambientVideos = heroVideo ? [heroVideo, ...galleryVideos] : galleryVideos;
const visibleVideos = new Set<HTMLVideoElement>();
let heroChoice: 'play' | 'pause' | null = null;

function play(video: HTMLVideoElement) {
  if (video.paused) void video.play().catch(() => { /* Keep the poster if playback is unavailable. */ });
}

function updateAmbientPlayback() {
  for (const video of ambientVideos) {
    const choice = video === heroVideo ? heroChoice : inlineChoices.get(video);
    const allowed = choice === 'play' || (choice !== 'pause' && !reducedMotion.matches);
    if (allowed && visibleVideos.has(video) && !document.hidden) play(video);
    else video.pause();
  }
}

function updateHeroControl() {
  if (!heroPlayback || !heroVideo) return;
  heroPlayback.hidden = false;
  heroPlayback.textContent = heroVideo.paused ? 'Play preview ▶' : 'Pause preview Ⅱ';
  heroPlayback.setAttribute('aria-label', heroVideo.paused ? 'Play preview' : 'Pause preview');
  preview?.classList.toggle('is-playing', !heroVideo.paused);
}

heroVideo?.addEventListener('play', updateHeroControl);
heroVideo?.addEventListener('pause', updateHeroControl);
heroPlayback?.addEventListener('click', () => {
  heroChoice = heroVideo?.paused ? 'play' : 'pause';
  updateAmbientPlayback();
});
updateHeroControl();

document.querySelectorAll<HTMLButtonElement>('[data-inline-video-toggle]').forEach(button => {
  const video = document.getElementById(button.getAttribute('aria-controls') || '') as HTMLVideoElement | null;
  if (!video) return;
  const render = () => {
    button.hidden = false;
    button.textContent = video.paused ? 'Play ▶' : 'Pause Ⅱ';
    button.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} ${button.dataset.videoLabel}`);
  };
  video.addEventListener('play', render);
  video.addEventListener('pause', render);
  button.addEventListener('click', () => {
    inlineChoices.set(video, video.paused ? 'play' : 'pause');
    updateAmbientPlayback();
  });
  render();
});

// One control for the counterfactual strip: keeps five clips in step and gives
// keyboard users a way to stop the motion without touching each clip.
const groupPlayback = document.querySelector<HTMLButtonElement>('#counterfactual-playback');
if (groupPlayback) {
  const groupVideos = Array.from(document.querySelectorAll<HTMLVideoElement>('.counterfactual-grid video'));
  const renderGroup = () => {
    const playing = groupVideos.some(video => !video.paused);
    groupPlayback.textContent = playing ? 'Pause all Ⅱ' : 'Play all ▶';
    groupPlayback.setAttribute('aria-label', playing ? 'Pause counterfactual rollouts' : 'Play counterfactual rollouts');
  };
  groupPlayback.addEventListener('click', () => {
    const shouldPlay = groupVideos.some(video => video.paused);
    for (const video of groupVideos) inlineChoices.set(video, shouldPlay ? 'play' : 'pause');
    updateAmbientPlayback();
    renderGroup();
  });
  groupVideos.forEach(video => {
    video.addEventListener('play', renderGroup);
    video.addEventListener('pause', renderGroup);
  });
  renderGroup();
}

if ('IntersectionObserver' in window) {
  const playbackObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target as HTMLVideoElement;
      if (entry.isIntersecting) visibleVideos.add(video);
      else visibleVideos.delete(video);
    });
    updateAmbientPlayback();
  }, { threshold: .35 });
  ambientVideos.forEach(video => playbackObserver.observe(video));
}

document.addEventListener('visibilitychange', updateAmbientPlayback);

// Robot selection remains immediate for assistive technology. An inert copy of
// the outgoing panel fades away while the real incoming panel becomes active.
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-robot]'));
const tabBar = document.querySelector<HTMLElement>('.robot-tabs');
const panels = document.querySelector<HTMLElement>('.robot-panels');
let finishPanelTransition: (() => void) | null = null;

function placeIndicator() {
  const selected = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
  if (!selected || !tabBar) return;
  tabBar.style.setProperty('--tab-x', `${selected.offsetLeft}px`);
  tabBar.style.setProperty('--tab-width', `${selected.offsetWidth}px`);
}

function selectRobot(tab: HTMLButtonElement) {
  if (tab.getAttribute('aria-selected') === 'true') return;
  finishPanelTransition?.();
  const outgoing = panels?.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])');
  const next = document.getElementById(`panel-${tab.dataset.robot}`);
  if (!next) return;
  const previousHeight = panels?.getBoundingClientRect().height ?? 0;
  const ghost = outgoing && !reducedMotion.matches ? outgoing.cloneNode(true) as HTMLElement : null;
  tabs.forEach(button => {
    const active = button === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(`panel-${button.dataset.robot}`);
    if (panel) {
      panel.hidden = !active;
      if (active) panel.classList.add('is-in');
    }
  });
  placeIndicator();
  updateFewShotPlayback();
  if (!panels || !ghost) return;
  ghost.removeAttribute('id');
  ghost.removeAttribute('role');
  ghost.removeAttribute('tabindex');
  ghost.removeAttribute('aria-labelledby');
  ghost.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  ghost.inert = true;
  ghost.setAttribute('aria-hidden', 'true');
  ghost.classList.add('panel-ghost');
  const newHeight = panels.getBoundingClientRect().height;
  panels.append(ghost);
  panels.classList.add('is-changing');
  const animations = [
    panels.animate([{ height: `${previousHeight}px` }, { height: `${newHeight}px` }], { duration: 380, easing: ease }),
    ghost.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-16px)' }], { duration: 180, fill: 'forwards' }),
    next.animate([{ opacity: 0, transform: 'translateX(20px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: ease }),
  ];
  const finish = () => {
    if (finishPanelTransition !== finish) return;
    animations.forEach(animation => animation.cancel());
    ghost.remove();
    panels.classList.remove('is-changing');
    if (finishPanelTransition === finish) finishPanelTransition = null;
  };
  finishPanelTransition = finish;
  void Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(finish);
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectRobot(tab));
  tab.addEventListener('keydown', event => {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectRobot(tabs[next]);
    tabs[next].focus();
  });
});
placeIndicator();
if (tabBar && 'ResizeObserver' in window) new ResizeObserver(() => {
  finishPanelTransition?.();
  placeIndicator();
}).observe(tabBar);

reducedMotion.addEventListener('change', () => {
  finishPanelTransition?.();
  updateAmbientPlayback();
});
