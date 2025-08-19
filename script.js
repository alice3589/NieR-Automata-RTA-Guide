(() => {
  "use strict";

  // ---- 再読込や二重読み込み対策（同名変数の再宣言エラー防止）----
  if (window.__RTA_SCRIPT_LOADED__) return;
  window.__RTA_SCRIPT_LOADED__ = true;

  /* ========== 背面スクロール制御 ========== */
  const root = document.documentElement;
  const lockScroll   = () => root.classList.add("no-scroll");
  const unlockScroll = () => root.classList.remove("no-scroll");

  /* ========== YouTube 停止ユーティリティ ========== */
  function stopEmbeddedVideos(panelEl) {
    if (!panelEl) return;
    const iframes = panelEl.querySelectorAll("iframe");
    iframes.forEach((ifr) => {
      // YouTube Iframe API が有効なら postMessage で停止
      try {
        ifr.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "stopVideo", args: "" }),
          "*"
        );
      } catch (_) {}
      // フォールバック：完全に読み直し
      ifr.src = "";
    });
  }

  /* ========== モーダル共通 ========== */
  function bindPanel(panelEl) {
    if (!panelEl) return;
    const overlay  = panelEl.querySelector(".overlay");
    const closeBtn = panelEl.querySelector(".panel-close");

    const escHandler = (e) => {
      if (e.key === "Escape") hidePanel(panelEl);
    };
    panelEl._esc = escHandler;

    overlay?.addEventListener("click", () => hidePanel(panelEl));
    closeBtn?.addEventListener("click", () => hidePanel(panelEl));
  }

  function showPanel(panelEl) {
    if (!panelEl) return;
    panelEl.classList.remove("hidden");
    document.addEventListener("keydown", panelEl._esc);
    lockScroll();

    // 動画パネルは開いた瞬間に現在インデックスの動画を必ず読み込む
    if (panelEl._videos && panelEl._els) {
      const idx =
        typeof panelEl._currentIndex === "number" ? panelEl._currentIndex : 0;
      selectVideo(panelEl, idx, /*autoplay*/ false, /*force*/ true);
    }
  }

  function hidePanel(panelEl) {
    if (!panelEl) return;
    // まず動画を止める
    stopEmbeddedVideos(panelEl);

    panelEl.classList.add("hidden");
    document.removeEventListener("keydown", panelEl._esc);

    // 他に開いているモーダルが無いときだけスクロール解除
    const anyOpen = !!document.querySelector("[data-modal]:not(.hidden)");
    if (!anyOpen) unlockScroll();
  }

  /* ========== パネル参照 & バインド ========== */
  const beginnerPanel   = document.getElementById("panel-beginner");
  const routePanel      = document.getElementById("panel-video-route");
  const basicsPanel     = document.getElementById("panel-video-basics");
  const settingsPanel   = document.getElementById("panel-settings");
  const imagePanel      = document.getElementById("panel-image");
  const categoriesPanel = document.getElementById("panel-categories");

  [beginnerPanel, routePanel, basicsPanel, settingsPanel, imagePanel, categoriesPanel]
    .filter(Boolean)
    .forEach(bindPanel);

  // メニュー：初心者ガイドを開く
  document.getElementById("btn-beginner")?.addEventListener("click", () =>
    showPanel(beginnerPanel)
  );

  // メニュー：カテゴリ解説を開く（※HTML側で id="btn-categories" を付けている前提）
  document.getElementById("btn-categories")?.addEventListener("click", () =>
    showPanel(categoriesPanel)
  );

  /* ========== 動画データ ========== */
  const videosRoute = [
    { id: "IKWAp2eXxsA", title: "プロローグ",                 desc: "プロローグの基本的な動きを解説。" },
    { id: "nJthTXdTgyY", title: "バンカー～砂漠終了",         desc: "廃墟都市から砂漠終わりまでの動きを解説。" },
    { id: "MnpSskXdLww", title: "廃墟都市～イヴ＆アダム戦終了", desc: "安定したボス攻略のパターンを解説。" },
    { id: "eYc0w4z57Xk", title: "バンカー～グリューン戦終了", desc: "パスカルの村からグリューン終了までの動きを解説。" },
    { id: "h-c43XfRxUQ", title: "複製された街～工場廃墟終了", desc: "いい感じの言葉を入れる" },
    { id: "nkOJ3OriYlE", title: "flowers for m[A]chines",     desc: "いい感じの言葉を入れる" },
  ];

  const videosBasics = [
    { id: "jCMOUmEyZ7E", title: "移動方法",       desc: "ダッシュ、動物" },
    { id: "BNadVOMQhnE", title: "戦闘方法",       desc: "ダメージグリッチとスローモーション" },
    { id: "EbJ3VxSnuvE", title: "簡単なテクニック", desc: "ダブルリフトとダイアログスキップ" },
    { id: "ShkgsCS19gs", title: "移動方法比較",   desc: "移動方法比較" },
  ];

  /* ========== 汎用：動画パネル初期化 ========== */
  function initVideoPanel(panelEl, videos, defaultIndex = 0) {
    if (!panelEl) return;

    panelEl._videos = videos;
    panelEl._currentIndex = defaultIndex;

    const listEl  = panelEl.querySelector('[data-role="list"]');
    const frameEl = panelEl.querySelector('[data-role="frame"]');
    const descEl  = panelEl.querySelector('[data-role="desc"]');
    const countEl = panelEl.querySelector('[data-role="count"]');

    function buildList() {
      if (!listEl) return;
      listEl.innerHTML = "";
      videos.forEach((v, i) => {
        const btn = document.createElement("button");
        btn.className = "vbtn";
        btn.type = "button";
        btn.textContent = v.title;
        btn.addEventListener("click", () =>
          selectVideo(panelEl, i, /*autoplay*/ true)
        );
        listEl.appendChild(btn);
      });
      if (countEl) countEl.textContent = `候補数: ${videos.length}`;
    }

    panelEl._els = { listEl, frameEl, descEl, countEl };
    buildList();

    // 初期表示：1本目を読み込んでおく（再生はしない）
    selectVideo(panelEl, defaultIndex, /*autoplay*/ false, /*force*/ true);
  }

  // 同じインデックスでも iframe が空なら再読込する
  function selectVideo(panelEl, index, autoplay = false, force = false) {
    const { listEl, frameEl, descEl } = panelEl._els || {};
    const videos = panelEl._videos || [];
    if (!frameEl || !videos[index]) return;

    const frameEmpty = !frameEl.src || frameEl.src === "about:blank";
    if (!force && index === panelEl._currentIndex && !frameEmpty) {
      return; // すでに同じ動画が読み込まれている
    }

    panelEl._currentIndex = index;

    // ハイライト更新
    if (listEl) {
      [...listEl.querySelectorAll(".vbtn")].forEach((b, i) => {
        b.setAttribute("aria-selected", String(i === index));
      });
    }

    // 埋め込みセット
    const v = videos[index];
    const params = autoplay
      ? "?autoplay=1&rel=0&modestbranding=1&enablejsapi=1"
      : "?rel=0&modestbranding=1&enablejsapi=1";
    frameEl.src = `https://www.youtube.com/embed/${v.id}${params}`;
    frameEl.title = v.title;
    if (descEl) descEl.textContent = v.desc || "";
  }

  // === 初期化（動画パネル） ===
  initVideoPanel(routePanel,  videosRoute,  0);
  initVideoPanel(basicsPanel, videosBasics, 0);

  // === 初心者ガイド → 各動画パネルを開く ===
  document.getElementById("open-route")?.addEventListener("click", () => {
    hidePanel(beginnerPanel);
    showPanel(routePanel);
  });
  document.getElementById("open-basics")?.addEventListener("click", () => {
    hidePanel(beginnerPanel);
    showPanel(basicsPanel);
  });
  // もしメニューから設定モーダルを開くボタンがあるなら
  document.getElementById("open-settings")?.addEventListener("click", () => {
    hidePanel(beginnerPanel);
    showPanel(settingsPanel);
  });

  /* ========== 設定タブ切替（日本/海外） ========== */
  (() => {
    if (!settingsPanel) return;
    const tabJP = settingsPanel.querySelector("#tab-jp");
    const tabEN = settingsPanel.querySelector("#tab-en");
    const jp    = settingsPanel.querySelector("#settings-jp");
    const en    = settingsPanel.querySelector("#settings-en");
    if (!tabJP || !tabEN || !jp || !en) return;

    const showJP = () => {
      tabJP.setAttribute("aria-selected", "true");
      tabEN.setAttribute("aria-selected", "false");
      jp.classList.remove("hidden");
      en.classList.add("hidden");
      en.setAttribute("aria-hidden", "true");
    };
    const showEN = () => {
      tabJP.setAttribute("aria-selected", "false");
      tabEN.setAttribute("aria-selected", "true");
      jp.classList.add("hidden");
      en.classList.remove("hidden");
      en.removeAttribute("aria-hidden");
    };

    tabJP.addEventListener("click", showJP);
    tabEN.addEventListener("click", showEN);
  })();

  /* ========== 画像ビューア（設定：日本人走者ギャラリー） ========== */
  (() => {
    if (!settingsPanel || !imagePanel) return;

    const viewerImg = imagePanel.querySelector("#viewer-img");
    const viewerCap = imagePanel.querySelector("#viewer-caption");

    // ギャラリー内の画像をクリックで拡大
    settingsPanel
      .querySelectorAll("#settings-jp .settings-card img")
      .forEach((img) => {
        img.style.cursor = "zoom-in";
        img.addEventListener("click", () => {
          const full = img.getAttribute("data-full") || img.src;
          viewerImg.src = full;
          viewerImg.alt = img.alt || "";
          const cap =
            img.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ||
            "";
          viewerCap.textContent = cap;
          showPanel(imagePanel);
        });
      });

    // 閉じたらリセット
    const resetViewer = () => {
      viewerImg.src = "";
      viewerCap.textContent = "";
    };
    imagePanel.querySelector(".overlay")?.addEventListener("click", resetViewer);
    imagePanel.querySelector(".panel-close")?.addEventListener("click", resetViewer);
  })();

  /* ========== カテゴリ解説 ========== */
  (() => {
    if (!categoriesPanel) return;

    // データ（文言は適宜編集OK）
    const categoriesData = [
      { key:"A",        title:"A",        desc:"Aルート（Any%）の概説・想定ルート・注意点。" },
      { key:"A VC3Mod", title:"A VC3Mod", desc:"VC3Mod使用時の差分・導入に伴うルート上の変更点。" },
      { key:"Prolouge", title:"Prolouge", desc:"プロローグ区間の項目別解説。※要求どおり 'Prolouge' 表記。" },
      { key:"E",        title:"E",        desc:"Eエンドに関わるカテゴリの要点・分岐条件メモ。" },
      { key:"Fishing",  title:"Fishing",  desc:"釣りに関する高速化テク・必要な場面の整理。" },
      { key:"RedDots",  title:"RedDots",  desc:"マップの赤点（進行マーカー）周辺の最短動線や注意点。" },
    ];

    function initCategoriesPanel(panelEl, items, defaultIndex = 0) {
      panelEl._items = items;
      panelEl._currentIndex = defaultIndex;

      const listEl  = panelEl.querySelector('[data-role="list"]');
      const titleEl = panelEl.querySelector('[data-role="title"]');
      const descEl  = panelEl.querySelector('[data-role="desc"]');
      const noteEl  = panelEl.querySelector('[data-role="note"]');
      const countEl = panelEl.querySelector('[data-role="count"]');

      function buildList() {
        listEl.innerHTML = "";
        items.forEach((it, i) => {
          const btn = document.createElement("button");
          btn.className = "vbtn";
          btn.type = "button";
          btn.textContent = it.title;
          btn.addEventListener("click", () => select(i));
          listEl.appendChild(btn);
        });
        if (countEl) countEl.textContent = `カテゴリ数: ${items.length}`;
      }

      function select(index) {
        if (index === panelEl._currentIndex) return;
        panelEl._currentIndex = index;
        [...listEl.querySelectorAll(".vbtn")].forEach((b, i) => {
          b.setAttribute("aria-selected", String(i === index));
        });
        const it = items[index];
        titleEl.textContent = it.title;
        descEl.textContent  = it.desc || "";
        if (noteEl) noteEl.textContent = it.note || "";
      }

      panelEl._els = { listEl, titleEl, descEl, noteEl, countEl };
      buildList();

      // 初期表示
      [...listEl.querySelectorAll(".vbtn")].forEach((b, i) => {
        b.setAttribute("aria-selected", String(i === defaultIndex));
      });
      const it = items[defaultIndex];
      titleEl.textContent = it.title;
      descEl.textContent  = it.desc || "";
      if (noteEl) noteEl.textContent = it.note || "";
    }

    initCategoriesPanel(categoriesPanel, categoriesData, 0);
  })();
})();
