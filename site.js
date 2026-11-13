const slides = [...document.querySelectorAll('.offer-slide')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const previews = [...document.querySelectorAll('.offer-preview img')];
const offerStatus = document.querySelector('#offers-status');
const moreButton = document.querySelector('#more-offers');
const offerIndex = document.querySelector('#offer-index');
let category = 'all';
let currentIndex = 0;

function matchingOffers() {
  return slides.filter(slide => category === 'all' || slide.dataset.category.split(' ').includes(category));
}

function renderOffers() {
  const matching = matchingOffers();
  const current = matching[currentIndex];
  slides.forEach(slide => { slide.hidden = slide !== current; });
  previews.forEach((preview, index) => {
    const next = matching[(currentIndex + index + 1) % matching.length];
    preview.src = next.querySelector('img').getAttribute('src');
  });
  offerStatus.textContent = `${currentIndex + 1} / ${matching.length}`;
  offerIndex.replaceChildren();
  matching.forEach(slide => {
    const entry = slide.querySelector('a').cloneNode(true);
    const caption = entry.querySelector('.offer-caption');
    caption.querySelector('.offer-arrow').remove();
    entry.append(caption.querySelector('strong'));
    caption.className = 'index-caption';
    offerIndex.append(entry);
  });
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    category = button.dataset.filter;
    currentIndex = 0;
    filterButtons.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    renderOffers();
  });
});

document.querySelector('#next-offer').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % matchingOffers().length;
  renderOffers();
});
document.querySelector('#previous-offer').addEventListener('click', () => {
  const count = matchingOffers().length;
  currentIndex = (currentIndex - 1 + count) % count;
  renderOffers();
});
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

const mobileMenu = document.querySelector('.mobile-nav');
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
    mobileMenu.open = false;
    requestAnimationFrame(openAnchorPanel);
  }
});
window.addEventListener('hashchange', openAnchorPanel);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileMenu.open) {
    mobileMenu.open = false;
    mobileMenu.querySelector('summary').focus();
  }
});

renderOffers();
openAnchorPanel();
