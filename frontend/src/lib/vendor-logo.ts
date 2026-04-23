export type VendorId = "AWS" | "GCP" | "AZURE"

const BASE: Record<VendorId, string> = {
  AWS: "aws",
  GCP: "gcp",
  AZURE: "azure",
}

export function vendorLogo(
  id: VendorId,
  theme: string | undefined,
  mounted: boolean,
) {
  const variant = mounted && theme === "dark" ? "dark" : "light"
  return `/icons/${BASE[id]}-${variant}.png`
}
