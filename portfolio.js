const studies = [
  ['toss', 'Lancer une balle dans un panier', 'handling'],
  ['ride-swing', 'Se balancer sur une balançoire', 'furniture'],
  ['put-on-glasses', 'Mettre ses lunettes', 'personal'],
  ['cooking', 'Remuer des légumes à la poêle', 'handling'],
  ['crawl-on-couch', 'Avancer à quatre pattes sur un canapé', 'furniture'],
  ['drink-cup', 'Boire à la tasse', 'personal'],
  ['cabinet', 'Ouvrir un meuble à abattant', 'handling'],
  ['kick', 'Frapper un ballon du pied', 'handling'],
  ['push', 'Pousser une caisse lourde', 'handling'],
  ['pull', 'Tirer une caisse lourde', 'handling'],
  ['sit-on-couch', 'S’asseoir sur un canapé', 'furniture'],
  ['lie-down', 'S’allonger sur un lit', 'furniture'],
  ['get-out-of-bed', 'Écarter la couverture et se lever', 'furniture'],
  ['pull-blanket-up', 'Remonter la couverture', 'furniture'],
  ['put-on-jacket', 'Enfiler une veste', 'personal'],
  ['remove-jacket', 'Retirer sa veste', 'personal'],
  ['remove-glasses', 'Retirer et poser ses lunettes', 'personal'],
  ['eat-bite', 'Prendre une bouchée', 'personal'],
];
const categories = { handling: 'Objets', furniture: 'Mobilier', personal: 'Gestes du quotidien' };
const gallery = document.querySelector('#motions');
const more = document.querySelector('#more');
let category = 'all';
let expanded = false;

function motionCard([id, title, group]) {
  const card = document.createElement('figure');
  card.className = 'motion';
  const button = document.createElement('button');
  const img = document.createElement('img');
  const caption = document.createElement('figcaption');
  const titleText = document.createElement('span');
  const groupText = document.createElement('span');
  const playIcon = document.createElement('span');
  playIcon.className = 'overlay-action';
  playIcon.ariaHidden = 'true';
  img.src = 'assets/ink/' + id + '.webp';
  img.alt = '';
  img.width = 420;
  img.height = 316;
  button.type = 'button';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', 'Animer le geste « ' + title + ' »');
  button.addEventListener('click', () => {
    const active = button.classList.toggle('active');
    button.setAttribute('aria-pressed', String(active));
    img.src = 'assets/ink/' + id + (active ? '.gif' : '.webp');
  });
  titleText.className = 'motion-title';
  titleText.textContent = title;
  groupText.className = 'motion-category';
  groupText.textContent = categories[group];
  caption.append(titleText, groupText);
  button.append(img, playIcon);
  card.append(button, caption);
  return card;
}

function renderGallery() {
  const matches = studies.filter(study => category === 'all' || study[2] === category);
  const visible = category === 'all' && !expanded ? matches.slice(0, 6) : matches;
  gallery.replaceChildren(...visible.map(motionCard));
  document.querySelector('#gallery-count').textContent = visible.length + ' sur ' + studies.length;
  more.hidden = category !== 'all';
  more.setAttribute('aria-expanded', String(expanded));
  more.setAttribute('aria-controls', 'motions');
  more.textContent = expanded ? 'Réduire la galerie' : 'Afficher les 18 mouvements';
}
document.querySelector('.filters').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  category = button.dataset.category;
  expanded = false;
  document.querySelectorAll('[data-category]').forEach(item => {
    item.setAttribute('aria-pressed', String(item === button));
  });
  renderGallery();
});
more.addEventListener('click', () => {
  expanded = !expanded;
  renderGallery();
  if (expanded) gallery.children[6].querySelector('button').focus();
  else document.querySelector('.gallery-top').scrollIntoView({block:'start'});
});
renderGallery();

const viewer = document.querySelector('#viewer');
const viewerBody = document.querySelector('#viewer-body');
function openViewer(title, element) {
  document.querySelector('#viewer-title').textContent = title;
  viewerBody.replaceChildren(element);
  viewer.showModal();
  document.body.classList.add('modal-open');
}
viewer.addEventListener('close', () => {
  viewerBody.querySelector('video')?.pause();
  viewerBody.replaceChildren();
  document.body.classList.remove('modal-open');
});
viewer.addEventListener('click', event => {
  if (event.target !== viewer) return;
  const rect = viewer.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
});
document.querySelector('#dismiss').addEventListener('click', () => viewer.close());
document.querySelectorAll('[data-pitch]').forEach(link => link.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.poster = 'assets/beehive/beehive-v4.webp';
  video.src = link.href;
  openViewer('Beehive · Démonstration V4', video);
  video.play().catch(() => {});
}));
document.querySelector('#network-open').addEventListener('click', async () => {
  try {
    await import('./assets/models/neural-network.js');
    openViewer('Explorer le réseau de neurones', document.createElement('neural-network-demo'));
  } catch {
    openAnimation('Le réseau de neurones', 'neural-network');
  }
});
function openAnimation(title, file) {
  const img = document.createElement('img');
  img.src = 'assets/models/' + file + '.gif';
  img.alt = title;
  openViewer(title, img);
}
document.querySelector('#arduino-open').addEventListener('click', () => {
  openAnimation('Les composants de l’Arduino Uno R3', 'arduino-uno');
});

// Download teaching loops as they enter view. A manual pause persists when scrolling.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.model-frame').forEach(frame => {
  const img = frame.querySelector('img');
  const button = frame.querySelector('button');
  const poster = img.getAttribute('src');
  const label = button.getAttribute('aria-label');
  let userChoice = null;
  let visible = false;
  function sync() {
    const playing = visible && (userChoice ?? !motionPreference.matches);
    const src = playing ? img.dataset.loop : poster;
    if (img.getAttribute('src') !== src) img.src = src;
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? label.replace('Lire', 'Arrêter') : label);
  }
  button.addEventListener('click', () => {
    userChoice = button.getAttribute('aria-pressed') !== 'true';
    sync();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, {threshold:0.05}).observe(frame);
  motionPreference.addEventListener('change', sync);
});
