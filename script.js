(() => {
  "use strict";

  /* ===== 背面スクロール制御 ===== */
  const root = document.documentElement;
  const lockScroll   = () => root.classList.add("no-scroll");
  const unlockScroll = () => root.classList.remove("no-scroll");

  /* ===== YouTube 停止ユーティリティ ===== */
  function stopEmbeddedVideos(panelEl) {
    const iframes = panelEl.querySelectorAll("iframe");
    iframes.forEach((ifr) => {
      try {
        ifr.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "stopVideo", args: "" }),
          "*"
        );
      } catch (_) {}
      // フォールバック（完全停止）
      ifr.src = "";
    });
  }

  /* ===== モーダル共通 ===== */
  function bindPanel(panelEl) {
    const overlay = panelEl.querySelector(".overlay");
    const closeBtn = panelEl.querySelector(".panel-close");

    const escHandler = (e) => {
      if (e.key === "Escape") {
        stopEmbeddedVideos(panelEl);
        hidePanel(panelEl);
      }
    };
    panelEl._esc = escHandler;

    overlay.addEventListener("click", () => {
      stopEmbeddedVideos(panelEl);
      hidePanel(panelEl);
    });
    closeBtn.addEventListener("click", () => {
      stopEmbeddedVideos(panelEl);
      hidePanel(panelEl);
    });
  }

  function showPanel(panelEl) {
    panelEl.classList.remove("hidden");
    document.addEventListener("keydown", panelEl._esc);
    lockScroll();

    // 開いた瞬間に現在インデックスの動画を必ず読み込む（再生準備OK）
    if (panelEl._videos && panelEl._els) {
      const idx =
        typeof panelEl._currentIndex === "number" ? panelEl._currentIndex : 0;
      selectVideo(panelEl, idx, /*autoplay*/ false, /*force*/ true);
    }
  }

  function hidePanel(panelEl) {
    panelEl.classList.add("hidden");
    document.removeEventListener("keydown", panelEl._esc);
    // 開いているモーダルが他に無いときだけスクロール解除
    const anyOpen = !!document.querySelector("[data-modal]:not(.hidden)");
    if (!anyOpen) unlockScroll();
  }

  /* ====== パネル取得 & バインド ====== */
  const beginnerPanel = document.getElementById("panel-beginner");
  const routePanel    = document.getElementById("panel-video-route");
  const basicsPanel   = document.getElementById("panel-video-basics");
  const settingsPanel = document.getElementById("panel-settings");
  const imagePanel    = document.getElementById("panel-image");

  [beginnerPanel, routePanel, basicsPanel, settingsPanel, imagePanel]
    .filter(Boolean)
    .forEach(bindPanel);

  // メニュー：初心者ガイドを開く
  document.getElementById("btn-beginner")?.addEventListener("click", () =>
    showPanel(beginnerPanel)
  );

  /* ===== 動画データ ===== */
  const videosRoute = [
    { id: "IKWAp2eXxsA", title: "プロローグ", desc: "プロローグの基本的な動きを解説。" },
    { id: "nJthTXdTgyY", title: "バンカー～砂漠終了", desc: "廃墟都市から砂漠終わりまでの動きを解説。" },
    { id: "MnpSskXdLww", title: "廃墟都市～イヴ＆アダム戦終了", desc: "安定したボス攻略のパターンを解説。" },
    { id: "eYc0w4z57Xk", title: "バンカー～グリューン戦終了", desc: "パスカルの村からグリューン終了までの動きを解説。" },
    { id: "h-c43XfRxUQ", title: "複製された街～工場廃墟終了", desc: "いい感じの言葉を入れる" },
    { id: "nkOJ3OriYlE", title: "flowers for m[A]chines", desc: "いい感じの言葉を入れる" },
  ];

  const videosBasics = [
    { id: "jCMOUmEyZ7E", title: "移動方法", desc: "ダッシュ、動物" },
    { id: "BNadVOMQhnE", title: "戦闘方法", desc: "ダメージグリッチとスローモーション" },
    { id: "EbJ3VxSnuvE", title: "簡単なテクニック", desc: "ダブルリフトとダイアログスキップ" },
    { id: "ShkgsCS19gs", title: "移動方法比較", desc: "移動方法比較" },
  ];

  /* ===== 汎用：動画パネル初期化 ===== */
  function initVideoPanel(panelEl, videos, defaultIndex = 0) {
    if (!panelEl) return;

    panelEl._videos = videos;
    panelEl._currentIndex = defaultIndex;

    const listEl  = panelEl.querySelector('[data-role="list"]');
    const frameEl = panelEl.querySelector('[data-role="frame"]');
    const descEl  = panelEl.querySelector('[data-role="desc"]');
    const countEl = panelEl.querySelector('[data-role="count"]');

    function buildList() {
      listEl.innerHTML = "";
      videos.forEach((v, i) => {
        const btn = document.createElement("button");
        btn.className = "vbtn";
        btn.type = "button";
        btn.textContent = v.title;
        btn.setAttribute("data-index", i);
        btn.addEventListener("click", () => selectVideo(panelEl, i, /*autoplay*/ true));
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
    const { listEl, frameEl, descEl } = panelEl._els;
    const videos = panelEl._videos;

    const frameEmpty = !frameEl.src || frameEl.src === "about:blank";
    if (!force && index === panelEl._currentIndex && !frameEmpty) {
      return; // すでに同じ動画が読み込まれている
    }

    panelEl._currentIndex = index;

    // ハイライト更新
    [...listEl.querySelectorAll(".vbtn")].forEach((b, i) => {
      b.setAttribute("aria-selected", String(i === index));
    });

    // 埋め込みセット
    const v = videos[index];
    const params = autoplay
      ? "?autoplay=1&rel=0&modestbranding=1&enablejsapi=1"
      : "?rel=0&modestbranding=1&enablejsapi=1";
    frameEl.src = `https://www.youtube.com/embed/${v.id}${params}`;
    frameEl.title = v.title;
    if (descEl) descEl.textContent = v.desc || "";
  }

  // 初期化（動画パネル）
  initVideoPanel(routePanel,  videosRoute,  0);
  initVideoPanel(basicsPanel, videosBasics, 0);

  // メニュー → 各モーダル
  document.getElementById("open-route")?.addEventListener("click", () => {
    hidePanel(beginnerPanel);
    showPanel(routePanel);
  });
  document.getElementById("open-basics")?.addEventListener("click", () => {
    hidePanel(beginnerPanel);
    showPanel(basicsPanel);
  });
  document.getElementById("open-settings")?.addEventListener("click", () => {
    hidePanel(beginnerPanel);
    showPanel(settingsPanel);
  });

  /* ===== 設定タブ切替 ===== */
  (() => {
    if (!settingsPanel) return;
    const tabJP = settingsPanel.querySelector("#tab-jp");
    const tabEN = settingsPanel.querySelector("#tab-en");
    const jp    = settingsPanel.querySelector("#settings-jp");
    const en    = settingsPanel.querySelector("#settings-en");

    if (!tabJP || !tabEN || !jp || !en) return;

    function showJP() {
      tabJP.setAttribute("aria-selected", "true");
      tabEN.setAttribute("aria-selected", "false");
      jp.classList.remove("hidden");
      en.classList.add("hidden");
      en.setAttribute("aria-hidden", "true");
    }
    function showEN() {
      tabJP.setAttribute("aria-selected", "false");
      tabEN.setAttribute("aria-selected", "true");
      jp.classList.add("hidden");
      en.classList.remove("hidden");
      en.removeAttribute("aria-hidden");
    }

    tabJP.addEventListener("click", showJP);
    tabEN.addEventListener("click", showEN);
  })();

  /* ===== 画像ビューア（設定：日本人走者ギャラリー） ===== */
  (() => {
    if (!settingsPanel || !imagePanel) return;

    const viewerImg = imagePanel.querySelector("#viewer-img");
    const viewerCap = imagePanel.querySelector("#viewer-caption");
    const imageBox  = imagePanel.querySelector(".panel"); // フル表示用クラス切替対象

    // ギャラリー内の画像をクリックで拡大
    settingsPanel
      .querySelectorAll("#settings-jp .settings-card img")
      .forEach((img) => {
        img.style.cursor = "zoom-in";
        img.addEventListener("click", () => {
          const full = img.getAttribute("data-full") || img.src;
          viewerImg.src = full;
          viewerImg.alt = img.alt || "";
          const cap = img.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || "";
          viewerCap.textContent = cap;
          showPanel(imagePanel);
        });
      });

    // 画像クリックでフル⇔通常
    viewerImg?.addEventListener("click", () => {
      imageBox.classList.toggle("is-full");
    });

    // 閉じたらリセット
    const resetViewer = () => {
      viewerImg.src = "";
      viewerCap.textContent = "";
      imageBox.classList.remove("is-full");
    };
    imagePanel.querySelector(".overlay")?.addEventListener("click", resetViewer);
    imagePanel.querySelector(".panel-close")?.addEventListener("click", resetViewer);
  })();
})();
