document.addEventListener('DOMContentLoaded', function() {
  const urlInput      = document.getElementById('url-input');
  const loadButton    = document.getElementById('load-btn');
  const backButton    = document.getElementById('back-btn');
  const forwardButton = document.getElementById('forward-btn');
  const contentArea   = document.getElementById('content-area');

  let historyStack = [];
  let currentIndex = -1;

  // ページを読み込む非同期関数
  async function loadPage(url, addToHistory = true) {
    // URL未入力時の処理
    if (!url) {
      alert('URLを入力してください')
      return;
    }

    try {
      // fetch APIでURLのHTMLコンテンツを取得
      const response = await fetch(url);
      // ステータスコード200以外が帰ってきた時の処理
      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
      const data = await response.text();
      // 取得したHTMLをコンテンツエリアにセット
      contentArea.innerHTML = data;

      // 履歴に新しいURLを追加する処理
      if (addToHistory) {
        // 現在位置以降に履歴があれば切り捨てる
        historyStack = historyStack.slice(0, currentIndex + 1);
        // 新しいURLを履歴に追加
        historyStack.push(url);
        // 現在位置を更新
        currentIndex = historyStack.length - 1;
      }
      // 戻る・進むボタンの有効・無効状態を更新
      updateNavigationButtons();
    } catch (error) {
      console.error('ページ読み込み中にエラーが発生しました:', error);
      contentArea.innerHTML = `<p>ページの読み込みに失敗しました。${error.message}</p>`;
    }
  }

  // 戻る・進むボタンの有効・無効状態を更新する関数
  function updateNavigationButtons() {
    backButton.disabled = (currentIndex <= 0);
    forwardButton.disabled = (currentIndex >= historyStack.length - 1);
  }

  // 「読み込み」ボタンがクリックされたときにloadPage関数を実行（履歴に追加）
  loadButton.addEventListener('click', function() {
    const url = urlInput.value.trim();
    loadPage(url, true);
  });

  // URL入力欄でEnterキーが押されたときにもloadPage関数を実行（履歴に追加）
  urlInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      const url = urlInput.value.trim();
      loadPage(url, true);
    }
  });
  
  backButton.addEventListener('click', function() {
    if (currentIndex > 0) {
      currentIndex--;
      const url = historyStack[currentIndex];
      urlInput.value = url;
      loadPage(url, false);
      // 非同期処理を待たずに更新
      updateNavigationButtons();
    }
  });

  forwardButton.addEventListener('click', function() {
    if (currentIndex < historyStack.length - 1) {
      currentIndex++;
      const url = historyStack[currentIndex];
      urlInput.value = url;
      loadPage(url, false);
      // 非同期処理を待たずに更新
      updateNavigationButtons();
    }
  });
});