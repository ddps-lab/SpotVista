import Link from "next/link"
import { Database, Download, FileText, Github, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const PAPER_URL = "https://arxiv.org/abs/2604.24548"
const REPO_URL = "https://github.com/ddps-lab/SpotVista"
const RELEASE_URL =
  "https://github.com/ddps-lab/SpotVista/releases/tag/figures-v1"
const SPOTLAKE_URL = "https://spotlake.ddps.cloud/"

export default function ArtifactPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4 text-center">
        <h1 className="brand-wordmark text-5xl font-bold tracking-tighter">
          Research Artifact
        </h1>
        <p className="mx-auto text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          The full dataset and figure-reproduction code are published on GitHub.
        </p>
      </section>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Preprint
            </CardTitle>
            <CardDescription>
              The full SpotVista paper covering design and evaluation, on arXiv.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href={PAPER_URL} target="_blank" rel="noopener noreferrer">
                <FileText className="size-4" />
                arXiv:2604.24548
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="size-5" />
              Source Repository
            </CardTitle>
            <CardDescription>
              Figure scripts, small data files, and the download helper.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href={REPO_URL} target="_blank" rel="noopener noreferrer">
                <Github className="size-4" />
                ddps-lab/SpotVista
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="size-5" />
              Dataset Archive
            </CardTitle>
            <CardDescription>
              Large CSVs (~2 GB compressed, ~29 GB raw) split across release
              assets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={RELEASE_URL} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" />
                Download from Release
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mx-auto max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Multi-Node Historical Data
          </CardTitle>
          <CardDescription>
            Historical data for multi-node spot instances can be requested
            through SpotLake.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link
              href={SPOTLAKE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="size-4" />
              spotlake.ddps.cloud
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
