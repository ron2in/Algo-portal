import { TOPICS } from '../data/topics.js';
import { StepPlayer } from './player.js';
import { renderArrayFrame } from './engines/arrayEngine.js';
import { renderGraphFrame } from './engines/graphEngine.js';

const STORAGE_KEY = 'algoportal_state_v1';

const state = {
  completed: new Set(),
  cheatsheet: new Set(),
  searchQuery: '',
  roadmapCategory: 'Все',
  activePlayer: null,
  activeTopicId: null
};

// ============================================================================
// Хранилище и утилиты
// ============================================================================
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.completed)) {
      state.completed = new Set(parsed.completed);
    }
    if (Array.isArray(parsed.cheatsheet)) {
      state.cheatsheet = new Set(parsed.cheatsheet);
    }
  } catch {
    // Игнорируем повреждённый JSON в localStorage
  }
}

function saveState() {
  const payload = {
    completed: [...state.completed],
    cheatsheet: [...state.cheatsheet]
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  updateProgressUI();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightCode(code, lang) {
  let html = escapeHtml(code);
  // Комментарии
  if (lang === 'cpp') {
    html = html.replace(/(\/\/[^\n]*)/g, '<span class="tok-com">$1</span>');
    html = html.replace(
      /\b(int|void|bool|const|vector|queue|using|namespace|std|return|while|if|else|for|auto)\b/g,
      '<span class="tok-kw">$1</span>'
    );
  } else {
    html = html.replace(/(#[^\n]*)/g, '<span class="tok-com">$1</span>');
    html = html.replace(
      /\b(def|return|while|if|else|for|in|from|import|list|int|float|len)\b/g,
      '<span class="tok-kw">$1</span>'
    );
  }
  html = html.replace(/\b(\d+)\b/g, '<span class="tok-num">$1</span>');
  return html;
}

// ============================================================================
// Сайдбар, прогресс и мобильное меню
// ============================================================================
function updateProgressUI() {
  const total = TOPICS.length;
  const doneCount = TOPICS.filter((t) => state.completed.has(t.id)).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const textEl = document.getElementById('sidebar-progress-text');
  const fillEl = document.getElementById('sidebar-progress-fill');
  const mobileBadge = document.getElementById('mobile-progress-badge');
  const cheatCount = document.getElementById('cheatsheet-count');

  if (textEl) textEl.textContent = `${doneCount} / ${total}`;
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (mobileBadge) mobileBadge.textContent = `${pct}%`;
  if (cheatCount) cheatCount.textContent = String(state.cheatsheet.size);
}

function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  const q = state.searchQuery.trim().toLowerCase();
  const filtered = TOPICS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q)
  );

  const categories = new Map();
  filtered.forEach((topic) => {
    if (!categories.has(topic.category)) categories.set(topic.category, []);
    categories.get(topic.category).push(topic);
  });

  if (filtered.length === 0) {
    nav.innerHTML = `<div style="padding:14px; color:var(--text-secondary); font-size:13px;">Темы не найдены</div>`;
    return;
  }

  let html = '';
  categories.forEach((items, catName) => {
    html += `<div class="nav-category"><div class="nav-category-title">${escapeHtml(catName)}</div>`;
    items.forEach((t) => {
      const isActive = state.activeTopicId === t.id;
      const isDone = state.completed.has(t.id);
      const dotClass = isDone ? 'done' : t.isStub ? 'stub' : '';
      html += `
        <a href="#topic=${t.id}" class="nav-item ${isActive ? 'active' : ''}" data-topic-link="${t.id}">
          <span class="nav-item-left">
            <span class="nav-status-dot ${dotClass}" title="${isDone ? 'Изучено' : t.isStub ? 'Скоро' : 'В процессе'}"></span>
            <span class="nav-item-title">${escapeHtml(t.title)}</span>
          </span>
        </a>
      `;
    });
    html += `</div>`;
  });

  nav.innerHTML = html;
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const toggle = document.getElementById('menu-toggle');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.hidden = true;
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function openMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const toggle = document.getElementById('menu-toggle');
  if (sidebar) sidebar.classList.add('open');
  if (backdrop) backdrop.hidden = false;
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
}

// ============================================================================
// Роутинг
// ============================================================================
function parseRoute() {
  const hash = window.location.hash || '#roadmap';
  if (hash.startsWith('#topic=')) {
    const id = hash.slice('#topic='.length).trim();
    const topic = TOPICS.find((t) => t.id === id);
    if (topic) return { view: 'topic', topic };
  }
  return { view: 'roadmap' };
}

function renderCurrentRoute() {
  if (state.activePlayer) {
    state.activePlayer.destroy();
    state.activePlayer = null;
  }

  const route = parseRoute();
  state.activeTopicId = route.view === 'topic' ? route.topic.id : null;
  renderSidebar();
  closeMobileSidebar();

  const main = document.getElementById('main-content');
  if (!main) return;

  if (route.view === 'roadmap') {
    renderRoadmapView(main);
  } else {
    renderTopicView(main, route.topic);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ============================================================================
// Главная страница: Роадмап тем
// ============================================================================
function renderRoadmapView(container) {
  const categories = ['Все', ...new Set(TOPICS.map((t) => t.category))];
  const doneCount = TOPICS.filter((t) => state.completed.has(t.id)).length;
  const interactiveCount = TOPICS.filter((t) => !t.isStub).length;

  const visibleTopics = TOPICS.filter((t) => {
    const matchCat = state.roadmapCategory === 'Все' || t.category === state.roadmapCategory;
    const q = state.searchQuery.trim().toLowerCase();
    const matchSearch =
      !q || t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  container.innerHTML = `
    <section class="hero-banner">
      <h1 class="hero-title">AlgoPortal — Интерактивный тренажёр алгоритмов</h1>
      <p class="hero-subtitle">
        Пошаговая визуализация структур данных, синхронизация выполнения с кодом (Dry-Run) и режим «Угадай следующий шаг» на базе материалов e-maxx.ru / cp-algorithms.
      </p>
      <div class="hero-stats">
        <div class="stat-pill">Изучено тем: <strong>${doneCount} / ${TOPICS.length}</strong></div>
        <div class="stat-pill">Интерактивных песочниц: <strong>${interactiveCount}</strong></div>
        <div class="stat-pill">В шпаргалке: <strong>${state.cheatsheet.size}</strong></div>
      </div>
    </section>

    <div class="roadmap-filters" id="roadmap-filters">
      ${categories
        .map(
          (cat) => `
          <button type="button" class="filter-chip ${state.roadmapCategory === cat ? 'active' : ''}" data-cat="${escapeHtml(cat)}">
            ${escapeHtml(cat)}
          </button>`
        )
        .join('')}
    </div>

    <div class="roadmap-grid">
      ${visibleTopics
        .map((t) => {
          const isDone = state.completed.has(t.id);
          return `
            <article class="topic-card ${isDone ? 'completed' : ''}" data-open-topic="${t.id}">
              <div>
                <div class="topic-card-top">
                  <span class="badge badge-muted">${escapeHtml(t.category)}</span>
                  ${
                    isDone
                      ? '<span class="badge badge-success">✓ Изучено</span>'
                      : t.isStub
                        ? '<span class="badge badge-warning">Скоро</span>'
                        : '<span class="badge badge-accent">Интерактив</span>'
                  }
                </div>
                <h2 class="topic-card-title">${escapeHtml(t.title)}</h2>
                <p class="topic-card-desc">${escapeHtml(t.summary)}</p>
              </div>
              <div class="topic-card-footer">
                <span class="mono">Время: ${escapeHtml(t.timeComplexity)}</span>
                <span style="color:var(--accent-light); font-weight:500;">Открыть →</span>
              </div>
            </article>
          `;
        })
        .join('')}
    </div>
  `;

  container.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.roadmapCategory = btn.getAttribute('data-cat');
      renderRoadmapView(container);
    });
  });

  container.querySelectorAll('[data-open-topic]').forEach((card) => {
    card.addEventListener('click', () => {
      window.location.hash = `#topic=${card.getAttribute('data-open-topic')}`;
    });
  });
}

// ============================================================================
// Страница алгоритма
// ============================================================================
function renderTopicView(container, topic) {
  const isDone = state.completed.has(topic.id);
  const inCheat = state.cheatsheet.has(topic.id);

  container.innerHTML = `
    <div style="margin-bottom: 12px;">
      <a href="#roadmap" class="btn btn-ghost btn-sm">← К роадмапу тем</a>
    </div>

    <!-- Карточка алгоритма -->
    <section class="card">
      <div class="card-header">
        <div>
          <span class="badge badge-muted">${escapeHtml(topic.category)} • ${escapeHtml(topic.difficulty)}</span>
          <h1 class="topic-title">${escapeHtml(topic.title)}</h1>
        </div>
        <div class="complexity-badges">
          <span class="badge badge-accent">Время: ${escapeHtml(topic.timeComplexity)}</span>
          <span class="badge badge-muted">Память: ${escapeHtml(topic.spaceComplexity)}</span>
        </div>
      </div>

      <p style="margin:0; color:var(--text-primary);">${escapeHtml(topic.summary)}</p>

      <div class="pitfalls-box">
        <div class="pitfalls-title">⚠ Подводные камни и крайние случаи</div>
        <ul class="pitfalls-list">
          ${topic.pitfalls.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
        </ul>
      </div>

      <div class="topic-actions-bar">
        <label class="checkbox-pill">
          <input type="checkbox" id="topic-done-checkbox" ${isDone ? 'checked' : ''}>
          <span>Тема изучена</span>
        </label>
        <button type="button" id="toggle-cheatsheet-btn" class="btn btn-secondary btn-sm">
          ${inCheat ? '✓ В шпаргалке (убрать)' : '+ Добавить в шпаргалку для печати'}
        </button>
      </div>
    </section>

    <div id="topic-workspace"></div>
  `;

  document.getElementById('topic-done-checkbox').addEventListener('change', (e) => {
    if (e.target.checked) state.completed.add(topic.id);
    else state.completed.delete(topic.id);
    saveState();
    renderSidebar();
    showToast(e.target.checked ? 'Тема отмечена как изученная!' : 'Отметка снята');
  });

  const cheatBtn = document.getElementById('toggle-cheatsheet-btn');
  cheatBtn.addEventListener('click', () => {
    if (state.cheatsheet.has(topic.id)) {
      state.cheatsheet.delete(topic.id);
      cheatBtn.textContent = '+ Добавить в шпаргалку для печати';
      showToast('Удалено из шпаргалки');
    } else {
      state.cheatsheet.add(topic.id);
      cheatBtn.textContent = '✓ В шпаргалке (убрать)';
      showToast('Добавлено в шпаргалку для печати');
    }
    saveState();
  });

  const workspace = document.getElementById('topic-workspace');
  if (topic.isStub) {
    workspace.innerHTML = `
      <section class="card">
        <div class="stub-notice">
          <h2 style="margin:0 0 8px;">Интерактивный визуализатор в разработке</h2>
          <p style="color:var(--text-secondary); max-width:520px; margin:0 auto;">
            Эта тема добавлена в роадмап для цельной программы подготовки. Полные пошаговые визуализаторы уже доступны в темах
            <a href="#topic=binary-search">Бинарный поиск</a> и <a href="#topic=bfs">Поиск в ширину (BFS)</a>.
          </p>
        </div>
      </section>
    `;
    return;
  }

  renderInteractiveWorkspace(workspace, topic);
}

// ============================================================================
// Интерактивный визуализатор + Dry-run + Вкладки
// ============================================================================
function renderInteractiveWorkspace(container, topic) {
  let currentData = structuredClone(topic.presets[0].data);
  let activePresetId = topic.presets[0].id;
  let graphEditMode = false;
  let edgeStartNode = null;

  container.innerHTML = `
    <section class="card">
      <div class="visualizer-toolbar">
        <h2 class="section-title" style="margin:0;">Интерактивный визуализатор</h2>
        <label class="checkbox-pill" title="Плеер будет останавливаться перед ключевым шагом и просить вас выбрать элемент">
          <input type="checkbox" id="guess-mode-toggle">
          <span>🎯 Режим «Угадай следующий шаг»</span>
        </label>
      </div>

      <div class="visualizer-toolbar">
        <div class="preset-group" id="preset-buttons">
          ${topic.presets
            .map(
              (p) => `
              <button type="button" class="preset-btn ${p.id === activePresetId ? 'active' : ''}" data-preset="${p.id}">
                ${escapeHtml(p.label)}
              </button>`
            )
            .join('')}
        </div>
      </div>

      <div id="custom-input-area"></div>

      <div id="guess-banner" class="guess-banner" hidden>
        <span id="guess-banner-text"></span>
        <button type="button" id="guess-skip-btn" class="btn btn-ghost btn-xs">Пропустить шаг</button>
      </div>

      <div class="dryrun-grid">
        <div class="stage-panel">
          <div id="stage-canvas" class="stage-canvas-wrap"></div>
          <div id="step-explanation" class="step-explanation"></div>
        </div>

        <div class="code-trace-panel">
          <div class="panel-subbar">
            <span>Трассировка кода (Dry-Run)</span>
            <span class="mono" style="color:var(--accent-light);">C++</span>
          </div>
          <div id="trace-code-lines" class="trace-code-lines">
            ${topic.traceCode
              .map(
                (line, idx) => `
                <div class="trace-line" data-line="${idx}">
                  <span class="trace-line-num">${idx + 1}</span>
                  <span>${escapeHtml(line)}</span>
                </div>`
              )
              .join('')}
          </div>
          <div class="variables-table-wrap">
            <div style="font-size:11.5px; color:var(--text-secondary); margin-bottom:6px;">Текущие переменные:</div>
            <div id="variables-grid" class="variables-grid"></div>
          </div>
        </div>
      </div>

      <div id="player-controls-mount"></div>
    </section>

    <!-- Вкладки с реализацией и практикой -->
    <section class="card">
      <div class="tabs-header">
        <div class="tabs-list" role="tablist">
          <button type="button" class="tab-btn active" data-tab="cpp">C++</button>
          <button type="button" class="tab-btn" data-tab="python">Python</button>
          <button type="button" class="tab-btn" data-tab="practice">Задачи и тест</button>
        </div>
      </div>
      <div id="tab-content-area"></div>
    </section>
  `;

  const stageCanvas = document.getElementById('stage-canvas');
  const stepExp = document.getElementById('step-explanation');
  const varsGrid = document.getElementById('variables-grid');
  const guessBanner = document.getElementById('guess-banner');
  const guessBannerText = document.getElementById('guess-banner-text');
  const guessToggle = document.getElementById('guess-mode-toggle');
  const customInputArea = document.getElementById('custom-input-area');

  const player = new StepPlayer({
    container: document.getElementById('player-controls-mount'),
    onGuessState: (info) => {
      if (!info) {
        guessBanner.hidden = true;
        guessBanner.className = 'guess-banner';
        return;
      }
      guessBanner.hidden = false;
      guessBanner.className = `guess-banner ${info.status === 'wrong' ? 'wrong' : info.status === 'correct' ? 'correct' : ''}`;
      guessBannerText.textContent = `🎯 ${info.prompt}`;
    },
    onRenderFrame: (frame) => {
      if (topic.engine === 'array') {
        renderArrayFrame(stageCanvas, frame, {
          clickable: Boolean(player.pendingGuess || player.guessMode),
          onCellClick: (idx) => {
            if (player.pendingGuess) player.submitGuess(idx);
          }
        });
      } else if (topic.engine === 'graph') {
        renderGraphFrame(stageCanvas, frame, {
          clickableNodes: Boolean(player.pendingGuess || graphEditMode),
          selectedForEdge: edgeStartNode,
          onCanvasClick: graphEditMode
            ? (x, y) => {
                const nextId = currentData.nodes.length
                  ? Math.max(...currentData.nodes.map((n) => n.id)) + 1
                  : 0;
                currentData.nodes.push({ id: nextId, x, y });
                rebuildCustomForm();
                runVisualization();
              }
            : null,
          onNodeClick: (nodeId) => {
            if (player.pendingGuess) {
              player.submitGuess(nodeId);
              return;
            }
            if (graphEditMode) {
              if (edgeStartNode === null) {
                edgeStartNode = nodeId;
                player.onRenderFrame(player.frames[player.index], player.index, player.frames.length);
              } else if (edgeStartNode !== nodeId) {
                const exists = currentData.edges.some(
                  (e) =>
                    (e.from === edgeStartNode && e.to === nodeId) ||
                    (e.from === nodeId && e.to === edgeStartNode)
                );
                if (!exists) currentData.edges.push({ from: edgeStartNode, to: nodeId });
                edgeStartNode = null;
                runVisualization();
              } else {
                edgeStartNode = null;
                player.onRenderFrame(player.frames[player.index], player.index, player.frames.length);
              }
            }
          }
        });
      }

      stepExp.textContent = frame.explanation || '';

      container.querySelectorAll('.trace-line').forEach((el) => {
        el.classList.toggle('active', Number(el.getAttribute('data-line')) === frame.line);
      });

      const vars = frame.vars || {};
      varsGrid.innerHTML = Object.entries(vars)
        .map(
          ([k, v]) =>
            `<span class="var-chip"><span class="var-name">${escapeHtml(k)} = </span><span class="var-val">${escapeHtml(v)}</span></span>`
        )
        .join('');
    }
  });

  state.activePlayer = player;

  guessToggle.addEventListener('change', (e) => {
    player.setGuessMode(e.target.checked);
    // Перерисовать текущий кадр, чтобы обновить курсор кликабельности
    if (player.frames[player.index]) {
      player.onRenderFrame(player.frames[player.index], player.index, player.frames.length);
    }
  });

  document.getElementById('guess-skip-btn').addEventListener('click', () => {
    player.stepForward(true);
  });

  function runVisualization() {
    const frames = topic.generateFrames(currentData);
    player.setFrames(frames);
  }

  function rebuildCustomForm() {
    if (topic.engine === 'array') {
      customInputArea.innerHTML = `
        <form id="array-custom-form" class="custom-input-form">
          <div class="form-field" style="flex:2;">
            <label for="arr-input">Отсортированный массив (через запятую или пробел)</label>
            <input id="arr-input" type="text" class="input-field input-mono" value="${currentData.array.join(', ')}">
          </div>
          <div class="form-field" style="max-width:140px;">
            <label for="target-input">Искомое (target)</label>
            <input id="target-input" type="number" class="input-field input-mono" value="${currentData.target}">
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Запустить визуализацию</button>
          <div id="custom-form-err" class="form-error" hidden></div>
        </form>
      `;

      document.getElementById('array-custom-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const errEl = document.getElementById('custom-form-err');
        const rawArr = document.getElementById('arr-input').value.trim();
        const rawTarget = document.getElementById('target-input').value.trim();

        const parts = rawArr.split(/[\s,;]+/).filter(Boolean);
        const nums = parts.map(Number);

        if (nums.length === 0 || nums.length > 18 || nums.some(Number.isNaN)) {
          errEl.textContent = 'Введите от 1 до 18 корректных целых чисел.';
          errEl.hidden = false;
          return;
        }
        for (let i = 1; i < nums.length; i++) {
          if (nums[i] < nums[i - 1]) {
            errEl.textContent = 'Массив должен быть отсортирован по неубыванию!';
            errEl.hidden = false;
            return;
          }
        }
        const target = Number(rawTarget);
        if (rawTarget === '' || Number.isNaN(target)) {
          errEl.textContent = 'Укажите корректное число target.';
          errEl.hidden = false;
          return;
        }

        errEl.hidden = true;
        currentData = { array: nums, target };
        runVisualization();
      });
    } else if (topic.engine === 'graph') {
      customInputArea.innerHTML = `
        <div class="custom-input-form">
          <div class="form-field" style="max-width:180px;">
            <label for="bfs-start-select">Стартовая вершина</label>
            <select id="bfs-start-select" class="select-field input-mono">
              ${currentData.nodes
                .map(
                  (n) =>
                    `<option value="${n.id}" ${n.id === currentData.startNode ? 'selected' : ''}>Вершина ${n.id}</option>`
                )
                .join('')}
            </select>
          </div>
          <button type="button" id="toggle-graph-edit" class="btn ${graphEditMode ? 'btn-primary' : 'btn-secondary'} btn-sm">
            ${graphEditMode ? '✓ Режим редактирования (вкл)' : '✎ Добавить вершину / ребро кликом'}
          </button>
          <button type="button" id="reset-graph-btn" class="btn btn-ghost btn-sm">Сбросить граф</button>
          ${
            graphEditMode
              ? '<div style="width:100%; font-size:12px; color:var(--accent-light);">Клик по пустому фону графа — добавить вершину. Клик по двум вершинам подряд — соединить ребром.</div>'
              : ''
          }
        </div>
      `;

      document.getElementById('bfs-start-select').addEventListener('change', (e) => {
        currentData.startNode = Number(e.target.value);
        runVisualization();
      });

      document.getElementById('toggle-graph-edit').addEventListener('click', () => {
        graphEditMode = !graphEditMode;
        edgeStartNode = null;
        rebuildCustomForm();
        player.onRenderFrame(player.frames[player.index], player.index, player.frames.length);
      });

      document.getElementById('reset-graph-btn').addEventListener('click', () => {
        const preset = topic.presets.find((p) => p.id === activePresetId) || topic.presets[0];
        currentData = structuredClone(preset.data);
        edgeStartNode = null;
        rebuildCustomForm();
        runVisualization();
      });
    }
  }

  // Переключение пресетов
  container.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activePresetId = btn.getAttribute('data-preset');
      const preset = topic.presets.find((p) => p.id === activePresetId);
      if (!preset) return;
      currentData = structuredClone(preset.data);
      edgeStartNode = null;

      container.querySelectorAll('[data-preset]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-preset') === activePresetId);
      });

      rebuildCustomForm();
      runVisualization();
    });
  });

  // Вкладки C++ / Python / Задачи и тест
  const tabContentArea = document.getElementById('tab-content-area');
  function renderTab(tabName) {
    if (tabName === 'cpp' || tabName === 'python') {
      const codeStr = topic.code[tabName];
      const label = tabName === 'cpp' ? 'C++17' : 'Python 3';
      tabContentArea.innerHTML = `
        <div class="code-block-wrap">
          <div class="code-block-header">
            <span>${label}</span>
            <button type="button" id="copy-code-btn" class="btn btn-secondary btn-xs">Копировать код</button>
          </div>
          <pre class="code-pre"><code>${highlightCode(codeStr, tabName)}</code></pre>
        </div>
      `;
      document.getElementById('copy-code-btn').addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(codeStr);
          showToast('Код скопирован в буфер обмена');
        } catch {
          showToast('Не удалось скопировать автоматически');
        }
      });
    } else {
      const q = topic.quiz;
      tabContentArea.innerHTML = `
        <h3 style="margin:0 0 10px; font-size:15px;">Задачи на закрепление</h3>
        <div class="problems-list">
          ${topic.problems
            .map(
              (pr) => `
              <a href="${pr.url}" target="_blank" rel="noopener noreferrer" class="problem-link-card">
                <div>
                  <div style="font-weight:500; font-size:14px;">${escapeHtml(pr.title)}</div>
                  <div style="font-size:12px; color:var(--text-secondary);">${escapeHtml(pr.platform)}</div>
                </div>
                <span class="badge ${pr.difficulty === 'Easy' ? 'badge-success' : 'badge-accent'}">${escapeHtml(pr.difficulty)}</span>
              </a>
            `
            )
            .join('')}
        </div>

        <h3 style="margin:0 0 10px; font-size:15px;">Мини-тест: определите асимптотику</h3>
        <div class="quiz-box">
          <pre class="code-pre" style="padding:10px 12px; background:var(--bg-code); border-radius:6px; margin-bottom:12px;"><code>${highlightCode(q.snippet, 'cpp')}</code></pre>
          <div style="font-size:14px; font-weight:500;">${escapeHtml(q.question)}</div>
          <div class="quiz-options">
            ${q.options
              .map(
                (opt) => `<button type="button" class="quiz-option-btn" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`
              )
              .join('')}
          </div>
          <div id="quiz-feedback" style="margin-top:10px; font-size:13px;" hidden></div>
        </div>
      `;

      tabContentArea.querySelectorAll('.quiz-option-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const chosen = btn.getAttribute('data-opt');
          const fb = document.getElementById('quiz-feedback');
          tabContentArea.querySelectorAll('.quiz-option-btn').forEach((b) => {
            b.classList.remove('correct', 'wrong');
          });
          if (chosen === q.answer) {
            btn.classList.add('correct');
            fb.style.color = 'var(--success)';
            fb.textContent = `✓ Верно! ${q.explanation}`;
          } else {
            btn.classList.add('wrong');
            fb.style.color = 'var(--danger)';
            fb.textContent = `✕ Неверно. Попробуйте другой вариант.`;
          }
          fb.hidden = false;
        });
      });
    }
  }

  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderTab(btn.getAttribute('data-tab'));
    });
  });

  rebuildCustomForm();
  runVisualization();
  renderTab('cpp');
}

// ============================================================================
// Экспорт / Импорт и Шпаргалка для печати
// ============================================================================
function setupGlobalActions() {
  document.getElementById('topic-search').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderSidebar();
    if (!state.activeTopicId) {
      renderRoadmapView(document.getElementById('main-content'));
    }
  });

  document.getElementById('menu-toggle').addEventListener('click', openMobileSidebar);
  document.getElementById('sidebar-close').addEventListener('click', closeMobileSidebar);
  document.getElementById('sidebar-backdrop').addEventListener('click', closeMobileSidebar);

  document.getElementById('export-progress-btn').addEventListener('click', () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      completed: [...state.completed],
      cheatsheet: [...state.cheatsheet]
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'algoportal-progress.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Прогресс экспортирован в JSON');
  });

  document.getElementById('import-progress-input').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.completed)) throw new Error('Invalid format');
        state.completed = new Set(data.completed);
        state.cheatsheet = new Set(Array.isArray(data.cheatsheet) ? data.cheatsheet : []);
        saveState();
        renderCurrentRoute();
        showToast('Прогресс успешно импортирован!');
      } catch {
        showToast('Ошибка: некорректный JSON-файл');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('open-cheatsheet-btn').addEventListener('click', () => {
    const printArea = document.getElementById('print-cheatsheet-area');
    let selected = TOPICS.filter((t) => state.cheatsheet.has(t.id));
    if (selected.length === 0 && state.activeTopicId) {
      selected = TOPICS.filter((t) => t.id === state.activeTopicId);
    }
    if (selected.length === 0) {
      selected = TOPICS.filter((t) => !t.isStub);
    }

    printArea.innerHTML = `
      <h1 style="margin:0 0 12px; font-size:18pt;">AlgoPortal — Шпаргалка</h1>
      ${selected
        .map(
          (t) => `
          <div class="print-topic">
            <h2>${escapeHtml(t.title)} (${escapeHtml(t.timeComplexity)} / ${escapeHtml(t.spaceComplexity)})</h2>
            <p style="margin:4px 0 8px;">${escapeHtml(t.summary)}</p>
            ${t.code?.cpp ? `<pre>${escapeHtml(t.code.cpp)}</pre>` : ''}
          </div>
        `
        )
        .join('')}
    `;
    window.print();
  });
}

// ============================================================================
// Инициализация
// ============================================================================
loadState();
updateProgressUI();
setupGlobalActions();
window.addEventListener('hashchange', renderCurrentRoute);
renderCurrentRoute();
