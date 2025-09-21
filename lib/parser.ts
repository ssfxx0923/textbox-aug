// 解析text.txt格式的卡密数据
export interface ParsedCardKey {
  tenant_url: string;
  access_token: string;
  email: string;
  balance_url?: string;
  expiry_date: string;
  query_params: string;
}

export function parseCardKeysText(text: string): ParsedCardKey[] {
  const cards: ParsedCardKey[] = [];
  const blocks = text.split('----------------').filter(block => block.trim());
  
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const cardData: Partial<ParsedCardKey> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('租户URL：')) {
        cardData.tenant_url = trimmedLine.replace('租户URL：', '').trim();
      } else if (trimmedLine.startsWith('访问令牌(Token)：')) {
        cardData.access_token = trimmedLine.replace('访问令牌(Token)：', '').trim();
      } else if (trimmedLine.startsWith('邮箱：')) {
        cardData.email = trimmedLine.replace('邮箱：', '').trim();
      } else if (trimmedLine.startsWith('余额查询URL：')) {
        const url = trimmedLine.replace('余额查询URL：', '').trim();
        if (url) {
          cardData.balance_url = url;
        }
      } else if (trimmedLine.startsWith('实际到期日：')) {
        cardData.expiry_date = trimmedLine.replace('实际到期日：', '').trim();
      } else if (trimmedLine.startsWith('查询参数：')) {
        cardData.query_params = trimmedLine.replace('查询参数：', '').trim();
      }
    }
    
    // 验证必需字段
    if (cardData.tenant_url && cardData.access_token && cardData.email && 
        cardData.expiry_date && cardData.query_params) {
      cards.push(cardData as ParsedCardKey);
    }
  }
  
  return cards;
}

export function formatCardKeyForDisplay(cardKey: any): string {
  return `您的登录信息如下
租户URL：${cardKey.tenant_url}
访问令牌(Token)：${cardKey.access_token}
邮箱：${cardKey.email}
${cardKey.balance_url ? `余额查询URL：${cardKey.balance_url}` : '余额查询URL：'}
实际到期日：${cardKey.expiry_date}`;
}
