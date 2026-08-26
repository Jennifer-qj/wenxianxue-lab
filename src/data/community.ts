export type ContributionRecord = {
  id: string;
  date: string;
  contributor: string;
  area: string;
  summary: string;
  decision: "accepted" | "partially_accepted" | "declined";
  issue_url: string;
  release?: string;
};

// 这里只记录已经公开讨论并完成处理的真实贡献，不用示例数据填充数字。
export const contributionRecords: ContributionRecord[] = [];

