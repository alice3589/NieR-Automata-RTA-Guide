(() => {
    // ====== 動画停止ユーティリティ ======
    function stopEmbeddedVideos(panelEl){
      const iframes = panelEl.querySelectorAll('iframe');
      iframes.forEach((ifr)=>{
        // YouTubeに停止コマンド
        try {
          ifr.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "stopVideo", args: "" }),
            "*"
          );
        } catch(e) {}
        // フォールバック（確実に停止）
        ifr.src = "";
      });
    }
  
    // ====== パネルの開閉 ======
    function bindPanel(panelEl) {
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
  
    function showPanel(panelEl) {
      panelEl.classList.remove('hidden');
      document.addEventListener('keydown', panelEl._esc);
  
      // 動画パネル再オープン時：停止状態で復元
      if (panelEl.id === 'panel-video') {
        const frame = document.getElementById('yt-frame');
        if (!frame.src) {
          selectVideo(currentIndex >= 0 ? currentIndex : 0, /*autoplay*/false);
        }
      }
    }
  
    function hidePanel(panelEl) {
      panelEl.classList.add('hidden');
      document.removeEventListener('keydown', panelEl._esc);
    }
  
    const beginnerPanel = document.getElementById('panel-beginner');
    const videoPanel    = document.getElementById('panel-video');
    bindPanel(beginnerPanel);
    bindPanel(videoPanel);
  
    document.getElementById('btn-beginner')?.addEventListener('click', ()=> showPanel(beginnerPanel));
  
    // ====== 動画セレクター ======
    // ★必要に応じて差し替え（YouTube動画ID）★
    const videos = [
      { id: "IKWAp2eXxsA", title: "プロローグ", desc: "プロローグの基本的な動きを解説。"},
      { id: "nJthTXdTgyY", title: "バンカー～砂漠終了", desc: "廃墟都市から砂漠終わりまでの動きを解説。"},
      { id: "MnpSskXdLww", title: "廃墟都市～イヴ＆アダム戦終了", desc: "安定したボス攻略のパターンを解説。"},
      { id: "eYc0w4z57Xk", title: "バンカー～グリューン戦終了", desc: "パスカルの村からグリューン終了までの動きを解説。"},
      { id: "h-c43XfRxUQ", title: "複製された街～工場廃墟終了", desc: "いい感じの言葉を入れる"},
      { id: "nkOJ3OriYlE", title: "flowers for m[A]chines", desc: "いい感じの言葉を入れる"},
    ];
  
    const listEl  = document.getElementById('video-list');
    const frameEl = document.getElementById('yt-frame');
    const descEl  = document.getElementById('video-desc');
    const countEl = document.getElementById('video-count');
    let currentIndex = -1;
  
    function buildList(){
      listEl.innerHTML = "";
      videos.forEach((v, i)=>{
        const btn = document.createElement('button');
        btn.className = 'vbtn';
        btn.type = 'button';
        btn.textContent = v.title;
        btn.setAttribute('data-index', i);
        btn.addEventListener('click', ()=> selectVideo(i, /*autoplay*/true));
        listEl.appendChild(btn);
      });
      countEl.textContent = `候補数: ${videos.length}`;
    }
  
    function selectVideo(index, autoplay=false){
      if(index === currentIndex) return;
      currentIndex = index;
  
      // リストのハイライト
      [...listEl.querySelectorAll('.vbtn')].forEach((b, i)=>{
        b.setAttribute('aria-selected', String(i===index));
      });
  
      // 動画の埋め込み
      const v = videos[index];
      const params = autoplay
        ? "?autoplay=1&rel=0&modestbranding=1&enablejsapi=1"
        : "?rel=0&modestbranding=1&enablejsapi=1";
      frameEl.src = `https://www.youtube.com/embed/${v.id}${params}`;
      frameEl.title = v.title;
      descEl.textContent = v.desc || "";
    }
  
    // 初期構築
    buildList();
    selectVideo(0, /*autoplay*/false);
  
    // 「初心者向けルート」を押したら動画パネルを開く
    document.getElementById('open-route')?.addEventListener('click', ()=>{
      hidePanel(beginnerPanel);
      showPanel(videoPanel);
    });
  })();
  