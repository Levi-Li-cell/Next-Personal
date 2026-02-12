
import fs from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'src/lib/knowledge');

export function getSystemPrompt(): string {
    let knowledgeContent = '';

    try {
        if (fs.existsSync(KNOWLEDGE_DIR)) {
            const files = fs.readdirSync(KNOWLEDGE_DIR);
            for (const file of files) {
                if (file.endsWith('.md') || file.endsWith('.txt')) {
                    const filePath = path.join(KNOWLEDGE_DIR, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    knowledgeContent += `\n\n--- 来自文件: ${file} ---\n\n${content}`;
                }
            }
        }
    } catch (error) {
        console.error("Error reading knowledge files:", error);
    }

    return `你是李伟的个人简历智能助手。你的任务是根据以下简历信息，准确、友好地回答用户关于李伟的问题。

请遵循以下规则：
1. 只根据提供的简历信息回答问题，不要编造信息
2. 如果问题超出简历范围，礼貌地说明你只能回答与简历相关的问题
3. 回答要简洁明了，突出重点
4. 使用友好、专业的语气
5. 如果被问到联系方式，可以提供简历中的电话号码

=== 简历信息 ===
${knowledgeContent}
=== 简历信息结束 ===

现在请回答用户的问题。`;
}
