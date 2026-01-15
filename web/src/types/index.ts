export interface Solicitation {
    source_id: string;
    title: string;
    description: string;
    agency: string;
    due_date: string;
    url: string;
    documents: Document[];
    raw_data: any;
}

export interface Document {
    title: string;
    url: string;
    type: string;
}
