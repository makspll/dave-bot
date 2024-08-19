export type MetricId = "avg" | "games" | "games_3_plus" | "avg_delta" | "rank";

export type Scores = Map<number, Map<number, number>>;



export type MetricDefinition = {
    title: string;
    ascending: boolean;
};
export type MetricBody = {
    rank: number;
    value: number;
};

