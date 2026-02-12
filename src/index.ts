// This file is modified from https://github.com/Raidenneox/nonebot_plugin_CyberSensoji, under the MIT license
// Copyright Raidenneox 2022

import { Context, Schema, Random } from 'koishi'
import { qian } from './qian'
import { } from 'koishi-plugin-puppeteer'

export const name = 'cyber-sensoji'

export interface Config {
  imageMode: boolean
}

export const Config: Schema<Config> = Schema.object({
  imageMode: Schema.boolean()
    .description("以图片形式发送签文（需要puppeteer服务）")
    .default(false),
})

export const inject = { optional: ["puppeteer"] }

export function apply(ctx: Context, config: Config) {
  ctx.command("浅草寺抽签", "诚心求签，感应神明")
    .action(async ({ session }) => {
      // --- 仪式感逻辑：模拟摇签筒 ---
      // 设定一个 40% 的成功率，模拟签杆不是每次都能轻易摇出来的感觉
      if (Random.bool(0.6)) {
        return "（签筒晃动声...）签头未出，请平心静气，再试一次。"
      }

      const num = Random.int(1, 101)

      if (num >= 5) {
        // 数据预处理：清理转义字符并标准化
        const rawText = Random.pick(qian).replace(/\\n/g, '\n');
        
        if (config.imageMode && ctx.puppeteer) {
          const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
          const result = lines[0]; 
          const poem = lines.slice(1, 5); 
          
          const explanations: { title: string; content: string }[] = [];
          const items: string[] = [];
          
          let currentTitle = "";
          for (let i = 5; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('：')) {
              items.push(line);
            } else if (line.length <= 12) {
              currentTitle = line;
            } else {
              explanations.push({ title: currentTitle, content: line });
              currentTitle = "";
            }
          }

          return ctx.puppeteer.render(
`<html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');

      html, body {
        width: fit-content;
        height: fit-content;
        margin: 0;
        padding: 0;
        background-color: transparent;
      }

      .omikuji-card {
        width: 380px;
        background: #fdfaf2;
        padding: 40px 30px;
        box-sizing: border-box;
        border: 1px solid #d4c5a9;
        font-family: "Noto Serif SC", "Source Han Serif SC", "MingLiU", "微軟正黑體", serif;
        position: relative;
        color: #2c2c2c;
      }

      /* 装饰性内边框 */
      .omikuji-card::after {
        content: "";
        position: absolute;
        top: 10px; left: 10px; right: 10px; bottom: 10px;
        border: 1px solid #e2d7bf;
        pointer-events: none;
      }

      .header-title {
        text-align: center;
        font-size: 14px;
        letter-spacing: 0.5em;
        color: #8b2222;
        margin-bottom: 30px;
        border-bottom: 1px solid #8b2222;
        display: block;
        width: fit-content;
        margin-left: auto;
        margin-right: auto;
        padding-bottom: 5px;
        font-weight: 700;
      }

      .luck-result {
        text-align: center;
        font-size: 52px;
        color: #b71c1c;
        margin: 0 0 40px 0;
        font-family: "Noto Serif SC", serif;
        font-weight: 900;
      }

      /* 诗句容器：严谨的对称与排版 */
      .poem-box {
        display: flex;
        flex-direction: row-reverse;
        justify-content: center;
        align-items: center;
        gap: 25px;
        margin: 0 auto 40px auto;
        padding: 35px 20px;
        border-top: 2px solid #333;
        border-bottom: 2px solid #333;
        background-color: #fff;
        min-height: 200px;
      }

      .poem-line {
        writing-mode: vertical-rl;
        font-size: 26px;
        font-weight: 600;
        letter-spacing: 0.3em;
        line-height: 1;
        text-align: center;
        color: #1a1a1a;
      }

      .section-head {
        font-size: 16px;
        font-weight: 700;
        color: #8b2222;
        border-left: 3px solid #8b2222;
        padding-left: 10px;
        margin: 25px 0 12px 0;
      }

      .desc-text {
        font-size: 14px;
        line-height: 1.8;
        color: #4a4a4a;
        margin-bottom: 10px;
        text-align: justify;
      }

      .desc-sub-title {
        font-weight: 700;
        color: #333;
        margin-top: 15px;
        font-size: 15px;
      }

      .item-grid {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px dashed #d4c5a9;
      }

      .item-row {
        font-size: 13px;
        margin-bottom: 6px;
        display: flex;
        color: #555;
      }

      .item-k {
        font-weight: 700;
        color: #333;
        white-space: nowrap;
        margin-right: 8px;
      }

      .footer-msg {
        text-align: center;
        font-size: 11px;
        color: #a09070;
        margin-top: 40px;
        font-style: italic;
      }
    </style>
  </head>
  <body>
    <div class="omikuji-card">
      <span class="header-title">浅草寺观音灵签</span>
      
      <div class="luck-result">${result}</div>

      <div class="poem-box">
        ${poem.map(p => `<div class="poem-line">${p}</div>`).join('')}
      </div>

      <div class="section-head">释义</div>
      ${explanations.map(e => `
        <div style="margin-bottom: 15px;">
          ${e.title ? `<div class="desc-sub-title">${e.title}</div>` : ''}
          <div class="desc-text">${e.content}</div>
        </div>
      `).join('')}

      <div class="section-head">仙机</div>
      <div class="item-grid">
        ${items.map(i => {
          const [k, v] = i.split('：');
          return `<div class="item-row"><span class="item-k">${k}</span><span>${v}</span></div>`;
        }).join('')}
      </div>

      <div class="footer-msg">— 诚心所愿，万事皆随缘 —</div>
    </div>
  </body>
</html>`
          );
        }
        return rawText;
      } else {
        return "此乃空签，意为“放下”，诸事不宜强求，留在寺中可化解。"
      }
    })
}
