/**
 * SpotVista 순위 계산.
 *
 * SpotVista-Query의 lambda_function.py에서 가용성 점수 다음 부분을 옮긴 것이다. 가용성
 * 점수(calculate_score)는 SpotLake가 기준일마다 미리 계산해 둔다. 비용 점수는 고른
 * 후보 안의 최저가와 평균가로 정해지므로 여기서 계산한다.
 */
import type { SpotVistaRow } from "@/components/ui/ag-columns"
import type { ScoreFile } from "./spotvista-data"

/** score_transformation: 최저가 100점, 평균가 50점이 되도록 지수 변환한다. */
export function scoreTransformation(prices: number[]): number[] {
  const min = Math.min(...prices)
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length
  // 가격이 모두 같으면 원래 식은 0/0이다. 모두 최저가이므로 100.
  if (mean === min) return prices.map(() => 100)
  const k = -Math.log(mean / min)
  return prices.map((x) => 100 * Math.exp((k * (x - min)) / (mean - min)))
}

/** 고른 타입·리전의 후보에 비용 점수와 가중치를 적용해 가중합 순으로 정렬한다. */
export function rankCandidates(
  file: ScoreFile,
  types: string[],
  regions: string[],
  weight: number,
): SpotVistaRow[] {
  const merged = types.flatMap((type) =>
    regions.flatMap((region) =>
      (file.rows[type]?.[region] ?? []).map(([AZ, SPS, T3, SpotPrice, AvailabilityScore]) => ({
        InstanceType: type, Region: region, AZ, SPS, T3, SpotPrice, AvailabilityScore,
      })),
    ),
  )
  const cost = scoreTransformation(merged.map((m) => m.SpotPrice))
  return merged
    .map((m, i) => ({
      ...m,
      CostScore: cost[i],
      Weight: weight,
      TotalScore: weight * m.AvailabilityScore + (1 - weight) * cost[i],
    }))
    .sort((a, b) => b.TotalScore - a.TotalScore)
}
