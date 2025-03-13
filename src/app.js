document.addEventListener('DOMContentLoaded', function() {
  const urlInput       = document.getElementById('url-input');
  const loadButton     = document.getElementById('load-btn');
  const backButton     = document.getElementById('back-btn');
  const forwardButton  = document.getElementById('forward-btn');
  const contentArea    = document.getElementById('content-area');
  const bookmarkButton = document.getElementById('bookmark-btn');
  const bookmarkUl     = document.getElementById('bookmark-ul');

  let historyStack = [];
  let currentIndex = -1;
  let bookmarks    = [];

  // ブックマークを localStorage に保存
  function saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }

  // localStorage からブックマークを読み込む
  function loadBookmarks() {
    const stored = localStorage.getItem('bookmarks');
    bookmarks = stored ? JSON.parse(stored) : [];
    renderBookmarks();
  }

  // ブックマーク一覧をUIに反映
  function renderBookmarks() {
    bookmarkUl.innerHTML = '';
    bookmarks.forEach((bookmark, index) => {
      const bookmarkLi = document.createElement('li');
      bookmarkLi.setAttribute('data-index', index);
      bookmarkLi.style.cursor = 'pointer';

      const bookmarkSpan = document.createElement('span');
      bookmarkSpan.textContent = bookmark.url;
      bookmarkSpan.addEventListener('click', () => {
        urlInput.value = bookmark.url;
        loadPage(bookmark.url, true);
      });
      bookmarkLi.appendChild(bookmarkSpan);

      const bookmarkDeleteButton = document.createElement('button');
      bookmarkDeleteButton.textContent = '×';
      bookmarkDeleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        bookmarks.splice(index, 1);
        saveBookmarks();
        renderBookmarks();
      });
      bookmarkLi.appendChild(bookmarkDeleteButton);

      bookmarkUl.appendChild(bookmarkLi);
    });
  }

  // ページを読み込む非同期関数
  async function loadPage(url, addToHistory = true) {
    if (!url) {
      alert('URLを入力してください')
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
      const data = await response.text();
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

  function updateNavigationButtons() {
    backButton.disabled = (currentIndex <= 0);
    forwardButton.disabled = (currentIndex >= historyStack.length - 1);
  }

  loadButton.addEventListener('click', function() {
    const url = urlInput.value.trim();
    loadPage(url, true);
  });

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

  // ブックマーク追加ボタンのクリックイベント
  bookmarkButton.addEventListener('click', function() {
    const url = urlInput.value.trim();
    if (!url) {
      alert('ブックマークに追加する URL がありません');
      return;
    }
    // すでに同じ URL が登録されていないかチェック
    if (bookmarks.find(bm => bm.url === url)) {
      alert('この URL はすでにブックマークに登録されています');
      return;
    }

    bookmarks.push({ url });
    saveBookmarks();
    renderBookmarks();
  });

  // ページロード時に localStorage からブックマークを読み込む
  loadBookmarks();
});