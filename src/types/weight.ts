export interface WeightRecord {
  id: string
  recordDate: string
  weight: number
  note: string
}

export interface WeightFormPayload {
  recordDate: string
  weight: number
  note: string
}
