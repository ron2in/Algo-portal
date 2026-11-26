/**
 * Движок визуализации графов на SVG (вершины, рёбра, очередь/стек, массив dist).
 */
const SVG_NS = 'http://www.w3.org/2000/svg';

export function renderGraphFrame(container, frame, options = {}) {
  const {
    nodes = [],
    edges = [],
    weighted = false,
    currentNode = null,
    queuedNodes = [],
    visitedNodes = [],
    activeEdge = null,
    treeEdges = [],
    queue = [],
    dist = {}
  } = frame;

  const {
    clickableNodes = false,
    onNodeClick = null,
    onCanvasClick = null,
    selectedForEdge = null
  } = options;

  const wrapper = document.createElement('div');
  wrapper.className = 'graph-wrapper';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 560 260');
  svg.classList.add('graph-svg');

  if (onCanvasClick) {
    svg.addEventListener('click', (e) => {
      if (e.target !== svg) return;
      const rect = svg.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 560);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 260);
      onCanvasClick(x, y);
    });
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const queuedSet = new Set(queuedNodes);
  const visitedSet = new Set(visitedNodes);

  const isSameEdge = (e1, e2) => {
    if (!e1 || !e2) return false;
    return (
      (e1[0] === e2[0] && e1[1] === e2[1]) ||
      (e1[0] === e2[1] && e1[1] === e2[0])
    );
  };

  // Отрисовка рёбер
  edges.forEach((edge) => {
    const u = nodeMap.get(edge.from);
    const v = nodeMap.get(edge.to);
    if (!u || !v) return;

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', u.x);
    line.setAttribute('y1', u.y);
    line.setAttribute('x2', v.x);
    line.setAttribute('y2', v.y);
    line.classList.add('graph-edge');

    if (activeEdge && isSameEdge([edge.from, edge.to], activeEdge)) {
      line.classList.add('active');
    } else if (treeEdges.some((te) => isSameEdge([edge.from, edge.to], te))) {
      line.classList.add('tree');
    }

    svg.appendChild(line);

    if (weighted && edge.weight !== undefined) {
      const mx = (u.x + v.x) / 2;
      const my = (u.y + v.y) / 2 - 6;
      const wText = document.createElementNS(SVG_NS, 'text');
      wText.setAttribute('x', mx);
      wText.setAttribute('y', my);
      wText.setAttribute('fill', '#94A3B8');
      wText.setAttribute('font-size', '11');
      wText.setAttribute('font-family', 'JetBrains Mono, monospace');
      wText.setAttribute('text-anchor', 'middle');
      wText.textContent = edge.weight;
      svg.appendChild(wText);
    }
  });

  // Отрисовка вершин
  nodes.forEach((node) => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.classList.add('graph-node');

    if (currentNode === node.id) {
      g.classList.add('current');
    } else if (queuedSet.has(node.id)) {
      g.classList.add('queued');
    } else if (visitedSet.has(node.id)) {
      g.classList.add('visited');
    }

    if (clickableNodes || onNodeClick) {
      g.classList.add('clickable');
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onNodeClick) onNodeClick(node.id);
      });
    }

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', 18);
    if (selectedForEdge === node.id) {
      circle.setAttribute('stroke-dasharray', '4 3');
      circle.style.stroke = '#F59E0B';
    }

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', node.x);
    label.setAttribute('y', node.y);
    label.classList.add('graph-node-label');
    label.textContent = node.label ?? node.id;

    const dVal = dist[node.id];
    const distLabel = document.createElementNS(SVG_NS, 'text');
    distLabel.setAttribute('x', node.x);
    distLabel.setAttribute('y', node.y + 30);
    distLabel.classList.add('graph-dist-badge');
    distLabel.textContent = `d=${dVal === Infinity || dVal === undefined ? '∞' : dVal}`;

    g.appendChild(circle);
    g.appendChild(label);
    g.appendChild(distLabel);
    svg.appendChild(g);
  });

  wrapper.appendChild(svg);

  // Очередь (queue) и таблица расстояний (dist)
  const auxRow = document.createElement('div');
  auxRow.className = 'graph-aux-row';

  const queueBox = document.createElement('div');
  queueBox.className = 'graph-aux-box';
  queueBox.innerHTML = `
    <div class="graph-aux-title">Очередь (queue)</div>
    <div style="color: var(--info);">[${queue.length ? queue.join(', ') : 'пусто'}]</div>
  `;

  const distEntries = nodes.map((n) => {
    const d = dist[n.id];
    return `${n.id}:${d === Infinity || d === undefined ? '∞' : d}`;
  });
  const distBox = document.createElement('div');
  distBox.className = 'graph-aux-box';
  distBox.innerHTML = `
    <div class="graph-aux-title">Массив расстояний (dist)</div>
    <div style="color: var(--accent-light);">${distEntries.join('  ')}</div>
  `;

  auxRow.appendChild(queueBox);
  auxRow.appendChild(distBox);
  wrapper.appendChild(auxRow);

  container.innerHTML = '';
  container.appendChild(wrapper);
}
