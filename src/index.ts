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
  ctx.command("浅草寺抽签", "诚心叩问，求取灵签")
    .action(async ({ session }) => {
      // --- 增强仪式感逻辑 ---
      const ceremony = Random.real(0, 1)
      if (ceremony < 0.4) {
        return "（你轻轻摇晃签筒...）签条似乎卡住了。神灵暗示：心若不静，签则不灵。请稍后重试。"
      } else if (ceremony < 0.75) {
        return "（签筒哗啦作响...）掉出了几根签，无法分辨。请平复心情，再次尝试。"
      }

      const num = Random.int(1, 101)

      if (num >= 5) {
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
            } else if (line.length <= 12 && poem.some(p => line.includes(p.substring(0, 2)))) {
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
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;900&display=swap');

      html, body {
        width: fit-content;
        height: fit-content;
        margin: 0;
        padding: 0;
        background-color: transparent;
      }

      .omikuji-container {
        width: 420px;
        padding: 45px;
        box-sizing: border-box;
        /* 模拟和纸质感：淡米色背景 + 细微颗粒渐变 */
        background: 
          radial-gradient(circle at 50% 50%, #fdf9f0 0%, #f5eedc 100%),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
        border: 2px solid #8b2222;
        position: relative;
        font-family: "Noto Serif SC", "Source Han Serif SC", "PingFang SC", "Hiragino Mincho ProN", "MS PMincho", serif;
        color: #1a1a1a;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      }

      /* 古典双线内边框 */
      .omikuji-container::before {
        content: "";
        position: absolute;
        top: 15px; left: 15px; right: 15px; bottom: 15px;
        border: 1px solid #c0a46b;
        pointer-events: none;
        z-index: 1;
      }

      .temple-name {
        text-align: center;
        font-size: 16px;
        letter-spacing: 0.8em;
        color: #8b2222;
        margin-bottom: 30px;
        font-weight: 900;
        text-transform: uppercase;
      }

      /* 结果框：木版水印风格 */
      .result-seal {
        width: 120px;
        height: 120px;
        border: 4px double #8b2222;
        margin: 0 auto 40px auto;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 58px;
        font-weight: 900;
        color: #b71c1c;
        line-height: 1;
        padding: 10px;
        background: rgba(139, 34, 34, 0.03);
      }

      /* 诗句排版：严格垂直对齐 */
      .poem-section {
        display: flex;
        flex-direction: row-reverse;
        justify-content: center;
        gap: 30px;
        margin: 40px 0;
        padding: 40px 10px;
        border-top: 1.5px solid #333;
        border-bottom: 1.5px solid #333;
        background: rgba(255,255,255,0.2);
      }

      .poem-v-line {
        writing-mode: vertical-rl;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 0.4em;
        line-height: 1.2;
        text-align: center;
        height: 220px; /* 固定高度确保视觉重心稳定 */
      }

      .section-title {
        font-size: 18px;
        font-weight: 900;
        color: #8b2222;
        margin: 35px 0 15px 0;
        display: flex;
        align-items: center;
      }
      .section-title::after {
        content: "";
        flex: 1;
        height: 1px;
        background: linear-gradient(to right, #8b2222, transparent);
        margin-left: 10px;
      }

      .explanation-block {
        margin-bottom: 20px;
      }

      .orig-poem-ref {
        font-weight: 900;
        font-size: 15px;
        color: #333;
        margin-bottom: 6px;
        border-bottom: 1px solid #d4c5a9;
        width: fit-content;
      }

      .meaning-text {
        font-size: 14.5px;
        line-height: 1.8;
        color: #3e3e3e;
        text-align: justify;
      }

      .luck-items {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        margin-top: 20px;
        padding: 20px;
        background: rgba(192, 164, 107, 0.05);
        border-radius: 4px;
      }

      .item-row {
        font-size: 14px;
        border-bottom: 1px dotted #d4c5a9;
        padding-bottom: 4px;
        display: flex;
      }

      .item-key {
        font-weight: 900;
        color: #1a1a1a;
        width: 85px;
        flex-shrink: 0;
      }

      .footer-sign {
        text-align: center;
        font-size: 12px;
        color: #a09070;
        margin-top: 50px;
        letter-spacing: 0.2em;
      }
    </style>
  </head>
  <body>
    <div class="omikuji-container">
      <div class="temple-name">浅草寺观音灵签</div>
      
      <div class="result-seal">${result}</div>

      <div class="poem-section">
        ${poem.map(p => `<div class="poem-v-line">${p}</div>`).join('')}
      </div>

      <div class="section-title">【 释义 】</div>
      ${explanations.map(e => `
        <div class="explanation-block">
          ${e.title ? `<div class="orig-poem-ref">${e.title}</div>` : ''}
          <div class="meaning-text">${e.content}</div>
        </div>
      `).join('')}

      <div class="section-title">【 仙机 】</div>
      <div class="luck-items">
        ${items.map(i => {
          const [k, v] = i.split('：');
          return `<div class="item-row"><span class="item-key">${k}</span><span style="color:#555">${v}</span></div>`;
        }).join('')}
      </div>

      <div class="footer-sign">—— 佛法无边，诚心则灵 ——</div>
    </div>
  </body>
</html>`
          );
        }
        return rawText;
      } else {
        return "此乃空签，意为“万事成空，从头开始”。请将此意留在寺中，不必忧怀。"
      }
    })
}
