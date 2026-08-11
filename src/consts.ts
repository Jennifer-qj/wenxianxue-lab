/** 全站唯一版次声明。具体页码必须经纸本逐条核验后才能进入公开数据。 */
export const EDITION = {
  book: "文献学概要（修订本）",
  author: "杜泽逊",
  publisher: "中华书局",
  year: 2008,
  isbn: "9787101030709",
  pages: 414,
} as const;

export const REVIEW_STATUS = ["not_started", "drafting", "pending_review", "reviewed", "verified"] as const;
