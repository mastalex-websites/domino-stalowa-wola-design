import { calculatePurchaseCosts } from './costs.mjs';
import { initializeMobileNavigation } from './navigation.js';

initializeMobileNavigation();

const siteBase = document.querySelector('meta[name="site-base"]')?.content || '/';

document.querySelector('[data-back]')?.addEventListener('click', () => {
  if (document.referrer.startsWith(location.origin) && history.length > 1) history.back();
  else location.href = siteBase + 'oferty/';
});

function initializeCatalog() {
  const form = document.querySelector('[data-filters]');
  if (!form) return;
  const cards = [...document.querySelectorAll('.catalog-card')];
  const count = document.querySelector('[data-result-count]');
  const empty = document.querySelector('[data-empty]');
  const more = document.querySelector('[data-load-more]');
  const fields = [...form.querySelectorAll('[data-f]')];
  const parameters = new URLSearchParams(location.search);
  let limit = 24;

  fields.forEach(field => {
    if (parameters.has(field.dataset.f)) field.value = parameters.get(field.dataset.f);
  });

  function renderCatalog(resetLimit = true) {
    if (resetLimit) limit = 24;
    const values = Object.fromEntries(fields.map(field => [field.dataset.f, field.value]));
    const matches = cards.filter(card => {
      const data = card.dataset;
      return (!values.cat || data.cats.split(' ').includes(values.cat))
        && (!values.city || data.city === values.city)
        && (!values.amin || Number(data.area) >= Number(values.amin))
        && (!values.amax || Number(data.area) <= Number(values.amax))
        && (!values.pmin || Number(data.price) >= Number(values.pmin))
        && (!values.pmax || Number(data.price) <= Number(values.pmax));
    });
    const visible = new Set(matches.slice(0, limit));
    cards.forEach(card => { card.hidden = !visible.has(card); });
    count.textContent = `Widoczne oferty: ${Math.min(limit, matches.length)} z ${matches.length}`;
    empty.hidden = matches.length > 0;
    more.hidden = limit >= matches.length;

    const nextParameters = new URLSearchParams();
    fields.forEach(field => {
      if (field.value) nextParameters.set(field.dataset.f, field.value);
    });
    const search = nextParameters.toString();
    history.replaceState(null, '', location.pathname + (search ? `?${search}` : ''));
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (form.reportValidity()) renderCatalog();
  });
  form.addEventListener('change', () => {
    if (!form.checkValidity()) return;
    const values = Object.fromEntries(fields.map(field => [field.dataset.f, field.value]));
    let destination;
    if (form.dataset.context === 'category' && values.cat !== form.dataset.defaultCategory) {
      destination = values.cat ? `oferta/${values.cat}/` : 'oferty/';
    }
    if (form.dataset.context === 'city' && values.city !== form.dataset.defaultCity) {
      const citySlug = values.city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').toLowerCase().replace(/ /g, '-');
      destination = values.city ? `property-city/${citySlug}/` : 'oferty/';
    }
    if (destination) {
      const query = new URLSearchParams();
      fields.forEach(field => { if (field.value) query.set(field.dataset.f, field.value); });
      location.href = siteBase + destination + '?' + query.toString();
      return;
    }
    renderCatalog();
  });
  more.addEventListener('click', () => {
    limit += 24;
    renderCatalog(false);
  });
  const drawer = document.querySelector('.filter-drawer');
  const mobile = matchMedia('(max-width: 760px)');
  const updateDrawer = () => { drawer.open = !mobile.matches; };
  mobile.addEventListener('change', updateDrawer);
  updateDrawer();
  renderCatalog();
}

function initializeGallery() {
  const main = document.querySelector('.property-main-photo');
  if (!main) return;
  const image = main.querySelector('img');
  const thumbnails = [...document.querySelectorAll('[data-photo]')];
  const photos = thumbnails.length ? thumbnails.map(button => button.dataset.photo) : [image.src];
  let index = 0;
  let previousOverflow = '';
  const dialog = document.createElement('dialog');
  dialog.className = 'image-dialog';
  dialog.setAttribute('aria-label', 'Galeria zdjęć nieruchomości');
  dialog.innerHTML = '<img alt=""><button type="button" class="dialog-close" aria-label="Zamknij galerię">×</button><button type="button" class="dialog-previous" aria-label="Poprzednie zdjęcie">←</button><button type="button" class="dialog-next" aria-label="Następne zdjęcie">→</button><p class="dialog-counter" aria-live="polite"></p>';
  document.body.append(dialog);
  const enlarged = dialog.querySelector('img');
  enlarged.alt = image.alt;

  function selectPhoto(nextIndex) {
    index = (nextIndex + photos.length) % photos.length;
    image.src = photos[index];
    enlarged.src = photos[index];
    thumbnails.forEach((thumbnail, photoIndex) => thumbnail.setAttribute('aria-pressed', String(photoIndex === index)));
    dialog.querySelector('.dialog-counter').textContent = `${index + 1} / ${photos.length}`;
  }
  thumbnails.forEach((thumbnail, photoIndex) => thumbnail.addEventListener('click', () => selectPhoto(photoIndex)));
  main.addEventListener('click', () => {
    selectPhoto(index);
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.dialog-previous').addEventListener('click', () => selectPhoto(index - 1));
  dialog.querySelector('.dialog-next').addEventListener('click', () => selectPhoto(index + 1));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); selectPhoto(index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); selectPhoto(index + 1); }
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    main.focus();
  });
}

function initializeMailForms() {
  document.querySelectorAll('form[data-mail]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = [...form.elements]
        .filter(field => field.name && field.value && (!['checkbox', 'radio'].includes(field.type) || field.checked))
        .map(field => `${field.name}: ${field.value}`);
      values.push(`Strona oferty: ${location.href}`);
      const subject = encodeURIComponent(form.dataset.subject || 'Zapytanie do Biura Nieruchomości DOMINO');
      const body = encodeURIComponent(values.join('\n'));
      location.href = `mailto:domino@nieruchomosci-stw.pl?subject=${subject}&body=${body}`;
    });
  });
}

function initializeCalculator() {
  const form = document.querySelector('[data-calculator]');
  if (!form) return;
  const currency = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });
  function updateCosts() {
    const values = new FormData(form);
    const costs = calculatePurchaseCosts({
      price: Number(values.get('price')),
      apartment: values.get('propertyType') === 'apartment',
      landRegister: values.has('landRegister'),
      taxRate: Number(values.get('tax')),
      commissionRate: Number(values.get('commission'))
    });
    document.querySelectorAll('[data-cost]').forEach(output => {
      output.value = currency.format(costs[output.dataset.cost]);
      output.textContent = output.value;
    });
  }
  form.addEventListener('input', () => { if (form.checkValidity()) updateCosts(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (form.reportValidity()) updateCosts();
  });
  updateCosts();
}

document.querySelectorAll('.catalog-photo img').forEach(image => {
  image.addEventListener('error', () => {
    const placeholder = document.createElement('div');
    placeholder.className = 'photo-placeholder';
    placeholder.textContent = 'Brak zdjęcia w ofercie';
    image.replaceWith(placeholder);
  }, { once: true });
});

initializeCatalog();
initializeGallery();
initializeMailForms();
initializeCalculator();
