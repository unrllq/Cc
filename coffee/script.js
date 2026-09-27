// Часы работы: [открытие, закрытие] в минутах от полуночи, индекс = день недели (0 — воскресенье).
const HOURS = [
  [9 * 60, 21 * 60],
  [7 * 60 + 30, 21 * 60],
  [7 * 60 + 30, 21 * 60],
  [7 * 60 + 30, 21 * 60],
  [7 * 60 + 30, 21 * 60],
  [7 * 60 + 30, 22 * 60],
  [9 * 60, 22 * 60],
];

const pad = (n) => String(n).padStart(2, '0');
const fmt = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

// Flip clock
const digits = ['h1', 'h2', 'm1', 'm2'].map((k) => document.querySelector(`[data-${k}]`));

function renderClock(now) {
  const value = pad(now.getHours()) + pad(now.getMinutes());
  digits.forEach((el, i) => {
    if (el.textContent === value[i]) return;
    el.textContent = value[i];
    el.classList.remove('is-flipping');
    void el.offsetWidth; // перезапуск анимации
    el.classList.add('is-flipping');
  });
}

// Статус «открыто / закрыто»
const status = document.querySelector('[data-status]');
const statusText = document.querySelector('[data-status-text]');

function renderStatus(now) {
  const day = now.getDay();
  const min = now.getHours() * 60 + now.getMinutes();
  const [open, close] = HOURS[day];
  const isOpen = min >= open && min < close;
  status.classList.toggle('is-open', isOpen);
  if (isOpen) {
    statusText.textContent = `Открыто до ${fmt(close)}`;
  } else {
    const nextDay = min < open ? day : (day + 1) % 7;
    statusText.textContent = `Откроемся ${min < open ? 'в' : 'завтра в'} ${fmt(HOURS[nextDay][0])}`;
  }

  document.querySelectorAll('.hours tr').forEach((tr) => {
    tr.classList.toggle('is-today', Number(tr.dataset.day) === day);
  });

  document.querySelectorAll('.day__item').forEach((li) => {
    const inRange = isOpen && min >= toMin(li.dataset.from) && min < toMin(li.dataset.to);
    li.classList.toggle('is-now', inRange);
  });
}

function tick() {
  const now = new Date();
  renderClock(now);
  renderStatus(now);
  setTimeout(tick, (60 - now.getSeconds()) * 1000 + 50);
}

// На первой отрисовке без анимации
digits.forEach((el) => (el.textContent = ''));
const first = new Date();
const v = pad(first.getHours()) + pad(first.getMinutes());
digits.forEach((el, i) => (el.textContent = v[i]));
tick();
