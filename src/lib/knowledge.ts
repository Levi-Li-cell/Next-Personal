
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

    return `你是李伟的个人知识库智能助手。你的任务是根据以下个人知识库信息，准确、友好地回答用户关于李伟的问题。

请遵循以下规则：
1. 只根据提供的个人知识库信息回答问题，不要编造信息
2. 如果问题超出知识库范围，礼貌地说明你只能回答与李伟个人知识库相关的问题
3. 回答要简洁明了，突出重点
4. 使用友好、专业的语气
5. 如果被问到联系方式，可以提供简历中的电话号码
6. 回答中不要使用“根据简历”这种措辞，统一使用“根据李伟个人知识库”或直接给出结论

=== 李伟个人知识库 ===
${knowledgeContent}
=== 李伟个人知识库结束 ===

现在请回答用户的问题。`;
}
