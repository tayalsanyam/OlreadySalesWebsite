export type ExampleEnquiry={id:number;city:string;date:string;budget:number;title:string};
export function matchingExamples(rows:ExampleEnquiry[],city:string,date:string,minBudget:number){return rows.filter(r=>(!city||r.city===city)&&(!date||r.date===date)&&r.budget>=minBudget);}
