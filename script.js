(() => {
  /* ===== 背面スクロールのロック ===== */
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
      ifr.src = ""; // フォールバック
    });
  }

  /* ===== パネル共通 ===== */
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

    // 再オープン時：停止状態なら現在インデックスで復元
    const frame = panelEl.querySelector('[data-role="frame"]');
    if (frame && !frame.src && typeof panelEl._currentIndex === 'number'){
      selectVideo(panelEl, panelEl._currentIndex, /*autoplay*/false);
    }
  }

  function hidePanel(panelEl){
    panelEl.classList.add('hidden');
    document.removeEventListener('keydown', panelEl._esc);
    const anyOpen = document.querySelectorAll('.panel:not(.hidden)').length > 0;
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

  // ★ここに「基本操作」用の動画IDを入れてください
  const videosBasics = [
    { id: "K21PFonrmVo", title: "基礎操作", desc: "攻撃モーション"},
    { id: "jCMOUmEyZ7E", title: "移動方法", desc: "ダッシュ、動物"},
    { id: "BNadVOMQhnE", title: "戦闘方法", desc: "ダメージグリッチとスローモーション"},
    { id: "EbJ3VxSnuvE", title: "簡単なテクニック", desc: "ダブルリフトとダイアログスキップ"},
    { id: "ShkgsCS19gs", title: "移動方法比較", desc: "移動方法比較"},
  ];

  /* ===== 汎用：動画パネルの初期化 ===== */
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
    selectVideo(panelEl, defaultIndex, /*autoplay*/false);
  }

  function selectVideo(panelEl, index, autoplay=false){
    const { listEl, frameEl, descEl } = panelEl._els;
    const videos = panelEl._videos;
    if(index === panelEl._currentIndex) return;

    panelEl._currentIndex = index;

    // list highlight
    [...listEl.querySelectorAll('.vbtn')].forEach((b, i)=>{
      b.setAttribute('aria-selected', String(i===index));
    });

    // set video
    const v = videos[index];
    const params = autoplay
      ? "?autoplay=1&rel=0&modestbranding=1&enablejsapi=1"
      : "?rel=0&modestbranding=1&enablejsapi=1";
    frameEl.src = `https://www.youtube.com/embed/${v.id}${params}`;
    frameEl.title = v.title;
    if(descEl) descEl.textContent = v.desc || "";
  }

  // 初期化（両パネル）
  initVideoPanel(routePanel,  videosRoute, 0);
  initVideoPanel(basicsPanel, videosBasics, 0);

  // メニュー → 各パネルを開く
  document.getElementById('open-route')?.addEventListener('click', ()=>{
    hidePanel(beginnerPanel);
    showPanel(routePanel);
  });
  document.getElementById('open-basics')?.addEventListener('click', ()=>{
    hidePanel(beginnerPanel);
    showPanel(basicsPanel);
  });
})();
