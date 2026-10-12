/**
 * SpotVista 점수 계산.
 *
 * SpotVista-Query의 calculate_score.py와 lambda_function.py를 옮긴 것이다. 원래는
 * T3 값 하나하나를 받아 계산했지만, 여기서는 하루 합계(spotvista-data.ts의 DayAgg)
 * 7일치를 이어 붙여 같은 값을 얻는다. 면적, 표준편차, 기울기 모두 개수·합·제곱합·
 * Σ x·y만 있으면 계산되기 때문이다.
 */
import type { SpotVistaRow } from "@/components/ui/ag-columns"
import type { DayAgg, DayFile, DayRow } from "./spotvista-data"

/** 이어 붙인 시계열. x는 0..n-1 순번이다. */
export interface Series {
  n: number
  sum: number
  sumsq: number
  sumXY: number
  first: number
  last: number
}

/** 날짜 순 하루 합계를 하나의 시계열로 잇는다. 값이 없으면 null. */
export function combine(days: DayAgg[]): Series | null {
  const s: Series = { n: 0, sum: 0, sumsq: 0, sumXY: 0, first: 0, last: 0 }
  for (const d of days) {
    if (d.n === 0) continue
    if (s.n === 0) s.first = d.first
    // 그날 순번 i는 이어 붙이면 s.n + i가 된다.
    s.sumXY += s.n * d.sum + d.sum_iy
    s.n += d.n
    s.sum += d.sum
    s.sumsq += d.sumsq
    s.last = d.last
  }
  return s.n ? s : null
}

/** np.polyfit(x, y, 1)[0], x = 0..n-1 */
function slopeOf(n: number, sumY: number, sumXY: number): number {
  const sx = (n * (n - 1)) / 2
  const sxx = ((n - 1) * n * (2 * n - 1)) / 6
  return (n * sumXY - sx * sumY) / (n * sxx - sx * sx)
}

/** get_slope: 기울기를 0에서 50으로 오르는 직선의 기울기로 나눠 ±0.1 안으로 줄인다. */
export function getSlope(s: Series): number {
  if (s.n < 2) return 0
  // np.linspace(0, 50, n).astype(int): i·step을 소수점 아래 버림, 마지막은 정확히 50.
  const step = 50 / (s.n - 1)
  let sumY = 0
  let sumXY = 0
  for (let i = 0; i < s.n; i++) {
    const y = i === s.n - 1 ? 50 : Math.trunc(i * step)
    sumY += y
    sumXY += i * y
  }
  // 원래 코드는 음수일 때 (a / -max) * -0.1 로 따로 계산하지만 값은 같다.
  return (slopeOf(s.n, s.sum, s.sumXY) / slopeOf(s.n, sumY, sumXY)) * 0.1
}

/** calculate_score. 값이 2개 미만이면 원래 코드에서 NaN이 되므로 null. */
export function calculateScore(s: Series): number | null {
  if (s.n < 2) return null
  // np.trapezoid(y)를 [50] * n 의 면적으로 나눈다. 간격 1이면 합 - (처음 + 끝) / 2.
  const integral = (s.sum - (s.first + s.last) / 2) / (50 * (s.n - 1))
  // pandas std (ddof=1)
  const std = Math.sqrt(Math.max(0, (s.sumsq - (s.sum * s.sum) / s.n) / (s.n - 1)))
  const stdPenalty = integral * ((std / 25) * 0.1)
  const slopePenalty = integral * getSlope(s)
  return (integral - stdPenalty + slopePenalty) * 100
}

/** score_transformation: 최저가 100점, 평균가 50점이 되도록 지수 변환한다. */
export function scoreTransformation(prices: number[]): number[] {
  const min = Math.min(...prices)
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length
  // 가격이 모두 같으면 원래 식은 0/0이다. 모두 최저가이므로 100.
  if (mean === min) return prices.map(() => 100)
  const k = -Math.log(mean / min)
  return prices.map((x) => 100 * Math.exp((k * (x - min)) / (mean - min)))
}

/**
 * lambda_function.py의 순위 매기기. 창 안 가장 최근 값에서 SPS와 가격이 유효한
 * 항목만 남기고, 7일 T3로 가용성 점수, 가격으로 비용 점수를 구해 가중합 순으로 정렬한다.
 */
export function rankCandidates(files: DayFile[], regions: string[], weight: number): SpotVistaRow[] {
  const entries = new Map<string, { type: string; row: DayRow; days: DayAgg[] }>()
  for (const f of [...files].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const row of f.rows) {
      if (!regions.includes(row.Region)) continue
      const key = `${f.InstanceType}|${row.Region}|${row.AZ}`
      const e = entries.get(key) ?? { type: f.InstanceType, row, days: [] }
      e.row = row
      e.days.push(row.T3)
      entries.set(key, e)
    }
  }

  const merged = []
  for (const { type, row, days } of entries.values()) {
    const { SPS, SpotPrice, T3 } = row.Last
    if (SPS === null || SPS <= 0 || SpotPrice === null || SpotPrice <= 0) continue
    const series = combine(days)
    const availability = series && calculateScore(series)
    if (availability === null) continue
    merged.push({ InstanceType: type, Region: row.Region, AZ: row.AZ, SPS, T3, SpotPrice,
                  AvailabilityScore: availability })
  }

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
