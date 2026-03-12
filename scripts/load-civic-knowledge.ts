/**
 * load-civic-knowledge.ts
 *
 * Seeds the `vectors` table with chunked Kenya civic/legal documents
 * so civic-observer and civic-sage have a real RAG knowledge base.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... JINA_API_KEY=... npx tsx scripts/load-civic-knowledge.ts
 *
 * Optional env vars:
 *   JINA_API_KEY      — JinaAI free-tier embeddings (1M tokens/month)
 *   OPENAI_API_KEY    — Alternative: OpenAI text-embedding-3-small
 *   EMBEDDING_PROVIDER — 'jina' (default) | 'openai'
 *   DRY_RUN           — 'true' to skip DB writes (just count chunks)
 *   SKIP_EXISTING     — 'true' (default) to skip source_types already in vectors
 *
 * Documents embedded:
 *   1. Kenya Constitution 2010 (key articles)
 *   2. PPADA 2015 (Public Procurement and Asset Disposal Act)
 *   3. PFMA 2012 (Public Finance Management Act)
 *   4. KICA 2022 (Computer Misuse and Cybercrimes Act)
 *   5. WanaIQ Community Guidelines
 */

import { createClient } from "@supabase/supabase-js";

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL            = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JINA_API_KEY            = process.env.JINA_API_KEY ?? "";
const OPENAI_API_KEY          = process.env.OPENAI_API_KEY ?? "";
const EMBEDDING_PROVIDER      = (process.env.EMBEDDING_PROVIDER ?? "jina") as "jina" | "openai";
const DRY_RUN                 = process.env.DRY_RUN === "true";
const SKIP_EXISTING           = process.env.SKIP_EXISTING !== "false"; // default true

const CHUNK_SIZE = 1200;     // characters per chunk
const CHUNK_OVERLAP = 150;   // overlap between chunks
const EMBED_BATCH_SIZE = 10; // embed N chunks per API call
const EMBED_DELAY_MS = 300;  // ms delay between batches

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const hasEmbeddingKey = EMBEDDING_PROVIDER === "jina" ? !!JINA_API_KEY : !!OPENAI_API_KEY;
if (!hasEmbeddingKey) {
  console.warn(`⚠️  No ${EMBEDDING_PROVIDER.toUpperCase()}_API_KEY set. Chunks will be stored as text-only (no embeddings). RAG similarity search will not work until embeddings are added.`);
}

// ─── Document library ─────────────────────────────────────────────────────────

interface KnowledgeDocument {
  source_type: string;
  title: string;
  description: string;
  content: string;
}

// NOTE: These are representative article summaries of the actual laws.
// For production accuracy, replace with full-text content from the official sources:
//   - Kenya Constitution: https://www.constitute.org/constitution/Kenya2010.pdf
//   - PPADA: https://ppra.go.ke/ppada2015/
//   - PFMA: https://www.parliament.go.ke/sites/default/files/...
//   - KICA: https://www.odpp.go.ke/...

const CIVIC_DOCUMENTS: KnowledgeDocument[] = [
  // ─── Kenya Constitution 2010 ────────────────────────────────────────────────
  {
    source_type: "kenya_constitution",
    title: "Kenya Constitution 2010 — Chapter 1: Sovereignty of the People",
    description: "Articles 1-6: Sovereignty, territory, national values, equality",
    content: `
Kenya Constitution 2010 — Chapter 1: Sovereignty of the People and Supremacy of the Constitution

Article 1: Sovereignty of the People
All sovereign power belongs to the people of Kenya and shall be exercised only in accordance with this Constitution. The people may exercise their sovereign power either directly or through their democratically elected representatives. Sovereign power under this Constitution is delegated to Parliament and the legislative assemblies in the county governments; the national executive and the executive structures in the county governments; and the Judiciary and independent tribunals.

Article 2: Supremacy of this Constitution
This Constitution is the supreme law of the Republic and binds all persons and all State organs at both levels of government. No person may claim or exercise State authority except as authorised under this Constitution. The validity or legality of this Constitution is not subject to challenge by or before any court or other State organ. Any law, whether written or unwritten, that is inconsistent with this Constitution is void to the extent of the inconsistency, and any act or omission in contravention of this Constitution is invalid.

Article 3: Defence of the Constitution
Every person has an obligation to respect, uphold and defend this Constitution. Any attempt to establish a government otherwise than in compliance with this Constitution is unlawful.

Article 4: Declaration of the Republic
Kenya is a sovereign republic. The Republic of Kenya shall be a multi-party democratic State founded on the national values and principles of governance referred to in Article 10.

Article 10: National Values and Principles of Governance
The national values and principles of governance in this Article bind all State organs, State officers, public officers and all persons whenever any of them applies or interprets this Constitution, enacts, applies or interprets any law, or makes or implements public policy decisions. The national values and principles of governance include patriotism, national unity, sharing and devolution of power, the rule of law, democracy and participation of the people; human dignity, equity, social justice, inclusiveness, equality, human rights, non-discrimination and protection of the marginalised; good governance, integrity, transparency and accountability; and sustainable development.

Article 27: Equality and Freedom from Discrimination
Every person is equal before the law and has the right to equal protection and equal benefit of the law. Equality includes the full and equal enjoyment of all rights and fundamental freedoms. Women and men have the right to equal treatment, including the right to equal opportunities in political, economic, cultural and social spheres.

Article 35: Access to Information
Every citizen has the right of access to information held by the State; and information held by another person and required for the exercise or protection of any right or fundamental freedom. Every person has the right to the correction or deletion of untrue or misleading information that affects the person. The State shall publish and publicise any important information affecting the nation.
    `.trim(),
  },
  {
    source_type: "kenya_constitution",
    title: "Kenya Constitution 2010 — Chapter 11: Devolved Government",
    description: "Articles 174-203: County governments, functions, finance",
    content: `
Kenya Constitution 2010 — Chapter 11: Devolved Government

Article 174: Objects of Devolution
The objects of the devolution of government are to promote democratic and accountable exercise of power; to foster national unity by recognising diversity; to give powers of self-governance to the people and enhance the participation of the people in the exercise of the powers of the State and in making decisions affecting them; to recognise the right of communities to manage their own affairs and to further their development; to protect and promote the interests and rights of minorities and marginalised communities; to promote social and economic development and the provision of proximate, easily accessible services throughout Kenya; to ensure equitable sharing of national and local resources throughout Kenya; to facilitate the decentralisation of State organs, their functions and services, from the capital of Kenya; and to enhance checks and balances and the separation of powers.

Article 175: Principles of County Government
County governments established under this Chapter shall reflect the following principles: county governments shall be based on democratic principles and the separation of powers; county governments shall have reliable sources of revenue to enable them to govern and deliver services effectively; and no more than two-thirds of the members of representative bodies in each county government shall be of the same gender.

Article 176: County governments
There shall be a county government for each county, consisting of a county assembly and a county executive committee.

Article 202: Equitable sharing of national revenue
Revenue raised nationally shall be shared equitably among the national and county governments. County governments may be given additional allocations from the national government's share of the revenue, either conditionally or unconditionally.

Article 203: Criteria for equitable sharing
The following criteria shall be taken into account in determining the equitable shares provided for in Article 202: national interest; public debt and other national obligations; the needs of counties, including the population of the county; development needs; economic disparities within and among counties and the need to remedy them; the need for economic optimisation of each county and to provide incentives for each county to optimise its capacity to raise revenue; the desirability of stable and predictable allocations of revenue; and the need for flexibility in responding to emergencies and other temporary needs.
    `.trim(),
  },
  {
    source_type: "kenya_constitution",
    title: "Kenya Constitution 2010 — Public Finance (Articles 201-231)",
    description: "Public finance principles, budget, procurement, audit",
    content: `
Kenya Constitution 2010 — Public Finance Principles

Article 201: Principles of public finance
The following principles shall guide all aspects of public finance in the Republic: there shall be openness and accountability, including public participation, in financial matters; the public finance system shall promote an equitable society, and in particular revenue raised nationally shall be shared equitably among national and county governments; expenditure shall promote the equitable development of the country, including by making special provision for marginalised groups and areas; the burdens and benefits of the use of resources and public borrowing shall be shared equitably between present and future generations; and public money shall be used in a prudent and responsible way.

Article 204: Equalisation Fund
There is established the Equalisation Fund into which shall be paid one half per cent of all the revenue collected by the national government each year calculated on the basis of the most recent audited accounts of revenue received. The national government shall use the Equalisation Fund only to provide basic services including water, roads, health facilities and electricity to marginalised areas to the extent necessary to bring the quality of those services in those areas to the level generally enjoyed by the rest of the nation.

Article 226: Accounts and audit of public entities
Each entity mentioned in Article 225 shall keep financial records and shall submit the records for auditing by the Auditor-General as prescribed by an Act of Parliament.

Article 227: Procurement of public goods and services
When a State organ or any other public entity contracts for goods or services, it shall do so in accordance with a system that is fair, equitable, transparent, competitive and cost-effective. An Act of Parliament shall prescribe a framework within which policies relating to procurement and asset disposal shall be implemented.
    `.trim(),
  },

  // ─── PPADA 2015 ─────────────────────────────────────────────────────────────
  {
    source_type: "kenya_ppada",
    title: "PPADA 2015 — Public Procurement and Asset Disposal Act",
    description: "Kenya procurement law: thresholds, open tender, debarment",
    content: `
Public Procurement and Asset Disposal Act, 2015 (PPADA)

Purpose and Scope
The Act provides for procurement of goods, works and services by public entities and county governments. It establishes the Public Procurement Regulatory Authority (PPRA) to oversee implementation. The Act applies to all public entities including national and county governments, state corporations, and any entity funded from public funds.

Key Principles (Section 3)
Public procurement shall be conducted in accordance with the following principles: maximisation of value for money; promotion of integrity, accountability and transparency; fair competition; and equitable treatment of tenderers.

Procurement Methods
Open Tender: Primary method for all procurement above threshold. Mandatory for contracts above KES 6 million (goods/services) or KES 30 million (works). Open to all qualified suppliers. Advertised in national newspapers and PPRA portal.

Restricted Tender: Permitted only where goods/services available only from limited suppliers, or open tender costs disproportionate to contract value.

Request for Proposals: Used for intellectual and professional services. Evaluated on technical merit and price.

Procurement Thresholds (as of 2023 guidelines)
- Micro procurement: up to KES 50,000 (direct purchase)
- Request for quotations: KES 50,001 to KES 6,000,000
- Open tender: above KES 6,000,000

Debarment (Section 175)
The Authority may debar a person from participating in public procurement for: providing false information; corrupt behaviour; collusion; breach of contract; failure to pay taxes; and any other ground specified. Debarment period: minimum 5 years.

Procurement Audit
The PPRA may audit any public procurement. Findings reported to the relevant accounting officer and Parliament.

Prohibited Actions
No splitting of procurement to avoid thresholds. No single-sourcing without written justification. No procurement from a debarred firm. No conflict of interest. Violations may lead to criminal prosecution and imprisonment.
    `.trim(),
  },

  // ─── PFMA 2012 ──────────────────────────────────────────────────────────────
  {
    source_type: "kenya_pfma",
    title: "PFMA 2012 — Public Finance Management Act",
    description: "Kenya public finance law: budget, expenditure control, reporting",
    content: `
Public Finance Management Act, 2012 (PFMA)

Purpose
The Act provides for effective management of public finances at both national and county levels, consistent with the principles of the Constitution.

Budget Cycle (Part IV)
The Cabinet Secretary for Finance shall prepare and submit to Cabinet a budget policy statement by 15th February each year. Budget estimates for each financial year shall be laid before the National Assembly by 30th April. County governments shall submit budget estimates to county assembly by 30th April.

Expenditure Controls (Section 45)
No expenditure from public funds except as authorised by law. Accounting officers are personally liable for any expenditure not authorised. Supplementary budgets may be introduced but total budget cannot increase by more than 10% without National Assembly approval.

Reporting Requirements
Accounting officers must submit quarterly reports to the Controller of Budget within 30 days of each quarter end. Annual financial statements due within 3 months of year end. Consolidated government accounts published within 6 months.

County Revenue (Part VI)
Counties may raise revenue through rates, charges, and fees within limits set by the Constitution. County governments must maintain a County Revenue Fund. No more than 2% of county budget may be spent on hospitality and entertainment.

Controller of Budget
Independent Officer established under Article 228 of the Constitution. Oversees budget execution at both national and county levels. May investigate any complaint relating to financial management. Annual report to Parliament within 7 days of Parliament sitting.

Financial Penalties
Public officer who authorises illegal expenditure: liable to surcharge equal to full amount plus 25% penalty. Criminal prosecution possible for gross misconduct. Assets may be frozen pending investigation.
    `.trim(),
  },

  // ─── KICA 2022 ──────────────────────────────────────────────────────────────
  {
    source_type: "kenya_kica",
    title: "KICA 2022 — Computer Misuse and Cybercrimes Act",
    description: "Kenya cybercrime law: false publications, hate speech, misinformation",
    content: `
Computer Misuse and Cybercrimes Act, 2018 (KICA) — as amended 2022

Section 22: Publication of False Information
A person who intentionally publishes false, misleading or fictitious data or misinforms with intent that the data shall be considered or acted upon as authentic, commits an offence and is liable, on conviction, to a fine not exceeding five million shillings or to imprisonment for a term not exceeding two years, or to both.

Section 25: Cybersquatting
A person who, with intent to profit, registers, traffics in, or uses a domain name that is identical to or confusingly similar to a distinctive mark belonging to another person commits an offence.

Section 27: Cyber harassment
A person who uses a computer system to engage in conduct which is intended and calculated to cause psychological, emotional, mental or physical harm to another person commits an offence punishable by fine up to KES 20 million or 10 years imprisonment.

Section 30: Hate speech
A person who uses a computer system to publish data or cause to be published data that: is designed to incite and does incite violence or discrimination against individuals or groups by reason of their ethnicity, gender, disability, nationality, or religion; commits an offence punishable by fine up to KES 50 million or imprisonment for up to 10 years, or both.

Relevance to WanaIQ
WanaIQ users should not post content that could constitute: false information about government officials, projects or budgets without factual basis; hate speech targeting ethnic communities or political groups; harassment of public figures or private individuals. Content moderation by civic-guardian is intended to detect and flag potential violations of KICA sections 22, 27, and 30.
    `.trim(),
  },

  // ─── WanaIQ Guidelines ───────────────────────────────────────────────────────
  {
    source_type: "wanaiq_guidelines",
    title: "WanaIQ Community Guidelines",
    description: "Platform rules: civic discourse, fact-checking, official engagement",
    content: `
WanaIQ Community Guidelines

Mission
WanaIQ is a civic accountability platform for Kenyans to track government performance, report issues, and engage in fact-based civic discourse.

Core Principles
1. Truth and Evidence: All claims about government projects, budgets, or official actions must be based on verifiable sources. Speculation presented as fact will be moderated.
2. Respect: Disagreement is welcome. Personal attacks, hate speech, and harassment are not permitted.
3. Accountability: Criticism of public officials and government institutions is encouraged when evidence-based and constructive.
4. Confidentiality: Do not share private personal information about private citizens.

Moderated Content
- Hate speech based on ethnicity, religion, gender, or political affiliation — prohibited
- False information presented as fact — flagged for observer review
- Personal attacks and harassment — removed
- Spam and commercial promotion — removed
- Content inciting violence — immediately removed and reported

Civic Engagement Rules
- When sharing government data (budgets, tenders, project updates), cite official sources
- Official pages for verified government officials are moderated against imposters
- Community flairs indicate confidence levels: Verified, Community Report, Unverified

AI Agent Disclosure
WanaIQ uses autonomous AI agents to: moderate content (civic-guardian), fact-check claims (civic-observer), track government commitments (civic-tracker), and generate accountability reports (civic-sage). Users may appeal any automated moderation decision through the appeals process.

Reporting
Use the Report button to flag content that violates guidelines. Reported content is reviewed by civic-observer and human moderators.
    `.trim(),
  },
];

// ─── Text chunker ─────────────────────────────────────────────────────────────

function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
    if (end === text.length) break;
  }
  return chunks.filter((c) => c.length > 50);
}

// ─── Embedding providers ──────────────────────────────────────────────────────

async function embedBatchJina(texts: string[]): Promise<(number[] | null)[]> {
  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${JINA_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "jina-embeddings-v2-base-en", input: texts }),
  });
  if (!res.ok) throw new Error(`Jina API error ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: Array<{ embedding: number[] }> };
  return json.data.map((d) => d.embedding ?? null);
}

async function embedBatchOpenAI(texts: string[]): Promise<(number[] | null)[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: Array<{ embedding: number[] }> };
  return json.data.map((d) => d.embedding ?? null);
}

async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  if (!hasEmbeddingKey) return texts.map(() => null);
  if (EMBEDDING_PROVIDER === "openai") return embedBatchOpenAI(texts);
  return embedBatchJina(texts);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`\n🏛  WanaIQ Civic Knowledge Base Seeder`);
  console.log(`   Provider: ${EMBEDDING_PROVIDER}${hasEmbeddingKey ? " ✓" : " (no key — text only)"}`);
  console.log(`   Dry run: ${DRY_RUN}`);
  console.log(`   Skip existing: ${SKIP_EXISTING}\n`);

  // Check which source_types already exist
  let existingTypes = new Set<string>();
  if (SKIP_EXISTING) {
    const { data } = await client.from("vectors").select("source_type").in("source_type", CIVIC_DOCUMENTS.map((d) => d.source_type));
    existingTypes = new Set((data ?? []).map((r: { source_type: string }) => r.source_type));
    if (existingTypes.size > 0) {
      console.log(`ℹ️  Skipping ${existingTypes.size} already-seeded source types: ${[...existingTypes].join(", ")}\n`);
    }
  }

  let totalChunks = 0;
  let totalEmbedded = 0;
  const totalSkipped = 0;

  for (const doc of CIVIC_DOCUMENTS) {
    if (SKIP_EXISTING && existingTypes.has(doc.source_type)) {
      console.log(`⏭  Skipping ${doc.source_type} (already exists)`);
      continue;
    }

    const chunks = chunkText(doc.content);
    console.log(`📄  ${doc.title}`);
    console.log(`    source_type: ${doc.source_type} | chunks: ${chunks.length}`);

    if (DRY_RUN) { totalChunks += chunks.length; continue; }

    // Process in batches
    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
      let embeddings: (number[] | null)[] = batch.map(() => null);

      try {
        embeddings = await embedBatch(batch);
      } catch (e) {
        console.warn(`    ⚠️  Embedding failed for batch ${i}-${i + EMBED_BATCH_SIZE}: ${(e as Error).message}`);
      }

      const rows = batch.map((chunk, idx) => ({
        content: chunk,
        embedding: embeddings[idx] ? JSON.stringify(embeddings[idx]) : null,
        metadata: {
          document_title: doc.title,
          description: doc.description,
          chunk_index: i + idx,
          chunk_total: chunks.length,
        },
        source_type: doc.source_type,
        source_id: `${doc.source_type}_chunk_${i + idx}`,
      }));

      const { error } = await client.from("vectors").upsert(rows, { onConflict: "source_id" });
      if (error) {
        console.error(`    ❌  Insert failed: ${error.message}`);
      } else {
        const embeddedCount = embeddings.filter(Boolean).length;
        totalChunks += batch.length;
        totalEmbedded += embeddedCount;
        process.stdout.write(`    ✓  Chunks ${i + 1}-${Math.min(i + EMBED_BATCH_SIZE, chunks.length)}/${chunks.length}${embeddedCount > 0 ? " (embedded)" : " (text only)"}\r`);
      }

      if (i + EMBED_BATCH_SIZE < chunks.length) {
        await new Promise((r) => setTimeout(r, EMBED_DELAY_MS));
      }
    }

    console.log(`\n`);
  }

  console.log(`\n✅  Complete!`);
  console.log(`   Total chunks inserted: ${totalChunks}`);
  console.log(`   Chunks with embeddings: ${totalEmbedded}`);
  if (totalSkipped) console.log(`   Source types skipped: ${totalSkipped}`);

  if (!hasEmbeddingKey) {
    console.log(`\n⚠️  No embedding key provided. Run again with JINA_API_KEY or OPENAI_API_KEY to add vector embeddings.`);
    console.log(`   JinaAI free tier: https://jina.ai (1M tokens/month, no credit card)`);
  }

  console.log(`\n📊  Verify in Supabase:`);
  console.log(`   SELECT source_type, COUNT(*) FROM vectors GROUP BY source_type;`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
