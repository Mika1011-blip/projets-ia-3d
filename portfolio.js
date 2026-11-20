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
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const loops = new Map();
const cards = new Map();
let category = 'all';
let expanded = false;

function syncLoop(loop) {
  const playing = loop.visible && (loop.choice ?? !motionPreference.matches);
  const src = playing ? loop.gif : loop.poster;
  if (loop.img.getAttribute('src') !== src) loop.img.src = src;
  loop.button.setAttribute('aria-pressed', String(playing));
}

const loopObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const loop = loops.get(entry.target);
    loop.visible = entry.isIntersecting && entry.intersectionRatio > 0;
    syncLoop(loop);
  }
}, {threshold: [0, 0.01]});
motionPreference.addEventListener('change', () => loops.forEach(syncLoop));

function registerLoop(frame, img, button, gif) {
  const loop = { button, img, gif, poster: img.getAttribute('src'), visible: false, choice: null };
  loops.set(frame, loop);
  syncLoop(loop);
  loopObserver.observe(frame);
  button.addEventListener('click', () => {
    loop.choice = button.getAttribute('aria-pressed') !== 'true';
    syncLoop(loop);
  });
}

function motionCard([id, title, group]) {
  if (cards.has(id)) return cards.get(id);
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
  const media = 'assets/ink/' + id;
  img.src = media + '.gif';
  img.alt = '';
  img.width = 420;
  img.height = 316;
  button.type = 'button';
  button.setAttribute('aria-label', 'Animer le geste « ' + title + ' »');
  button.setAttribute('aria-pressed', 'true');
  button.addEventListener('click', () => {
    const resume = button.getAttribute('aria-pressed') === 'false';
    img.src = media + (resume ? '.gif' : '.webp');
    button.setAttribute('aria-pressed', String(resume));
  });
  titleText.className = 'motion-title';
  titleText.textContent = title;
  groupText.className = 'motion-category';
  groupText.textContent = categories[group];
  caption.append(titleText, groupText);
  button.append(img, playIcon);
  card.append(button, caption);
  cards.set(id, card);
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

document.querySelectorAll('.model-frame').forEach(frame => {
  const img = frame.querySelector('img');
  const button = frame.querySelector('button');
  registerLoop(frame, img, button, img.dataset.loop);
});
