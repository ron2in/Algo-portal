/**
 * База тем AlgoPortal (по материалам e-maxx.ru / cp-algorithms).
 */

export const TOPICS = [
  {
    id: 'binary-search',
    title: 'Бинарный поиск (lower_bound)',
    category: 'Поиск и массивы',
    difficulty: 'Базовый',
    isStub: false,
    engine: 'array',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    summary:
      'Бинарный поиск на отсортированном массиве позволяет за логарифмическое время найти первый элемент, который больше либо равен заданному значению target (lower_bound), а также используется для «бинарного поиска по ответу» на монотонных функциях.',
    pitfalls: [
      'Переполнение при вычислении середины: в C++/Java используйте l + (r - l) / 2 вместо (l + r) / 2.',
      'Ошибки на ±1 (off-by-one): чётко фиксируйте инвариант границ [l, r] и начальное значение ans = n.',
      'Неотсортированный массив: алгоритм корректно работает только при монотонности предиката a[i] >= target.'
    ],
    traceCode: [
      'int l = 0, r = n - 1, ans = n;',
      'while (l <= r) {',
      '    int mid = l + (r - l) / 2;',
      '    if (a[mid] >= target) {',
      '        ans = mid;',
      '        r = mid - 1;',
      '    } else {',
      '        l = mid + 1;',
      '    }',
      '}',
      'return ans;'
    ],
    presets: [
      {
        id: 'normal',
        label: 'Обычный случай',
        data: { array: [2, 5, 8, 12, 16, 23, 38, 56, 72], target: 23 }
      },
      {
        id: 'duplicates',
        label: 'Дубликаты',
        data: { array: [1, 4, 4, 4, 7, 9, 12, 15], target: 4 }
      },
      {
        id: 'missing',
        label: 'Элемент отсутствует',
        data: { array: [3, 7, 11, 18, 25, 31], target: 15 }
      }
    ],
    generateFrames({ array, target }) {
      const n = array.length;
      const frames = [];
      let l = 0;
      let r = n - 1;
      let ans = n;

      const snapVars = (mid = '—') => ({
        l,
        r,
        mid,
        ans,
        target
      });

      frames.push({
        array,
        pointers: { L: l, R: r },
        activeRange: [l, r],
        midIndex: null,
        foundIndex: null,
        line: 0,
        vars: snapVars(),
        explanation: `Инициализация: l = 0, r = ${n - 1}, ans = ${n} (если элемент не найдётся, ответ будет за пределами массива).`
      });

      while (l <= r) {
        frames.push({
          array,
          pointers: { L: l, R: r, ans: ans < n ? ans : null },
          activeRange: [l, r],
          midIndex: null,
          foundIndex: null,
          line: 1,
          vars: snapVars(),
          explanation: `Проверяем условие цикла: l (${l}) <= r (${r}) — истина, продолжаем сужать диапазон.`
        });

        const mid = l + Math.floor((r - l) / 2);

        frames.push({
          array,
          pointers: { L: l, R: r, M: mid, ans: ans < n ? ans : null },
          activeRange: [l, r],
          midIndex: mid,
          foundIndex: null,
          line: 2,
          vars: snapVars(mid),
          guess: {
            expected: mid,
            prompt: `Какой индекс станет серединой mid на отрезке [${l}, ${r}]? Кликните по ячейке.`
          },
          explanation: `Вычисляем середину: mid = ${l} + (${r} - ${l}) / 2 = ${mid}. Значение a[${mid}] = ${array[mid]}.`
        });

        frames.push({
          array,
          pointers: { L: l, R: r, M: mid, ans: ans < n ? ans : null },
          activeRange: [l, r],
          midIndex: mid,
          foundIndex: null,
          line: 3,
          vars: snapVars(mid),
          explanation: `Сравниваем a[${mid}] (${array[mid]}) >= target (${target}): ${array[mid] >= target ? 'да' : 'нет'}.`
        });

        if (array[mid] >= target) {
          ans = mid;
          frames.push({
            array,
            pointers: { L: l, R: r, M: mid, ans },
            activeRange: [l, r],
            midIndex: mid,
            foundIndex: null,
            line: 4,
            vars: snapVars(mid),
            explanation: `Так как a[${mid}] >= ${target}, индекс ${mid} подходит. Обновляем ans = ${mid}.`
          });

          r = mid - 1;
          frames.push({
            array,
            pointers: { L: l, R: r >= 0 ? r : null, ans },
            activeRange: l <= r ? [l, r] : null,
            midIndex: null,
            foundIndex: null,
            line: 5,
            vars: snapVars(mid),
            explanation: `Пытаемся найти более левое вхождение: сдвигаем правую границу r = ${mid} - 1 = ${r}.`
          });
        } else {
          l = mid + 1;
          frames.push({
            array,
            pointers: { L: l < n ? l : null, R: r, ans: ans < n ? ans : null },
            activeRange: l <= r ? [l, r] : null,
            midIndex: null,
            foundIndex: null,
            line: 7,
            vars: snapVars(mid),
            explanation: `Так как a[${mid}] (${array[mid]}) < ${target}, отбрасываем левую половину: l = ${mid} + 1 = ${l}.`
          });
        }
      }

      frames.push({
        array,
        pointers: { ans: ans < n ? ans : null },
        activeRange: null,
        midIndex: null,
        foundIndex: ans < n ? ans : null,
        line: 10,
        vars: snapVars(),
        explanation:
          ans < n
            ? `Цикл завершён (l > r). Ответ: ans = ${ans}, a[${ans}] = ${array[ans]} (первый элемент >= ${target}).`
            : `Цикл завершён (l > r). Все элементы меньше ${target}, возвращаем ans = ${n}.`
      });

      return frames;
    },
    code: {
      cpp: `#include <vector>
using namespace std;

// Возвращает минимальный индекс i, такой что a[i] >= target (или n, если такого нет)
int lowerBound(const vector<int>& a, int target) {
    int n = (int)a.size();
    int l = 0, r = n - 1, ans = n;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (a[mid] >= target) {
            ans = mid;
            r = mid - 1;
        } else {
            l = mid + 1;
        }
    }
    return ans;
}`,
      python: `def lower_bound(a: list[int], target: int) -> int:
    """Возвращает минимальный индекс i, такой что a[i] >= target (или len(a))."""
    n = len(a)
    l, r, ans = 0, n - 1, n
    while l <= r:
        mid = l + (r - l) // 2
        if a[mid] >= target:
            ans = mid
            r = mid - 1
        else:
            l = mid + 1
    return ans`
    },
    problems: [
      {
        title: 'CF EDU: Binary Search (Step 1A)',
        platform: 'Codeforces',
        difficulty: 'Easy',
        url: 'https://codeforces.com/edu/course/2/lesson/6/1/practice'
      },
      {
        title: 'CSES: Factory Machines',
        platform: 'CSES',
        difficulty: 'Medium',
        url: 'https://cses.fi/problemset/task/1620'
      },
      {
        title: 'ACMP #1182: Двоичный поиск',
        platform: 'ACMP',
        difficulty: 'Easy',
        url: 'https://acmp.ru/asp/do/index.asp?main=task&id_course=1&id_section=7&id_topic=119&id_problem=733'
      }
    ],
    quiz: {
      snippet: `int l = 0, r = n;
while (r - l > 1) {
    int m = l + (r - l) / 2;
    if (check(m)) l = m;
    else r = m;
}`,
      question: 'Какова временная сложность приведённого фрагмента, если check(m) работает за O(log N)?',
      options: ['O(log N)', 'O(log² N)', 'O(N log N)', 'O(N)'],
      answer: 'O(log² N)',
      explanation: 'Цикл делает O(log N) итераций, на каждой из которых вызывается check(m) за O(log N). Итого O(log² N).'
    }
  },

  {
    id: 'bfs',
    title: 'Поиск в ширину (BFS)',
    category: 'Графы',
    difficulty: 'Базовый',
    isStub: false,
    engine: 'graph',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    summary:
      'Поиск в ширину (Breadth-First Search) обходит граф слоями в порядке удаления от стартовой вершины. В невзвешенном графе BFS гарантированно находит кратчайшие пути от стартовой вершины до всех достижимых.',
    pitfalls: [
      'Пометка visited/dist должна происходить при добавлении в очередь, а НЕ при извлечении из неё — иначе одна вершина попадёт в очередь многократно.',
      'В несвязном графе недостижимые вершины сохраняют расстояние ∞ (или -1).',
      'Для графов с разными весами рёбер BFS не подходит — нужен алгоритм Дейкстры или 0-1 BFS.'
    ],
    traceCode: [
      'dist.assign(n, INF);',
      'dist[start] = 0; q.push(start);',
      'while (!q.empty()) {',
      '    int u = q.front(); q.pop();',
      '    for (int v : adj[u]) {',
      '        if (dist[v] == INF) {',
      '            dist[v] = dist[u] + 1;',
      '            q.push(v);',
      '        }',
      '    }',
      '}'
    ],
    presets: [
      {
        id: 'connected',
        label: 'Связный граф (6 вершин)',
        data: {
          startNode: 0,
          nodes: [
            { id: 0, x: 90, y: 130 },
            { id: 1, x: 210, y: 60 },
            { id: 2, x: 210, y: 200 },
            { id: 3, x: 350, y: 60 },
            { id: 4, x: 350, y: 200 },
            { id: 5, x: 470, y: 130 }
          ],
          edges: [
            { from: 0, to: 1 },
            { from: 0, to: 2 },
            { from: 1, to: 3 },
            { from: 1, to: 2 },
            { from: 2, to: 4 },
            { from: 3, to: 5 },
            { from: 4, to: 5 }
          ]
        }
      },
      {
        id: 'disconnected',
        label: '2 компоненты связности',
        data: {
          startNode: 0,
          nodes: [
            { id: 0, x: 90, y: 70 },
            { id: 1, x: 220, y: 70 },
            { id: 2, x: 155, y: 185 },
            { id: 3, x: 360, y: 80 },
            { id: 4, x: 470, y: 80 },
            { id: 5, x: 415, y: 185 }
          ],
          edges: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 0, to: 2 },
            { from: 3, to: 4 },
            { from: 4, to: 5 }
          ]
        }
      }
    ],
    generateFrames({ nodes, edges, startNode }) {
      const adj = new Map();
      nodes.forEach((n) => adj.set(n.id, []));
      edges.forEach((e) => {
        if (adj.has(e.from) && adj.has(e.to)) {
          adj.get(e.from).push(e.to);
          adj.get(e.to).push(e.from);
        }
      });
      adj.forEach((list) => list.sort((a, b) => a - b));

      const dist = {};
      nodes.forEach((n) => {
        dist[n.id] = Infinity;
      });

      const frames = [];
      const queue = [];
      const visited = new Set();
      const treeEdges = [];

      const snap = (extra = {}) => ({
        nodes,
        edges,
        weighted: false,
        currentNode: null,
        queuedNodes: [...queue],
        visitedNodes: [...visited],
        activeEdge: null,
        treeEdges: treeEdges.map((e) => [...e]),
        queue: [...queue],
        dist: { ...dist },
        ...extra
      });

      frames.push(
        snap({
          line: 0,
          vars: { start: startNode, queue: '[]' },
          explanation: `Инициализируем расстояния dist[v] = ∞ для всех вершин.`
        })
      );

      dist[startNode] = 0;
      queue.push(startNode);

      frames.push(
        snap({
          currentNode: startNode,
          line: 1,
          vars: { start: startNode, 'dist[start]': 0, queue: `[${queue.join(', ')}]` },
          explanation: `Задаём dist[${startNode}] = 0 и помещаем стартовую вершину ${startNode} в очередь.`
        })
      );

      while (queue.length > 0) {
        const u = queue.shift();
        visited.add(u);

        frames.push(
          snap({
            currentNode: u,
            line: 3,
            vars: { u, 'dist[u]': dist[u], queue: `[${queue.join(', ')}]` },
            explanation: `Извлекаем вершину u = ${u} из начала очереди. Начинаем просмотр её соседей.`
          })
        );

        const neighbors = adj.get(u) || [];
        for (const v of neighbors) {
          frames.push(
            snap({
              currentNode: u,
              activeEdge: [u, v],
              line: 5,
              vars: { u, v, 'dist[v]': dist[v] === Infinity ? '∞' : dist[v] },
              explanation: `Проверяем соседа v = ${v} по ребру (${u}, ${v}).`
            })
          );

          if (dist[v] === Infinity) {
            dist[v] = dist[u] + 1;
            queue.push(v);
            treeEdges.push([u, v]);

            frames.push(
              snap({
                currentNode: u,
                activeEdge: [u, v],
                line: 7,
                vars: {
                  u,
                  v,
                  'dist[v]': dist[v],
                  queue: `[${queue.join(', ')}]`
                },
                guess: {
                  expected: v,
                  prompt: `Какая непосещённая вершина будет добавлена в очередь из вершины ${u}? Кликните по вершине на графе.`
                },
                explanation: `Вершина ${v} ещё не посещена! Устанавливаем dist[${v}] = dist[${u}] + 1 = ${dist[v]} и добавляем ${v} в очередь.`
              })
            );
          }
        }
      }

      frames.push(
        snap({
          line: 10,
          vars: { queue: '[]', visited: visited.size },
          explanation: `Очередь пуста — обход BFS завершён! Все достижимые вершины получили кратчайшие расстояния.`
        })
      );

      return frames;
    },
    code: {
      cpp: `#include <vector>
#include <queue>
using namespace std;

vector<int> bfs(int start, const vector<vector<int>>& adj) {
    const int INF = 1e9;
    int n = (int)adj.size();
    vector<int> dist(n, INF);
    queue<int> q;

    dist[start] = 0;
    q.push(start);

    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : adj[u]) {
            if (dist[v] == INF) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return dist;
}`,
      python: `from collections import deque

def bfs(start: int, adj: list[list[int]]) -> list[int]:
    inf = float('inf')
    dist = [inf] * len(adj)
    q = deque([start])
    dist[start] = 0

    while q:
        u = q.popleft()
        for v in adj[u]:
            if dist[v] == inf:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist`
    },
    problems: [
      {
        title: 'CSES: Message Route',
        platform: 'CSES',
        difficulty: 'Easy',
        url: 'https://cses.fi/problemset/task/1667'
      },
      {
        title: 'CSES: Labyrinth',
        platform: 'CSES',
        difficulty: 'Medium',
        url: 'https://cses.fi/problemset/task/1193'
      },
      {
        title: 'ACMP #127: Путь',
        platform: 'ACMP',
        difficulty: 'Easy',
        url: 'https://acmp.ru/index.asp?main=task&id_task=127'
      }
    ],
    quiz: {
      snippet: `// Граф задан матрицей смежности n x n
queue<int> q;
q.push(start);
while (!q.empty()) {
    int u = q.front(); q.pop();
    for (int v = 0; v < n; ++v)
        if (g[u][v] && dist[v] == INF) { ... }
}`,
      question: 'Какова временная сложность BFS при использовании матрицы смежности?',
      options: ['O(V + E)', 'O(V²)', 'O(E log V)', 'O(V · E)'],
      answer: 'O(V²)',
      explanation: 'Для каждой из V вершин цикл по v проходит все V столбцов матрицы смежности, что даёт O(V²).'
    }
  },

  // === Темы-заглушки для целостности роадмапа ===
  {
    id: 'two-pointers',
    title: 'Метод двух указателей',
    category: 'Поиск и массивы',
    difficulty: 'Базовый',
    isStub: true,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    summary:
      'Техника поддержания двух индексов L и R, которые монотонно двигаются по массиву и позволяют решать задачи на подотрезки и пары за линейное время.',
    pitfalls: [
      'Убедитесь, что при сдвиге L или R условие монотонности действительно сохраняется.',
      'Следите за границей R < N перед обращением к элементу.'
    ]
  },
  {
    id: 'dijkstra',
    title: 'Алгоритм Дейкстры',
    category: 'Графы',
    difficulty: 'Средний',
    isStub: false,
    engine: 'graph',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V + E)',
    summary:
      'Жадный алгоритм нахождения кратчайших путей от одной стартовой вершины до всех остальных во взвешенном графе с неотрицательными весами рёбер. На каждом шаге извлекается вершина с минимальным текущим расстоянием и выполняются релаксации исходящих рёбер.',
    pitfalls: [
      'Отрицательные веса рёбер ломают жадный инвариант: уже зафиксированная вершина может получить более короткий путь позже (в таких случаях нужен Беллман–Форд).',
      'Ленивое удаление в priority_queue: при извлечении пары (d, u) обязательно проверяйте if (d > dist[u]) continue;, иначе асимптотика ухудшится.',
      'Переполнение int: при весах до 10^9 сумма расстояний легко превышает 2·10^9 — используйте long long и INF = 1e18.'
    ],
    traceCode: [
      'dist.assign(n, INF); dist[start] = 0;',
      'pq.push({0, start});',
      'while (!pq.empty()) {',
      '    auto [d, u] = pq.top(); pq.pop();',
      '    if (d > dist[u]) continue;',
      '    for (auto [v, w] : adj[u]) {',
      '        if (dist[u] + w < dist[v]) {',
      '            dist[v] = dist[u] + w;',
      '            pq.push({dist[v], v});',
      '        }',
      '    }',
      '}'
    ],
    presets: [
      {
        id: 'classic',
        label: 'Классический граф (6 вершин)',
        data: {
          startNode: 0,
          nodes: [
            { id: 0, x: 80, y: 130 },
            { id: 1, x: 205, y: 55 },
            { id: 2, x: 205, y: 205 },
            { id: 3, x: 355, y: 55 },
            { id: 4, x: 355, y: 205 },
            { id: 5, x: 480, y: 130 }
          ],
          edges: [
            { from: 0, to: 1, weight: 4 },
            { from: 0, to: 2, weight: 2 },
            { from: 1, to: 2, weight: 1 },
            { from: 1, to: 3, weight: 5 },
            { from: 2, to: 4, weight: 8 },
            { from: 2, to: 3, weight: 7 },
            { from: 3, to: 4, weight: 2 },
            { from: 3, to: 5, weight: 3 },
            { from: 4, to: 5, weight: 1 }
          ]
        }
      },
      {
        id: 'shortcut',
        label: 'Обходной путь короче прямого',
        data: {
          startNode: 0,
          nodes: [
            { id: 0, x: 90, y: 130 },
            { id: 1, x: 240, y: 55 },
            { id: 2, x: 390, y: 130 },
            { id: 3, x: 240, y: 205 }
          ],
          edges: [
            { from: 0, to: 2, weight: 12 },
            { from: 0, to: 1, weight: 2 },
            { from: 1, to: 2, weight: 3 },
            { from: 0, to: 3, weight: 6 },
            { from: 3, to: 2, weight: 4 }
          ]
        }
      },
      {
        id: 'disconnected',
        label: 'Крайний случай: недостижимые вершины',
        data: {
          startNode: 0,
          nodes: [
            { id: 0, x: 95, y: 80 },
            { id: 1, x: 225, y: 80 },
            { id: 2, x: 160, y: 190 },
            { id: 3, x: 380, y: 80 },
            { id: 4, x: 480, y: 180 }
          ],
          edges: [
            { from: 0, to: 1, weight: 3 },
            { from: 1, to: 2, weight: 5 },
            { from: 0, to: 2, weight: 10 },
            { from: 3, to: 4, weight: 2 }
          ]
        }
      }
    ],
    generateFrames({ nodes, edges, startNode }) {
      const adj = new Map();
      nodes.forEach((n) => adj.set(n.id, []));
      edges.forEach((e) => {
        const w = e.weight ?? 1;
        if (adj.has(e.from) && adj.has(e.to)) {
          adj.get(e.from).push({ to: e.to, weight: w });
          adj.get(e.to).push({ to: e.from, weight: w });
        }
      });
      adj.forEach((list) => list.sort((a, b) => a.to - b.to));

      const dist = {};
      const parentEdge = {};
      nodes.forEach((n) => {
        dist[n.id] = Infinity;
      });

      const frames = [];
      const pq = []; // [{ d, u }]
      const visited = new Set();

      const formatPQ = () =>
        pq
          .slice()
          .sort((a, b) => a.d - b.d || a.u - b.u)
          .map((item) => `(${item.d}, v${item.u})`);

      const snap = (extra = {}) => ({
        nodes,
        edges: edges.map((e) => ({ ...e, weight: e.weight ?? 1 })),
        weighted: true,
        currentNode: null,
        queuedNodes: [...new Set(pq.map((item) => item.u).filter((id) => !visited.has(id)))],
        visitedNodes: [...visited],
        activeEdge: null,
        treeEdges: Object.values(parentEdge),
        queue: formatPQ(),
        dist: { ...dist },
        ...extra
      });

      dist[startNode] = 0;
      frames.push(
        snap({
          currentNode: startNode,
          line: 0,
          vars: { start: startNode, 'dist[start]': 0 },
          explanation: `Инициализация: dist[v] = ∞ для всех вершин, кроме стартовой dist[${startNode}] = 0.`
        })
      );

      pq.push({ d: 0, u: startNode });
      frames.push(
        snap({
          currentNode: startNode,
          line: 1,
          vars: { start: startNode, pq: formatPQ().join(' ') },
          explanation: `Помещаем стартовую пару (0, ${startNode}) в очередь с приоритетом.`
        })
      );

      while (pq.length > 0) {
        pq.sort((a, b) => a.d - b.d || a.u - b.u);
        const { d, u } = pq.shift();

        frames.push(
          snap({
            currentNode: u,
            line: 3,
            vars: { d, u, 'dist[u]': dist[u] },
            guess:
              !visited.has(u) && u !== startNode
                ? {
                    expected: u,
                    prompt: `Какая вершина с минимальным расстоянием будет извлечена из очереди следующей? Кликните по вершине.`
                  }
                : undefined,
            explanation: `Извлекаем из очереди вершину u = ${u} с расстоянием d = ${d}.`
          })
        );

        if (d > dist[u]) {
          frames.push(
            snap({
              currentNode: u,
              line: 4,
              vars: { d, u, 'dist[u]': dist[u] },
              explanation: `Устаревшая запись: d (${d}) > dist[${u}] (${dist[u]}), пропускаем её.`
            })
          );
          continue;
        }

        visited.add(u);
        const neighbors = adj.get(u) || [];

        for (const { to: v, weight: w } of neighbors) {
          frames.push(
            snap({
              currentNode: u,
              activeEdge: [u, v],
              line: 6,
              vars: {
                u,
                v,
                w,
                'dist[u]+w': dist[u] + w,
                'dist[v]': dist[v] === Infinity ? '∞' : dist[v]
              },
              explanation: `Проверяем ребро (${u}, ${v}) весом ${w}: можно ли улучшить путь до ${v} (${dist[u]} + ${w} < ${dist[v] === Infinity ? '∞' : dist[v]})?`
            })
          );

          if (dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            parentEdge[v] = [u, v];
            pq.push({ d: dist[v], u: v });

            frames.push(
              snap({
                currentNode: u,
                activeEdge: [u, v],
                line: 8,
                vars: {
                  u,
                  v,
                  'dist[v]': dist[v],
                  pq: formatPQ().join(' ')
                },
                explanation: `Релаксация успешна! Обновляем dist[${v}] = ${dist[v]} и добавляем (${dist[v]}, ${v}) в очередь.`
              })
            );
          }
        }
      }

      frames.push(
        snap({
          line: 11,
          vars: { pq: 'пусто', visited: visited.size },
          explanation: `Очередь с приоритетом пуста — алгоритм Дейкстры завершён! Все достижимые вершины имеют минимальные расстояния.`
        })
      );

      return frames;
    },
    code: {
      cpp: `#include <vector>
#include <queue>
using namespace std;

// Возвращает массив кратчайших расстояний от start до всех вершин
vector<long long> dijkstra(int start, const vector<vector<pair<int, int>>>& adj) {
    const long long INF = 1e18;
    int n = (int)adj.size();
    vector<long long> dist(n, INF);
    // Мин-куча хранит пары {расстояние, вершина}
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue; // Пропускаем устаревшую запись

        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}`,
      python: `import heapq

def dijkstra(start: int, adj: list[list[tuple[int, int]]]) -> list[float]:
    """Возвращает список кратчайших расстояний от start до всех вершин."""
    inf = float('inf')
    dist = [inf] * len(adj)
    dist[start] = 0
    pq = [(0, start)]  # мин-куча (расстояние, вершина)

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue  # пропускаем устаревшую запись

        for v, w in adj[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))
    return dist`
    },
    problems: [
      {
        title: 'CF #20C: Dijkstra?',
        platform: 'Codeforces',
        difficulty: 'Medium',
        url: 'https://codeforces.com/problemset/problem/20/C'
      },
      {
        title: 'CSES: Shortest Routes I',
        platform: 'CSES',
        difficulty: 'Easy',
        url: 'https://cses.fi/problemset/task/1671'
      },
      {
        title: 'ACMP #132: Алгоритм Дейкстры',
        platform: 'ACMP',
        difficulty: 'Easy',
        url: 'https://acmp.ru/index.asp?main=task&id_task=132'
      },
      {
        title: 'CSES: Flight Discount',
        platform: 'CSES',
        difficulty: 'Hard',
        url: 'https://cses.fi/problemset/task/1195'
      }
    ],
    quiz: {
      snippet: `// Реализация Дейкстры на плотном графе без кучи:
for (int i = 0; i < n; ++i) {
    int u = findMinUnvisited(dist, used); // за O(V)
    used[u] = true;
    for (auto [v, w] : adj[u])
        dist[v] = min(dist[v], dist[u] + w);
}`,
      question: 'Какова временная сложность алгоритма Дейкстры без использования очереди с приоритетом (наивный поиск минимума)?',
      options: ['O(V² + E)', 'O((V + E) log V)', 'O(V · E)', 'O(E log V)'],
      answer: 'O(V² + E)',
      explanation: 'Поиск минимума за O(V) выполняется V раз (итого O(V²)), плюс каждое ребро просматривается O(1) раз (итого O(E)). Для плотных графов (E ≈ V²) это даже быстрее, чем с кучей.'
    }
  },
  {
    id: 'knapsack',
    title: 'ДП: Задача о рюкзаке (0-1)',
    category: 'Динамическое программирование',
    difficulty: 'Средний',
    isStub: true,
    timeComplexity: 'O(N · W)',
    spaceComplexity: 'O(W)',
    summary:
      'Классическая задача динамического программирования о выборе подмножества предметов максимальной стоимости при ограничении на суммарный вес.',
    pitfalls: [
      'При оптимизации памяти до 1D-массива цикл по весу w должен идти в обратном порядке (от W до weight[i]).'
    ]
  },
  {
    id: 'prefix-function',
    title: 'Префикс-функция (алгоритм КМП)',
    category: 'Строки',
    difficulty: 'Средний',
    isStub: true,
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    summary:
      'Вычисление длины наибольшего собственного суффикса, совпадающего с префиксом, для поиска подстроки в строке за линейное время.',
    pitfalls: [
      'Забытый символ-разделитель # при конкатенации pattern + "#" + text приводит к ложным значениям > |pattern|.'
    ]
  },
  {
    id: 'dsu',
    title: 'Система непересекающихся множеств (DSU)',
    category: 'Структуры данных',
    difficulty: 'Средний',
    isStub: true,
    timeComplexity: 'O(α(N))',
    spaceComplexity: 'O(N)',
    summary:
      'Структура данных для быстрого объединения множеств и проверки принадлежности элементов с эвристиками сжатия путей и объединения по рангу.',
    pitfalls: [
      'Без сжатия путей или ранговой эвристики дерево может выродиться в бамбук за O(N) на запрос.'
    ]
  }
];
