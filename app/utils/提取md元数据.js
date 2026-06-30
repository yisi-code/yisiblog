import fs from 'node:fs';
import path from 'node:path';
/**
 * 解析 Markdown 中的 YAML front matter（--- 包裹部分）
 * 支持简单字符串键值对和列表（以 - 开头）
 * 返回 { meta, body }，若解析失败则 meta 为 null
 */
function parseFrontMatter(text) {
    const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return { meta: null, body: text };

    const fmText = match[1];
    const body = text.slice(match[0].length);
    const meta = {};
    let currentListKey = null;

    fmText.split('\n').forEach(line => {
        line = line.trim();
        if (!line) return;

        // 列表项
        if (line.startsWith('- ')) {
            let value = line.slice(2).trim();
            // 去除可能的首尾引号
            value = value.replace(/^["']|["']$/g, '');
            if (currentListKey) {
                if (!meta[currentListKey]) meta[currentListKey] = [];
                meta[currentListKey].push(value);
            }
            return;
        }

        // 键值对
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
            currentListKey = null;
            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();
            // 去除首尾引号
            value = value.replace(/^["']|["']$/g, '');
            if (value === '') {
                // 可能后面跟着一个列表
                currentListKey = key;
                meta[key] = [];
            } else {
                meta[key] = value;
            }
        }
    });

    return { meta, body };
}
/**
 * 主处理函数
 */
function processFolder(folderPath = '文件夹1', outputFile = 'postrecord.json') {
    if (!fs.existsSync(folderPath)) {
        console.error(`错误：文件夹 '${folderPath}' 不存在。`);
        return;
    }

    const files = fs.readdirSync(folderPath);
    const records = [];

    files.forEach(filename => {
        if (!filename.toLowerCase().endsWith('.md')) return;

        const filePath = path.join(folderPath, filename);
        const text = fs.readFileSync(filePath, 'utf-8');
        const { meta} = parseFrontMatter(text);

        if (!meta) {
            console.warn(`警告：${filename} 没有有效的 YAML 头部，跳过。`);
            return;
        }

        const title = meta.title || path.basename(filename, '.md');
        const dateRaw = meta.date || '';
        let tags = meta.tags || [];

        // 确保 tags 是数组
        if (!Array.isArray(tags)) {
            tags = [tags];
        }


        records.push({
            id: title,
            type: 'post',
            title: title,
            description: '',
            date: dateRaw,
            cover: '',
            tags: tags
        });
    });

    // 按日期降序排序（最新的在前）
    records.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    fs.writeFileSync(outputFile, JSON.stringify(records, null, 2), 'utf-8');
    console.log(`处理完成，共提取 ${records.length} 篇文章，结果保存至 ${outputFile}`);
}

// 运行
processFolder('E:\\全栈项目\\博客中转');