import { FastifyInstance } from 'fastify';

interface ParseEntryRequest {
  text: string;
}

interface LifeItem {
  title: string;
  category: string;
  status: 'done' | 'todo' | 'reminder' | 'habit' | 'bill' | 'project';
  confidence: number;
  dueText?: string;
  priority?: 'high' | 'medium' | 'low';
  habit?: string;
  value?: string;
  amount?: number;
}

const DONE_KEYWORDS = ['完成了', '写完了', '做完了', '跑了', '学了', '看完了', '交了', '处理了', '已经', '搞定'];
const TODO_KEYWORDS = ['要', '需要', '计划', '准备', '记得', '明天', '后天', '周五前', '下周'];
const HABIT_KEYWORDS = ['跑步', '健身', '阅读', '学习', '冥想', '喝水', '运动'];
const BILL_KEYWORDS = ['交了', '支付', '花了', '买了', '续费', '房租', '服务器', '订阅'];
const PROJECT_KEYWORDS = ['项目', '部署', 'README', '测试', '前端', '后端', '面试', 'GitHub'];

function parseEntry(text: string) {
  const startTime = Date.now();
  const done: LifeItem[] = [];
  const todos: LifeItem[] = [];
  const habits: LifeItem[] = [];
  const bills: LifeItem[] = [];
  const projects: LifeItem[] = [];
  const suggestions: string[] = [];

  const segments = text.split(/[,，。；;、\n]+/).filter(s => s.trim());

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    const isBill = BILL_KEYWORDS.some(kw => trimmed.includes(kw)) || /\d+\s*(元|块|¥)/.test(trimmed);
    if (isBill) {
      const item: LifeItem = { title: trimmed, category: '账单', status: 'bill', confidence: 0.85 };
      const amountMatch = trimmed.match(/(\d+)\s*(元|块|¥)/);
      if (amountMatch) item.amount = parseInt(amountMatch[1]);
      bills.push(item);
      const isDone = DONE_KEYWORDS.some(kw => trimmed.includes(kw));
      if (isDone) done.push({ ...item, status: 'done' });
      continue;
    }

    const isHabit = HABIT_KEYWORDS.some(kw => trimmed.includes(kw));
    if (isHabit && DONE_KEYWORDS.some(kw => trimmed.includes(kw))) {
      const item: LifeItem = { title: trimmed, category: '健康', status: 'habit', confidence: 0.9, habit: HABIT_KEYWORDS.find(kw => trimmed.includes(kw)) };
      const valueMatch = trimmed.match(/(\d+)\s*(公里|分钟|小时|页|次|个)/);
      if (valueMatch) item.value = `${valueMatch[1]}${valueMatch[2]}`;
      habits.push(item);
      done.push({ ...item, status: 'done' });
      continue;
    }

    const isDone = DONE_KEYWORDS.some(kw => trimmed.includes(kw));
    if (isDone) {
      done.push({ title: trimmed, category: '其他', status: 'done', confidence: 0.9 });
      continue;
    }

    const isTodo = TODO_KEYWORDS.some(kw => trimmed.includes(kw));
    if (isTodo) {
      const dueText = trimmed.includes('明天') ? '明天' : trimmed.includes('后天') ? '后天' : trimmed.includes('周五') ? '周五' : trimmed.includes('下周') ? '下周' : undefined;
      const isProject = PROJECT_KEYWORDS.some(kw => trimmed.includes(kw));
      if (isProject) {
        projects.push({ title: trimmed, category: '项目', status: 'project', confidence: 0.85, dueText, priority: 'high' });
      }
      todos.push({ title: trimmed, category: isProject ? '项目' : '其他', status: 'todo', confidence: 0.85, dueText, priority: isProject ? 'high' : 'medium' });
      continue;
    }

    if (isHabit) {
      const item: LifeItem = { title: trimmed, category: '健康', status: 'habit', confidence: 0.8, habit: HABIT_KEYWORDS.find(kw => trimmed.includes(kw)) };
      habits.push(item);
      continue;
    }

    todos.push({ title: trimmed, category: '其他', status: 'todo', confidence: 0.6, priority: 'medium' });
  }

  if (todos.length > 0) suggestions.push(`建议今天先完成: ${todos[0].title}`);
  if (habits.length > 0) suggestions.push('坚持记录习惯，有助于养成好习惯');
  if (bills.length > 0) {
    const total = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
    if (total > 0) suggestions.push(`今日支出 ${total} 元，注意控制预算`);
  }

  return { done, todos, reminders: [], habits, bills, projects, suggestions, meta: { mode: 'local-rules', durationMs: Date.now() - startTime } };
}

const memoryStore: Map<string, any> = new Map();

export async function lifepilotRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ParseEntryRequest }>('/parse-entry', async (request, reply) => {
    const { text } = request.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return reply.status(400).send({ error: '请输入内容' });
    }
    if (text.length > 1000) {
      return reply.status(400).send({ error: '输入内容过长，最多 1000 字' });
    }
    return parseEntry(text.trim());
  });

  fastify.post('/save-plan', async (request, reply) => {
    const { entryText, items } = request.body as any;
    if (!entryText || !items) return reply.status(400).send({ error: '缺少必要参数' });
    const id = `entry_${Date.now()}`;
    memoryStore.set(id, { id, entryText, items, createdAt: new Date().toISOString() });
    return { saved: true, id, items, meta: { mode: 'memory-demo', durationMs: 0 } };
  });

  fastify.get('/today', async () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = Array.from(memoryStore.values()).filter((entry: any) => entry.createdAt?.startsWith(today));
    const allItems = todayEntries.flatMap((entry: any) => entry.items || []);
    return {
      done: allItems.filter((item: any) => item.status === 'done'),
      todos: allItems.filter((item: any) => item.status === 'todo'),
      timeline: todayEntries.map((entry: any) => ({ time: entry.createdAt, text: entry.entryText })),
      summary: { totalDone: allItems.filter((i: any) => i.status === 'done').length, totalTodos: allItems.filter((i: any) => i.status === 'todo').length },
      meta: { mode: 'memory-demo', durationMs: 0 },
    };
  });
}