const titles = {
  "도감": "codex-tabs",
  "삼토체스": "home",
  "병영": "barracks",
  "상점": "shop",
  "전역": "campaign",
  "동맹": "alliance",
  "군웅대전": "arena",
  "장수 편성": "formation",
  "장수 도감": "codex",
  "전투 기록": "record",
  "상품 교환": "exchange",
  "토벌 파견": "expedition",
  "내정": "government",
  "우편함": "mail",
  "군공 상점": "merit",
  "상품 · 보급": "products",
  "군주 정보": "profile",
  "전투 결과": "results",
  "S 장수 선택": "select",
  "설정": "settings",
  "첫 7일 보상": "start",
  "군략 선택": "strategy",
  "연무탑": "tower",
  "보물함": "treasure",
  "상대 선택": "opponent",
  "시즌 · 등급": "season",
  "픽업 확률": "pickup",
  "모집 확률": "rates",
  "보물 획득": "treasure-result",
  "등용 결과": "recruit-result",
  "임무": "missions",
  "기초 훈련": "training",
  "황건의 난": "yellow",
  "사수관": "sishui",
  "호뢰관": "hulao",
  "복양": "puyang",
  "하비": "xiapi",
  "관도": "guandu",
  "적벽": "chibi",
  "이릉": "yiling",
  "어려움": "hard",
  "층": "floor"
};
const assetRoot = new URL('./assets/ui-common/header-lettering/', import.meta.url);

export function headerLettering(title) {
 const tower = /^연무탑 (\d+)층$/.exec(title);
 if (tower) return ['tower', ...Array.from(tower[1], digit => 'digit-' + digit), 'floor'];
 const difficulty = ' · 어려움';
 if (title.endsWith(difficulty)) {
  const base = headerLettering(title.slice(0, -difficulty.length));
  return base ? [...base, 'dot', 'hard'] : null;
 }
 return Object.hasOwn(titles, title) ? [titles[title]] : null;
}

export function paintHeaderLettering(label, title) {
 const parts = headerLettering(title);
 if (!parts) return;
 const row = document.createElement('span');
 row.className = 'header-lettering';
 const images = [];
 for (const id of parts) {
  if (id === 'dot') {
   const dot = document.createElement('i');
   dot.className = 'header-lettering-dot';
   row.append(dot);
   continue;
  }
  const image = new Image();
  image.alt = '';
  image.src = new URL(id === 'home' ? '../gate-title-samto.png' : id + '.png', assetRoot);
  row.append(image);
  images.push(image);
 }
 Promise.all(images.map(image => image.decode())).then(() => {
  const aspect = images.reduce((sum, image) => sum + image.naturalWidth / image.naturalHeight, 0);
  const height = Math.min(63, 250 / (aspect + (parts.length - 1) * .26));
  row.style.setProperty('--lettering-height', height / 941 * 100 + 'cqw');
  label.setAttribute('aria-label', title);
  label.replaceChildren(row);
 }).catch(() => {});
}
