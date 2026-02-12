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
        // 清理原始数据中的异常换行符
        const rawText = Random.pick(qian).replace(/\\n/g, '\n');

        if (config.imageMode) {
          if (ctx.puppeteer) {
            // --- 数据精准解析 ---
            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
            const result = lines[0]; // 大吉 / 凶 等
            const poem = lines.slice(1, 5); // 四句诗
            
            const explanations: { title: string; content: string }[] = [];
            const items: string[] = [];
            
            // 解析剩余部分
            let currentTitle = "";
            for (let i = 5; i < lines.length; i++) {
              const line = lines[i];
              if (line.includes('：')) {
                items.push(line);
              } else {
                // 如果这一行比较短，且是下一段的开头（匹配诗句），则作为标题
                if (line.length <= 10 && poem.some(p => line.includes(p.substring(0,2)))) {
                  currentTitle = line;
                } else if (currentTitle) {
                  explanations.push({ title: currentTitle, content: line });
                  currentTitle = ""; // 用完清空
                } else {
                  explanations.push({ title: "", content: line });
                }
              }
            }

            return ctx.puppeteer.render(
`<html>
  <head>
    <style>
      html, body {
        width: fit-content;
        height: fit-content;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }

      .paper {
        width: 420px;
        background: #fdf6e3; /* 经典纸张色 */
        border: 2px solid #8b2222;
        margin: 20px;
        padding: 30px 25px;
        box-sizing: border-box;
        font-family: "Source Han Serif SC", "Noto Serif SC", "SimSun", "STSong", serif;
        position: relative;
        color: #333;
      }

      /* 顶部装饰 */
      .header-box {
        border: 1.5px solid #8b2222;
        color: #8b2222;
        width: fit-content;
        margin: 0 auto;
        padding: 2px 15px;
        font-size: 16px;
        font-weight: bold;
        letter-spacing: 4px;
      }

      /* 结果字体 */
      .result {
        text-align: center;
        font-size: 64px;
        color: #b71c1c;
        margin: 20px 0;
        font-family: "KaiTi", "STKaiti", serif;
      }

      /* 竖排诗句区域 */
      .poem-wrap {
        border: 1px solid #c0a46b;
        background: rgba(255,255,255,0.4);
        display: flex;
        flex-direction: row-reverse; /* 关键：从右往左排 */
        justify-content: center;
        padding: 30px 10px;
        margin: 20px 0;
      }

      .poem-col {
        writing-mode: vertical-rl;
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 0.2em;
        margin: 0 12px;
        line-height: 1.2;
        height: 180px; /* 固定高度确保整齐 */
        text-align: start;
      }

      .section-label {
        color: #8b2222;
        font-weight: bold;
        font-size: 18px;
        display: flex;
        align-items: center;
        margin-top: 25px;
      }
      .section-label::before { content: "✦ "; margin-right: 5px; }

      /* 释义文字 */
      .desc-group { margin-bottom: 15px; }
      .desc-title {
        font-weight: bold;
        color: #555;
        margin-top: 10px;
        font-size: 15px;
      }
      .desc-content {
        font-size: 14px;
        line-height: 1.6;
        color: #444;
        text-align: justify;
        margin-top: 4px;
      }

      /* 仙机列表 */
      .item-list {
        border-top: 1px dashed #ccc;
        margin-top: 15px;
        padding-top: 10px;
      }
      .item {
        font-size: 14px;
        margin-bottom: 5px;
        line-height: 1.5;
      }
      .item-k { font-weight: bold; color: #614126; }

      .footer {
        text-align: center;
        font-size: 12px;
        color: #999;
        margin-top: 30px;
        letter-spacing: 1px;
      }
    </style>
  </head>
  <body>
    <div class="paper">
      <div class="header-box">浅草寺观音签</div>
      <div class="result">${result}</div>

      <div class="poem-wrap">
        ${poem.map(p => `<div class="poem-col">${p}</div>`).join('')}
      </div>

      <div class="section-label">释义</div>
      ${explanations.map(e => `
        <div class="desc-group">
          ${e.title ? `<div class="desc-title">${e.title}</div>` : ''}
          <div class="desc-content">${e.content}</div>
        </div>
      `).join('')}

      <div class="section-label">仙机</div>
      <div class="item-list">
        ${items.map(i => {
          const [k, v] = i.split('：');
          return `<div class="item"><span class="item-k">${k}：</span>${v}</div>`;
        }).join('')}
      </div>

      <div class="footer">此签诚心求之，万事皆有定数。</div>
    </div>
  </body>
</html>`
            );
          } else {
            ctx.logger('cyber-sensoji').warn("未启用puppeteer服务，无法使用图片模式")
            return rawText
          }
        } else {
          return rawText
        }
      } else {
        return "是空签呢"
      }
    })
}
