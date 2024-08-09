declare global {
    type MetricId = "avg" | "games" | "games_3_plus" | "avg_delta" | "rank";
    type MetricDefinition = {
        title: string;
        ascending: boolean;
    };
    type MetricBody = {
        rank: number;
        value: number;
    };
}

export { }
