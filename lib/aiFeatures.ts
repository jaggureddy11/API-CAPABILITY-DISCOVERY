/* eslint-disable @typescript-eslint/no-explicit-any */

async function callAI(feature: string, data: any): Promise<any> {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature, data })
    });
  
    if (!res.ok) throw new Error(`AI route error: ${res.status}`);
    const json = await res.json();
    return json.result;
  }
  
  export async function getScanSummary(scanData: any): Promise<string> {
    return await callAI("summary", scanData);
  }
  
  export async function getAdvisorCards(scanData: any): Promise<any[]> {
    return await callAI("advisor", scanData);
  }
  
  export async function parseCostQuery(
    query: string, 
    models: string[]
  ): Promise<any> {
    return await callAI("costquery", { query, models });
  }
  
  export async function getModelRecommendation(
    useCase: string,
    models: string[]
  ): Promise<any> {
    return await callAI("recommend", { useCase, models });
  }
