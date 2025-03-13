import '@testing-library/jest-dom'; // DOMのマッチャーを拡張
import { fireEvent } from '@testing-library/dom';
global.alert = jest.fn();

describe('ブラウザプロトタイプの履歴管理機能とブックマーク機能', () => {
  let urlInput, loadButton, backButton, forwardButton, contentArea;
  let bookmarkButton, bookmarkUl; // ブックマーク機能用

  // テスト前にHTML要素をセットアップする
  beforeEach(async () => {
    document.body.innerHTML = `
      <header>
        <button id="back-btn" disabled>戻る</button>
        <button id="forward-btn" disabled>進む</button>
        <input type="text" id="url-input" placeholder="URLを入力してください">
        <button id="load-btn">読み込み</button>
        <button id="bookmark-btn">ブックマーク追加</button>
      </header>
      <aside id="bookmark-list">
        <h2>ブックマーク</h2>
        <ul id="bookmark-ul"></ul>
      </aside>
      <main>
        <div id="content-area"></div>
      </main>
    `;

    // 必要な DOM 要素を取得
    urlInput      = document.getElementById('url-input');
    loadButton    = document.getElementById('load-btn');
    backButton    = document.getElementById('back-btn');
    forwardButton = document.getElementById('forward-btn');
    contentArea   = document.getElementById('content-area');
    bookmarkButton = document.getElementById('bookmark-btn');
    bookmarkUl  = document.getElementById('bookmark-ul');

    // fetch をモックする（常に成功し、指定したURLに基づいた内容を返す）
    global.fetch = jest.fn((url) =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`<p>Content from ${url}</p>`)
      })
    );
    
    // HTML のセットアップが完了した後に、app.js を動的にインポート
    await import('../src/app.js');
    
    // DOMContentLoaded イベントをディスパッチして初期化処理を実行
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  // 履歴管理テスト
  test('「読み込み」ボタンをクリックするとページが読み込まれ、履歴に追加される', async () => {
    urlInput.value = 'http://127.0.0.1:5500/test1.html';
    fireEvent.click(loadButton);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(contentArea.innerHTML).toContain('Content from http://127.0.0.1:5500/test1.html');
    expect(backButton).toBeDisabled();
    expect(forwardButton).toBeDisabled();
  });

  test('戻る・進むボタンで履歴内を移動できる', async () => {
    urlInput.value = 'http://127.0.0.1:5500/test1.html';
    fireEvent.click(loadButton);
    await new Promise(resolve => setTimeout(resolve, 0));

    urlInput.value = 'http://127.0.0.1:5500/test2.html';
    fireEvent.click(loadButton);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(contentArea.innerHTML).toContain('Content from http://127.0.0.1:5500/test2.html');
    expect(backButton).not.toBeDisabled();

    fireEvent.click(backButton);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(contentArea.innerHTML).toContain('Content from http://127.0.0.1:5500/test1.html');

    fireEvent.click(forwardButton);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(contentArea.innerHTML).toContain('Content from http://127.0.0.1:5500/test2.html');
  });

  // ブックマーク機能のテスト
  test('ブックマーク追加ボタンをクリックすると、ブックマークが追加されUIに反映される', async () => {
    const testUrl = 'http://127.0.0.1:5500/testBookmark.html';
    urlInput.value = testUrl;
    fireEvent.click(bookmarkButton);
    expect(bookmarkUl.childElementCount).toBe(1);
    expect(bookmarkUl).toHaveTextContent(testUrl);
  });

  test('同じURLが重複してブックマークに追加されない', async () => {
    const testUrl = 'http://127.0.0.1:5500/testBookmark.html';
    urlInput.value = testUrl;
    fireEvent.click(bookmarkButton);
    fireEvent.click(bookmarkButton);
    // bookmarkUl の子要素は1件であることを確認
    expect(bookmarkUl.childElementCount).toBe(1);
  });

  test('ブックマーク一覧の項目をクリックすると、該当のURLが入力欄に反映され、ページが読み込まれる', async () => {
    const testUrl = 'http://127.0.0.1:5500/testBookmark.html';
    urlInput.value = testUrl;
    fireEvent.click(bookmarkButton);

    const bookmarkLi = bookmarkUl.querySelector('li');
    const bookmarkSpan = bookmarkLi.querySelector('span');
    fireEvent.click(bookmarkSpan);

    // URL入力欄にブックマークのURLが設定されていることを確認
    expect(urlInput.value).toBe(testUrl);

    // fetch のモックにより、contentArea に表示される内容を確認
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(contentArea.innerHTML).toContain(`Content from ${testUrl}`);
  });

  test('ブックマーク一覧の項目を削除すると、ブックマーク一覧から削除される', async () => {
    const testUrl = 'http://127.0.0.1:5500/testBookmark.html';
    urlInput.value = testUrl;
    fireEvent.click(bookmarkButton);
    const bookmarkLi = bookmarkUl.querySelector('li');
    const bookmarkDeleteButton = bookmarkLi.querySelector('button');
    fireEvent.click(bookmarkDeleteButton);
    expect(bookmarkUl.childElementCount).toBe(0);
    expect(localStorage.getItem('bookmarks')).toBe('[]');
  });
});
