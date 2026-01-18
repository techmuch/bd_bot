export interface Solicitation {
    source_id: string;
    title: string;
    description: string;
    agency: string;
    due_date: string;
    url: string;
    documents: Document[];
    raw_data: any;
    lead_name?: string;
    interested_parties?: string;
}

export interface Document {
    title: string;
    url: string;
    type: string;
}

export interface Match {
    match_id: number;
    score: number;
    explanation: string;
    solicitation: Solicitation;
}