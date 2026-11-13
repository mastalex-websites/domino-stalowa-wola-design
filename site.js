import { initializeMobileNavigation } from './assets/navigation.js';

initializeMobileNavigation();

const slides = [...document.querySelectorAll('.offer-slide')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const offerStatus = document.querySelector('#offers-status');
const moreButton = document.querySelector('#more-offers');
const offerIndex = document.querySelector('#offer-index');
const previousOffer = document.querySelector('#previous-offer');
const nextOffer = document.querySelector('#next-offer');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let category = 'all';
let currentIndex = 0;
let queuedSteps = 0;
let isAnimating = false;
let transitionVersion = 0;
let activeAnimations = [];
let transitionCards = [];

function matchingOffers() {
  return slides.filter(slide => category === 'all' || slide.dataset.category.split(' ').includes(category));
}

function visibleOffers() {
  const matching = matchingOffers();
  return matching.slice(0, 3).map((_, offset) => matching[(currentIndex + offset) % matching.length]);
}

function renderOffers() {
  const visible = visibleOffers();
  slides.forEach(slide => {
    const position = visible.indexOf(slide);
    slide.hidden = position === -1;
    slide.inert = position !== 0;
    slide.setAttribute('aria-hidden', String(position !== 0));
    if (position !== -1) slide.dataset.position = position;
  });
  const count = matchingOffers().length;
  offerStatus.textContent = count ? `${currentIndex + 1} / ${count}` : '0 / 0';
  previousOffer.disabled = nextOffer.disabled = count < 2;
}

function renderOfferIndex() {
  offerIndex.replaceChildren();
  matchingOffers().forEach(slide => {
    const entry = slide.querySelector('a').cloneNode(true);
    const caption = entry.querySelector('.offer-caption');
    caption.querySelector('.offer-arrow').remove();
    entry.append(caption.querySelector('strong'));
    caption.className = 'index-caption';
    offerIndex.append(entry);
  });
}

async function animateOfferStep(direction, version) {
  const previous = visibleOffers();
  const startTransforms = new Map(previous.map(slide => [slide, getComputedStyle(slide).transform]));
  currentIndex = (currentIndex + direction + matchingOffers().length) % matchingOffers().length;
  renderOffers();
  if (reducedMotion.matches) return;

  const next = visibleOffers();
  const targetTransforms = next.map(slide => getComputedStyle(slide).transform);
  const exitTransform = `${targetTransforms[0]} translateX(-18%)`;
  const animations = [];
  next.forEach(slide => { slide.style.visibility = 'hidden'; });

  function animateCard(slide, fromPosition, toPosition) {
    const entering = fromPosition === -1;
    const leaving = toPosition < 0 || toPosition >= next.length;
    const from = entering ? (toPosition === 0 ? exitTransform : targetTransforms[toPosition]) : startTransforms.get(slide);
    const to = leaving ? (fromPosition === 0 ? exitTransform : from) : targetTransforms[toPosition];
    const card = slide.cloneNode(true);
    card.classList.add('offer-transition');
    card.hidden = false;
    card.inert = true;
    card.setAttribute('aria-hidden', 'true');
    card.style.visibility = 'visible';
    const foreground = fromPosition === 0 || toPosition === 0;
    card.style.zIndex = foreground ? '4' : String(3 - Math.max(fromPosition, toPosition));
    if (fromPosition === 0 && leaving) card.style.zIndex = '5';
    slide.parentElement.append(card);
    transitionCards.push(card);
    const timing = { duration: 540, easing: 'cubic-bezier(.22, .68, 0, 1)', fill: 'both' };
    animations.push(card.animate([
      { transform: from, opacity: entering ? 0 : 1 },
      { transform: to, opacity: leaving ? 0 : 1 }
    ], timing));
    const endsFront = toPosition === 0 || (leaving && fromPosition === 0);
    animations.push(card.querySelector('img').animate([
      { opacity: fromPosition === 0 ? 1 : .6, filter: fromPosition === 0 ? 'saturate(1)' : 'saturate(.4)' },
      { opacity: endsFront ? 1 : .6, filter: endsFront ? 'saturate(1)' : 'saturate(.4)' }
    ], timing));
  }

  previous.forEach((slide, position) => {
    animateCard(slide, position, position - direction);
  });
  const enteringPosition = direction > 0 ? next.length - 1 : 0;
  animateCard(next[enteringPosition], -1, enteringPosition);
  activeAnimations = animations;
  await Promise.allSettled(animations.map(animation => animation.finished));
  if (version !== transitionVersion) return;
  next.forEach(slide => slide.style.removeProperty('visibility'));
  animations.forEach(animation => animation.cancel());
  transitionCards.forEach(card => card.remove());
  transitionCards = [];
  activeAnimations = [];
}

async function moveOffer(direction) {
  if (matchingOffers().length < 2) return;
  queuedSteps += direction;
  if (isAnimating) return;
  isAnimating = true;
  const version = transitionVersion;
  while (queuedSteps && version === transitionVersion) {
    const step = Math.sign(queuedSteps);
    queuedSteps -= step;
    await animateOfferStep(step, version);
  }
  if (version === transitionVersion) isAnimating = false;
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    transitionVersion += 1;
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations = [];
    transitionCards.forEach(card => card.remove());
    transitionCards = [];
    slides.forEach(slide => slide.style.removeProperty('visibility'));
    queuedSteps = 0;
    isAnimating = false;
    category = button.dataset.filter;
    currentIndex = 0;
    filterButtons.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    renderOffers();
    renderOfferIndex();
  });
});

nextOffer.addEventListener('click', () => moveOffer(1));
previousOffer.addEventListener('click', () => moveOffer(-1));
moreButton.addEventListener('click', () => {
  offerIndex.hidden = !offerIndex.hidden;
  moreButton.setAttribute('aria-expanded', String(!offerIndex.hidden));
});

const approachTabs = [...document.querySelectorAll('.approach-tabs [role="tab"]')];
const approachPanels = [...document.querySelectorAll('.approach-panel')];

function activateApproachTab(selectedTab) {
  approachTabs.forEach(tab => {
    const selected = tab === selectedTab;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  approachPanels.forEach(panel => {
    panel.hidden = panel.id !== selectedTab.getAttribute('aria-controls');
  });
}

approachTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateApproachTab(tab));
  tab.addEventListener('keydown', event => {
    let nextIndex;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % approachTabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (index - 1 + approachTabs.length) % approachTabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = approachTabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    activateApproachTab(approachTabs[nextIndex]);
    approachTabs[nextIndex].focus();
  });
});

function openAnchorPanel() {
  const destination = document.getElementById(location.hash.slice(1));
  if (destination?.getAttribute('role') === 'tabpanel') {
    const tab = document.getElementById(destination.getAttribute('aria-labelledby'));
    activateApproachTab(tab);
    document.querySelector('.approach').scrollIntoView({ block: 'start' });
  }
}

document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (anchor) {
    requestAnimationFrame(openAnchorPanel);
  }
});
window.addEventListener('hashchange', openAnchorPanel);
const storyText = document.querySelector('.story > p');
const storyWords = storyText.textContent.trim().split(/\s+/).map(word => {
  const span = document.createElement('span');
  span.className = 'story-word';
  span.textContent = word;
  return span;
});
storyText.replaceChildren(...storyWords.flatMap((word, index) => index ? [' ', word] : [word]));
let storyFrame = 0;

function highlightStory() {
  storyFrame = 0;
  const bounds = storyText.getBoundingClientRect();
  const progress = reducedMotion.matches ? 1 : Math.max(0, Math.min(1, (innerHeight * .8 - bounds.top) / (bounds.height + innerHeight * .35)));
  storyWords.forEach((word, index) => {
    word.style.setProperty('--highlight', Math.max(0, Math.min(1, progress * storyWords.length - index)));
  });
}

function scheduleStoryHighlight() {
  if (!storyFrame) storyFrame = requestAnimationFrame(highlightStory);
}

window.addEventListener('scroll', scheduleStoryHighlight, { passive: true });
window.addEventListener('resize', scheduleStoryHighlight);
reducedMotion.addEventListener('change', scheduleStoryHighlight);
document.fonts.ready.then(scheduleStoryHighlight);
highlightStory();

renderOffers();
renderOfferIndex();
openAnchorPanel();
