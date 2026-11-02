import type { TopicStat, TopicStatStatus } from "./types";

/**
 * Gap means the class average is below 60%.
 * 60–69 is Watch. 70 and above is On track.
 * Status is derived here so a stored average cannot drift from the label.
 */
export function topicStatus(avg: number): TopicStatStatus {
  if (avg < 60) return "gap";
  if (avg < 70) return "watch";
  return "on_track";
}

export function withTopicStatus(
  row: Omit<TopicStat, "status">,
): TopicStat {
  return { ...row, status: topicStatus(row.avg) };
}
