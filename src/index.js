import fs from 'fs';
// import path from 'path';
import util from 'util';
import core from '@actions/core';
import childProcess from 'child_process';

import { JSDOM } from 'jsdom';

const exec = util.promisify(childProcess.exec);

// 读取参数: 掘金用户 ID
const USER_ID = core.getInput('user_id');

try {
  core.info('1. Waiting 拉取页面 ...');
  const { stdout: body } = await exec(`curl https://juejin.cn/user/${USER_ID}/posts`);

  core.info('2. Waiting 解析 HTML ...');
  const dom = await new JSDOM(body);

  core.info('3. Waiting 生成 html ...');
  const htmlText = [...dom.window.document.querySelectorAll('.detail-list .post-list-box .entry-list .entry')]
    .reduce((total, ele) => {
      const data = ele.querySelector('.meta-container .date')?.textContent;
      const link = ele.querySelector('.content-wrapper .title-row a.title');
      return `${total}\n<li>[${data}] <a href="https://juejin.cn${link?.getAttribute('href')}">${link?.textContent}</a></li>`;
    }, '');

  core.info('4. Waiting 获取 目录 README 路径 ...');
  // const { stdout: pwd } = await exec('pwd');
  const README_PATH = './README.md';

  core.info(`5. 去 ${README_PATH} 内容, 在 <!-- posts start --> 和 <!-- posts end --> 中间插入生成的 html ...`);
  const res = fs.readFileSync(README_PATH, 'utf-8')
    .replace(/(?<=<!-- posts start -->)[.\s\S]*?(?=<!-- posts end -->)/, `\n<ul>${htmlText}\n</ul>\n`);

  core.info('6. 修改 README ...');
  fs.writeFileSync(README_PATH, res);

  core.info(`res: ${fs.readFileSync(README_PATH, 'utf-8')}`);
} catch (error) {
  core.setFailed(error);
}

// 设置输出给下一个步骤的参数
// core.setOutput('time', new Date().toTimeString());
