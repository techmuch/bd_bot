export interface Solicitation {
    source_id: string;
    title: string;
    description: string;
    agency: string;
    due_date: string; // ISO date string
    url: string;
    raw_data: any;
}
