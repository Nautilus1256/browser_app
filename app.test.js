import '@testing-library/jest-dom'; // DOMのマッチャーを拡張
import { fireEvent } from '@testing-library/dom';

describe('ブラウザプロトタイプの履歴管理機能', () => {
  let urlInput, loadButton, backButton, forwardButton, contentArea;

  // テスト前にHTML要素をセットアップする
  beforeEach(async () => {
    // HTML を設定
    document.body.innerHTML = `
      <header>
        <button id="back-btn" disabled>戻る</button>
        <button id="forward-btn" disabled>進む</button>
        <input type="text" id="url-input" placeholder="URLを入力してください">
        <button id="load-btn">読み込み</button>
      </header>
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

    // fetch をモックする（常に成功し、指定したURLに基づいた内容を返す）
    global.fetch = jest.fn((url) =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`<p>Content from ${url}</p>`)
      })
    );
    
    // HTML のセットアップが完了した後に、app.js を動的にインポート
    await import('./app.js');
    
    // DOMContentLoaded イベントをディスパッチして初期化処理を実行
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('「読み込み」ボタンをクリックするとページが読み込まれ、履歴に追加される', async () => {
    // URL入力欄に値を設定
    urlInput.value = 'http://127.0.0.1:5500/test1.html';
    // 「読み込み」ボタンのクリックをシミュレーション
    fireEvent.click(loadButton);

    // 非同期処理が完了するのを待つ
    await new Promise(resolve => setTimeout(resolve, 0));

    // コンテンツ表示エリアに期待した内容がセットされているか確認
    expect(contentArea.innerHTML).toContain('Content from http://127.0.0.1:5500/test1.html');

    // 履歴が更新され、戻る・進むボタンの状態が正しく反映されているか確認
    expect(backButton).toBeDisabled();
    expect(forwardButton).toBeDisabled();
  });

  test('戻る・進むボタンで履歴内を移動できる', async () => {
    // 2つのURLを順番に読み込む
    urlInput.value = 'http://127.0.0.1:5500/test1.html';
    fireEvent.click(loadButton);
    await new Promise(resolve => setTimeout(resolve, 0));

    urlInput.value = 'http://127.0.0.1:5500/test2.html';
    fireEvent.click(loadButton);
    await new Promise(resolve => setTimeout(resolve, 0));

    // 現在は test2.html が表示されているはず
    expect(contentArea.innerHTML).toContain('Content from http://127.0.0.1:5500/test2.html');
    expect(backButton).not.toBeDisabled(); // 戻るボタンは有効

    // 戻るボタンをクリックして test1.html に戻る
    fireEvent.click(backButton);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(contentArea.innerHTML).toContain('Content from http://127.0.0.1:5500/test1.html');

    // 進むボタンをクリックして再び test2.html に進む
    fireEvent.click(forwardButton);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(contentArea.innerHTML).toContain('Content from http://127.0.0.1:5500/test2.html');
  });
});
