(() => {
  /* ===== 背面スクロール制御 ===== */
  const root = document.documentElement;
  function lockScroll(){ root.classList.add('no-scroll'); }
  function unlockScroll(){ root.classList.remove('no-scroll'); }

  /* ===== YouTube 停止ユーティリティ ===== */
  function stopEmbeddedVideos(panelEl){
    const iframes = panelEl.querySelectorAll('iframe');
    iframes.forEach((ifr)=>{
      try{
        ifr.contentWindow?.postMessage(
          JSON.stringify({ event:"command", func:"stopVideo", args:"" }),
          "*"
        );
      }catch(e){}
      // フォールバック（完全停止）
      ifr.src = "";
    });
  }

  /* ===== モーダルの開閉 ===== */
  function bindPanel(panelEl){
    const overlay = panelEl.querySelector('.overlay');
    const closeBtn = panelEl.querySelector('.panel-close');

    const escHandler = (e)=>{
      if(e.key === 'Escape'){
        stopEmbeddedVideos(panelEl);
        hidePanel(panelEl);
      }
    };
    panelEl._esc = escHandler;

    overlay.addEventListener('click', ()=>{
      stopEmbeddedVideos(panelEl);
      hidePanel(panelEl);
    });
    closeBtn.addEventListener('click', ()=>{
      stopEmbeddedVideos(panelEl);
      hidePanel(panelEl);
    });
  }

  function showPanel(panelEl){
    panelEl.classList.remove('hidden');
    document.addEventListener('keydown', panelEl._esc);
    lockScroll();

    // 開いた瞬間に現在インデックスの動画を必ず読み込む（再生準備OK）
    if (panelEl._videos && panelEl._els){
      const idx = (typeof panelEl._currentIndex === 'number') ? panelEl._currentIndex : 0;
      selectVideo(panelEl, idx, /*autoplay*/false, /*force*/true);
    }
  }

  function hidePanel(panelEl){
    panelEl.classList.add('hidden');
    document.removeEventListener('keydown', panelEl._esc);

    // ★修正ポイント：本当に開いている“モーダルコンテナ”が無いときだけ解除
    const anyOpen = !!document.querySelector('[data-modal]:not(.hidden)');
    if(!anyOpen) unlockScroll();
  }

  const beginnerPanel = document.getElementById('panel-beginner');
  const routePanel    = document.getElementById('panel-video-route');
  const basicsPanel   = document.getElementById('panel-video-basics');
  [beginnerPanel, routePanel, basicsPanel].forEach(bindPanel);

  document.getElementById('btn-beginner')?.addEventListener('click', ()=> showPanel(beginnerPanel));

  /* ===== 動画データ ===== */
  const videosRoute = [
    { id: "IKWAp2eXxsA", title: "プロローグ", desc: "プロローグの基本的な動きを解説。"},
    { id: "nJthTXdTgyY", title: "バンカー～砂漠終了", desc: "廃墟都市から砂漠終わりまでの動きを解説。"},
    { id: "MnpSskXdLww", title: "廃墟都市～イヴ＆アダム戦終了", desc: "安定したボス攻略のパターンを解説。"},
    { id: "eYc0w4z57Xk", title: "バンカー～グリューン戦終了", desc: "パスカルの村からグリューン終了までの動きを解説。"},
    { id: "h-c43XfRxUQ", title: "複製された街～工場廃墟終了", desc: "いい感じの言葉を入れる"},
    { id: "nkOJ3OriYlE", title: "flowers for m[A]chines", desc: "いい感じの言葉を入れる"},
  ];

  const videosBasics = [
    { id: "dQw4w9WgXcQ", title: "操作の基礎（移動/回避/射撃）", desc: "移動・ロックオン・回避の基礎と弾幕の捌き方。"},
    { id: "3JZ_D3ELwOQ", title: "近接/遠隔の連携", desc: "武器切替・ジャンプキャンセル・射撃の連携。"},
    { id: "L_jWHffIx5E", title: "ポッドプログラム入門", desc: "代表的なポッドの使い分けと基本運用。"}
  ];

  /* ===== 汎用：動画パネル初期化 ===== */
  function initVideoPanel(panelEl, videos, defaultIndex=0){
    panelEl._videos = videos;
    panelEl._currentIndex = defaultIndex;

    const listEl  = panelEl.querySelector('[data-role="list"]');
    const frameEl = panelEl.querySelector('[data-role="frame"]');
    const descEl  = panelEl.querySelector('[data-role="desc"]');
    const countEl = panelEl.querySelector('[data-role="count"]');

    function buildList(){
      listEl.innerHTML = "";
      videos.forEach((v, i)=>{
        const btn = document.createElement('button');
        btn.className = 'vbtn';
        btn.type = 'button';
        btn.textContent = v.title;
        btn.setAttribute('data-index', i);
        btn.addEventListener('click', ()=> selectVideo(panelEl, i, /*autoplay*/true));
        listEl.appendChild(btn);
      });
      if(countEl) countEl.textContent = `候補数: ${videos.length}`;
    }

    panelEl._els = { listEl, frameEl, descEl, countEl };
    buildList();

    // 初期表示：ページロード直後でも1本目を読み込んでおく（再生はしない）
    selectVideo(panelEl, defaultIndex, /*autoplay*/false, /*force*/true);
  }

  // ★修正：同じインデックスでも iframe が空なら再読込する
  function selectVideo(panelEl, index, autoplay=false, force=false){
    const { listEl, frameEl, descEl } = panelEl._els;
    const videos = panelEl._videos;

    const frameEmpty = !frameEl.src || frameEl.src === 'about:blank';
    if(!force && index === panelEl._currentIndex && !frameEmpty){
      // すでに同じ動画が読み込まれている
      return;
    }

    panelEl._currentIndex = index;

    // ハイライト更新
    [...listEl.querySelectorAll('.vbtn')].forEach((b, i)=>{
      b.setAttribute('aria-selected', String(i===index));
    });

    // 埋め込みセット
    const v = videos[index];
    const params = autoplay
      ? "?autoplay=1&rel=0&modestbranding=1&enablejsapi=1"
      : "?rel=0&modestbranding=1&enablejsapi=1";
    frameEl.src = `https://www.youtube.com/embed/${v.id}${params}`;
    frameEl.title = v.title;
    if(descEl) descEl.textContent = v.desc || "";
  }

  // 初期化
  initVideoPanel(routePanel,  videosRoute,  0);
  initVideoPanel(basicsPanel, videosBasics, 0);

  // メニュー操作
  const beginnerPanelEl = document.getElementById('panel-beginner');
  document.getElementById('open-route')?.addEventListener('click', ()=>{
    hidePanel(beginnerPanelEl);
    showPanel(routePanel);
  });
  document.getElementById('open-basics')?.addEventListener('click', ()=>{
    hidePanel(beginnerPanelEl);
    showPanel(basicsPanel);
  });
})();
