/**
 * SpotLake가 매일 공개하는 SpotVista용 데이터.
 *
 * spotvista-daily-exporter Lambda가 TITANS 변경점으로 (InstanceType, Region, AZ)마다
 * 하루 T3 합계를 만들어 SpotLake 공개 CloudFront에 올린다. 10분 단위 값은 공개하지
 * 않고, 점수 계산에 필요한 합계만 있다(score.ts 참고).
 *
 * 교차 출처 요청이라 CloudFront CORS 정책에 이 사이트와 http://localhost:3000 이
 * 허용돼 있다. 로컬에서 다른 데이터를 보려면 NEXT_PUBLIC_SPOTVISTA_DATA_ORIGIN 을 준다.
 */

export const DATA_ORIGIN =
  process.env.NEXT_PUBLIC_SPOTVISTA_DATA_ORIGIN ??
  "https://d2krkjqajp4l0e.cloudfront.net/spotvista/aws"

/** 점수 기준일 전날까지 며칠을 보는지. 기존 쿼리 모듈의 LOOKBACK_DAYS와 같다. */
export const WINDOW_DAYS = 7

/** 하루 T3 값(10분 간격, 빈 칸 제외)의 개수, 합, 제곱합, Σ i·y, 첫 값, 끝 값. */
export interface DayAgg {
  n: number
  sum: number
  sumsq: number
  sum_iy: number
  first: number
  last: number
}

export interface DayRow {
  Region: string
  AZ: string
  T3: DayAgg
  /** 그날 마지막 시점의 값. SpotPrice는 그날 마지막 유효 가격이다. */
  Last: { Time: string; SPS: number | null; T3: number; SpotPrice: number | null }
}

export interface DayFile {
  date: string
  InstanceType: string
  rows: DayRow[]
}

export interface SpotVistaIndex {
  generated_at: string
  dates: { first: string; last: string }
  instance_types: Record<string, string[]>
}

export async function fetchIndex(signal?: AbortSignal): Promise<SpotVistaIndex> {
  const res = await fetch(`${DATA_ORIGIN}/index.json`, { signal })
  if (!res.ok) throw new Error(`index.json ${res.status}`)
  return res.json()
}

/** 그날 그 타입의 파일. 없으면(수집 전이거나 그날 데이터가 없는 타입) null. */
export async function fetchDay(date: string, instanceType: string): Promise<DayFile | null> {
  const res = await fetch(`${DATA_ORIGIN}/daily/${date}/${encodeURIComponent(instanceType)}.json`)
  // S3는 없는 키에 403을 준다. 404와 같이 "그날 파일 없음"으로 본다.
  if (res.status === 403 || res.status === 404) return null
  if (!res.ok) throw new Error(`${date}/${instanceType} ${res.status}`)
  return res.json()
}

/** 기준일(YYYY-MM-DD) 전날까지 WINDOW_DAYS일의 날짜. 오래된 날부터. */
export function windowDays(reference: string): string[] {
  const t = Date.parse(`${reference}T00:00:00Z`)
  return Array.from({ length: WINDOW_DAYS }, (_, k) =>
    new Date(t - (WINDOW_DAYS - k) * 86_400_000).toISOString().slice(0, 10),
  )
}
