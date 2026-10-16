/**
 * SpotLake가 매일 공개하는 SpotVista 점수.
 *
 * spotvista-daily-exporter Lambda가 TITANS 변경점으로 기준일마다 전체 인스턴스의
 * 가용성 점수(기준일 전날까지 7일 T3, 기존 쿼리 모듈의 calculate_score)와 창 안 가장
 * 최근 SPS·T3·가격을 JSON 하나로 만들어 SpotLake 공개 CloudFront에 올린다. 브라우저는
 * 그 파일 하나를 받아 거르고 비용 점수와 가중치만 적용한다(score.ts).
 *
 * 교차 출처 요청이라 CloudFront CORS 정책이 이 사이트(spotvista.ddps.cloud)를 허용한다.
 * localhost는 허용돼 있지 않으므로, 로컬에서는 NEXT_PUBLIC_SPOTVISTA_DATA_ORIGIN 을
 * 같은 출처의 프록시나 로컬 사본 주소로 준다.
 */

export const DATA_ORIGIN =
  process.env.NEXT_PUBLIC_SPOTVISTA_DATA_ORIGIN ??
  "https://d2krkjqajp4l0e.cloudfront.net/spotvista/aws"

/** 점수 기준일 전날까지 며칠을 보는지. 기존 쿼리 모듈의 LOOKBACK_DAYS와 같다. */
export const WINDOW_DAYS = 7

/** [AZ, SPS, T3, SpotPrice, AvailabilityScore] */
export type ScoreRow = [string, number, number, number, number]

export interface ScoreFile {
  /** 기준일 */
  date: string
  /** 창의 첫 날과 끝 날(기준일 전날) */
  window: [string, string]
  /** InstanceType → Region → 후보(SPS > 0, SpotPrice > 0) */
  rows: Record<string, Record<string, ScoreRow[]>>
}

export interface SpotVistaIndex {
  generated_at: string
  /** 점수 파일이 있는 기준일 범위 */
  dates: { first: string; last: string }
  /** 가장 최근 기준일의 InstanceType → Region 목록 */
  instance_types: Record<string, string[]>
}

export async function fetchIndex(signal?: AbortSignal): Promise<SpotVistaIndex> {
  const res = await fetch(`${DATA_ORIGIN}/index.json`, { signal })
  if (!res.ok) throw new Error(`index.json ${res.status}`)
  return res.json()
}

/** 그 기준일의 점수 파일. 없으면(공개 범위 밖) null. */
export async function fetchScores(date: string): Promise<ScoreFile | null> {
  const res = await fetch(`${DATA_ORIGIN}/scores/${date}.json`)
  // S3는 없는 키에 403을 준다. 404와 같이 "파일 없음"으로 본다.
  if (res.status === 403 || res.status === 404) return null
  if (!res.ok) throw new Error(`scores/${date}.json ${res.status}`)
  return res.json()
}
