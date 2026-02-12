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
  ctx.command("浅草寺抽签", "抽签")
    .action(async ({ session }) => {
      const num = Random.int(1, 101)

      if (num >= 5) {
        // 获取原始文本并清洗掉数据中可能存在的转义字符
        let rawText = Random.pick(qian).replace(/\\n/g, '\n');

        if (config.imageMode) {
          if (ctx.puppeteer) {
            // --- 精细化解析逻辑 ---
            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
            const result = lines[0]; // 吉凶
            const poem = lines.slice(1, 5); // 四句核心诗句
            
            const rest = lines.slice(5);
            const explanations: { text: string, isHeader: boolean }[] = [];
            const items: string[] = [];
            
            for (const line of rest) {
              if (line.includes('：')) {
                items.push(line);
              } else {
                // 如果这行文字在诗句中出现过，将其视为子标题（原诗句重申）
                const isHeader = poem.some(p => line.includes(p) || p.includes(line));
                explanations.push({ text: line, isHeader });
              }
            }

            // --- HTML & CSS 设计 ---
            return ctx.puppeteer.render(
`<html>
  <head>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: fit-content;
        height: fit-content;
        background: transparent;
      }

      .paper {
        width: 380px;
        padding: 30px;
        background: #fdfaf2;
        /* 模拟宣纸纹理 */
        background-image: 
          linear-gradient(rgba(139, 34, 34, 0.05) 1px, transparent 1px),
          radial-gradient(#f7f0d5 0%, #fdfaf2 100%);
        background-size: 100% 2em, auto;
        border: 1px solid #d4c5a1;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        font-family: "STKaiti", "KaiTi", "楷体", "SimSun", "宋体", serif;
        color: #2b2b2b;
      }

      .outer-border {
        border: 2px solid #8b2222;
        padding: 5px;
      }

      .inner-content {
        border: 1px solid #8b2222;
        padding: 20px 15px;
        position: relative;
      }

      /* 顶部印章 */
      .top-seal {
        text-align: center;
        color: #8b2222;
        font-size: 14px;
        font-weight: bold;
        border: 2px solid #8b2222;
        width: fit-content;
        margin: 0 auto 15px;
        padding: 2px 10px;
      }

      /* 吉凶结果 */
      .result-title {
        font-size: 60px;
        text-align: center;
        color: #b71c1c;
        margin: 10px 0 30px;
        font-weight: 900;
        line-height: 1;
      }

      /* 诗句竖排区：从右往左 */
      .poem-section {
        display: flex;
        flex-direction: row-reverse; /* 关键：使诗句从右向左排列 */
        justify-content: center;
        writing-mode: vertical-rl;
        text-orientation: upright;
        height: 180px;
        margin: 0 auto 30px;
        padding: 20px;
        background: white;
        border: 1px solid #eee;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.02);
      }

      .poem-line {
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 0.2em;
        margin: 0 10px;
        line-height: 1.5;
      }

      /* 标题装饰 */
      .section-label {
        color: #8b2222;
        font-weight: bold;
        font-size: 16px;
        margin: 20px 0 10px;
        display: flex;
        align-items: center;
      }
      .section-label::before {
        content: "✦";
        margin-right: 5px;
      }

      /* 释义内容 */
      .exp-container {
        font-family: "SimSun", "宋体", serif;
        font-size: 14px;
        line-height: 1.8;
        text-align: justify;
      }

      .exp-header {
        color: #8b2222;
        font-weight: bold;
        display: block;
        margin-top: 10px;
        font-size: 15px;
      }

      .exp-text {
        display: block;
        margin-bottom: 8px;
        color: #444;
      }

      /* 仙机部分 */
      .item-list {
        border-top: 1px dashed #d4c5a1;
        margin-top: 15px;
        padding-top: 10px;
        font-size: 13px;
        font-family: "SimSun", "宋体", serif;
      }
      .item-row { margin-bottom: 5px; }
      .item-key { font-weight: bold; color: #5d4037; }

      .footer-note {
        text-align: center;
        font-size: 11px;
        color: #999;
        margin-top: 25px;
        letter-spacing: 1px;
      }
    </style>
  </head>
  <body>
    <div class="paper">
      <div class="outer-border">
        <div class="inner-content">
          <div class="top-seal">浅草寺观音签</div>
          
          <div class="result-title">${result}</div>

          <div class="poem-section">
            ${poem.map(line => `<div class="poem-line">${line}</div>`).join('')}
          </div>

          <div class="section-label">释义</div>
          <div class="exp-container">
            ${explanations.map(exp => 
              exp.isHeader 
              ? `<span class="exp-header">${exp.text}</span>` 
              : `<span class="exp-text">${exp.text}</span>`
            ).join('')}
          </div>

          <div class="section-label">仙机</div>
          <div class="item-list">
            ${items.map(line => {
              const [key, ...val] = line.split('：');
              return `<div class="item-row"><span class="item-key">${key}：</span>${val.join('：')}</div>`;
            }).join('')}
          </div>

          <div class="footer-note">此签诚心求之，万事皆有定数。</div>
        </div>
      </div>
    </div>
  </body>
</html>`
            );
          } else {
            ctx.logger('cyber-sensoji').warn("未启用puppeteer服务，无法使用图片模式");
            return rawText;
          }
        } else {
          return rawText;
        }
      } else {
        return "是空签呢（据说这是把凶签留在了寺里，是好事哦）";
      }
    })
}
