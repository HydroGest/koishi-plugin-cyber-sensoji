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
      // 模拟摇签筒的过程，虽然这里是随机逻辑
      const num = Random.int(1, 101)

      if (num >= 5) {
        // 从数据源中随机获取一条签文
        const rawText = Random.pick(qian);

        if (config.imageMode) {
          if (ctx.puppeteer) {
            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
            
            // 第一行为吉凶，接下来的四行为诗句
            const result = lines[0]; // 大吉、小吉等
            const poem = lines.slice(1, 5); // 四句诗
            
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
            
            return ctx.puppeteer.render(
`<html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');
      
      body {
        margin: 0;
        padding: 20px;
        background-color: transparent; /* 让 Puppeteer 截图决定背景 */
        font-family: "SimSun", "Songti SC", "Noto Serif SC", serif; /* 优先宋体，更有古风 */
      }

      .container {
        width: 375px; /* 固定宽度，像一张手机屏幕或长条纸 */
        background-color: #fffdf5; /* 米黄色纸张背景 */
        border: 2px solid #333;
        padding: 25px;
        box-sizing: border-box;
        position: relative;
        box-shadow: 5px 5px 15px rgba(0,0,0,0.2);
        margin: 0 auto;
      }

      /* 内边框装饰 */
      .inner-border {
        border: 1px solid #8b0000;
        padding: 15px;
        height: 100%;
      }

      .header {
        text-align: center;
        font-size: 14px;
        color: #555;
        margin-bottom: 10px;
        letter-spacing: 2px;
      }

      /* 吉凶结果 - 大红字 */
      .result {
        text-align: center;
        font-size: 48px;
        font-weight: bold;
        color: #d32f2f; /* 朱红色 */
        margin: 10px 0 20px 0;
        font-family: "KaiTi", "楷体", serif;
        border-bottom: 2px solid #333;
        padding-bottom: 15px;
      }

      /* 诗句 - 居中或竖排 */
      .poem-box {
        text-align: center;
        margin: 20px 0;
        padding: 15px;
        background-color: #fff;
        border: 1px solid #ccc;
      }

      .poem-line {
        font-size: 22px;
        margin: 8px 0;
        letter-spacing: 2px;
        color: #000;
        font-weight: 600;
      }

      /* 解说部分 */
      .section-title {
        font-weight: bold;
        font-size: 16px;
        margin-top: 20px;
        margin-bottom: 5px;
        color: #8b0000;
        border-left: 4px solid #8b0000;
        padding-left: 8px;
      }

      .explanation {
        font-size: 14px;
        color: #444;
        line-height: 1.6;
        margin-bottom: 10px;
        text-align: justify;
      }

      /* 具体项目列表 */
      .item-list {
        margin-top: 15px;
        border-top: 1px dashed #aaa;
        padding-top: 15px;
      }

      .item {
        font-size: 14px;
        margin-bottom: 6px;
        line-height: 1.4;
      }

      .item-label {
        font-weight: bold;
        color: #333;
      }

      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 12px;
        color: #999;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="inner-border">
        <div class="header">浅草寺观音签</div>
        
        <div class="result">${result}</div>

        <div class="poem-box">
          ${poem.map(line => `<div class="poem-line">${line}</div>`).join('')}
        </div>

        ${explanations.length > 0 ? `
          <div class="section-title">解曰</div>
          ${explanations.map(line => `<div class="explanation">${line}</div>`).join('')}
        ` : ''}

        ${items.length > 0 ? `
          <div class="section-title">仙机</div>
          <div class="item-list">
            ${items.map(line => {
              const parts = line.split('：');
              const label = parts[0];
              const content = parts.slice(1).join('：');
              return `<div class="item"><span class="item-label">${label}：</span>${content}</div>`;
            }).join('')}
          </div>
        ` : ''}

        <div class="footer">
          Cyber Sensoji | 诚心祈愿
        </div>
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
