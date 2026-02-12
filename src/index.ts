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
        const rawText = Random.pick(qian);

        if (config.imageMode) {
          if (ctx.puppeteer) {
            // --- 数据解析 ---
            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
            const result = lines[0]; // 吉凶
            const poem = lines.slice(1, 5); // 诗句
            const explanations: string[] = [];
            const items: string[] = [];
            
            for (let i = 5; i < lines.length; i++) {
              const line = lines[i];
              if (line.includes('：')) {
                items.push(line);
              } else {
                explanations.push(line);
              }
            }
            // --- 解析结束 ---

            // --- HTML 渲染 (全新设计风格) ---
            return ctx.puppeteer.render(
`<html>
  <head>
    <style>
      /* 引入网络字体作为后备，优先使用系统自带的传统字体 */
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');
      
      html, body {
        width: fit-content;
        height: fit-content;
        margin: 0;
        padding: 0;
        /* 确保截图背景透明 */
        background-color: transparent; 
      }

      /* 主容器：模拟陈旧纸张 */
      .omikuji-paper {
        width: 400px; /* 设定一个合适的宽度 */
        /* 模拟泛黄宣纸的渐变和纹理背景 */
        background: 
          radial-gradient(ellipse at center, #fcf5e4 0%, #f3e2c0 100%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23999' fill-opacity='0.05' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
        
        /* 传统风格的双重边框 */
        border: 3px double #8b2222; /* 深朱红色 */
        padding: 25px;
        box-sizing: border-box;
        box-shadow: 10px 10px 20px rgba(0,0,0,0.15);
        
        /* 全局字体设定，优先楷体和宋体 */
        font-family: "KaiTi", "楷体", "STKaiti", "SimSun", "宋体", "Noto Serif SC", serif;
        color: #2c2c2c; /* 墨色 */
      }

      .header-stamp {
        text-align: center;
        font-size: 16px;
        color: #8b2222;
        font-weight: bold;
        letter-spacing: 4px;
        margin-bottom: 15px;
        /* 模拟印章效果的边框 */
        border: 2px solid #8b2222;
        display: inline-block;
        padding: 4px 12px;
        border-radius: 4px;
        position: relative;
        left: 50%;
        transform: translateX(-50%);
      }

      /* 吉凶结果：极大，朱红，楷体 */
      .result-big {
        text-align: center;
        font-size: 56px;
        font-weight: 900;
        color: #b71c1c; /* 更鲜艳的朱红 */
        margin: 5px 0 25px 0;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }

      /* 诗句区域：核心改动 -> 竖排直书 */
      .poem-container {
        display: flex;
        justify-content: center;
        margin: 30px 0;
        padding: 20px 0;
        /* 上下古典风格分隔线 */
        border-top: 1px solid #8b2222;
        border-bottom: 1px solid #8b2222;
        background-color: rgba(255,255,255,0.3); /* 微微提亮 */
      }

      .poem-vertical {
        /* 关键属性：竖排从右向左 */
        writing-mode: vertical-rl;
        text-orientation: upright;
        font-size: 26px;
        font-weight: bold;
        letter-spacing: 6px;
        line-height: 2.2; /* 行间距 */
        height: 200px; /* 固定高度确保对齐 */
        color: #1a1a1a;
      }

      /* 解说章节标题 */
      .section-title {
        font-size: 18px;
        font-weight: bold;
        color: #8b2222;
        margin-top: 25px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
      }
      /* 标题前的小装饰 */
      .section-title::before {
        content: '✦';
        margin-right: 8px;
        font-size: 14px;
      }

      .explanation-text {
        font-size: 15px;
        line-height: 1.7;
        text-align: justify; /* 两端对齐 */
        margin-bottom: 12px;
        font-family: "SimSun", "宋体", serif; /* 正文用宋体更易读 */
      }

      /* 具体项目列表 */
      .item-grid {
        display: grid;
        grid-template-columns: 1fr; /* 单列，看起来更像清单 */
        gap: 8px;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px dashed #a67c52; /* 棕色虚线 */
      }

      .item-row {
        font-size: 14px;
        line-height: 1.5;
        font-family: "SimSun", "宋体", serif;
      }

      .item-label {
        font-weight: bold;
        color: #5d4037; /* 深棕色 */
        margin-right: 4px;
      }

      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 12px;
        color: #795548;
        opacity: 0.8;
      }
    </style>
  </head>

  <body>
    <div class="omikuji-paper">
      <div class="header-stamp">浅草寺观音签</div>
      
      <div class="result-big">${result}</div>

      <div class="poem-container">
        <div class="poem-vertical">
          ${poem.reverse().join('\n')} </div>
      </div>

      ${explanations.length > 0 ? `
        <div class="section-title">释义</div>
        ${explanations.map(line => `<div class="explanation-text">${line}</div>`).join('')}
      ` : ''}

      ${items.length > 0 ? `
        <div class="section-title">仙机</div>
        <div class="item-grid">
          ${items.map(line => {
            const parts = line.split('：');
            return `<div class="item-row"><span class="item-label">${parts[0]}：</span>${parts.slice(1).join('：')}</div>`;
          }).join('')}
        </div>
      ` : ''}

      <div class="footer">
        此签诚心求之，万事皆有定数。
      </div>
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
        return "是空签呢（据说这是把凶签留在了寺里，是好事哦）"
      }
    })
}
